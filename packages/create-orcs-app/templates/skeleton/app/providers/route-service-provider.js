import { ServiceProvider } from "@jevido/orcs";

export class RouteServiceProvider extends ServiceProvider {
  async boot() {
    // Load route files
    await import("../../routes/api.js");
  }
}
