import { Middleware } from "@jevido/orcs";

/**
 * Rate Limit Middleware (Example)
 *
 * Simple in-memory rate limiting.
 * In production, use Redis for distributed rate limiting.
 */
export class RateLimitMiddleware extends Middleware {
  constructor(options = {}) {
    super();
    this.maxRequests = options.maxRequests || 100;
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.requests = new Map();
  }

  async handle(ctx, next) {
    const ip = ctx.headers.get("x-forwarded-for") || ctx.request.url;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Clean old entries
    if (this.requests.has(ip)) {
      const timestamps = this.requests.get(ip).filter(t => t > windowStart);
      this.requests.set(ip, timestamps);
    }

    // Check rate limit
    const requestCount = (this.requests.get(ip) || []).length;

    if (requestCount >= this.maxRequests) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: `Rate limit exceeded. Try again in ${Math.ceil(this.windowMs / 1000)} seconds.`,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add current request
    const timestamps = this.requests.get(ip) || [];
    timestamps.push(now);
    this.requests.set(ip, timestamps);

    return next();
  }
}
