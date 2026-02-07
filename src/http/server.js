import { compileToBunRoutes } from "../routing/bun-route-compiler.js";
import { generateOpenApiDocument } from "../openapi/generator.js";
import { ExceptionHandler } from "../errors/handler.js";
import { createDocsHandler } from "./docs-handler.js";

/**
 * Creates and starts a Bun HTTP server using native routes object.
 * Routes are compiled from ORCS format to Bun's native format for optimal performance.
 */
export function createServer(app) {
  const routeCollection = app.routeCollection();
  const globalMiddleware = app.getGlobalMiddleware();
  const handler = app.exceptionHandler || new ExceptionHandler();

  // Compile ORCS routes to Bun's native routes format
  const bunRoutes = compileToBunRoutes(routeCollection, globalMiddleware, app);

  // Wrap all route handlers with error handling
  const wrappedRoutes = wrapRoutesWithErrorHandler(bunRoutes, handler);

  // Create docs handler
  const docsHandler = createDocsHandler(app.config);

  const server = Bun.serve({
    port: app.config.get("http.port", 3000),
    idleTimeout: app.config.get("http.idleTimeout", 60),

    // Use Bun's native routes object for optimal performance
    routes: {
      // OpenAPI spec endpoint (GET only)
      "/openapi.json": {
        GET: Response.json(generateOpenApiDocument()),
      },

      // API documentation UI (GET only)
      "/docs": {
        GET: docsHandler,
      },

      // All compiled ORCS routes
      ...wrappedRoutes,
    },

    // Fallback for unmatched routes and method not allowed
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      // Check if path exists with different methods (405 handling)
      const availableMethods = routeCollection.methodsFor(path);
      if (availableMethods.length > 0) {
        return Response.json(
          {
            error: "Method Not Allowed",
            message: `${req.method} not allowed for ${path}`,
          },
          {
            status: 405,
            headers: { Allow: availableMethods.join(", ") },
          },
        );
      }

      // Path not found (404)
      return Response.json(
        { error: "Not Found", message: `${path} not found` },
        { status: 404 },
      );
    },
  });

  return server;
}

/**
 * Wraps all route handlers with error handling
 */
function wrapRoutesWithErrorHandler(routes, handler) {
  const wrapped = {};

  for (const [path, methods] of Object.entries(routes)) {
    // All routes are now method objects for proper 405 handling
    const wrappedMethods = {};
    for (const [method, methodHandler] of Object.entries(methods)) {
      wrappedMethods[method] = wrapHandler(methodHandler, handler);
    }
    wrapped[path] = wrappedMethods;
  }

  return wrapped;
}

/**
 * Wraps a single handler with error handling
 */
function wrapHandler(routeHandler, exceptionHandler) {
  return async (req) => {
    try {
      return await routeHandler(req);
    } catch (error) {
      // Create a minimal context for error handling
      const ctx = {
        req,
        method: req.method,
        path: new URL(req.url).pathname,
      };
      return exceptionHandler.render(error, ctx);
    }
  };
}
