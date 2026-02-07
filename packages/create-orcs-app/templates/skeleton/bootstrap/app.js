import { Application } from "@jevido/orcs";
import { providers } from "./providers.js";

export async function boot() {
  const app = new Application();

  // Register service providers
  for (const Provider of providers) {
    app.register(new Provider(app));
  }

  // Boot application
  const server = await app.boot();

  return { server, app };
}
