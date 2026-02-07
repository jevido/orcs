/**
 * Health Controller
 */
export class HealthController {
  static async index(ctx) {
    return ctx.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }
}
