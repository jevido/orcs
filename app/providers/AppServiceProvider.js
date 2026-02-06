import { ServiceProvider } from "../../src/core/ServiceProvider.js";
import { cors } from "../middleware/cors.js";

export class AppServiceProvider extends ServiceProvider {
  register() {
    const corsConfig = this.app.config.get("http.cors", {});

    if (corsConfig.enabled) {
      this.app.useGlobalMiddleware([cors(corsConfig)]);
    }
  }

  async boot() {
    // Register application services, event listeners, etc.
  }
}
