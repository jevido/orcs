import { ServiceProvider } from "../../src/core/service-provider.js";

export class RouteServiceProvider extends ServiceProvider {
  async boot() {
    // Load API routes only (backend API only)
    await import("../../routes/api.js");
  }
}
