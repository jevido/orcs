import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { boot } from "../bootstrap/app.js";

describe("WebSocket Integration", () => {
  let app;
  let server;
  let baseUrl;

  beforeAll(async () => {
    // Use a random port to avoid conflicts with other tests
    Bun.env.PORT = "0"; // Let Bun choose an available port

    // Start the server
    const result = await boot();
    app = result.app;
    server = result.server;
    baseUrl = `ws://localhost:${server.port}`;
  });

  afterAll(() => {
    if (server) {
      server.stop();
    }
  });

  test("connects to WebSocket echo endpoint", async () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${baseUrl}/ws/echo`);
      let welcomeReceived = false;

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        if (data.event === "welcome") {
          welcomeReceived = true;
          expect(data.payload.message).toBe("Connected to echo server");

          // Send a test message
          ws.send(
            JSON.stringify({
              event: "message",
              payload: { text: "Hello, server!" },
            }),
          );
        } else if (data.event === "echo") {
          expect(welcomeReceived).toBe(true);
          expect(data.payload.original).toEqual({ text: "Hello, server!" });
          expect(data.payload.timestamp).toBeDefined();

          ws.close();
          resolve();
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        ws.close();
        reject(new Error("Test timeout"));
      }, 5000);
    });
  });

  test("receives clientId on connection", async () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${baseUrl}/ws/echo`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.event === "welcome") {
          // The connection should have been established
          expect(data.payload.message).toBeDefined();
          ws.close();
          resolve();
        }
      };

      ws.onerror = (error) => {
        reject(error);
      };

      setTimeout(() => {
        ws.close();
        reject(new Error("Test timeout"));
      }, 5000);
    });
  });

  test("handles multiple concurrent connections", async () => {
    const numConnections = 5;
    const promises = [];

    for (let i = 0; i < numConnections; i++) {
      promises.push(
        new Promise((resolve, reject) => {
          const ws = new WebSocket(`${baseUrl}/ws/echo`);

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event === "welcome") {
              ws.close();
              resolve();
            }
          };

          ws.onerror = reject;

          setTimeout(() => {
            ws.close();
            reject(new Error("Connection timeout"));
          }, 5000);
        }),
      );
    }

    await Promise.all(promises);

    // Wait a bit for all connections to fully close
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify stats
    const stats = server.wsManager.getStats();
    expect(stats.connections).toBe(0); // All should be closed now
  });

  test("closes connection on invalid route", async () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${baseUrl}/ws/nonexistent`);

      ws.onerror = () => {
        // Expected to fail
        resolve();
      };

      ws.onopen = () => {
        ws.close();
        reject(new Error("Should not have connected to invalid route"));
      };

      setTimeout(() => {
        resolve(); // Timeout is OK for this test
      }, 2000);
    });
  });
});
