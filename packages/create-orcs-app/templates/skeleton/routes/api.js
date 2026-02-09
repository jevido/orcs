import { Route } from "@jevido/orcs";
import { HealthController } from "../app/controllers/health-controller.js";

// ============================================================================
// System Endpoints
// ============================================================================

Route.get(
  "/api/health",
  {
    summary: "Health check",
    tags: ["System"],
    responses: {
      200: { description: "Service is healthy" },
      503: { description: "Service is unhealthy" },
    },
  },
  HealthController.index
);

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

// ============================================================================
// Add your routes here
// ============================================================================
