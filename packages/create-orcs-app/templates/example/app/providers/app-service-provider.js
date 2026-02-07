import { ServiceProvider } from "@jevido/orcs";

export class AppServiceProvider extends ServiceProvider {
  register() {
    // Register services, middleware, etc.
  }

  async boot() {
    // Boot services after all providers are registered
  }
}
