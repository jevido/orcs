import { Application } from "../../src/core/application.js";
import { ServiceProvider } from "../../src/core/service-provider.js";

// Test provider that loads routes from example
class TestRouteProvider extends ServiceProvider {
  async boot() {
    // Load all routes from example directory
    await import("../../../../example/routes/api.js");
    await import("../../../../example/routes/websocket.js");

    // Load test routes
    if (process.env.NODE_ENV === "test") {
      await import("../../../../example/routes/test.js");
    }
  }
}

export async function boot() {
  const app = new Application({
    basePath: import.meta.dir + "/../..",
  });

  // Manually set config instead of loading from files
  app.config.set("app", {
    name: "ORCS Test",
    env: "test",
    url: "http://localhost:42069",
  });

  app.config.set("http", {
    port: 42069,
    idleTimeout: 120,
  });

  app.config.set("openapi", {
    title: "ORCS Test API",
    version: "1.0.0",
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  });

  // Register route provider
  app.register(new TestRouteProvider(app));

  // Boot providers (this loads routes)
  await app.boot();

  // Start server
  const server = app.serve();

  return { app, server };
}
