# Error Handling

ORCS returns structured JSON errors with consistent formatting.

## Throwing Errors

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

## Error Response Format

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

## Custom Exception Handler

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

## Environment-Aware

- **Development**: error responses include stack traces
- **Production** (`APP_ENV=production`): stack traces are hidden, generic messages for 500s
