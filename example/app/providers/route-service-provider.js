import { ServiceProvider } from "../../src/core/service-provider.js";

export class RouteServiceProvider extends ServiceProvider {
  async boot() {
    // Load API routes only (backend API only)
    await import("../../routes/api.js");

    // Load WebSocket routes
    await import("../../routes/websocket.js");

    // Load test routes in test environment
    if (Bun.env.NODE_ENV === "test" || process.env.NODE_ENV === "test") {
      await import("../../routes/test.js");
    }
  }
}
