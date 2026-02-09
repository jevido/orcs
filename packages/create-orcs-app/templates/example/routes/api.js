import { Route, auth } from "@jevido/orcs";
import { HealthController } from "../app/controllers/health-controller.js";
import { ExampleController } from "../app/controllers/example-controller.js";
import { AuthController } from "../app/controllers/auth-controller.js";
import { PostController } from "../app/controllers/post-controller.js";

// Health check endpoint
Route.get(
  "/api/health",
  {
    summary: "Health check",
    tags: ["System"],
    responses: {
      200: { description: "Service is healthy" },
    },
  },
  HealthController.index
);

// Welcome endpoint
Route.get(
  "/api",
  {
    summary: "API welcome",
    tags: ["System"],
    responses: {
      200: { description: "Welcome message" },
    },
  },
  (ctx) =>
    ctx.json({
      message: "Welcome to ORCS!",
      version: "1.0.0",
      docs: "/docs",
      openapi: "/openapi.json",
    })
);

// Example CRUD endpoints (you can delete these)
Route.get(
  "/api/items",
  {
    summary: "List items",
    tags: ["Examples"],
    responses: {
      200: { description: "List of items" },
    },
  },
  ExampleController.index
);

Route.post(
  "/api/items",
  {
    summary: "Create an item",
    tags: ["Examples"],
    requestBody: {
      name: { type: "string", minLength: 1 },
      description: { type: "string" },
    },
    responses: {
      201: { description: "Item created" },
      422: { description: "Validation failed" },
    },
  },
  ExampleController.store
);

Route.get(
  "/api/items/:id",
  {
    summary: "Get an item",
    tags: ["Examples"],
    parameters: {
      id: { type: "integer", description: "Item ID" },
    },
    responses: {
      200: { description: "Item details" },
      404: { description: "Item not found" },
    },
  },
  ExampleController.show
);

Route.put(
  "/api/items/:id",
  {
    summary: "Update an item",
    tags: ["Examples"],
    parameters: {
      id: { type: "integer", description: "Item ID" },
    },
    requestBody: {
      name: { type: "string", minLength: 1 },
      description: { type: "string" },
    },
    responses: {
      200: { description: "Item updated" },
      404: { description: "Item not found" },
      422: { description: "Validation failed" },
    },
  },
  ExampleController.update
);

Route.delete(
  "/api/items/:id",
  {
    summary: "Delete an item",
    tags: ["Examples"],
    parameters: {
      id: { type: "integer", description: "Item ID" },
    },
    responses: {
      200: { description: "Item deleted" },
      404: { description: "Item not found" },
    },
  },
  ExampleController.destroy
);

// ============================================================================
// Authentication Endpoints
// ============================================================================

Route.post(
  "/api/auth/login",
  {
    summary: "User login",
    tags: ["Authentication"],
    requestBody: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
    },
    responses: {
      200: { description: "Login successful, returns JWT token" },
      401: { description: "Invalid credentials" },
      422: { description: "Validation failed" },
    },
  },
  AuthController.login
);

Route.get(
  "/api/auth/me",
  {
    summary: "Get authenticated user",
    tags: ["Authentication"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: "Authenticated user details" },
      401: { description: "Unauthorized" },
    },
  },
  [auth("jwt")],
  AuthController.me
);

Route.post(
  "/api/auth/logout",
  {
    summary: "User logout",
    tags: ["Authentication"],
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: "Logout successful" },
    },
  },
  [auth("jwt")],
  AuthController.logout
);

// ============================================================================
// Posts Endpoints (Database Example)
// ============================================================================

Route.get(
  "/api/posts",
  {
    summary: "List all posts",
    tags: ["Posts"],
    responses: {
      200: { description: "List of posts" },
    },
  },
  PostController.index
);

Route.post(
  "/api/posts",
  {
    summary: "Create a post",
    tags: ["Posts"],
    security: [{ bearerAuth: [] }],
    requestBody: {
      title: { type: "string", minLength: 1, maxLength: 255 },
      content: { type: "string", minLength: 1 },
      status: { type: "string", enum: ["draft", "published"] },
    },
    responses: {
      201: { description: "Post created" },
      401: { description: "Unauthorized" },
      422: { description: "Validation failed" },
    },
  },
  [auth("jwt")],
  PostController.store
);

Route.get(
  "/api/posts/:id",
  {
    summary: "Get a post",
    tags: ["Posts"],
    parameters: {
      id: { type: "integer", description: "Post ID" },
    },
    responses: {
      200: { description: "Post details" },
      404: { description: "Post not found" },
    },
  },
  PostController.show
);

Route.put(
  "/api/posts/:id",
  {
    summary: "Update a post",
    tags: ["Posts"],
    security: [{ bearerAuth: [] }],
    parameters: {
      id: { type: "integer", description: "Post ID" },
    },
    requestBody: {
      title: { type: "string", minLength: 1, maxLength: 255 },
      content: { type: "string", minLength: 1 },
      status: { type: "string", enum: ["draft", "published"] },
    },
    responses: {
      200: { description: "Post updated" },
      401: { description: "Unauthorized" },
      404: { description: "Post not found" },
      422: { description: "Validation failed" },
    },
  },
  [auth("jwt")],
  PostController.update
);

Route.delete(
  "/api/posts/:id",
  {
    summary: "Delete a post",
    tags: ["Posts"],
    security: [{ bearerAuth: [] }],
    parameters: {
      id: { type: "integer", description: "Post ID" },
    },
    responses: {
      200: { description: "Post deleted" },
      401: { description: "Unauthorized" },
      404: { description: "Post not found" },
    },
  },
  [auth("jwt")],
  PostController.destroy
);
