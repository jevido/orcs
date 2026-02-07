import { Route } from "@jevido/orcs";
import { HealthController } from "../app/controllers/health-controller.js";

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

// Add your routes here
