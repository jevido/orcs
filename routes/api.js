import { Route } from "../src/routing/Router.js";
import { HealthController } from "../app/controllers/HealthController.js";

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
