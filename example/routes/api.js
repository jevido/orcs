import { Route } from "@jevido/orcs/routing/router.js";
import { HealthController } from "../app/controllers/health-controller.js";

Route.group({ prefix: "/api", tags: ["General"] }, () => {
  Route.get(
    "/health",
    {
      summary: "Health check",
      description: "Returns the current health status of the service.",
      responses: {
        200: { description: "Service is healthy" },
      },
    },
    HealthController.index,
  );
});
