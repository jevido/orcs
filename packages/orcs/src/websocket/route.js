/**
 * WebSocket Route Helper
 *
 * Helper for defining WebSocket routes in ORCS.
 * Integrates WebSocket connections with the routing system.
 */

export class WebSocketRoute {
  static routes = new Map();

  /**
   * Define a WebSocket route
   * @param {string} path - Route path
   * @param {object} handlers - WebSocket event handlers
   * @param {object} options - Route options (middleware, authentication, etc.)
   */
  static ws(path, handlers, options = {}) {
    this.routes.set(path, {
      path,
      handlers,
      options,
    });
  }

  /**
   * Get all WebSocket routes
   */
  static all() {
    return Array.from(this.routes.values());
  }

  /**
   * Get a specific WebSocket route
   */
  static get(path) {
    return this.routes.get(path);
  }

  /**
   * Clear all routes (useful for testing)
   */
  static clear() {
    this.routes.clear();
  }
}

/**
 * Convenience method for defining WebSocket routes
 */
export function ws(path, handlers, options) {
  return WebSocketRoute.ws(path, handlers, options);
}
