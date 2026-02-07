import { getConnection } from "@jevido/orcs/database/connection.js";

export class HealthController {
  static async index(ctx) {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: await checkDatabase(),
      },
    };

    // Set overall status based on service health
    const allHealthy = Object.values(health.services).every(
      (service) => service.status === "ok",
    );

    if (!allHealthy) {
      health.status = "degraded";
    }

    return ctx.json(health, allHealthy ? 200 : 503);
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  try {
    const db = getConnection();
    const start = Date.now();

    // Simple connectivity check
    await db.unsafe("SELECT 1 as result");

    const responseTime = Date.now() - start;

    return {
      status: "ok",
      responseTime: `${responseTime}ms`,
    };
  } catch (error) {
    return {
      status: "error",
      error: error.message,
    };
  }
}
