import { describe, test, expect, afterAll } from "bun:test";
import { boot } from "../bootstrap/app.js";

const { server } = await boot();
const base = server.url.origin;

afterAll(() => {
  server.stop();
});

describe("GET /api/health", () => {
  test("returns 200 with status ok", async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });
});

describe("GET /openapi.json", () => {
  test("returns a valid OpenAPI 3.1.0 document", async () => {
    const res = await fetch(`${base}/openapi.json`);
    expect(res.status).toBe(200);

    const doc = await res.json();
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info).toBeDefined();
    expect(doc.info.title).toBeDefined();
    expect(doc.paths).toBeDefined();
    expect(doc.paths["/api/health"]).toBeDefined();
    expect(doc.paths["/api/health"].get).toBeDefined();
    expect(doc.paths["/api/health"].get.summary).toBe("Health check");
  });
});

describe("404 handling", () => {
  test("returns 404 for unknown routes", async () => {
    const res = await fetch(`${base}/nonexistent`);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Not Found");
  });
});

describe("405 handling", () => {
  test("returns 405 with Allow header for wrong method", async () => {
    const res = await fetch(`${base}/api/health`, { method: "POST" });

    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toContain("GET");
  });
});
