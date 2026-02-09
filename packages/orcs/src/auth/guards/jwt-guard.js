/**
 * JWT Guard
 *
 * Authenticates requests using JSON Web Tokens (JWT).
 * Uses Bun's native crypto APIs for verification - zero external dependencies.
 */

export class JwtGuard {
  constructor(config = {}) {
    this.secret = config.secret || Bun.env.JWT_SECRET;
    this.algorithm = config.algorithm || "HS256";
    this.userProvider = config.userProvider || null;

    if (!this.secret) {
      throw new Error(
        "JWT secret is required. Set JWT_SECRET environment variable or pass secret in config.",
      );
    }
  }

  /**
   * Authenticate a request by verifying the JWT token
   * @param {Context} ctx - Request context
   * @returns {Promise<object|null>} User object or null
   */
  async authenticate(ctx) {
    const token = this.extractToken(ctx);

    if (!token) {
      return null;
    }

    try {
      const payload = await this.verifyToken(token);

      // If a user provider is configured, fetch the full user record
      if (this.userProvider) {
        return await this.userProvider(payload);
      }

      // Otherwise return the token payload as the user
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract JWT token from Authorization header
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
   * Verify and decode a JWT token
   * @param {string} token - JWT token
   * @returns {Promise<object>} Decoded payload
   * @throws {Error} If token is invalid
   */
  async verifyToken(token) {
    const parts = token.split(".");

    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature
    const message = `${headerB64}.${payloadB64}`;
    const signature = this.base64UrlDecode(signatureB64);
    const isValid = await this.verifySignature(message, signature);

    if (!isValid) {
      throw new Error("Invalid JWT signature");
    }

    // Decode payload
    const payloadJson = atob(this.base64UrlToBase64(payloadB64));
    const payload = JSON.parse(payloadJson);

    // Verify expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("JWT token has expired");
    }

    return payload;
  }

  /**
   * Verify HMAC signature
   * @param {string} message - Message to verify
   * @param {Uint8Array} signature - Signature bytes
   * @returns {Promise<boolean>}
   */
  async verifySignature(message, signature) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      encoder.encode(message),
    );
  }

  /**
   * Sign a JWT token
   * @param {object} payload - Token payload
   * @param {object} options - Options (expiresIn, etc.)
   * @returns {Promise<string>} Signed JWT token
   */
  async sign(payload, options = {}) {
    const header = {
      alg: this.algorithm,
      typ: "JWT",
    };

    // Add standard claims
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      ...payload,
      iat: payload.iat || now,
    };

    // Add expiration if specified
    if (options.expiresIn) {
      claims.exp = now + this.parseExpiration(options.expiresIn);
    }

    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(claims));
    const message = `${headerB64}.${payloadB64}`;

    // Create signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(message),
    );

    const signatureB64 = this.base64UrlEncode(
      String.fromCharCode(...new Uint8Array(signatureBuffer)),
    );

    return `${message}.${signatureB64}`;
  }

  /**
   * Parse expiration string to seconds
   * @param {string|number} expiresIn - "1h", "30m", "7d", or seconds
   * @returns {number} Seconds
   */
  parseExpiration(expiresIn) {
    if (typeof expiresIn === "number") {
      return expiresIn;
    }

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(
        'Invalid expiresIn format. Use "1h", "30m", "7d", or seconds.',
      );
    }

    const [, value, unit] = match;
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };

    return parseInt(value) * multipliers[unit];
  }

  /**
   * Base64 URL encode
   * @param {string} str - String to encode
   * @returns {string}
   */
  base64UrlEncode(str) {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  /**
   * Base64 URL to standard Base64
   * @param {string} str - Base64 URL string
   * @returns {string}
   */
  base64UrlToBase64(str) {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = str.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }
    return base64;
  }

  /**
   * Base64 URL decode to Uint8Array
   * @param {string} str - Base64 URL string
   * @returns {Uint8Array}
   */
  base64UrlDecode(str) {
    const base64 = this.base64UrlToBase64(str);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
