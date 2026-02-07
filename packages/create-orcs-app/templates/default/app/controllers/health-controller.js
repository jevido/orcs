/**
 * Health Controller
 *
 * Handles health check endpoints for monitoring and load balancers.
 */
export class HealthController {
  /**
   * Check application health
   */
  static async index(ctx) {
    return ctx.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }
}
