import { Route } from "@jevido/orcs";

Route.get(
  "/api/health",
  {
    summary: "Health check",
    responses: {
      200: { description: "Service is healthy" },
    },
  },
  (ctx) =>
    ctx.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    })
);

Route.get(
  "/api/hello",
  {
    summary: "Say hello",
    responses: {
      200: { description: "Greeting message" },
    },
  },
  (ctx) =>
    ctx.json({
      message: "Hello from ORCS!",
      docs: "/docs",
    })
);
