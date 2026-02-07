# Logging

ORCS includes a built-in structured logging system with support for different log levels, JSON output, and colorized console output for development. Zero external dependencies.

## Basic Usage

```js
import { info, warn, error, debug } from "./src/index.js";

// Log messages at different levels
info("Application started");
warn("Low disk space", { available: "10GB" });
error("Database connection failed", { error: dbError });
debug("Request received", { method: "GET", path: "/api/users" });
```

## Logger Instance

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

## Child Loggers

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

## Log Levels

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

## Request Logging Middleware

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

## Access Logs

Simple Apache/Nginx-style access logging:

```js
import { accessLog } from "./src/index.js";

Route.use(accessLog());
// Logs: "192.168.1.1 - GET /api/users 200 15ms"
```

## Log Formats

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

## Configuration

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

## Error Handling

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

## Setting Up Request Logging

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
