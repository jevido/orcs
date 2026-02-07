# Service Providers

Service providers manage the application boot lifecycle. They are registered in `bootstrap/providers.js`.

## Creating a Service Provider

```js
import { ServiceProvider } from "../../src/core/service-provider.js";

export class AppServiceProvider extends ServiceProvider {
  register() {
    // Called immediately when the provider is registered.
    // Register middleware, configure services.
  }

  async boot() {
    // Called after ALL providers are registered.
    // Safe to depend on other providers' registrations.
  }
}
```

## Provider Registration

```js
// bootstrap/providers.js
import { AppServiceProvider } from "../app/providers/app-service-provider.js";
import { RouteServiceProvider } from "../app/providers/route-service-provider.js";

export default [AppServiceProvider, RouteServiceProvider];
```

## Boot Sequence

1. `Application` is created
2. `loadConfig()` — imports all config files, merges with environment
3. `register()` — each provider's `register()` runs (sync)
4. `boot()` — each provider's `boot()` runs (async, sequential)
5. `serve()` — Bun HTTP server starts
