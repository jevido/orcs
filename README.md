# ORCS

**Opinionated Runtime for Contractual Services**

Build monolithic empires. Contract-first.

---

A Bun-first web framework where your routes **are** your API contract. Every route definition simultaneously registers a handler and generates its OpenAPI specification. No separate docs to maintain. No specs drifting out of sync. Your code is the contract, and the contract is always true.

Inspired by Laravel's structure and developer experience. Powered by Bun. Zero external dependencies.

## Principles

- **Routes are the contract** — every `Route.get()` defines both the handler and the OpenAPI spec in one declaration
- **OpenAPI is always in sync** — the spec is generated from your routes, not written separately
- **Laravel's conventions, JavaScript's simplicity** — familiar directory structure, service providers, middleware pipeline
- **Bun-only** — no Node polyfills, no compatibility layers, no compromise
- **Explicit over implicit** — no decorator magic, no reflection, no dependency injection
- **Zero dependencies** — the framework is entirely self-contained

## Quick Start

```bash
# Clone and run
bun run dev
```

Visit:

- `GET http://localhost:42069/api/health` — your first endpoint
- `GET http://localhost:42069/docs` — interactive API documentation
- `GET http://localhost:42069/openapi.json` — your auto-generated OpenAPI spec

## Project Structure

```
orcs/
├── app/                          # Your application code
│   ├── controllers/              # Route handlers organized by resource
│   │   └── health-controller.js
│   ├── middleware/                # Custom middleware
│   │   └── cors.js
│   ├── providers/                # Service providers (boot lifecycle)
│   │   ├── app-service-provider.js
│   │   └── route-service-provider.js
│   └── exceptions/               # Error handling
│       └── handler.js
│
├── bootstrap/                    # Application bootstrap
│   ├── app.js                    # Creates and boots the application
│   └── providers.js              # Provider registration list
│
├── config/                       # Configuration files
│   ├── app.js                    # App name, environment, URL
│   ├── http.js                   # Port, timeouts, CORS
│   └── openapi.js                # OpenAPI document metadata
│
├── routes/                       # Route definitions (the contracts)
│   ├── api.js                    # API routes — auto-prefixed with /api
│   └── web.js                    # Web routes — no prefix
│
├── src/                          # Framework internals
│   ├── core/                     # Application, ServiceProvider, helpers
│   ├── config/                   # Configuration loading, env() helper
│   ├── http/                     # Server, Context, Middleware
│   ├── routing/                  # Router, RouteCollection, RouteCompiler
│   ├── openapi/                  # Registry, Generator, SchemaBuilder
│   └── errors/                   # HttpException, ValidationException, Handler
│
├── storage/logs/                 # Application logs
├── public/                       # Static files
├── tests/                        # Test files
├── server.js                     # Entry point
├── .env.example                  # Environment variable template
└── package.json
```

## Defining Routes

Routes are the single source of truth. Each route declares its handler **and** its OpenAPI metadata in one call.

### Inline Handlers

```js
import { Route } from "./src/index.js";

Route.get(
  "/api/health",
  {
    summary: "Health check",
    responses: {
      200: { description: "Service is healthy" },
    },
  },
  (ctx) => ctx.json({ status: "ok" }),
);
```

### With Controllers

```js
import { Route } from "./src/index.js";
import { UserController } from "../app/controllers/user-controller.js";

Route.group({ prefix: "/api/users", tags: ["Users"] }, () => {
  Route.get(
    "/",
    {
      summary: "List all users",
      responses: { 200: { description: "User list" } },
    },
    UserController.index,
  );

  Route.post(
    "/",
    {
      summary: "Create a user",
      requestBody: {
        email: { type: "string", format: "email" },
        name: { type: "string", minLength: 1 },
        password: { type: "string", minLength: 8 },
      },
      responses: {
        201: { description: "User created" },
        422: { description: "Validation failed" },
      },
    },
    UserController.store,
  );

  Route.get(
    "/:id",
    {
      summary: "Get user by ID",
      responses: {
        200: { description: "User details" },
        404: { description: "Not found" },
      },
    },
    UserController.show,
  );
});
```

### Route Groups

Groups share a prefix, tags, and middleware:

```js
Route.group(
  { prefix: "/api/admin", tags: ["Admin"], middleware: ["auth"] },
  () => {
    Route.get(
      "/dashboard",
      { summary: "Admin dashboard" },
      AdminController.index,
    );
    Route.get("/users", { summary: "Manage users" }, AdminController.users);
  },
);
```

### Request Body Shorthand

You can pass full OpenAPI `requestBody` or a shorthand object. The shorthand auto-wraps into a proper JSON schema:

```js
// Shorthand — just the properties
requestBody: {
  email: { type: "string", format: "email" },
  password: { type: "string", minLength: 8 },
}

// Becomes this OpenAPI spec automatically:
requestBody: {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
        required: ["email", "password"],
      },
    },
  },
}
```

### Request Validation

ORCS automatically validates incoming request bodies against the OpenAPI schema defined in your routes. If validation fails, a structured 422 error is returned.

```js
Route.post(
  "/api/users",
  {
    requestBody: {
      email: { type: "string", format: "email" },
      name: { type: "string", minLength: 2, maxLength: 50 },
      age: { type: "integer", minimum: 18 },
    },
  },
  UserController.store,
);
```

**Valid request:**

```json
{
  "email": "john@example.com",
  "name": "John Doe",
  "age": 25
}
```

→ Passes validation, handler executes

**Invalid request:**

```json
{
  "email": "not-an-email",
  "name": "J",
  "age": 17
}
```

→ Returns 422 with validation errors:

```json
{
  "error": "Validation Error",
  "message": "Validation failed",
  "errors": {
    "email": ["must be a valid email address"],
    "name": ["must be at least 2 characters long"],
    "age": ["must be at least 18"]
  }
}
```

**Supported validations:**

- **Type**: `string`, `number`, `integer`, `boolean`, `array`, `object`
- **String**: `minLength`, `maxLength`, `pattern` (regex)
- **Number**: `minimum`, `maximum`, `multipleOf`, `exclusiveMinimum`, `exclusiveMaximum`
- **Format**: `email`, `url`, `uri`, `uuid`, `date`, `date-time`
- **Required fields**: All fields in shorthand `requestBody` are required by default

Validation happens automatically before your handler runs. No need for manual checks or third-party validation libraries.

## Controllers

Controllers are classes with static methods. Each method receives a `ctx` (context) object with everything it needs.

```js
// app/controllers/user-controller.js

export class UserController {
  static async index(ctx) {
    const page = ctx.query.page || 1;
    // fetch users...
    return ctx.json({ users: [], page });
  }

  static async store(ctx) {
    const { email, name, password } = ctx.body;
    // create user...
    return ctx.json({ id: 1, email, name }, 201);
  }

  static async show(ctx) {
    const user = null; // find by ctx.params.id
    if (!user) ctx.abort(404, "User not found");
    return ctx.json(user);
  }
}
```

### The Context Object

Every handler receives `ctx` with:

| Property / Method            | Description                                           |
| ---------------------------- | ----------------------------------------------------- |
| `ctx.params`                 | URL path parameters (`/users/:id` -> `ctx.params.id`) |
| `ctx.query`                  | Query string parameters                               |
| `ctx.body`                   | Parsed request body (JSON, text)                      |
| `ctx.headers`                | Request headers as a plain object                     |
| `ctx.method`                 | HTTP method (GET, POST, etc.)                         |
| `ctx.path`                   | Request path                                          |
| `ctx.json(data, status?)`    | Return a JSON response                                |
| `ctx.text(data, status?)`    | Return a text response                                |
| `ctx.redirect(url, status?)` | Return a redirect                                     |
| `ctx.abort(status, message)` | Throw an HTTP exception                               |

Handlers can also return plain values:

- **`Response`** — passed through as-is
- **`string`** — returned as `text/plain`
- **`object`** — returned as `application/json`
- **`undefined`** — returns `204 No Content`

## Middleware

Middleware uses the onion model. Each middleware receives `ctx` and a `next` function.

### Global Middleware

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

### Named Middleware

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

### Route-Level Middleware

```js
Route.use(async (ctx, next) => {
  console.log(`${ctx.method} ${ctx.path}`);
  await next();
});
```

### Writing Middleware

```js
export async function timing(ctx, next) {
  const start = performance.now();
  await next();
  const ms = (performance.now() - start).toFixed(2);
  console.log(`${ctx.method} ${ctx.path} — ${ms}ms`);
}
```

## OpenAPI

OpenAPI is not a bolt-on — it is generated directly from your route definitions.

### Interactive Documentation

Visit `/docs` in your browser for a beautiful, interactive API documentation UI powered by Scalar:

```
GET /docs
```

The documentation automatically loads your OpenAPI spec and provides:

- **Try it out** — test your API endpoints directly from the browser
- **Code examples** — auto-generated request examples in multiple languages
- **Type definitions** — clear schemas for request/response bodies
- **Dark mode** — automatically matches your system preferences

### Accessing the Spec

The spec is served automatically at:

```
GET /openapi.json
```

It returns a complete OpenAPI 3.1.0 document built from every route that includes metadata.

### Programmatic Access

```js
import { generateOpenApiDocument } from "./src/index.js";

const spec = generateOpenApiDocument();
console.log(JSON.stringify(spec, null, 2));
```

### What Gets Included

Any route with a `summary`, `requestBody`, or `responses` in its metadata gets an OpenAPI entry. Routes without metadata (inline handlers with no second argument) are silently skipped.

Path parameters like `:id` are automatically converted to OpenAPI format `{id}`.

## Configuration

Configuration lives in `config/` as plain JavaScript objects with environment variable overrides.

### Config Files

| File                | Purpose               | Key Values                        |
| ------------------- | --------------------- | --------------------------------- |
| `config/app.js`     | Application settings  | `name`, `env`, `url`, `debug`     |
| `config/http.js`    | HTTP server settings  | `port`, `idleTimeout`, `cors`     |
| `config/openapi.js` | OpenAPI document info | `title`, `version`, `description` |

### The `env()` Helper doesn't exist

Just write `Bun.env.APP_NAME || 'orcs'`

````

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
APP_NAME=ORCS
APP_ENV=development
PORT=42069
CORS_ENABLED=false
OPENAPI_TITLE="My API"
````

## Service Providers

Service providers manage the application boot lifecycle. They are registered in `bootstrap/providers.js`.

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

### Provider Registration

```js
// bootstrap/providers.js
import { AppServiceProvider } from "../app/providers/app-service-provider.js";
import { RouteServiceProvider } from "../app/providers/route-service-provider.js";

export default [AppServiceProvider, RouteServiceProvider];
```

### Boot Sequence

1. `Application` is created
2. `loadConfig()` — imports all config files, merges with environment
3. `register()` — each provider's `register()` runs (sync)
4. `boot()` — each provider's `boot()` runs (async, sequential)
5. `serve()` — Bun HTTP server starts

## Error Handling

ORCS returns structured JSON errors with consistent formatting.

### Throwing Errors

```js
import { abort } from "./src/index.js";

// In a handler
static show(ctx) {
  const user = findUser(ctx.params.id);
  if (!user) ctx.abort(404, "User not found");
  return ctx.json(user);
}

// Or anywhere
abort(403, "Access denied");
```

### Error Response Format

```json
{
  "error": "Not Found",
  "message": "User not found"
}
```

Validation errors include field details:

```json
{
  "error": "Validation Error",
  "message": "Validation failed",
  "errors": {
    "email": ["must be a valid email"],
    "password": ["must be at least 8 characters"]
  }
}
```

### Custom Exception Handler

Override the default handler in `app/exceptions/handler.js`:

```js
import { ExceptionHandler } from "../../src/errors/handler.js";

export class AppExceptionHandler extends ExceptionHandler {
  render(error, ctx) {
    // Custom formatting, logging, etc.
    return super.render(error, ctx);
  }
}
```

### Environment-Aware

- **Development**: error responses include stack traces
- **Production** (`APP_ENV=production`): stack traces are hidden, generic messages for 500s

## CLI Tooling

ORCS includes a command-line interface for common tasks:

```bash
bun orcs <command> [options]
```

### Available Commands

**Server Management:**

```bash
# Start the HTTP server
bun orcs serve
```

**Introspection:**

```bash
# List all registered routes
bun orcs routes
```

**Code Generation:**

```bash
# Generate a new controller
bun orcs make:controller UserController

# Generate a new middleware
bun orcs make:middleware auth

# Generate a new service provider
bun orcs make:provider CacheServiceProvider
```

### Examples

**Creating a resource controller:**

```bash
bun orcs make:controller PostController
```

Generates `app/controllers/post-controller.js` with CRUD methods (index, store, show, update, destroy).

**Creating middleware:**

```bash
bun orcs make:middleware rateLimit
```

Generates `app/middleware/rate-limit.js` with the onion model pattern already set up.

**Viewing routes:**

```bash
bun orcs routes
```

Displays a formatted table of all registered routes with their methods, paths, and metadata.

## Comparison with Laravel

| Concept           | Laravel                           | ORCS                              |
| ----------------- | --------------------------------- | --------------------------------- |
| Runtime           | PHP                               | Bun                               |
| Route definitions | `Route::get()` + separate OpenAPI | `Route.get()` with inline OpenAPI |
| Controllers       | Class with dependency injection   | Class with static methods + ctx   |
| Models            | Eloquent ORM                      | No ORM (bring your own)           |
| Configuration     | PHP arrays + `.env`               | JS objects + `Bun.env` helper     |
| CLI               | `php artisan`                     | `bun orcs`                        |
| Middleware        | Class-based                       | Function-based (onion model)      |
| Service providers | Full DI container                 | Boot lifecycle only (no DI)       |
| Views             | Blade templates                   | N/A (API-first)                   |
| API docs          | Third-party package               | Built-in (`/openapi.json`)        |
| Dependencies      | Composer + many packages          | Zero external dependencies        |

## API Surface

```js
import {
  Application, // App orchestrator
  ServiceProvider, // Base provider class
  Route, // Route.get/post/put/patch/delete/group/use
  Context, // Request context
  HttpException, // Throwable HTTP error
  ValidationException, // 422 with field errors
  ExceptionHandler, // Base error handler
  abort, // Throw HTTP exception
  generateOpenApiDocument, // Get the full OpenAPI spec
  Validator, // JSON schema validator
  createValidationMiddleware, // Create validation middleware from schema
  createDocsHandler, // Create interactive documentation handler
} from "./src/index.js";
```

## Roadmap

- [x] Request validation against OpenAPI schemas
- [x] `/docs` endpoint (Swagger UI / Scalar / jevido/openapi-docs)
- [x] CLI tooling (`bun orcs serve`, `bun orcs routes`, `bun orcs make:*`)
- [ ] Database layer (query builder, migrations, seeds)
- [ ] Authentication middleware and guards
- [ ] Logging system with structured output
- [ ] WebSocket support via Bun
- [ ] Background job queue
- [ ] Response caching middleware

See [todo.md](todo.md) for the full roadmap.

## License

MIT
