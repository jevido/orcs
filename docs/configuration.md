# Configuration

Configuration lives in `config/` as plain JavaScript objects with environment variable overrides.

## Config Files

| File                | Purpose               | Key Values                        |
| ------------------- | --------------------- | --------------------------------- |
| `config/app.js`     | Application settings  | `name`, `env`, `url`, `debug`     |
| `config/http.js`    | HTTP server settings  | `port`, `idleTimeout`, `cors`     |
| `config/openapi.js` | OpenAPI document info | `title`, `version`, `description` |

## The `env()` Helper doesn't exist

Just write `Bun.env.APP_NAME || 'orcs'`

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
APP_NAME=ORCS
APP_ENV=development
PORT=42069
CORS_ENABLED=false
OPENAPI_TITLE="My API"
```
