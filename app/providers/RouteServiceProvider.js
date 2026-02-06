import { ServiceProvider } from "../../src/core/ServiceProvider.js";

export class RouteServiceProvider extends ServiceProvider {
  async boot() {
    await import("../../routes/api.js");
    await import("../../routes/web.js");
  }
}
