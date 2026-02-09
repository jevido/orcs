import { Context } from "../http/context.js";
import { compose } from "../http/middleware.js";
import { createValidationMiddleware } from "../validation/middleware.js";

/**
 * Compiles ORCS routes into Bun's native routes object format.
 * Groups routes by path and method, wraps handlers with middleware.
 */
export function compileToBunRoutes(
  routeCollection,
  globalMiddleware = [],
  app = null,
) {
  const routes = {};
  const allRoutes = routeCollection.all();

  // Group routes by path
  const pathGroups = new Map();

  for (const route of allRoutes) {
    const path = route.path;
    if (!pathGroups.has(path)) {
      pathGroups.set(path, []);
    }
    pathGroups.get(path).push(route);
  }

  // Build Bun routes object
  // Always use method objects for proper 405 handling
  for (const [path, routesForPath] of pathGroups) {
    const methodHandlers = {};
    for (const route of routesForPath) {
      methodHandlers[route.method] = createBunHandler(
        route,
        globalMiddleware,
        app,
      );
    }
    routes[path] = methodHandlers;
  }

  return routes;
}

/**
 * Creates a Bun-compatible handler that wraps ORCS middleware and context
 */
function createBunHandler(route, globalMiddleware, app) {
  return async (req) => {
    const url = new URL(req.url);

    // Parse query string
    const query = parseQuery(url.searchParams);

    // Parse request body
    const body = await parseBody(req);

    // Build ORCS context
    const ctx = new Context({
      req,
      params: req.params || {}, // Bun populates this automatically
      query,
      body,
      headers: Object.fromEntries(req.headers.entries()),
      app,
    });

    // Build middleware stack with automatic validation
    const middleware = [...globalMiddleware];

    // Auto-inject validation middleware if route has requestBody
    if (route.meta?.requestBody) {
      const validationMiddleware = createValidationMiddleware(
        route.meta.requestBody,
      );
      if (validationMiddleware) {
        middleware.push(validationMiddleware);
      }
    }

    // Add route-specific middleware
    middleware.push(...route.middleware);

    // Compose and execute middleware + handler
    const dispatch = compose(middleware, route.handler);
    const result = await dispatch(ctx);

    return coerceResponse(result);
  };
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
  // API only - always parse as JSON
  if (req.method === "GET" || req.method === "HEAD") return null;

  try {
    return await req.json();
  } catch {
    return null;
  }
}

function coerceResponse(result) {
  // API only - always return JSON unless explicit Response
  if (result instanceof Response) return result;
  if (result === undefined || result === null)
    return Response.json(null, { status: 204 });
  // Always return JSON (strings, objects, arrays, etc.)
  return Response.json(result);
}
