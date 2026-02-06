/**
 * CORS middleware. Reads configuration from the app's http.cors config.
 * Handles preflight OPTIONS requests and sets appropriate headers.
 */
export function cors(config) {
  const origins = config.origins || ["*"];
  const methods = (
    config.methods || ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  ).join(", ");
  const headers = (config.headers || ["Content-Type", "Authorization"]).join(
    ", ",
  );
  const credentials = config.credentials !== false;

  return async (ctx, next) => {
    const origin = ctx.headers.origin || "*";
    const allowedOrigin = origins.includes("*")
      ? "*"
      : origins.includes(origin)
        ? origin
        : null;

    if (!allowedOrigin) return await next();

    // Handle preflight
    if (ctx.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": methods,
          "Access-Control-Allow-Headers": headers,
          ...(credentials
            ? { "Access-Control-Allow-Credentials": "true" }
            : {}),
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = await next();

    if (response instanceof Response) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
      if (credentials) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }
    }

    return response;
  };
}
