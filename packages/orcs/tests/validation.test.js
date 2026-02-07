import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { boot } from "../bootstrap/app.js";

// Set test environment so routes/test.js gets loaded
process.env.NODE_ENV = "test";

const { server } = await boot();
const base = server.url.origin;

afterAll(() => {
  server.stop();
});

describe("Request Validation", () => {
  describe("Valid requests", () => {
    test("accepts valid request body", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          name: "John Doe",
          age: 25,
          password: "secure123",
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.message).toBe("User created");
      expect(body.data.email).toBe("john@example.com");
    });

    test("accepts request with optional fields omitted", async () => {
      const res = await fetch(`${base}/api/test/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(200);
    });

    test("accepts request with optional fields provided", async () => {
      const res = await fetch(`${base}/api/test/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: "Software developer",
          website: "https://example.com",
        }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe("Required field validation", () => {
    test("rejects request with missing required field", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          age: 25,
          password: "secure123",
          // email is missing
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("Validation Error");
      expect(body.errors.email).toBeDefined();
      expect(body.errors.email[0]).toContain("required");
    });

    test("rejects request with null required field", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: null,
          name: "John Doe",
          age: 25,
          password: "secure123",
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.errors.email).toBeDefined();
    });
  });

  describe("Type validation", () => {
    test("rejects invalid email format", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          name: "John Doe",
          age: 25,
          password: "secure123",
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.errors.email).toBeDefined();
      expect(body.errors.email[0]).toContain("email");
    });

    test("rejects non-integer age", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          name: "John Doe",
          age: 25.5, // Should be integer
          password: "secure123",
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.errors.age).toBeDefined();
      expect(body.errors.age[0]).toContain("integer");
    });
  });

  describe("String length validation", () => {
    test("rejects string below minLength", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          name: "J", // minLength is 2
          age: 25,
          password: "secure123",
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.errors.name).toBeDefined();
      expect(body.errors.name[0]).toContain("at least 2");
    });

    test("rejects string above maxLength", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          name: "a".repeat(51), // maxLength is 50
          age: 25,
          password: "secure123",
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.errors.name).toBeDefined();
      expect(body.errors.name[0]).toContain("at most 50");
    });

    test("rejects password below minLength", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          name: "John Doe",
          age: 25,
          password: "short", // minLength is 8
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.errors.password).toBeDefined();
      expect(body.errors.password[0]).toContain("at least 8");
    });
  });

  describe("Number range validation", () => {
    test("rejects number below minimum", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          name: "John Doe",
          age: 17, // minimum is 18
          password: "secure123",
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.errors.age).toBeDefined();
      expect(body.errors.age[0]).toContain("at least 18");
    });

    test("rejects number above maximum", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "john@example.com",
          name: "John Doe",
          age: 121, // maximum is 120
          password: "secure123",
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.errors.age).toBeDefined();
      expect(body.errors.age[0]).toContain("at most 120");
    });
  });

  describe("Pattern validation", () => {
    test("rejects string not matching pattern", async () => {
      const res = await fetch(`${base}/api/test/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "123 Main St",
          city: "New York",
          country: "US",
          zipCode: "12345-6789", // Pattern expects exactly 5 digits
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.errors.zipCode).toBeDefined();
      expect(body.errors.zipCode[0]).toContain("pattern");
    });

    test("accepts string matching pattern", async () => {
      const res = await fetch(`${base}/api/test/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street: "123 Main St",
          city: "New York",
          country: "US",
          zipCode: "12345",
        }),
      });

      expect(res.status).toBe(201);
    });
  });

  describe("Multiple validation errors", () => {
    test("returns all validation errors at once", async () => {
      const res = await fetch(`${base}/api/test/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          name: "J",
          age: 17,
          password: "short",
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("Validation Error");
      expect(body.errors.email).toBeDefined();
      expect(body.errors.name).toBeDefined();
      expect(body.errors.age).toBeDefined();
      expect(body.errors.password).toBeDefined();
    });
  });

  describe("URL format validation", () => {
    test("rejects invalid URL format", async () => {
      const res = await fetch(`${base}/api/test/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: "not-a-url",
        }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.errors.website).toBeDefined();
      expect(body.errors.website[0]).toContain("URL");
    });

    test("accepts valid URL format", async () => {
      const res = await fetch(`${base}/api/test/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: "https://example.com",
        }),
      });

      expect(res.status).toBe(200);
    });
  });
});
