# My ORCS Project

Built with [ORCS](https://github.com/jevido/orcs) - Opinionated Runtime for Contractual Services.

## Quick Start

### 1. Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env and set your configurations
```

### 2. Start Services (Optional)

If you want to use PostgreSQL, Redis, MinIO, and Mailpit:

```bash
# Start all services
docker compose up -d

# Check services are running
docker compose ps

# View logs
docker compose logs -f
```

Services:
- **PostgreSQL**: localhost:5432 (user: orcs, password: secret)
- **Redis**: localhost:6379
- **MinIO**: localhost:9000 (console: localhost:9001, user: minio, password: minio123)
- **Mailpit**: localhost:8025 (SMTP: localhost:1025)

### 3. Run Migrations

```bash
# Run database migrations
bun orcs db:migrate

# Check migration status
bun orcs db:status

# Rollback last migration
bun orcs db:rollback
```

### 4. Start Development Server

```bash
# Start with auto-reload
bun run dev

# Or start normally
bun start
```

## Endpoints

### API
- **Welcome**: http://localhost:42069/api
- **Health**: http://localhost:42069/api/health
- **Docs**: http://localhost:42069/docs
- **OpenAPI**: http://localhost:42069/openapi.json

### Example Endpoints
- **Items CRUD**: http://localhost:42069/api/items
- **Posts CRUD**: http://localhost:42069/api/posts (requires auth)
- **Auth**: http://localhost:42069/api/auth/login

### WebSocket Endpoints
- **Echo**: ws://localhost:42069/ws/echo
- **Chat**: ws://localhost:42069/ws/chat
- **Notifications**: ws://localhost:42069/ws/notifications

## Project Structure

```
.
├── app/
│   ├── controllers/      # Request handlers
│   │   ├── health-controller.js
│   │   ├── example-controller.js
│   │   ├── auth-controller.js
│   │   └── post-controller.js
│   ├── middleware/       # Custom middleware
│   │   ├── cors-middleware.js
│   │   └── rate-limit-middleware.js
│   ├── providers/        # Service providers
│   ├── jobs/            # Background jobs
│   │   ├── example-job.js
│   │   ├── send-email-job.js
│   │   └── process-upload-job.js
│   └── exceptions/      # Error handling
│       └── handler.js
├── bootstrap/           # Application bootstrap
├── config/             # Configuration files
├── routes/             # Route definitions
│   ├── api.js          # API routes
│   └── websocket.js    # WebSocket routes
├── database/
│   └── migrations/     # Database migrations
│       ├── 001_create_users_table.js
│       └── 002_create_posts_table.js
├── storage/
│   └── logs/           # Application logs
├── docker-compose.yml  # Docker services
├── .env.example        # Environment template
└── server.js          # Entry point
```

## Features Demonstrated

### RESTful API
Example CRUD operations in [app/controllers/example-controller.js](app/controllers/example-controller.js)

### Authentication (JWT)
Login and protected routes in [app/controllers/auth-controller.js](app/controllers/auth-controller.js)

```bash
# Login
curl -X POST http://localhost:42069/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get authenticated user
curl http://localhost:42069/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database (PostgreSQL)
Post management with database queries in [app/controllers/post-controller.js](app/controllers/post-controller.js)

### Migrations
Example migrations in [database/migrations/](database/migrations/)

```bash
bun orcs make:migration create_products_table
bun orcs db:migrate
```

### WebSocket (Real-time)
Three working examples in [routes/websocket.js](routes/websocket.js):
- Echo server
- Chat room with pub/sub
- Push notifications

Test with:
```javascript
const ws = new WebSocket('ws://localhost:42069/ws/chat');
ws.onmessage = (e) => console.log(e.data);
ws.send(JSON.stringify({ user: 'Alice', message: 'Hello!' }));
```

### Background Jobs
Email and upload processing examples in [app/jobs/](app/jobs/)

```javascript
import { QueueManager } from "@jevido/orcs";
import { SendEmailJob } from "./app/jobs/send-email-job.js";

// Dispatch job
await QueueManager.push(SendEmailJob, {
  to: "user@example.com",
  subject: "Welcome!",
  body: "Thanks for signing up"
});

// Start worker
bun orcs queue:work
```

### Middleware
- CORS handling: [app/middleware/cors-middleware.js](app/middleware/cors-middleware.js)
- Rate limiting: [app/middleware/rate-limit-middleware.js](app/middleware/rate-limit-middleware.js)

### Request Validation
Automatic validation from OpenAPI schemas in routes

### API Documentation
Auto-generated from your routes at `/docs`

## CLI Commands

```bash
# Server
bun orcs serve              # Start the server

# Routes
bun orcs routes             # List all routes

# Code Generation
bun orcs make:controller UserController
bun orcs make:middleware AuthMiddleware
bun orcs make:migration create_users_table
bun orcs make:provider CacheServiceProvider

# Database
bun orcs db:migrate         # Run migrations
bun orcs db:rollback        # Rollback last migration
bun orcs db:status          # Migration status
bun orcs db:reset           # Reset database

# Queue
bun orcs queue:work         # Start queue worker
bun orcs queue:stats        # Queue statistics
bun orcs queue:clear        # Clear queue

# Tests
bun test                    # Run tests
```

## Docker Services

### PostgreSQL
```bash
# Connect to database
docker compose exec postgres psql -U orcs -d orcs

# Backup database
docker compose exec postgres pg_dump -U orcs orcs > backup.sql

# Restore database
docker compose exec -T postgres psql -U orcs orcs < backup.sql
```

### Redis
```bash
# Connect to Redis
docker compose exec redis redis-cli

# Clear cache
docker compose exec redis redis-cli FLUSHALL
```

### MinIO (S3)
Access MinIO console at http://localhost:9001
- Username: `minio`
- Password: `minio123`

### Mailpit
View test emails at http://localhost:8025

## Development

### Adding a New Feature

1. **Create a migration**
   ```bash
   bun orcs make:migration create_products_table
   ```

2. **Create a controller**
   ```bash
   bun orcs make:controller ProductController
   ```

3. **Add routes** in `routes/api.js`
   ```javascript
   Route.get("/api/products", {
     summary: "List products",
     tags: ["Products"]
   }, ProductController.index);
   ```

4. **Run migration**
   ```bash
   bun orcs db:migrate
   ```

Your endpoint is now live with automatic OpenAPI documentation!

## Testing WebSocket Connections

### Echo Server
```javascript
const ws = new WebSocket('ws://localhost:42069/ws/echo');
ws.onopen = () => ws.send('Hello!');
ws.onmessage = (e) => console.log('Echo:', e.data);
```

### Chat Room
```javascript
const ws = new WebSocket('ws://localhost:42069/ws/chat');
ws.onmessage = (e) => console.log('Chat:', JSON.parse(e.data));
ws.send(JSON.stringify({ user: 'Alice', message: 'Hi everyone!' }));
```

## Environment Variables

See [.env.example](.env.example) for all configuration options:
- Application settings
- Database configuration
- Authentication (JWT)
- Queue settings
- S3/MinIO storage
- Email (Mailpit/SMTP)
- Redis caching

## Documentation

- [ORCS Documentation](https://github.com/jevido/orcs)
- [Routing](https://github.com/jevido/orcs/blob/main/docs/routing.md)
- [Validation](https://github.com/jevido/orcs/blob/main/docs/validation.md)
- [Database](https://github.com/jevido/orcs/blob/main/docs/database.md)
- [Authentication](https://github.com/jevido/orcs/blob/main/docs/authentication.md)
- [WebSockets](https://github.com/jevido/orcs/blob/main/docs/websockets.md)
- [Job Queue](https://github.com/jevido/orcs/blob/main/docs/queue.md)
- [S3 Storage](https://github.com/jevido/orcs/blob/main/docs/storage.md)

## Production Deployment

1. Set `APP_ENV=production` in `.env`
2. Generate secure `JWT_SECRET`
3. Configure production database
4. Set up proper CORS settings
5. Enable HTTPS
6. Configure production S3 bucket
7. Set up monitoring and logging

## License

MIT
