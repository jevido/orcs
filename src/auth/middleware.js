/**
 * Authentication Middleware
 *
 * Middleware factory for protecting routes with authentication.
 * Can be used with different guards and configuration options.
 */

import { HttpException } from "../errors/http-exception.js";

/**
 * Create authentication middleware
 * @param {object} options - Middleware options
 * @param {string} options.guard - Guard name to use (default: uses configured default)
 * @param {boolean} options.optional - If true, doesn't throw on missing auth (default: false)
 * @returns {Function} Middleware function
 */
export function auth(options = {}) {
  const { guard = null, optional = false } = options;

  return async (ctx, next) => {
    const authenticator = ctx.app.authenticator;

    if (!authenticator) {
      throw new Error(
        "Authenticator not configured. Register authentication in a service provider.",
      );
    }

    try {
      const user = await authenticator.authenticate(ctx, guard);

      if (!user && !optional) {
        throw new HttpException(401, "Unauthenticated");
      }

      // Attach user to context
      ctx.user = user;
      ctx.authenticated = user !== null;

      return await next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (!optional) {
        throw new HttpException(401, "Unauthenticated");
      }

      ctx.user = null;
      ctx.authenticated = false;
      return await next();
    }
  };
}

/**
 * Create middleware that requires specific guards to all pass
 * @param {...string} guards - Guard names
 * @returns {Function} Middleware function
 */
export function requireGuards(...guards) {
  return async (ctx, next) => {
    const authenticator = ctx.app.authenticator;

    if (!authenticator) {
      throw new Error(
        "Authenticator not configured. Register authentication in a service provider.",
      );
    }

    for (const guardName of guards) {
      const user = await authenticator.authenticate(ctx, guardName);
      if (!user) {
        throw new HttpException(
          401,
          `Authentication failed for guard: ${guardName}`,
        );
      }
      ctx.user = user;
    }

    ctx.authenticated = true;
    return await next();
  };
}

/**
 * Create middleware that requires ANY of the specified guards to pass
 * @param {...string} guards - Guard names
 * @returns {Function} Middleware function
 */
export function requireAnyGuard(...guards) {
  return async (ctx, next) => {
    const authenticator = ctx.app.authenticator;

    if (!authenticator) {
      throw new Error(
        "Authenticator not configured. Register authentication in a service provider.",
      );
    }

    let user = null;
    for (const guardName of guards) {
      user = await authenticator.authenticate(ctx, guardName);
      if (user) {
        break;
      }
    }

    if (!user) {
      throw new HttpException(
        401,
        "Authentication failed for all specified guards",
      );
    }

    ctx.user = user;
    ctx.authenticated = true;
    return await next();
  };
}
