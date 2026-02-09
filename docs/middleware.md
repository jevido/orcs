# Middleware

Middleware uses the onion model. Each middleware receives `ctx` and a `next` function.

## Global Middleware

Registered in a service provider, runs on every request:

```js
// app/providers/app-service-provider.js
import { ServiceProvider } from "../../src/core/service-provider.js";
import { cors } from "../middleware/cors.js";

export class AppServiceProvider extends ServiceProvider {
  register() {
    if (this.app.config.get("http.cors.enabled")) {
      this.app.useGlobalMiddleware([cors(this.app.config.get("http.cors"))]);
    }
  }
}
```

## Named Middleware

Register middleware by name, then reference it in routes:

```js
// In a service provider
this.app.registerMiddleware({
  auth: async (ctx, next) => {
    if (!ctx.headers.authorization) {
      return ctx.json({ error: "Unauthorized" }, 401);
    }
    await next();
  },
});

// In routes
Route.group({ prefix: "/api/admin", middleware: ["auth"] }, () => {
  // These routes require authentication
});
```

## Route-Level Middleware

```js
Route.use(async (ctx, next) => {
  console.log(`${ctx.method} ${ctx.path}`);
  await next();
});
```

## Writing Middleware

```js
export async function timing(ctx, next) {
  const start = performance.now();
  await next();
  const ms = (performance.now() - start).toFixed(2);
  console.log(`${ctx.method} ${ctx.path} — ${ms}ms`);
}
```
