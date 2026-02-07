/**
 * Logging Middleware
 *
 * Middleware for logging HTTP requests and responses with structured data.
 * Tracks request duration, status codes, and errors.
 */

import { getLogger } from "./logger.js";

/**
 * Generate a unique request ID
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create request logging middleware
 */
export function requestLogger(options = {}) {
  const logger = options.logger || getLogger();
  const includeHeaders = options.includeHeaders || false;
  const includeBody = options.includeBody || false;

  return async (ctx, next) => {
    const startTime = performance.now();
    const requestId = ctx.headers["x-request-id"] || generateRequestId();

    // Create request-specific logger with context
    ctx.logger = logger.child({
      requestId,
      method: ctx.method,
      path: ctx.path,
    });

    // Log request start
    const requestMeta = {
      requestId,
      method: ctx.method,
      path: ctx.path,
      query: ctx.query,
      ip:
        ctx.headers["x-forwarded-for"] || ctx.headers["x-real-ip"] || "unknown",
      userAgent: ctx.headers["user-agent"],
    };

    if (includeHeaders) {
      requestMeta.headers = ctx.headers;
    }

    if (includeBody && ctx.body) {
      requestMeta.body = ctx.body;
    }

    ctx.logger.info("Request started", requestMeta);

    let error = null;
    let response = null;

    try {
      response = await next();
      return response;
    } catch (err) {
      error = err;
      throw err;
    } finally {
      // Calculate duration
      const duration = performance.now() - startTime;

      // Determine status code
      let statusCode = 200;
      if (error) {
        statusCode = error.statusCode || error.status || 500;
      } else if (response && response.status) {
        statusCode = response.status;
      }

      // Log request completion
      const responseMeta = {
        requestId,
        statusCode,
        duration: `${duration.toFixed(2)}ms`,
      };

      if (error) {
        responseMeta.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
        ctx.logger.error("Request failed", responseMeta);
      } else {
        const level =
          statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
        ctx.logger[level]("Request completed", responseMeta);
      }
    }
  };
}

/**
 * Simple access log middleware (Apache/Nginx style)
 */
export function accessLog(options = {}) {
  const logger = options.logger || getLogger();

  return async (ctx, next) => {
    const startTime = Date.now();

    let statusCode = 200;
    try {
      const response = await next();
      if (response && response.status) {
        statusCode = response.status;
      }
      return response;
    } catch (err) {
      statusCode = err.statusCode || err.status || 500;
      throw err;
    } finally {
      const duration = Date.now() - startTime;

      // Format: IP - METHOD PATH STATUS DURATION
      const message = `${ctx.headers["x-forwarded-for"] || "unknown"} - ${ctx.method} ${ctx.path} ${statusCode} ${duration}ms`;

      logger.info(message);
    }
  };
}
