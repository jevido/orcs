import { compileToBunRoutes } from "../routing/bun-route-compiler.js";
import { generateOpenApiDocument } from "../openapi/generator.js";
import { ExceptionHandler } from "../errors/handler.js";
import { createDocsHandler } from "./docs-handler.js";
import { WebSocketRoute } from "../websocket/route.js";
import { WebSocketManager } from "../websocket/manager.js";
import { WebSocketAuthenticator } from "../websocket/authenticator.js";

/**
 * Creates and starts a Bun HTTP server using native routes object.
 * Routes are compiled from ORCS format to Bun's native format for optimal performance.
 * Supports WebSocket upgrades using Bun's native WebSocket implementation.
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

  // Setup WebSocket support
  const wsConfig = app.config.get("websocket", {});
  const wsManager = new WebSocketManager({
    idleTimeout: wsConfig.idleTimeout,
    maxPayloadLength: wsConfig.maxPayloadLength,
    logger: app.logger,
  });

  // Create WebSocket authenticator if authentication is configured
  let wsAuth = null;
  if (wsConfig.auth?.enabled && app.authenticator) {
    wsAuth = new WebSocketAuthenticator({
      authenticator: app.authenticator,
    });
  }

  // Get WebSocket routes
  const wsRoutes = WebSocketRoute.all();
  const wsRouteMap = new Map(wsRoutes.map((r) => [r.path, r]));

  const server = Bun.serve({
    port: app.config.get("http.port", 3000),
    reusePort: app.config.get(
      "http.reusePort",
      process.env.ORCS_CLUSTER_WORKER === "1",
    ),
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
    async fetch(req, server) {
      const url = new URL(req.url);
      const path = url.pathname;

      // Check if this is a WebSocket upgrade request
      const wsRoute = wsRouteMap.get(path);
      if (wsRoute) {
        // Authenticate if required
        if (wsRoute.options?.auth?.required && wsAuth) {
          const ws = { data: {} };
          const canConnect = await wsAuth.required()(req, ws);
          if (!canConnect) {
            return new Response("Unauthorized", { status: 401 });
          }
        }

        // Upgrade to WebSocket
        const success = server.upgrade(req, {
          data: {
            route: wsRoute,
            manager: wsManager,
          },
        });

        if (success) {
          // Authenticate if optional
          if (
            wsRoute.options?.auth &&
            !wsRoute.options.auth.required &&
            wsAuth
          ) {
            // Authentication will happen in open handler
          }
          return undefined;
        }

        return new Response("WebSocket upgrade failed", { status: 500 });
      }

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

    // WebSocket handlers
    websocket: wsManager.getHandlers(),
  });

  // Store manager on server for access in application
  server.wsManager = wsManager;

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
