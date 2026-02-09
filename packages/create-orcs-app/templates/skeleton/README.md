# My ORCS Project

Built with [ORCS](https://github.com/jevido/orcs) - Opinionated Runtime for Contractual Services.

## Quick Start

```bash
# Copy environment file
cp .env.example .env

# Start services (optional)
docker compose up -d

# Start development server
bun run dev
```

Visit http://localhost:42069/docs

## What's Included

This skeleton includes **all ORCS features** ready for you to implement:

- ✅ **Authentication (JWT)** - Routes ready, add database logic
- ✅ **Database (PostgreSQL)** - Docker Compose + migration structure
- ✅ **WebSockets** - Echo, Chat, Notifications servers ready
- ✅ **Background Jobs** - Email, Upload jobs ready to implement
- ✅ **Middleware** - CORS, Rate limiting
- ✅ **Docker Services** - PostgreSQL, Redis, MinIO, Mailpit

All controllers have TODO comments showing where to add your logic.

## CLI Commands

```bash
bun orcs make:controller UserController
bun orcs make:migration create_users_table
bun orcs db:migrate
bun orcs queue:work
```

## Documentation

- [ORCS Documentation](https://github.com/jevido/orcs)
- [Routing](https://github.com/jevido/orcs/blob/main/docs/routing.md)
- [Database](https://github.com/jevido/orcs/blob/main/docs/database.md)
- [Authentication](https://github.com/jevido/orcs/blob/main/docs/authentication.md)

## Skeleton vs Example

This **skeleton** has the same structure as the example app, but:
- ❌ No example data
- ✅ TODO comments for implementation
- ✅ Same routes and features
- ✅ Production ready

Want working examples? Choose "Example app" when creating your project.

## License

MIT
