import { Middleware } from "@jevido/orcs";

/**
 * CORS Middleware
 *
 * Configure Cross-Origin Resource Sharing settings.
 */
export class CorsMiddleware extends Middleware {
  async handle(ctx, next) {
    // TODO: Configure CORS headers for your application
    ctx.headers.set("Access-Control-Allow-Origin", "*");
    ctx.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    ctx.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (ctx.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: ctx.headers });
    }

    return next();
  }
}
