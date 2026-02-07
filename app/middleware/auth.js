/**
 * Authentication Middleware
 *
 * Pre-configured auth middleware for your application.
 * Import this in your routes for easy authentication.
 */

import { auth as createAuthMiddleware } from "../../src/auth/middleware.js";

/**
 * Require authentication (default guard)
 */
export const auth = createAuthMiddleware();

/**
 * Optional authentication - attaches user if present but doesn't throw
 */
export const authOptional = createAuthMiddleware({ optional: true });

/**
 * Require JWT authentication specifically
 */
export const authJwt = createAuthMiddleware({ guard: "jwt" });

/**
 * Require API token authentication specifically
 */
export const authApi = createAuthMiddleware({ guard: "api" });
