import { ServiceProvider } from "@jevido/orcs";

export class RouteServiceProvider extends ServiceProvider {
  async boot() {
    // Load routes
    await import("../../routes/api.js");
  }
}
