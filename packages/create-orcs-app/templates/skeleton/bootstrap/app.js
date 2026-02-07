import { Application } from "@jevido/orcs";
import providers from "./providers.js";

export async function boot() {
  const app = new Application({
    basePath: import.meta.dir + "/..",
  });

  // Load configuration
  await app.loadConfig();

  // Register service providers
  for (const Provider of providers) {
    app.register(new Provider(app));
  }

  // Boot providers (loads routes, services)
  await app.boot();

  // Start HTTP server
  const server = app.serve();

  return { app, server };
}
