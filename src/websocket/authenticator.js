/**
 * WebSocket Authenticator
 *
 * Authenticate WebSocket connections using various methods.
 * Supports token-based authentication (JWT, API tokens).
 */

export class WebSocketAuthenticator {
  constructor(config = {}) {
    this.authenticator = config.authenticator; // Application authenticator
    this.tokenExtractor = config.tokenExtractor || this.defaultTokenExtractor;
  }

  /**
   * Authenticate a WebSocket connection
   * @param {Request} request - Upgrade request
   * @param {WebSocket} ws - WebSocket instance (after upgrade)
   * @returns {Promise<object|null>} User object or null
   */
  async authenticate(request, ws) {
    if (!this.authenticator) {
      return null;
    }

    // Extract token from request
    const token = this.tokenExtractor(request);
    if (!token) {
      return null;
    }

    // Create a minimal context for authentication
    const ctx = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    try {
      const user = await this.authenticator.authenticate(ctx);
      if (user) {
        ws.data.authenticated = true;
        ws.data.user = user;
      }
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Default token extractor - looks for token in query string or headers
   */
  defaultTokenExtractor(request) {
    const url = new URL(request.url);

    // Try query parameter first
    const token = url.searchParams.get("token");
    if (token) {
      return token;
    }

    // Try authorization header
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      return match ? match[1] : authHeader;
    }

    // Try sec-websocket-protocol header (for token in subprotocol)
    const protocol = request.headers.get("sec-websocket-protocol");
    if (protocol) {
      // Format: "token, <actual-token>"
      const parts = protocol.split(",").map((p) => p.trim());
      if (parts.length === 2 && parts[0] === "token") {
        return parts[1];
      }
    }

    return null;
  }

  /**
   * Require authentication for WebSocket
   */
  required() {
    return async (request, ws) => {
      const user = await this.authenticate(request, ws);
      if (!user) {
        ws.close(4401, "Unauthorized");
        return false;
      }
      return true;
    };
  }

  /**
   * Optional authentication for WebSocket
   */
  optional() {
    return async (request, ws) => {
      await this.authenticate(request, ws);
      return true;
    };
  }
}
