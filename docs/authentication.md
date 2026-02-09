# Authentication

ORCS provides a flexible authentication system with support for multiple guards (JWT, API tokens) using zero external dependencies. All cryptographic operations use Bun's native Web Crypto APIs.

## Configuration

Configure authentication in `config/auth.js` and `.env`:

```bash
# .env
AUTH_GUARD=jwt
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
```

## JWT Authentication

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

## API Token Authentication

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

## Protecting Routes

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

## Multiple Guards

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

## Optional Authentication

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

## Setting Up Authentication

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

## Accessing the Authenticated User

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

## Example: Login/Register Endpoints

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
