import { Application } from "../src/core/Application.js";
import { AppExceptionHandler } from "../app/exceptions/Handler.js";
import providers from "./providers.js";

export async function boot() {
  const app = new Application({
    basePath: import.meta.dir + "/..",
  });

  // Load configuration from config/
  await app.loadConfig();

  // Set application exception handler
  app.withExceptionHandler(new AppExceptionHandler());

  // Register all service providers
  for (const Provider of providers) {
    app.register(new Provider(app));
  }

  // Boot all providers (loads routes, starts services)
  await app.boot();

  // Start the HTTP server
  const server = app.serve();

  return { app, server };
}
