import { Route } from "@jevido/orcs/routing/router.js";
import { HealthController } from "../app/controllers/health-controller.js";

Route.group({ prefix: "/api", tags: ["General"] }, () => {
  Route.get(
    "/health",
    {
      summary: "Health check",
      responses: {
        200: { description: "Service is healthy" },
      },
    },
    HealthController.index,
  );
});
