import { getConnection } from "@jevido/orcs";

/**
 * Health Controller
 *
 * Checks the health of the application and its services
 */
export class HealthController {
  static async index(ctx) {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: {
        database: await checkDatabase(),
      },
    };

    // If any check fails, return 503
    const hasFailure = Object.values(health.checks).some(
      (check) => check.status !== "ok"
    );

    if (hasFailure) {
      health.status = "error";
      return ctx.json(health, 503);
    }

    return ctx.json(health);
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  try {
    const db = getConnection();
    await db.unsafe("SELECT 1");
    return { status: "ok" };
  } catch (error) {
    return {
      status: "error",
      message: error.message,
    };
  }
}
