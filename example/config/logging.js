/**
 * Logging Configuration
 *
 * Configure logging behavior for your application.
 */

export default {
  /*
  |--------------------------------------------------------------------------
  | Log Level
  |--------------------------------------------------------------------------
  |
  | The minimum log level to output. Messages below this level are ignored.
  | Options: "debug", "info", "warn", "error"
  |
  */
  level:
    Bun.env.LOG_LEVEL || (Bun.env.APP_ENV === "production" ? "info" : "debug"),

  /*
  |--------------------------------------------------------------------------
  | Log Format
  |--------------------------------------------------------------------------
  |
  | Output format for logs.
  | Options:
  |   - "pretty": Colorized human-readable output (development)
  |   - "json": Structured JSON output (production)
  |
  */
  format:
    Bun.env.LOG_FORMAT ||
    (Bun.env.APP_ENV === "production" ? "json" : "pretty"),

  /*
  |--------------------------------------------------------------------------
  | Request Logging
  |--------------------------------------------------------------------------
  |
  | Configuration for HTTP request logging middleware.
  |
  */
  requests: {
    // Enable request logging
    enabled: Bun.env.LOG_REQUESTS !== "false",

    // Include request headers in logs
    includeHeaders: Bun.env.LOG_INCLUDE_HEADERS === "true",

    // Include request body in logs (be careful with sensitive data)
    includeBody: Bun.env.LOG_INCLUDE_BODY === "true",
  },
};
