/**
 * API Token Guard
 *
 * Authenticates requests using simple API tokens (Bearer tokens).
 * Tokens are typically stored in a database and validated against user records.
 */

export class ApiTokenGuard {
  constructor(config = {}) {
    this.tokenProvider = config.tokenProvider;

    if (!this.tokenProvider) {
      throw new Error(
        "API token guard requires a tokenProvider function to validate tokens",
      );
    }
  }

  /**
   * Authenticate a request by validating the API token
   * @param {Context} ctx - Request context
   * @returns {Promise<object|null>} User object or null
   */
  async authenticate(ctx) {
    const token = this.extractToken(ctx);

    if (!token) {
      return null;
    }

    try {
      // Use the token provider to validate and fetch user
      const user = await this.tokenProvider(token);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract API token from Authorization header
   * @param {Context} ctx - Request context
   * @returns {string|null} Token or null
   */
  extractToken(ctx) {
    const authHeader = ctx.headers.authorization;

    if (!authHeader) {
      return null;
    }

    // Support both "Bearer <token>" and plain token
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : authHeader;
  }

  /**
   * Generate a random API token
   * @param {number} length - Token length (default: 64)
   * @returns {string} Random token
   */
  static generateToken(length = 64) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(randomBytes)
      .map((byte) => chars[byte % chars.length])
      .join("");
  }

  /**
   * Hash an API token for secure storage
   * @param {string} token - Plain token
   * @returns {Promise<string>} Hashed token (hex string)
   */
  static async hashToken(token) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
