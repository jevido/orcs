import { Route } from "@jevido/orcs";
import { HealthController } from "../app/controllers/health-controller.js";
import { ExampleController } from "../app/controllers/example-controller.js";

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
