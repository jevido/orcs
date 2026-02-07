# My ORCS Project

Built with [ORCS](https://github.com/jevido/orcs) - Opinionated Runtime for Contractual Services.

## Quick Start

```bash
# Start development server
bun run dev

# Or start normally
bun start
```

## Endpoints

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
│   └── api.js          # API routes
├── database/
│   └── migrations/     # Database migrations
├── storage/
│   └── logs/           # Application logs
└── server.js          # Entry point
```

## Adding Your First Route

Edit [routes/api.js](routes/api.js):

```javascript
import { Route } from "@jevido/orcs";

Route.get("/api/users", {
  summary: "List users",
  tags: ["Users"],
  responses: { 200: { description: "User list" } }
}, (ctx) => ctx.json({ users: [] }));
```

Your routes automatically generate OpenAPI documentation!

## CLI Commands

```bash
# Code Generation
bun orcs make:controller UserController
bun orcs make:middleware AuthMiddleware
bun orcs make:migration create_users_table
bun orcs make:provider CacheServiceProvider

# Database
bun orcs db:migrate         # Run migrations
bun orcs db:rollback        # Rollback last migration
bun orcs db:status          # Migration status

# Other
bun orcs routes             # List all routes
bun orcs queue:work         # Start queue worker
```

## Documentation

- [ORCS Documentation](https://github.com/jevido/orcs)
- [Routing](https://github.com/jevido/orcs/blob/main/docs/routing.md)
- [Validation](https://github.com/jevido/orcs/blob/main/docs/validation.md)
- [Database](https://github.com/jevido/orcs/blob/main/docs/database.md)
- [Authentication](https://github.com/jevido/orcs/blob/main/docs/authentication.md)
- [WebSockets](https://github.com/jevido/orcs/blob/main/docs/websockets.md)
- [Job Queue](https://github.com/jevido/orcs/blob/main/docs/queue.md)

## Next Steps

1. **Add a controller**
   ```bash
   bun orcs make:controller UserController
   ```

2. **Add a route** in `routes/api.js`
   ```javascript
   Route.get("/api/users", {
     summary: "List users",
     tags: ["Users"]
   }, UserController.index);
   ```

3. **Need a database?**
   ```bash
   bun orcs make:migration create_users_table
   ```

4. **Need authentication?** See [Authentication docs](https://github.com/jevido/orcs/blob/main/docs/authentication.md)

5. **Need WebSockets?** See [WebSockets docs](https://github.com/jevido/orcs/blob/main/docs/websockets.md)

## License

MIT
