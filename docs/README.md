# ORCS Documentation

Welcome to the ORCS documentation! This guide covers everything you need to build contract-first APIs with Bun.

## Getting Started

Start here if you're new to ORCS:

1. **[Routing](routing.md)** — Learn how to define routes, controllers, and handle requests
2. **[Validation](validation.md)** — Understand automatic request validation
3. **[OpenAPI](openapi.md)** — Explore auto-generated API documentation

## Core Features

Essential features for building applications:

- **[Configuration](configuration.md)** — Environment variables and config files
- **[Middleware](middleware.md)** — Request processing pipeline
- **[Error Handling](error-handling.md)** — Structured error responses
- **[Service Providers](service-providers.md)** — Application boot lifecycle
- **[CLI Tooling](cli.md)** — Commands and code generation

## Database

Everything related to data persistence:

- **[Database](database.md)** — Query builder, migrations, and Active Record ORM

Topics covered:
- Configuration and Docker setup
- Query Builder API
- Raw SQL queries
- Migrations
- Transactions
- Models (Active Record ORM)

## Security & Authentication

Protect your APIs:

- **[Authentication](authentication.md)** — JWT and API token authentication

Topics covered:
- JWT signing and verification
- API token generation
- Route protection with middleware
- Multiple guard support
- Authentication setup

## Monitoring & Debugging

Observe and troubleshoot your application:

- **[Logging](logging.md)** — Structured logging with request tracking

Topics covered:
- Log levels (debug, info, warn, error)
- Request logging middleware
- Log formats (pretty and JSON)
- Child loggers
- Error handling

## Real-Time Features

Build interactive, real-time applications:

- **[WebSockets](websockets.md)** — Real-time communication

Topics covered:
- WebSocket routes and handlers
- Rooms and broadcasting
- Authentication
- WebSocket manager API
- Chat and notification examples

## Background Processing

Handle asynchronous tasks:

- **[Job Queue](queue.md)** — Background task processing

Topics covered:
- Creating and dispatching jobs
- Queue drivers (memory, database)
- Worker processes
- Job retries and priorities
- Queue management commands

## File Storage

Work with S3-compatible object storage:

- **[S3 Storage](storage.md)** — Object storage integration

Topics covered:
- Supported services (AWS S3, R2, Spaces, MinIO)
- Object-oriented and functional APIs
- Presigned URLs
- Streaming and partial reads
- File operations

## Quick Reference

### Common Tasks

- **Creating a route**: See [Routing](routing.md#defining-routes)
- **Validating requests**: See [Validation](validation.md#automatic-validation)
- **Adding middleware**: See [Middleware](middleware.md#named-middleware)
- **Database queries**: See [Database](database.md#query-builder)
- **Authenticating users**: See [Authentication](authentication.md#jwt-authentication)
- **Logging events**: See [Logging](logging.md#basic-usage)
- **WebSocket connections**: See [WebSockets](websockets.md#basic-setup)
- **Background jobs**: See [Job Queue](queue.md#creating-jobs)
- **File uploads**: See [S3 Storage](storage.md#basic-usage)

### API Reference

For a complete list of exported functions and classes, see the [API Surface](../README.md#api-surface) section in the main README.

## Contributing

Found an issue with the documentation? Please [open an issue](https://github.com/yourusername/orcs/issues) or submit a pull request.

## Need Help?

- Check the [examples](../app/examples/) directory for working code
- Review the [test files](../tests/) to see how features are tested
- Open an issue on GitHub for questions and bugs
