# Routing

Routes are the single source of truth in ORCS. Each route declares its handler **and** its OpenAPI metadata in one call.

## Defining Routes

### Inline Handlers

```js
import { Route } from "./src/index.js";

Route.get(
  "/api/health",
  {
    summary: "Health check",
    responses: {
      200: { description: "Service is healthy" },
    },
  },
  (ctx) => ctx.json({ status: "ok" }),
);
```

### With Controllers

```js
import { Route } from "./src/index.js";
import { UserController } from "../app/controllers/user-controller.js";

Route.group({ prefix: "/api/users", tags: ["Users"] }, () => {
  Route.get(
    "/",
    {
      summary: "List all users",
      responses: { 200: { description: "User list" } },
    },
    UserController.index,
  );

  Route.post(
    "/",
    {
      summary: "Create a user",
      requestBody: {
        email: { type: "string", format: "email" },
        name: { type: "string", minLength: 1 },
        password: { type: "string", minLength: 8 },
      },
      responses: {
        201: { description: "User created" },
        422: { description: "Validation failed" },
      },
    },
    UserController.store,
  );

  Route.get(
    "/:id",
    {
      summary: "Get user by ID",
      responses: {
        200: { description: "User details" },
        404: { description: "Not found" },
      },
    },
    UserController.show,
  );
});
```

### Route Groups

Groups share a prefix, tags, and middleware:

```js
Route.group(
  { prefix: "/api/admin", tags: ["Admin"], middleware: ["auth"] },
  () => {
    Route.get(
      "/dashboard",
      { summary: "Admin dashboard" },
      AdminController.index,
    );
    Route.get("/users", { summary: "Manage users" }, AdminController.users);
  },
);
```

### Request Body Shorthand

You can pass full OpenAPI `requestBody` or a shorthand object. The shorthand auto-wraps into a proper JSON schema:

```js
// Shorthand — just the properties
requestBody: {
  email: { type: "string", format: "email" },
  password: { type: "string", minLength: 8 },
}

// Becomes this OpenAPI spec automatically:
requestBody: {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
        required: ["email", "password"],
      },
    },
  },
}
```

## Controllers

Controllers are classes with static methods. Each method receives a `ctx` (context) object with everything it needs.

```js
// app/controllers/user-controller.js

export class UserController {
  static async index(ctx) {
    const page = ctx.query.page || 1;
    // fetch users...
    return ctx.json({ users: [], page });
  }

  static async store(ctx) {
    const { email, name, password } = ctx.body;
    // create user...
    return ctx.json({ id: 1, email, name }, 201);
  }

  static async show(ctx) {
    const user = null; // find by ctx.params.id
    if (!user) ctx.abort(404, "User not found");
    return ctx.json(user);
  }
}
```

## The Context Object

Every handler receives `ctx` with:

| Property / Method            | Description                                           |
| ---------------------------- | ----------------------------------------------------- |
| `ctx.params`                 | URL path parameters (`/users/:id` -> `ctx.params.id`) |
| `ctx.query`                  | Query string parameters                               |
| `ctx.body`                   | Parsed request body (JSON, text)                      |
| `ctx.headers`                | Request headers as a plain object                     |
| `ctx.method`                 | HTTP method (GET, POST, etc.)                         |
| `ctx.path`                   | Request path                                          |
| `ctx.json(data, status?)`    | Return a JSON response                                |
| `ctx.text(data, status?)`    | Return a text response                                |
| `ctx.redirect(url, status?)` | Return a redirect                                     |
| `ctx.abort(status, message)` | Throw an HTTP exception                               |

Handlers can also return plain values:

- **`Response`** — passed through as-is
- **`string`** — returned as `text/plain`
- **`object`** — returned as `application/json`
- **`undefined`** — returns `204 No Content`
