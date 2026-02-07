# My ORCS Project

Built with [ORCS](https://github.com/jevido/orcs) - Opinionated Runtime for Contractual Services.

## Quick Start

```bash
# Start development server
bun run dev

# Start production server
bun start

# Run tests
bun test
```

## Endpoints

- **API**: http://localhost:42069/api
- **Health**: http://localhost:42069/api/health
- **Docs**: http://localhost:42069/docs
- **OpenAPI**: http://localhost:42069/openapi.json

## Project Structure

```
.
├── app/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── providers/        # Service providers
│   ├── jobs/            # Background jobs
│   └── exceptions/      # Error handling
├── bootstrap/           # Application bootstrap
├── config/             # Configuration files
├── routes/             # Route definitions
│   ├── api.js          # API routes
│   └── websocket.js    # WebSocket routes
├── database/
│   └── migrations/     # Database migrations
├── storage/
│   └── logs/           # Application logs
└── server.js          # Entry point
```

## Adding Routes

Edit [routes/api.js](routes/api.js):

```javascript
import { Route } from "@jevido/orcs";
import { UserController } from "../app/controllers/user-controller.js";

Route.get("/api/users", {
  summary: "List users",
  tags: ["Users"],
  responses: { 200: { description: "User list" } }
}, UserController.index);
```

Your routes automatically generate OpenAPI documentation!

## Creating Controllers

```bash
bun orcs make:controller UserController
```

This creates `app/controllers/user-controller.js`:

```javascript
export class UserController {
  static async index(ctx) {
    return ctx.json({ users: [] });
  }
}
```

## CLI Commands

```bash
bun orcs serve              # Start the server
bun orcs routes             # List all routes
bun orcs make:controller    # Generate a controller
bun orcs make:middleware    # Generate middleware
bun orcs make:migration     # Generate a migration
bun orcs db:migrate         # Run migrations
bun orcs queue:work         # Start queue worker
```

## Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Configuration files are in the [config/](config/) directory.

## Documentation

- [ORCS Documentation](https://github.com/jevido/orcs)
- [Routing](https://github.com/jevido/orcs/blob/main/docs/routing.md)
- [Validation](https://github.com/jevido/orcs/blob/main/docs/validation.md)
- [Database](https://github.com/jevido/orcs/blob/main/docs/database.md)
- [Authentication](https://github.com/jevido/orcs/blob/main/docs/authentication.md)
- [WebSockets](https://github.com/jevido/orcs/blob/main/docs/websockets.md)
- [Job Queue](https://github.com/jevido/orcs/blob/main/docs/queue.md)

## Example Files

This project includes example files to help you get started:

- [app/controllers/example-controller.js](app/controllers/example-controller.js) - CRUD example
- [app/middleware/cors-middleware.js](app/middleware/cors-middleware.js) - CORS example
- [app/jobs/example-job.js](app/jobs/example-job.js) - Background job example

Feel free to modify or delete these files as you build your application.
