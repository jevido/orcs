/**
 * Authenticator
 *
 * Manages authentication guards and provides methods to authenticate users.
 * Supports multiple guards (JWT, API tokens, etc.) and can be extended.
 */

export class Authenticator {
  constructor(config = {}) {
    this.config = config;
    this.guards = new Map();
    this.defaultGuard = config.default || "jwt";
  }

  /**
   * Register an authentication guard
   * @param {string} name - Guard name (e.g., "jwt", "api")
   * @param {object} guard - Guard instance implementing authenticate() method
   */
  registerGuard(name, guard) {
    this.guards.set(name, guard);
  }

  /**
   * Get a specific guard by name
   * @param {string} name - Guard name
   * @returns {object} Guard instance
   */
  guard(name = null) {
    const guardName = name || this.defaultGuard;
    const guard = this.guards.get(guardName);

    if (!guard) {
      throw new Error(`Authentication guard "${guardName}" not found`);
    }

    return guard;
  }

  /**
   * Authenticate a request using the default or specified guard
   * @param {Context} ctx - Request context
   * @param {string} guardName - Optional guard name
   * @returns {Promise<object|null>} Authenticated user or null
   */
  async authenticate(ctx, guardName = null) {
    const guard = this.guard(guardName);
    return await guard.authenticate(ctx);
  }

  /**
   * Check if the request has valid authentication
   * @param {Context} ctx - Request context
   * @param {string} guardName - Optional guard name
   * @returns {Promise<boolean>}
   */
  async check(ctx, guardName = null) {
    try {
      const user = await this.authenticate(ctx, guardName);
      return user !== null;
    } catch (error) {
      return false;
    }
  }
}
