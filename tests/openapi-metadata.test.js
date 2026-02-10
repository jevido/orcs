import { describe, test, expect, afterAll } from "bun:test";
import { boot } from "../bootstrap/app.js";

// Ensure test routes are loaded
process.env.NODE_ENV = "test";

const { server } = await boot();
const base = server.url.origin;

afterAll(() => {
  server.stop();
});

describe("OpenAPI metadata", () => {
  test("all routes include summary and description", async () => {
    const res = await fetch(`${base}/openapi.json`);
    expect(res.status).toBe(200);

    const doc = await res.json();
    const missing = [];

    for (const [path, operations] of Object.entries(doc.paths || {})) {
      for (const [method, operation] of Object.entries(operations || {})) {
        // Skip non-HTTP operation keys like "parameters"
        if (
          method !== "get" &&
          method !== "post" &&
          method !== "put" &&
          method !== "patch" &&
          method !== "delete" &&
          method !== "options" &&
          method !== "head"
        ) {
          continue;
        }

        const summary = operation?.summary?.trim?.();
        const description = operation?.description?.trim?.();

        if (!summary || !description) {
          missing.push({
            path,
            method: method.toUpperCase(),
            summary: summary || null,
            description: description || null,
          });
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
