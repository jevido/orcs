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

### CLI Alias (Optional)

For convenience, you can create a shell alias to run `orcs` without typing `bun`:

**Option 1: Shell Alias (Bash/Zsh)**

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias orcs="bun $(pwd)/bin/orcs.js"
```

Or for a global alias that works in any ORCS project:

```bash
alias orcs="bun bin/orcs.js"
```

Then reload your shell:

```bash
source ~/.bashrc  # or source ~/.zshrc
```

Now you can run:

```bash
orcs serve
orcs routes
orcs test
orcs make:controller UserController
```

**Option 2: Add to PATH**

Make the CLI globally accessible:

```bash
# Make executable (if not already)
chmod +x bin/orcs.js

# Create a symlink in your local bin
mkdir -p ~/.local/bin
ln -s $(pwd)/bin/orcs.js ~/.local/bin/orcs

# Make sure ~/.local/bin is in your PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
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

**Testing:**

```bash
# Run the test suite
bun orcs test

# Run specific test file
bun orcs test tests/model.test.js

# Run tests with additional Bun test options
bun orcs test --watch
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

## Database

ORCS includes a built-in database layer powered by Bun's native SQL support. Zero external dependencies, support for PostgreSQL, MySQL, and SQLite.

### Configuration

Configure your database connection in `config/database.js` or using the `DATABASE_URL` environment variable:

```bash
# PostgreSQL (recommended)
DATABASE_URL="postgres://user:password@localhost:5432/mydb"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# SQLite
DATABASE_URL="sqlite://storage/database.sqlite"
```

### Local Development with Docker

Start a PostgreSQL database locally using Docker Compose:

```bash
# Start PostgreSQL in the background
docker-compose up -d

# Check database status
docker-compose ps

# View logs
docker-compose logs -f postgres

# Stop database
docker-compose down

# Stop and remove data
docker-compose down -v
```

The database will be available at `postgres://orcs:orcs@localhost:5432/orcs` (already configured in `.env.example`).

**First time setup:**

```bash
# Copy environment file
cp .env.example .env

# Start database
docker-compose up -d

# Wait for database to be ready (check with docker-compose ps)
# Then run migrations
bun orcs db:migrate
```

### Query Builder

ORCS provides a fluent query builder for constructing SQL queries:

```js
import { DB } from "./src/index.js";

// Select all users
const users = await DB("users").get();

// Where clause
const activeUsers = await DB("users")
  .where("active", true)
  .where("age", ">=", 18)
  .get();

// Select specific columns
const emails = await DB("users")
  .select("id", "email")
  .where("verified", true)
  .get();

// Order and limit
const topUsers = await DB("users")
  .orderBy("created_at", "DESC")
  .limit(10)
  .get();

// Get first result
const user = await DB("users").where("email", "john@example.com").first();

// Insert
const newUser = await DB("users").insert({
  name: "Alice",
  email: "alice@example.com",
});

// Update
await DB("users").where("id", 1).update({ name: "Bob" });

// Delete
await DB("users").where("id", 1).delete();

// Joins
const posts = await DB("posts")
  .join("users", "posts.user_id", "=", "users.id")
  .select("posts.*", "users.name as author_name")
  .get();
```

### Raw SQL

For complex queries, use Bun's SQL directly:

```js
import { sql } from "bun";

// Tagged template literals (safe from SQL injection)
const users = await sql`
  SELECT * FROM users
  WHERE created_at > ${since}
  ORDER BY name
`;

// Transactions
await sql.begin(async (tx) => {
  await tx`INSERT INTO users (name) VALUES (${"Alice"})`;
  await tx`UPDATE accounts SET balance = balance - 100`;
});
```

### Migrations

Migrations provide version control for your database schema.

**Create a migration:**

```bash
bun orcs make:migration create_users_table
```

This creates a timestamped migration file in `database/migrations/`:

```js
import { Migration } from "../../src/database/migration.js";

export default class CreateUsersTable extends Migration {
  async up(db) {
    await db.unsafe(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async down(db) {
    await db.unsafe(`DROP TABLE IF EXISTS users`);
  }
}
```

**Run migrations:**

```bash
# Run all pending migrations
bun orcs db:migrate

# Rollback last batch
bun orcs db:rollback

# Reset all migrations
bun orcs db:reset

# Check migration status
bun orcs db:status
```

### Transactions

Execute multiple queries in a transaction:

```js
import { transaction } from "./src/index.js";

await transaction(async (tx) => {
  await tx`INSERT INTO users (name) VALUES (${"Alice"})`;
  await tx`UPDATE accounts SET balance = balance - 100 WHERE user_id = 1`;
  // Auto-commits if no errors, auto-rolls back on error
});
```

### Models

ORCS includes an Active Record-style ORM for working with database records using classes. Models provide a clean, object-oriented API on top of the query builder.

**Define a model:**

```js
// app/models/user.js
import { Model } from "../../src/index.js";

export class User extends Model {
  // Table name (auto-inferred as "users" from class name)
  // static table = "users";

  // Primary key (default: "id")
  // static primaryKey = "id";

  // Enable timestamps (default: true)
  static timestamps = true;

  // Enable soft deletes (default: false)
  static softDeletes = false;

  // Cast attributes to native types
  static casts = {
    active: "boolean",
    age: "integer",
    metadata: "json",
  };

  // Hide attributes when converting to JSON
  static hidden = ["password"];
}
```

**Creating records:**

```js
import { User } from "./app/models/user.js";

// Create and save
const user = await User.create({
  name: "John Doe",
  email: "john@example.com",
  age: 25,
});

// Or create instance then save
const user = new User({
  name: "Jane Doe",
  email: "jane@example.com",
});
await user.save();
```

**Finding records:**

```js
// Find by primary key
const user = await User.find(1);

// Find or throw error
const user = await User.findOrFail(1);

// Find by column value
const users = await User.where("active", true);
const users = await User.where("age", ">=", 18);

// Get all records
const users = await User.all();

// Get first record
const user = await User.first();

// Count records
const count = await User.count();
```

**Updating records:**

```js
// Update instance
const user = await User.find(1);
user.setAttribute("name", "New Name");
await user.save();

// Update multiple records
await User.query().where("active", false).update({ verified: false });
```

**Deleting records:**

```js
// Delete instance
const user = await User.find(1);
await user.destroy();

// Soft delete (if enabled)
await user.destroy(); // Sets deleted_at timestamp

// Force delete (hard delete)
await user.forceDelete();

// Delete multiple records
await User.query().where("active", false).delete();
```

**Working with attributes:**

```js
const user = new User({
  name: "John",
  age: "25", // Will be cast to integer
  active: "1", // Will be cast to boolean
  metadata: '{"key": "value"}', // Will be cast to object
});

// Get attribute
const name = user.getAttribute("name");

// Check if model has unsaved changes
if (user.isDirty()) {
  await user.save();
}

// Get changed attributes
const changes = user.getDirty();

// Refresh from database
await user.refresh();

// Convert to JSON (hidden fields removed)
const json = user.toJSON();
```

**Advanced queries:**

Since models use the query builder under the hood, you can chain any query builder methods:

```js
// Complex queries
const users = await User.query()
  .where("active", true)
  .where("age", ">=", 18)
  .orderBy("created_at", "DESC")
  .limit(10)
  .get();

// Joins
const posts = await Post.query()
  .join("users", "posts.user_id", "=", "users.id")
  .select("posts.*", "users.name as author_name")
  .get();
```

**Timestamps:**

When `timestamps = true`, models automatically manage `created_at` and `updated_at`:

```js
const user = await User.create({ name: "John" });
// created_at and updated_at are set automatically

user.setAttribute("name", "Jane");
await user.save();
// updated_at is automatically updated
```

**Soft Deletes:**

Enable soft deletes to mark records as deleted without removing them:

```js
export class User extends Model {
  static softDeletes = true;
  static deletedAtColumn = "deleted_at";
}

// Soft delete
await user.destroy(); // Sets deleted_at timestamp

// Queries automatically exclude soft-deleted records
const users = await User.all(); // Only returns non-deleted

// Force delete
await user.forceDelete(); // Permanently deletes
```

**Custom table names:**

```js
export class BlogPost extends Model {
  static table = "posts"; // Override auto-inferred "blog_posts"
}
```

## Authentication

ORCS provides a flexible authentication system with support for multiple guards (JWT, API tokens) using zero external dependencies. All cryptographic operations use Bun's native Web Crypto APIs.

### Configuration

Configure authentication in `config/auth.js` and `.env`:

```bash
# .env
AUTH_GUARD=jwt
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
```

### JWT Authentication

JWT (JSON Web Tokens) is the default authentication method. Tokens are signed using HMAC-SHA256.

**Signing a token:**

```js
import { JwtGuard } from "./src/index.js";

const guard = new JwtGuard({
  secret: Bun.env.JWT_SECRET,
});

// Create a token
const token = await guard.sign(
  { userId: 1, email: "user@example.com" },
  { expiresIn: "1h" }, // Optional: "30m", "2h", "7d", or seconds
);

// Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTcwNjEyMzQ1NiwiZXhwIjoxNzA2MTI3MDU2fQ.signature"
```

**Verifying a token:**

```js
const payload = await guard.verifyToken(token);
// Returns: { userId: 1, email: "user@example.com", iat: 1706123456, exp: 1706127056 }
```

### API Token Authentication

API tokens are simple bearer tokens, typically stored hashed in a database.

**Generating a token:**

```js
import { ApiTokenGuard } from "./src/index.js";

// Generate a random token (default: 64 characters)
const token = ApiTokenGuard.generateToken();

// Hash for storage
const hash = await ApiTokenGuard.hashToken(token);
// Save hash to database, return plain token to user
```

**Validating a token:**

```js
const guard = new ApiTokenGuard({
  tokenProvider: async (token) => {
    // Hash the incoming token
    const hash = await ApiTokenGuard.hashToken(token);

    // Look up in database
    const tokenRecord = await DB("api_tokens").where("token", hash).first();
    if (!tokenRecord) return null;

    // Return the user
    return await DB("users").where("id", tokenRecord.user_id).first();
  },
});
```

### Protecting Routes

Use the `auth` middleware to require authentication:

```js
import { Route } from "./src/index.js";
import { auth } from "./app/middleware/auth.js";

Route.group({ prefix: "/api", middleware: [auth] }, () => {
  Route.get("/profile", { summary: "Get user profile" }, (ctx) => {
    return ctx.json(ctx.user); // User is attached by auth middleware
  });
});
```

### Multiple Guards

Use specific guards or allow multiple authentication methods:

```js
import { requireGuards, requireAnyGuard } from "./src/index.js";

// Require BOTH guards to pass
Route.get(
  "/api/admin",
  { middleware: [requireGuards("jwt", "api")] },
  AdminController.index,
);

// Require ANY guard to pass
Route.get(
  "/api/data",
  { middleware: [requireAnyGuard("jwt", "api")] },
  DataController.index,
);
```

### Optional Authentication

Attach user information if present, but don't require it:

```js
import { authOptional } from "./app/middleware/auth.js";

Route.get("/api/posts", { middleware: [authOptional] }, (ctx) => {
  if (ctx.authenticated) {
    // Show private posts for authenticated users
  } else {
    // Show only public posts
  }
});
```

### Setting Up Authentication

Register the authenticator in a service provider:

```js
// app/providers/auth-service-provider.js
import { ServiceProvider } from "../../src/core/service-provider.js";
import { Authenticator } from "../../src/auth/authenticator.js";
import { JwtGuard } from "../../src/auth/guards/jwt-guard.js";
import { ApiTokenGuard } from "../../src/auth/guards/api-token-guard.js";
import { DB } from "../../src/database/query-builder.js";

export class AuthServiceProvider extends ServiceProvider {
  register() {
    const config = this.app.config.get("auth");

    // Create authenticator
    const authenticator = new Authenticator(config);

    // Register JWT guard
    const jwtGuard = new JwtGuard({
      secret: config.jwt.secret,
      algorithm: config.jwt.algorithm,
      // Optional: fetch full user from database
      userProvider: async (payload) => {
        return await DB("users").where("id", payload.userId).first();
      },
    });

    // Register API token guard
    const apiGuard = new ApiTokenGuard({
      tokenProvider: async (token) => {
        const hash = await ApiTokenGuard.hashToken(token);
        const tokenRecord = await DB("api_tokens").where("token", hash).first();
        if (!tokenRecord) return null;
        return await DB("users").where("id", tokenRecord.user_id).first();
      },
    });

    authenticator.registerGuard("jwt", jwtGuard);
    authenticator.registerGuard("api", apiGuard);

    // Attach to app
    this.app.authenticator = authenticator;
  }
}
```

Register the provider in `bootstrap/providers.js`:

```js
import { AuthServiceProvider } from "../app/providers/auth-service-provider.js";

export default [
  // ... other providers
  AuthServiceProvider,
];
```

### Accessing the Authenticated User

In any handler protected by auth middleware:

```js
export class UserController {
  static async profile(ctx) {
    // User is automatically attached by middleware
    const user = ctx.user;

    return ctx.json({
      id: user.id,
      email: user.email,
      authenticated: ctx.authenticated, // Always true in protected routes
    });
  }
}
```

### Example: Login/Register Endpoints

```js
// app/controllers/auth-controller.js
import { DB } from "../../src/database/query-builder.js";
import { JwtGuard } from "../../src/auth/guards/jwt-guard.js";

const guard = new JwtGuard({ secret: Bun.env.JWT_SECRET });

export class AuthController {
  static async register(ctx) {
    const { email, password, name } = ctx.body;

    // Hash password (use bcrypt or similar in production)
    const hashedPassword = await Bun.password.hash(password);

    // Create user
    const user = await DB("users").insert({
      email,
      name,
      password: hashedPassword,
    });

    // Generate JWT
    const token = await guard.sign(
      { userId: user.id, email: user.email },
      { expiresIn: "7d" },
    );

    return ctx.json({ user, token }, 201);
  }

  static async login(ctx) {
    const { email, password } = ctx.body;

    // Find user
    const user = await DB("users").where("email", email).first();
    if (!user) {
      ctx.abort(401, "Invalid credentials");
    }

    // Verify password
    const valid = await Bun.password.verify(password, user.password);
    if (!valid) {
      ctx.abort(401, "Invalid credentials");
    }

    // Generate JWT
    const token = await guard.sign(
      { userId: user.id, email: user.email },
      { expiresIn: "7d" },
    );

    return ctx.json({ user, token });
  }
}
```

## Logging

ORCS includes a built-in structured logging system with support for different log levels, JSON output, and colorized console output for development. Zero external dependencies.

### Basic Usage

```js
import { info, warn, error, debug } from "./src/index.js";

// Log messages at different levels
info("Application started");
warn("Low disk space", { available: "10GB" });
error("Database connection failed", { error: dbError });
debug("Request received", { method: "GET", path: "/api/users" });
```

### Logger Instance

Create a custom logger with specific configuration:

```js
import { Logger } from "./src/index.js";

const logger = new Logger({
  level: "debug", // Minimum log level: debug, info, warn, error
  format: "json", // Output format: json or pretty
  context: { service: "auth", version: "1.0" }, // Global context
});

logger.info("User logged in", { userId: 123, ip: "192.168.1.1" });
```

### Child Loggers

Create child loggers with additional context:

```js
const logger = getLogger();
const requestLogger = logger.child({
  requestId: "abc123",
  userId: 456,
});

requestLogger.info("Processing request");
// Logs: { timestamp, level: "info", message: "Processing request", requestId: "abc123", userId: 456 }
```

### Log Levels

```js
logger.debug("Detailed debug information"); // Development only
logger.info("General information"); // Standard logs
logger.warn("Warning condition"); // Potential issues
logger.error("Error condition", { error }); // Errors and exceptions
```

Logs below the configured level are filtered out:

```js
const logger = new Logger({ level: "warn" });

logger.debug("Not logged"); // Filtered
logger.info("Not logged"); // Filtered
logger.warn("Logged"); // Visible
logger.error("Logged"); // Visible
```

### Request Logging Middleware

Log all HTTP requests automatically:

```js
import { Route } from "./src/index.js";
import { requestLogger } from "./src/index.js";

// Global request logging
Route.use(requestLogger());
```

Each request gets a unique ID and logs:

- Request start (method, path, query, IP, user agent)
- Request completion (status code, duration)
- Errors (with stack traces)

The logger is attached to the context:

```js
export class UserController {
  static async index(ctx) {
    ctx.logger.info("Fetching users", { limit: 10 });
    // ...
  }
}
```

### Access Logs

Simple Apache/Nginx-style access logging:

```js
import { accessLog } from "./src/index.js";

Route.use(accessLog());
// Logs: "192.168.1.1 - GET /api/users 200 15ms"
```

### Log Formats

**Pretty Format (Development):**
Colorized, human-readable output with timestamps:

```
12:34:56 AM INFO  User logged in {"userId":123,"ip":"192.168.1.1"}
12:34:57 AM WARN  Low disk space {"available":"10GB"}
12:34:58 AM ERROR Request failed {"error":{"message":"Timeout","stack":"..."}}
```

**JSON Format (Production):**
Structured JSON for log aggregation tools:

```json
{
  "timestamp": "2026-02-06T12:34:56.789Z",
  "level": "info",
  "message": "User logged in",
  "userId": 123,
  "ip": "192.168.1.1"
}
```

### Configuration

Configure logging in `config/logging.js` and `.env`:

```bash
# .env
LOG_LEVEL=info
LOG_FORMAT=pretty
LOG_REQUESTS=true
LOG_INCLUDE_HEADERS=false
LOG_INCLUDE_BODY=false
```

```js
// config/logging.js
export default {
  level: Bun.env.LOG_LEVEL || "info",
  format: Bun.env.LOG_FORMAT || "pretty",
  requests: {
    enabled: true,
    includeHeaders: false,
    includeBody: false,
  },
};
```

### Error Handling

Automatically handles Error objects:

```js
try {
  throw new Error("Something went wrong");
} catch (error) {
  logger.error("Operation failed", { error });
}
```

Logs:

```json
{
  "timestamp": "2026-02-06T12:34:56.789Z",
  "level": "error",
  "message": "Operation failed",
  "error": {
    "name": "Error",
    "message": "Something went wrong",
    "stack": "Error: Something went wrong\n    at ..."
  }
}
```

### Setting Up Request Logging

Enable request logging in a service provider:

```js
// app/providers/app-service-provider.js
import { ServiceProvider } from "../../src/core/service-provider.js";
import { requestLogger } from "../../src/index.js";

export class AppServiceProvider extends ServiceProvider {
  register() {
    const config = this.app.config.get("logging");

    if (config.requests?.enabled) {
      this.app.useGlobalMiddleware([
        requestLogger({
          includeHeaders: config.requests.includeHeaders,
          includeBody: config.requests.includeBody,
        }),
      ]);
    }
  }
}
```

## WebSocket Support

ORCS includes built-in WebSocket support using Bun's native WebSocket implementation. Build real-time features like chat, notifications, and live updates with zero external dependencies.

### Basic Setup

Define WebSocket routes in `routes/websocket.js`:

```js
import { ws } from "./src/index.js";

ws("/ws/chat", {
  // Handle connection
  connect: (ws, payload) => {
    console.log(`Client ${ws.data.clientId} connected`);
  },

  // Handle custom events
  message: (ws, payload) => {
    const { text } = payload;
    // Echo message back
    ws.send(JSON.stringify({ event: "message", payload: { text } }));
  },

  // Handle disconnection
  disconnect: (ws, payload) => {
    console.log(`Client ${ws.data.clientId} disconnected`);
  },
});
```

### Client-Side Connection

```js
const ws = new WebSocket("ws://localhost:42069/ws/chat");

ws.onopen = () => {
  console.log("Connected!");

  // Send a message
  ws.send(
    JSON.stringify({
      event: "message",
      payload: { text: "Hello!" },
    }),
  );
};

ws.onmessage = (event) => {
  const { event: eventName, payload } = JSON.parse(event.data);
  console.log(`Received ${eventName}:`, payload);
};
```

### Rooms and Broadcasting

WebSocket manager supports rooms for organizing connections:

```js
ws("/ws/chat", {
  join: (ws, payload) => {
    const { room } = payload;
    const manager = ws.data.manager;

    // Join room
    manager.joinRoom(ws.data.clientId, room);

    // Notify room
    manager.broadcastToRoom(room, "user-joined", {
      userId: ws.data.clientId,
    });
  },

  message: (ws, payload) => {
    const { room, text } = payload;
    const manager = ws.data.manager;

    // Broadcast to everyone in room except sender
    manager.broadcastToRoom(
      room,
      "message",
      {
        from: ws.data.clientId,
        text,
        timestamp: new Date().toISOString(),
      },
      { except: [ws.data.clientId] },
    );
  },

  leave: (ws, payload) => {
    const { room } = payload;
    const manager = ws.data.manager;

    manager.leaveRoom(ws.data.clientId, room);
  },
});
```

### Broadcasting Methods

```js
const manager = ws.data.manager;

// Broadcast to all connected clients
manager.broadcast("announcement", {
  message: "Server restarting in 5 minutes",
});

// Broadcast to specific room
manager.broadcastToRoom("lobby", "update", { count: 42 });

// Broadcast to room except specific clients
manager.broadcastToRoom("lobby", "update", data, { except: ["client-123"] });

// Send to specific client
manager.sendToClient("client-456", "notification", { type: "info" });
```

### Authentication

Authenticate WebSocket connections using tokens:

```js
ws(
  "/ws/private",
  {
    connect: (ws, payload) => {
      // Check if authenticated
      if (!ws.data.authenticated) {
        ws.close(4401, "Unauthorized");
        return;
      }

      console.log(`User ${ws.data.user.id} connected`);
    },
  },
  {
    auth: { required: true },
  },
);
```

**Client-side with token:**

```js
// Option 1: Query parameter
const ws = new WebSocket(
  "ws://localhost:42069/ws/private?token=YOUR_JWT_TOKEN",
);

// Option 2: Authorization header (if supported by client)
const ws = new WebSocket("ws://localhost:42069/ws/private", {
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
  },
});

// Option 3: Subprotocol
const ws = new WebSocket("ws://localhost:42069/ws/private", [
  "token",
  "YOUR_JWT_TOKEN",
]);
```

### WebSocket Manager

The WebSocket manager provides connection and room management:

```js
import { WebSocketManager } from "./src/index.js";

const manager = new WebSocketManager({
  idleTimeout: 120, // seconds
  maxPayloadLength: 16 * 1024 * 1024, // 16MB
});

// Register event handlers
manager.on("message", (ws, payload) => {
  // Handle message event
});

// Get connection statistics
const stats = manager.getStats();
console.log(stats);
// { connections: 42, rooms: 5, averageRoomSize: 8.4 }

// Get clients in a room
const clients = manager.getRoomClients("lobby");

// Get rooms a client is in
const rooms = manager.getClientRooms("client-123");

// Disconnect a client
manager.disconnect("client-123", 1000, "Kicked");
```

### WebSocket Context

Each WebSocket connection has a context with useful information:

```js
ws.data.clientId; // Unique client ID
ws.data.connectedAt; // Connection timestamp
ws.data.authenticated; // Authentication status
ws.data.user; // User object (if authenticated)
ws.data.manager; // WebSocket manager instance
```

### Configuration

Configure WebSocket behavior in `config/websocket.js` and `.env`:

```bash
# .env
WS_IDLE_TIMEOUT=120
WS_MAX_PAYLOAD_LENGTH=16777216
WS_AUTH_ENABLED=true
WS_AUTH_REQUIRED=false
```

```js
// config/websocket.js
export default {
  idleTimeout: 120,
  maxPayloadLength: 16 * 1024 * 1024,
  auth: {
    enabled: true,
    required: false,
  },
};
```

### Example: Chat Application

```js
// routes/websocket.js
import { ws } from "./src/index.js";

ws("/ws/chat", {
  connect: (ws, payload) => {
    const manager = ws.data.manager;

    // Join general room
    manager.joinRoom(ws.data.clientId, "general");

    // Welcome message
    manager.send(ws, "welcome", {
      message: "Welcome to chat!",
      clientId: ws.data.clientId,
    });

    // Notify others
    manager.broadcastToRoom(
      "general",
      "user-joined",
      { clientId: ws.data.clientId },
      { except: [ws.data.clientId] },
    );
  },

  message: (ws, payload) => {
    const { room, text } = payload;
    const manager = ws.data.manager;

    // Broadcast message to room
    manager.broadcastToRoom(room, "message", {
      from: ws.data.clientId,
      text,
      timestamp: new Date().toISOString(),
    });
  },

  typing: (ws, payload) => {
    const { room } = payload;
    const manager = ws.data.manager;

    // Notify room about typing
    manager.broadcastToRoom(
      room,
      "user-typing",
      { clientId: ws.data.clientId },
      { except: [ws.data.clientId] },
    );
  },

  disconnect: (ws, payload) => {
    const manager = ws.data.manager;

    // Notify general room
    manager.broadcastToRoom("general", "user-left", {
      clientId: ws.data.clientId,
    });
  },
});
```

### Example: Notifications

```js
ws(
  "/ws/notifications",
  {
    connect: (ws, payload) => {
      const userId = ws.data.user.id;
      const manager = ws.data.manager;

      // Join user-specific room
      manager.joinRoom(ws.data.clientId, `user:${userId}`);

      // Send unread count
      manager.send(ws, "unread-count", { count: 5 });
    },
  },
  { auth: { required: true } },
);

// Send notification to specific user
function notifyUser(userId, notification) {
  manager.broadcastToRoom(`user:${userId}`, "notification", notification);
}
```

### Error Handling

WebSocket errors are automatically logged:

```js
ws("/ws/chat", {
  message: (ws, payload) => {
    try {
      // Your logic
    } catch (error) {
      // Send error to client
      ws.send(
        JSON.stringify({
          event: "error",
          payload: { message: "Something went wrong" },
        }),
      );
    }
  },
});
```

## Background Job Queue

ORCS includes a built-in job queue system for running tasks asynchronously in the background. Process emails, images, reports, and other time-consuming tasks without blocking your API responses.

### Creating Jobs

Create jobs by extending the `Job` class:

```js
// app/jobs/send-email-job.js
import { Job } from "../src/index.js";

export class SendEmailJob extends Job {
  // Configure job behavior
  static maxRetries = 3; // Retry failed jobs up to 3 times
  static retryDelay = 60; // Wait 60 seconds before retrying
  static queue = "emails"; // Queue name
  static priority = 10; // Higher = more important
  static timeout = 30; // Job timeout in seconds

  async handle() {
    const { to, subject, body } = this.data;

    // Send email
    await sendEmail(to, subject, body);
  }

  async failed(error) {
    // Called when job fails after all retries
    console.error(`Failed to send email: ${error.message}`);
  }
}
```

### Dispatching Jobs

Dispatch jobs to run in the background:

```js
import { SendEmailJob } from "./app/jobs/send-email-job.js";

// Dispatch immediately
await SendEmailJob.dispatch({
  to: "user@example.com",
  subject: "Welcome!",
  body: "Thanks for signing up",
});

// Dispatch with delay (in seconds)
await SendEmailJob.dispatchAfter(60, {
  to: "user@example.com",
  subject: "Reminder",
});

// Dispatch with custom options
await SendEmailJob.dispatch(
  { to: "user@example.com" },
  {
    queue: "high-priority",
    priority: 20,
    delay: 30,
  },
);
```

### Queue Drivers

ORCS supports multiple queue drivers:

**Memory Driver** (default) - Fast in-memory queue, good for development:

```bash
# .env
QUEUE_DRIVER=memory
```

**Database Driver** - Persistent queue that survives restarts:

```bash
# .env
QUEUE_DRIVER=database
```

The database driver automatically creates a `jobs` table to store queued jobs.

### Processing Jobs

Start a worker to process background jobs:

```bash
# Process jobs from default queue
bun orcs queue:work

# Process specific queues (in priority order)
bun orcs queue:work --queue high,default,low

# Limit processing
bun orcs queue:work --sleep 5 --max-jobs 100
```

Worker options:

- `--queue` - Comma-separated list of queues to process (in order)
- `--sleep` - Seconds to wait between polls when queue is empty
- `--max-jobs` - Maximum number of jobs to process before stopping

### Queue Management

**View queue statistics:**

```bash
bun orcs queue:stats
bun orcs queue:stats emails  # Specific queue
```

**Clear a queue:**

```bash
bun orcs queue:clear default --force
```

### Job Retries

Failed jobs are automatically retried with exponential backoff:

```js
export class ProcessImageJob extends Job {
  static maxRetries = 3; // Retry up to 3 times
  static retryDelay = 60; // Base delay in seconds

  async handle() {
    // Attempt 1: wait 60s before retry
    // Attempt 2: wait 120s before retry (60 * 2^1)
    // Attempt 3: wait 240s before retry (60 * 2^2)
  }
}
```

### Multiple Queues

Organize jobs into different queues with priorities:

```js
export class SendEmailJob extends Job {
  static queue = "emails";
  static priority = 10;
}

export class ProcessImageJob extends Job {
  static queue = "images";
  static priority = 5;
}

export class GenerateReportJob extends Job {
  static queue = "reports";
  static priority = 1;
}
```

Process queues in priority order:

```bash
bun orcs queue:work --queue emails,images,reports
```

### Configuration

Configure queue behavior in `config/queue.js` and `.env`:

```bash
# .env
QUEUE_DRIVER=memory
QUEUE_DEFAULT=default
QUEUE_WORKER_QUEUES=default,high,low
QUEUE_WORKER_SLEEP=3
QUEUE_WORKER_MAX_JOBS=
```

```js
// config/queue.js
export default {
  driver: "memory", // or "database"
  default: "default",
  worker: {
    queues: ["default"],
    sleep: 3,
    maxJobs: null,
  },
};
```

### Registering Jobs

Register your jobs with the worker so they can be processed:

```js
// app/providers/queue-service-provider.js
import { ServiceProvider } from "../../src/core/service-provider.js";
import { SendEmailJob } from "../jobs/send-email-job.js";
import { ProcessImageJob } from "../jobs/process-image-job.js";

export class QueueServiceProvider extends ServiceProvider {
  register() {
    // Register jobs with the application
    this.app.jobRegistry.set("SendEmailJob", SendEmailJob);
    this.app.jobRegistry.set("ProcessImageJob", ProcessImageJob);
  }
}
```

### Example: Email Notifications

```js
// app/jobs/send-welcome-email-job.js
export class SendWelcomeEmailJob extends Job {
  static queue = "emails";
  static maxRetries = 3;

  async handle() {
    const { userId, email, name } = this.data;

    await sendEmail({
      to: email,
      subject: "Welcome to our platform!",
      template: "welcome",
      data: { name },
    });

    // Update database
    await db
      .table("users")
      .where("id", userId)
      .update({ welcome_email_sent_at: new Date() });
  }

  async failed(error) {
    // Log failure for monitoring
    await db.table("failed_jobs").insert({
      job: "SendWelcomeEmailJob",
      data: JSON.stringify(this.data),
      error: error.message,
      failed_at: new Date(),
    });
  }
}

// In your controller
export class UserController {
  static async register(ctx) {
    const user = await createUser(ctx.body);

    // Dispatch welcome email in background
    await SendWelcomeEmailJob.dispatch({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return ctx.json({ user }, 201);
  }
}
```

### Example: Image Processing

```js
export class ProcessImageJob extends Job {
  static queue = "images";
  static maxRetries = 2;
  static timeout = 120; // 2 minutes

  async handle() {
    const { imageId, operations } = this.data;

    const image = await loadImage(imageId);

    for (const op of operations) {
      switch (op.type) {
        case "resize":
          await resizeImage(image, op.width, op.height);
          break;
        case "thumbnail":
          await createThumbnail(image, op.size);
          break;
        case "watermark":
          await addWatermark(image, op.text);
          break;
      }
    }

    await saveImage(image, imageId);
  }
}

// Dispatch from controller
await ProcessImageJob.dispatch({
  imageId: upload.id,
  operations: [
    { type: "resize", width: 1920, height: 1080 },
    { type: "thumbnail", size: 200 },
    { type: "watermark", text: "© 2026" },
  ],
});
```

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
  getConnection, // Get database connection
  closeConnection, // Close database connection
  transaction, // Execute queries in a transaction
  QueryBuilder, // Query builder class
  DB, // Shorthand for QueryBuilder
  table, // Create query builder for table
  Model, // Active Record base class
  Migration, // Base migration class
  Migrator, // Migration runner
  Authenticator, // Authentication manager
  JwtGuard, // JWT authentication guard
  ApiTokenGuard, // API token authentication guard
  auth, // Auth middleware factory
  requireGuards, // Require multiple guards
  requireAnyGuard, // Require any of multiple guards
  Logger, // Logger class
  getLogger, // Get default logger instance
  setLogger, // Set default logger instance
  debug, // Log debug message
  info, // Log info message
  warn, // Log warning message
  error, // Log error message
  requestLogger, // Request logging middleware
  accessLog, // Access log middleware
  WebSocketManager, // WebSocket connection manager
  WebSocketRoute, // WebSocket route definition
  ws, // Define WebSocket route
  WebSocketAuthenticator, // WebSocket authentication
} from "./src/index.js";
```

## Roadmap

- [x] Request validation against OpenAPI schemas
- [x] `/docs` endpoint (Swagger UI / Scalar / jevido/openapi-docs)
- [x] CLI tooling (`bun orcs serve`, `bun orcs routes`, `bun orcs make:*`)
- [x] Database layer (query builder, migrations, seeds)
- [x] Authentication middleware and guards
- [x] Logging system with structured output
- [x] WebSocket support via Bun
- [x] Background job queue
- [ ] Response caching middleware
- [ ] S3 support
- [ ] Split the readme into docs/markdownfiles, and make the readme on how to start an orcs project

See [todo.md](todo.md) for the full roadmap.

## License

MIT
