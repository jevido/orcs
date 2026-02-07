# ORCS

**Opinionated Runtime for Contractual Services**

Build monolithic empires. Contract-first.

---

A Bun-first web framework where your routes **are** your API contract. Every route definition simultaneously registers a handler and generates its OpenAPI specification. No separate docs to maintain. No specs drifting out of sync. Your code is the contract, and the contract is always true.

Inspired by Laravel's structure and developer experience. Powered by Bun. Zero external dependencies.

## Features

- ✅ **Contract-first routing** — routes define both handlers and OpenAPI specs
- ✅ **Automatic validation** — request bodies validated against your schemas
- ✅ **Interactive docs** — `/docs` endpoint with Scalar UI
- ✅ **Database layer** — query builder, migrations, Active Record ORM
- ✅ **Authentication** — JWT and API tokens with zero dependencies
- ✅ **Logging** — structured logging with request tracking
- ✅ **WebSockets** — real-time features with Bun's native WebSocket support
- ✅ **Job queue** — background processing with memory or database drivers
- ✅ **S3 storage** — native S3 support for AWS, R2, Spaces, MinIO, and more
- ✅ **CLI tooling** — code generation, migrations, queue workers

## Quick Start

### Create a New Project

```bash
# Create a new ORCS project
bunx @jevido/create-orcs-app my-api

# Navigate to your project
cd my-api

# Set your GitHub token for package installation
export GITHUB_TOKEN=your_github_token_here

# Install dependencies
bun install

# Start the development server
bun run dev
```

Visit:
- **API**: http://localhost:42069/api/health
- **Docs**: http://localhost:42069/docs
- **OpenAPI Spec**: http://localhost:42069/openapi.json

### Authentication Setup

ORCS is distributed via GitHub Packages. You'll need a GitHub Personal Access Token:

1. Go to https://github.com/settings/tokens
2. Generate a new token with `read:packages` scope
3. Set it in your environment: `export GITHUB_TOKEN=your_token_here`
4. Or add it to your project's `.env` file

### CLI Commands

```bash
bun orcs serve              # Start the server
bun orcs routes             # List all routes
bun orcs make:controller    # Generate a controller
bun orcs make:middleware    # Generate middleware
bun orcs make:migration     # Generate a migration
bun orcs db:migrate         # Run migrations
bun orcs queue:work         # Start queue worker
```

## Your First Route

```js
// routes/api.js
import { Route } from "@jevido/orcs";

Route.get(
  "/api/hello",
  {
    summary: "Say hello",
    responses: {
      200: { description: "Greeting message" },
    },
  },
  (ctx) => ctx.json({ message: "Hello, ORCS!" }),
);
```

That's it! Your route is live, validated, and documented.

## Repository Structure

This is a monorepo containing:

```
orcs/
├── packages/
│   ├── orcs/                 # Framework package (@jevido/orcs)
│   │   ├── src/             # Framework internals
│   │   ├── bin/             # CLI commands
│   │   └── tests/           # Framework tests
│   └── create-orcs-app/      # Project scaffolder
│       ├── bin/             # CLI tool
│       └── templates/       # Project templates
├── example/                  # Example application
└── docs/                     # Documentation
```

## User Project Structure

When you create a new project with `create-orcs-app`, you get:

```
my-api/
├── app/                      # Your application code
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Custom middleware
│   ├── providers/            # Service providers
│   ├── jobs/                 # Background jobs
│   └── exceptions/           # Error handling
├── bootstrap/                # Application bootstrap
├── config/                   # Configuration files
├── routes/                   # Route definitions
│   ├── api.js               # API routes
│   └── websocket.js         # WebSocket routes
├── database/                 # Database files
│   └── migrations/          # Database migrations
├── .env                      # Environment variables
├── .npmrc                    # Package registry config
└── server.js                # Entry point
```

## Core Concepts

### Routes are Contracts

Every route defines both behavior and documentation:

```js
Route.post(
  "/api/users",
  {
    summary: "Create a user",
    requestBody: {
      email: { type: "string", format: "email" },
      name: { type: "string", minLength: 2 },
    },
    responses: {
      201: { description: "User created" },
      422: { description: "Validation failed" },
    },
  },
  UserController.store,
);
```

### Controllers Handle Requests

```js
export class UserController {
  static async store(ctx) {
    const { email, name } = ctx.body; // Already validated!
    const user = await createUser({ email, name });
    return ctx.json({ user }, 201);
  }
}
```

### Context Has Everything

```js
ctx.params    // URL parameters
ctx.query     // Query string
ctx.body      // Request body (validated)
ctx.headers   // Request headers
ctx.user      // Authenticated user (if auth middleware)
ctx.json()    // Return JSON response
ctx.abort()   // Throw HTTP exception
```

## Documentation

Explore the comprehensive documentation to learn more:

### Getting Started
- [Routing](docs/routing.md) — Define routes, controllers, and handle requests
- [Validation](docs/validation.md) — Automatic request validation
- [Middleware](docs/middleware.md) — Request processing pipeline
- [OpenAPI](docs/openapi.md) — Auto-generated API documentation
- [Configuration](docs/configuration.md) — Environment and config files
- [Error Handling](docs/error-handling.md) — Structured error responses

### Core Features
- [Service Providers](docs/service-providers.md) — Application boot lifecycle
- [CLI Tooling](docs/cli.md) — Commands and code generation
- [Database](docs/database.md) — Query builder, migrations, and ORM
- [Authentication](docs/authentication.md) — JWT and API tokens
- [Logging](docs/logging.md) — Structured logging with request tracking

### Advanced Features
- [WebSockets](docs/websockets.md) — Real-time communication
- [Job Queue](docs/queue.md) — Background task processing
- [S3 Storage](docs/storage.md) — Object storage with S3-compatible services

## Examples

Check out the examples in the `app/examples/` directory:
- [S3 Storage Examples](app/examples/s3-example.js)

## Principles

- **Routes are the contract** — every `Route.get()` defines both the handler and the OpenAPI spec
- **OpenAPI is always in sync** — the spec is generated from your routes, not written separately
- **Laravel's conventions, JavaScript's simplicity** — familiar directory structure, but with modern JS
- **Bun-only** — no Node polyfills, no compatibility layers, no compromise
- **Explicit over implicit** — no decorator magic, no reflection, no dependency injection
- **Zero dependencies** — the framework is entirely self-contained

## Comparison with Laravel

| Concept           | Laravel                           | ORCS                              |
| ----------------- | --------------------------------- | --------------------------------- |
| Runtime           | PHP                               | Bun                               |
| Route definitions | `Route::get()` + separate OpenAPI | `Route.get()` with inline OpenAPI |
| Controllers       | Class with dependency injection   | Class with static methods + ctx   |
| Configuration     | PHP arrays + `.env`               | JS objects + `Bun.env`            |
| CLI               | `php artisan`                     | `bun orcs`                        |
| Dependencies      | Composer + many packages          | Zero external dependencies        |

## API Surface

```js
import {
  // Core
  Application,
  ServiceProvider,
  Route,
  Context,
  abort,

  // OpenAPI & Validation
  generateOpenApiDocument,
  Validator,
  createValidationMiddleware,
  createDocsHandler,

  // Database
  DB,
  QueryBuilder,
  Model,
  Migration,
  Migrator,
  getConnection,
  transaction,

  // Authentication
  Authenticator,
  JwtGuard,
  ApiTokenGuard,
  auth,
  requireGuards,
  requireAnyGuard,

  // Logging
  Logger,
  getLogger,
  debug,
  info,
  warn,
  error,
  requestLogger,
  accessLog,

  // WebSockets
  WebSocketManager,
  ws,

  // Job Queue
  Job,
  QueueManager,
  Worker,

  // S3 Storage
  S3Storage,
  s3upload,
  s3download,
  s3file,
  s3presign,
  s3list,

  // Errors
  HttpException,
  ValidationException,
  ExceptionHandler,
} from "@jevido/orcs";
```

## Roadmap

- [x] Request validation against OpenAPI schemas
- [x] `/docs` endpoint (Swagger UI / Scalar)
- [x] CLI tooling (`bun orcs serve`, `bun orcs routes`, `bun orcs make:*`)
- [x] Database layer (query builder, migrations, ORM)
- [x] Authentication middleware and guards
- [x] Logging system with structured output
- [x] WebSocket support via Bun
- [x] Background job queue
- [x] S3 support
- [x] Documentation organization
- [x] Framework distribution via GitHub Packages
- [x] Project scaffolder (`create-orcs-app`)

## Testing

```bash
# Run all tests
bun test

# Run specific test
bun test tests/routing.test.js

# Run with coverage
bun test --coverage
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

---

**Built with [Bun](https://bun.sh) — the all-in-one JavaScript runtime.**
