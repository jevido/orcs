import { Context } from "./Context.js";
import { compose } from "./Middleware.js";
import { generateOpenApiDocument } from "../openapi/Generator.js";
import { ExceptionHandler } from "../errors/Handler.js";

/**
 * Creates and starts a Bun HTTP server wired to the ORCS routing system.
 */
export function createServer(app) {
  const routes = app.routeCollection();
  const globalMiddleware = app.getGlobalMiddleware();
  const handler = app.exceptionHandler || new ExceptionHandler();

  const server = Bun.serve({
    port: app.config.get("http.port", 3000),
    idleTimeout: app.config.get("http.idleTimeout", 60),

    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;

      // Serve OpenAPI spec
      if (path === "/openapi.json" && method === "GET") {
        return Response.json(generateOpenApiDocument());
      }

      // Parse query string
      const query = parseQuery(url.searchParams);

      // Find matching route
      const match = routes.match(method, path);

      if (!match) {
        const allowed = routes.methodsFor(path);
        if (allowed.length > 0) {
          return Response.json(
            {
              error: "Method Not Allowed",
              message: `${method} ${path} is not allowed`,
            },
            {
              status: 405,
              headers: { Allow: allowed.join(", ") },
            },
          );
        }
        return Response.json(
          { error: "Not Found", message: `${path} not found` },
          { status: 404 },
        );
      }

      const { route, params } = match;

      // Parse request body
      const body = await parseBody(req);

      // Build context
      const ctx = new Context({
        req,
        params,
        query,
        body,
        headers: Object.fromEntries(req.headers.entries()),
      });

      try {
        // Compose global + route middleware + handler
        const middleware = [...globalMiddleware, ...route.middleware];
        const dispatch = compose(middleware, route.handler);
        const result = await dispatch(ctx);
        return coerceResponse(result);
      } catch (error) {
        return handler.render(error, ctx);
      }
    },
  });

  return server;
}

function parseQuery(searchParams) {
  const query = {};
  for (const [key, value] of searchParams.entries()) {
    if (query[key] !== undefined) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  }
  return query;
}

async function parseBody(req) {
  const contentType = req.headers.get("content-type") || "";

  if (req.method === "GET" || req.method === "HEAD") return null;

  try {
    if (contentType.includes("application/json")) {
      return await req.json();
    }
    if (contentType.includes("text/")) {
      return await req.text();
    }
    const text = await req.text();
    if (text) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function coerceResponse(result) {
  if (result instanceof Response) return result;
  if (result === undefined || result === null)
    return new Response(null, { status: 204 });
  if (typeof result === "string") {
    return new Response(result, {
      headers: { "Content-Type": "text/plain" },
    });
  }
  return Response.json(result);
}
