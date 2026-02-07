import { Middleware } from "@jevido/orcs";

/**
 * CORS Middleware (Example)
 *
 * This is an example middleware showing how to handle CORS.
 * Uncomment and customize as needed.
 */
export class CorsMiddleware extends Middleware {
  async handle(ctx, next) {
    // Set CORS headers
    ctx.headers.set("Access-Control-Allow-Origin", "*");
    ctx.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    ctx.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight requests
    if (ctx.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: ctx.headers });
    }

    return next();
  }
}
