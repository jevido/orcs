export class HealthController {
  static index(ctx) {
    return ctx.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }
}
