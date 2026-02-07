import { describe, test, expect, afterAll } from "bun:test";
import { boot } from "../bootstrap/app.js";

// Set test environment
process.env.NODE_ENV = "test";

const { server } = await boot();
const base = server.url.origin;

afterAll(() => {
  server.stop();
});

describe("GET /docs", () => {
  test("returns HTML documentation page", async () => {
    const res = await fetch(`${base}/docs`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("api-reference");
    expect(html).toContain("/openapi.json");
    expect(html).toContain("@scalar/api-reference");
  });

  test("only allows GET method", async () => {
    const res = await fetch(`${base}/docs`, { method: "POST" });
    // Bun's native routes return 404 for undefined methods, not 405
    expect(res.status).toBe(404);
  });

  test("references the correct OpenAPI spec URL", async () => {
    const res = await fetch(`${base}/docs`);
    const html = await res.text();

    // Check that the data-url attribute points to /openapi.json
    expect(html).toMatch(/data-url="[^"]*\/openapi\.json"/);
  });
});
