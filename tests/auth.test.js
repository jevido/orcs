import { describe, test, expect, beforeAll } from "bun:test";
import { Authenticator } from "../src/auth/authenticator.js";
import { JwtGuard } from "../src/auth/guards/jwt-guard.js";
import { ApiTokenGuard } from "../src/auth/guards/api-token-guard.js";
import { auth } from "../src/auth/middleware.js";

describe("JWT Guard", () => {
  const secret = "test-secret-key-for-testing-only";
  const guard = new JwtGuard({ secret });

  test("can sign and verify a JWT token", async () => {
    const payload = { userId: 1, email: "test@example.com" };
    const token = await guard.sign(payload);

    expect(token).toBeString();
    expect(token.split(".").length).toBe(3);

    const verified = await guard.verifyToken(token);
    expect(verified.userId).toBe(1);
    expect(verified.email).toBe("test@example.com");
    expect(verified.iat).toBeDefined();
  });

  test("can sign token with expiration", async () => {
    const payload = { userId: 1 };
    const token = await guard.sign(payload, { expiresIn: "1h" });

    const verified = await guard.verifyToken(token);
    expect(verified.exp).toBeDefined();
    expect(verified.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test("rejects expired token", async () => {
    const payload = { userId: 1, exp: Math.floor(Date.now() / 1000) - 100 };
    const token = await guard.sign(payload);

    await expect(guard.verifyToken(token)).rejects.toThrow(
      "JWT token has expired",
    );
  });

  test("rejects invalid signature", async () => {
    const payload = { userId: 1 };
    const token = await guard.sign(payload);

    // Tamper with the token
    const parts = token.split(".");
    parts[2] = "invalidsignature";
    const tamperedToken = parts.join(".");

    await expect(guard.verifyToken(tamperedToken)).rejects.toThrow(
      "Invalid JWT signature",
    );
  });

  test("rejects malformed token", async () => {
    await expect(guard.verifyToken("not.a.valid.token")).rejects.toThrow(
      "Invalid JWT format",
    );
  });

  test("extracts token from Bearer header", async () => {
    const mockCtx = {
      headers: { authorization: "Bearer test-token" },
    };

    const token = guard.extractToken(mockCtx);
    expect(token).toBe("test-token");
  });

  test("extracts token from plain header", async () => {
    const mockCtx = {
      headers: { authorization: "test-token" },
    };

    const token = guard.extractToken(mockCtx);
    expect(token).toBe("test-token");
  });

  test("returns null when no authorization header", async () => {
    const mockCtx = { headers: {} };
    const token = guard.extractToken(mockCtx);
    expect(token).toBeNull();
  });

  test("authenticates valid request", async () => {
    const payload = { userId: 1, email: "test@example.com" };
    const token = await guard.sign(payload);

    const mockCtx = {
      headers: { authorization: `Bearer ${token}` },
    };

    const user = await guard.authenticate(mockCtx);
    expect(user).toBeDefined();
    expect(user.userId).toBe(1);
    expect(user.email).toBe("test@example.com");
  });

  test("returns null for invalid request", async () => {
    const mockCtx = {
      headers: { authorization: "Bearer invalid-token" },
    };

    const user = await guard.authenticate(mockCtx);
    expect(user).toBeNull();
  });

  test("uses custom user provider", async () => {
    const userProvider = async (payload) => ({
      id: payload.userId,
      email: payload.email,
      name: "Test User",
    });

    const customGuard = new JwtGuard({ secret, userProvider });
    const payload = { userId: 1, email: "test@example.com" };
    const token = await customGuard.sign(payload);

    const mockCtx = {
      headers: { authorization: `Bearer ${token}` },
    };

    const user = await customGuard.authenticate(mockCtx);
    expect(user.name).toBe("Test User");
  });

  test("parses expiration strings correctly", () => {
    expect(guard.parseExpiration("30s")).toBe(30);
    expect(guard.parseExpiration("5m")).toBe(300);
    expect(guard.parseExpiration("2h")).toBe(7200);
    expect(guard.parseExpiration("7d")).toBe(604800);
    expect(guard.parseExpiration(3600)).toBe(3600);
  });
});

describe("API Token Guard", () => {
  test("generates random tokens", () => {
    const token1 = ApiTokenGuard.generateToken();
    const token2 = ApiTokenGuard.generateToken();

    expect(token1).toBeString();
    expect(token1.length).toBe(64);
    expect(token1).not.toBe(token2);
  });

  test("generates tokens of custom length", () => {
    const token = ApiTokenGuard.generateToken(32);
    expect(token.length).toBe(32);
  });

  test("hashes tokens consistently", async () => {
    const token = "test-token-123";
    const hash1 = await ApiTokenGuard.hashToken(token);
    const hash2 = await ApiTokenGuard.hashToken(token);

    expect(hash1).toBeString();
    expect(hash1).toBe(hash2);
  });

  test("different tokens produce different hashes", async () => {
    const hash1 = await ApiTokenGuard.hashToken("token1");
    const hash2 = await ApiTokenGuard.hashToken("token2");

    expect(hash1).not.toBe(hash2);
  });

  test("extracts token from Bearer header", () => {
    const tokenProvider = async () => ({ userId: 1 });
    const guard = new ApiTokenGuard({ tokenProvider });

    const mockCtx = {
      headers: { authorization: "Bearer test-token" },
    };

    const token = guard.extractToken(mockCtx);
    expect(token).toBe("test-token");
  });

  test("authenticates with token provider", async () => {
    const tokenProvider = async (token) => {
      if (token === "valid-token") {
        return { id: 1, name: "Test User" };
      }
      return null;
    };

    const guard = new ApiTokenGuard({ tokenProvider });

    const mockCtx = {
      headers: { authorization: "Bearer valid-token" },
    };

    const user = await guard.authenticate(mockCtx);
    expect(user).toBeDefined();
    expect(user.id).toBe(1);
    expect(user.name).toBe("Test User");
  });

  test("returns null for invalid token", async () => {
    const tokenProvider = async () => null;
    const guard = new ApiTokenGuard({ tokenProvider });

    const mockCtx = {
      headers: { authorization: "Bearer invalid-token" },
    };

    const user = await guard.authenticate(mockCtx);
    expect(user).toBeNull();
  });
});

describe("Authenticator", () => {
  test("can register and retrieve guards", () => {
    const auth = new Authenticator({ default: "jwt" });
    const jwtGuard = new JwtGuard({ secret: "test" });

    auth.registerGuard("jwt", jwtGuard);

    expect(auth.guard("jwt")).toBe(jwtGuard);
    expect(auth.guard()).toBe(jwtGuard); // default guard
  });

  test("throws error for unknown guard", () => {
    const auth = new Authenticator();

    expect(() => auth.guard("unknown")).toThrow(
      'Authentication guard "unknown" not found',
    );
  });

  test("can authenticate using a guard", async () => {
    const auth = new Authenticator({ default: "jwt" });
    const jwtGuard = new JwtGuard({ secret: "test" });

    auth.registerGuard("jwt", jwtGuard);

    const token = await jwtGuard.sign({ userId: 1 });
    const mockCtx = {
      headers: { authorization: `Bearer ${token}` },
    };

    const user = await auth.authenticate(mockCtx);
    expect(user).toBeDefined();
    expect(user.userId).toBe(1);
  });

  test("can check authentication status", async () => {
    const auth = new Authenticator({ default: "jwt" });
    const jwtGuard = new JwtGuard({ secret: "test" });

    auth.registerGuard("jwt", jwtGuard);

    const token = await jwtGuard.sign({ userId: 1 });
    const validCtx = {
      headers: { authorization: `Bearer ${token}` },
    };

    const invalidCtx = {
      headers: { authorization: "Bearer invalid" },
    };

    expect(await auth.check(validCtx)).toBe(true);
    expect(await auth.check(invalidCtx)).toBe(false);
  });
});

describe("Authentication Middleware", () => {
  test("middleware requires authenticator on app", async () => {
    const middleware = auth();
    const mockCtx = {
      headers: {},
      app: {}, // No authenticator
    };

    const next = async () => {};

    await expect(middleware(mockCtx, next)).rejects.toThrow(
      "Authenticator not configured",
    );
  });

  test("middleware attaches user to context", async () => {
    const jwtGuard = new JwtGuard({ secret: "test" });
    const token = await jwtGuard.sign({ userId: 1, email: "test@example.com" });

    const authenticator = new Authenticator({ default: "jwt" });
    authenticator.registerGuard("jwt", jwtGuard);

    const middleware = auth();
    const mockCtx = {
      headers: { authorization: `Bearer ${token}` },
      app: { authenticator },
      user: null,
      authenticated: false,
    };

    let nextCalled = false;
    const next = async () => {
      nextCalled = true;
    };

    await middleware(mockCtx, next);

    expect(nextCalled).toBe(true);
    expect(mockCtx.user).toBeDefined();
    expect(mockCtx.user.userId).toBe(1);
    expect(mockCtx.authenticated).toBe(true);
  });

  test("middleware throws 401 for unauthenticated requests", async () => {
    const jwtGuard = new JwtGuard({ secret: "test" });
    const authenticator = new Authenticator({ default: "jwt" });
    authenticator.registerGuard("jwt", jwtGuard);

    const middleware = auth();
    const mockCtx = {
      headers: {},
      app: { authenticator },
    };

    const next = async () => {};

    await expect(middleware(mockCtx, next)).rejects.toThrow("Unauthenticated");
  });

  test("optional middleware doesn't throw on missing auth", async () => {
    const jwtGuard = new JwtGuard({ secret: "test" });
    const authenticator = new Authenticator({ default: "jwt" });
    authenticator.registerGuard("jwt", jwtGuard);

    const middleware = auth({ optional: true });
    const mockCtx = {
      headers: {},
      app: { authenticator },
      user: null,
      authenticated: false,
    };

    let nextCalled = false;
    const next = async () => {
      nextCalled = true;
    };

    await middleware(mockCtx, next);

    expect(nextCalled).toBe(true);
    expect(mockCtx.user).toBeNull();
    expect(mockCtx.authenticated).toBe(false);
  });
});
