/**
 * Authentication Configuration
 *
 * Configure authentication guards and their settings.
 */

export default {
  /*
  |--------------------------------------------------------------------------
  | Default Authentication Guard
  |--------------------------------------------------------------------------
  |
  | The default guard to use when none is specified in middleware.
  | Options: "jwt", "api"
  |
  */
  default: Bun.env.AUTH_GUARD || "jwt",

  /*
  |--------------------------------------------------------------------------
  | JWT Configuration
  |--------------------------------------------------------------------------
  |
  | Settings for JWT-based authentication.
  |
  */
  jwt: {
    // Secret key for signing/verifying JWTs
    // IMPORTANT: Keep this secret and use a strong random string in production
    secret: Bun.env.JWT_SECRET || "change-me-in-production",

    // Algorithm for signing (currently only HS256 is supported)
    algorithm: "HS256",

    // Default token expiration (e.g., "1h", "30m", "7d")
    expiresIn: Bun.env.JWT_EXPIRES_IN || "1h",
  },

  /*
  |--------------------------------------------------------------------------
  | API Token Configuration
  |--------------------------------------------------------------------------
  |
  | Settings for API token authentication (Bearer tokens).
  |
  */
  api: {
    // Token provider function - validates tokens and returns user
    // This should be set in a service provider with your database logic
    tokenProvider: null,
  },
};
