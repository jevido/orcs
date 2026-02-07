# My ORCS Project

Built with [ORCS](https://github.com/jevido/orcs) - Opinionated Runtime for Contractual Services.

## Quick Start

```bash
# Start development server
bun run dev

# Start production server
bun start
```

## Endpoints

- **API**: http://localhost:42069/api/health
- **Docs**: http://localhost:42069/docs
- **OpenAPI**: http://localhost:42069/openapi.json

## Documentation

- [ORCS Documentation](https://github.com/jevido/orcs)
- [Routing](https://github.com/jevido/orcs/blob/main/docs/routing.md)
- [Validation](https://github.com/jevido/orcs/blob/main/docs/validation.md)
- [Database](https://github.com/jevido/orcs/blob/main/docs/database.md)

## Adding Routes

Edit `routes/api.js`:

```javascript
import { Route } from "@jevido/orcs";

Route.get("/api/users", {
  summary: "List users",
  responses: { 200: { description: "User list" } }
}, (ctx) => ctx.json({ users: [] }));
```

Your routes automatically generate OpenAPI documentation!
