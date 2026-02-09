import { Route } from "@jevido/orcs";

// Test routes for validation
Route.post(
  "/api/test/users",
  {
    summary: "Create a test user",
    requestBody: {
      email: { type: "string", format: "email" },
      name: { type: "string", minLength: 2, maxLength: 50 },
      age: { type: "integer", minimum: 18, maximum: 120 },
      password: { type: "string", minLength: 8 },
    },
    responses: {
      201: { description: "User created" },
      422: { description: "Validation failed" },
    },
  },
  (ctx) => {
    return ctx.json({ message: "User created", data: ctx.body }, 201);
  },
);

// Test optional fields
Route.post(
  "/api/test/profile",
  {
    summary: "Update profile",
    requestBody: {
      schema: {
        type: "object",
        properties: {
          bio: { type: "string", maxLength: 200 },
          website: { type: "string", format: "url" },
        },
        required: [], // All fields optional
      },
    },
    responses: {
      200: { description: "Profile updated" },
    },
  },
  (ctx) => ctx.json({ message: "Profile updated" }),
);

// Test nested objects
Route.post(
  "/api/test/address",
  {
    summary: "Add address",
    requestBody: {
      street: { type: "string", minLength: 1 },
      city: { type: "string", minLength: 1 },
      country: { type: "string", minLength: 2, maxLength: 2 },
      zipCode: { type: "string", pattern: "^[0-9]{5}$" },
    },
    responses: {
      201: { description: "Address added" },
    },
  },
  (ctx) => ctx.json({ message: "Address added" }, 201),
);
