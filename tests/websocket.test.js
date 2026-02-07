import { describe, test, expect, beforeEach } from "bun:test";
import { WebSocketManager } from "../src/websocket/manager.js";
import { WebSocketRoute, ws } from "../src/websocket/route.js";
import { WebSocketAuthenticator } from "../src/websocket/authenticator.js";

describe("WebSocket Manager", () => {
  let manager;

  beforeEach(() => {
    manager = new WebSocketManager();
  });

  test("creates manager with default config", () => {
    expect(manager).toBeDefined();
    expect(manager.connections.size).toBe(0);
    expect(manager.rooms.size).toBe(0);
  });

  test("generates unique client IDs", () => {
    const id1 = manager.generateClientId();
    const id2 = manager.generateClientId();

    expect(id1).toBeString();
    expect(id2).toBeString();
    expect(id1).not.toBe(id2);
  });

  test("registers event handlers", () => {
    const handler = (ws, payload) => {};
    manager.on("test-event", handler);

    expect(manager.handlers.get("test-event")).toBe(handler);
  });

  test("creates room when client joins", () => {
    const clientId = "test-client";
    manager.connections.set(clientId, {
      ws: {},
      data: {},
      rooms: new Set(),
    });

    manager.joinRoom(clientId, "room1");

    expect(manager.rooms.has("room1")).toBe(true);
    expect(manager.rooms.get("room1").has(clientId)).toBe(true);
  });

  test("removes room when last client leaves", () => {
    const clientId = "test-client";
    manager.connections.set(clientId, {
      ws: {},
      data: {},
      rooms: new Set(["room1"]),
    });
    manager.rooms.set("room1", new Set([clientId]));

    manager.leaveRoom(clientId, "room1");

    expect(manager.rooms.has("room1")).toBe(false);
  });

  test("gets clients in a room", () => {
    manager.connections.set("client1", {
      ws: {},
      data: {},
      rooms: new Set(["room1"]),
    });
    manager.connections.set("client2", {
      ws: {},
      data: {},
      rooms: new Set(["room1"]),
    });
    manager.rooms.set("room1", new Set(["client1", "client2"]));

    const clients = manager.getRoomClients("room1");

    expect(clients).toHaveLength(2);
    expect(clients).toContain("client1");
    expect(clients).toContain("client2");
  });

  test("gets rooms a client is in", () => {
    manager.connections.set("client1", {
      ws: {},
      data: {},
      rooms: new Set(["room1", "room2"]),
    });

    const rooms = manager.getClientRooms("client1");

    expect(rooms).toHaveLength(2);
    expect(rooms).toContain("room1");
    expect(rooms).toContain("room2");
  });

  test("returns empty array for non-existent room", () => {
    const clients = manager.getRoomClients("non-existent");
    expect(clients).toHaveLength(0);
  });

  test("returns empty array for non-existent client rooms", () => {
    const rooms = manager.getClientRooms("non-existent");
    expect(rooms).toHaveLength(0);
  });

  test("provides connection statistics", () => {
    manager.connections.set("client1", {
      ws: {},
      data: {},
      rooms: new Set(),
    });
    manager.connections.set("client2", {
      ws: {},
      data: {},
      rooms: new Set(),
    });
    manager.rooms.set("room1", new Set(["client1", "client2"]));

    const stats = manager.getStats();

    expect(stats.connections).toBe(2);
    expect(stats.rooms).toBe(1);
    expect(stats.averageRoomSize).toBe(2);
  });

  test("calculates average room size correctly", () => {
    manager.rooms.set("room1", new Set(["client1", "client2"]));
    manager.rooms.set("room2", new Set(["client3"]));

    const stats = manager.getStats();

    expect(stats.averageRoomSize).toBe(1.5);
  });

  test("returns zero average when no rooms", () => {
    const stats = manager.getStats();

    expect(stats.averageRoomSize).toBe(0);
  });
});

describe("WebSocket Route", () => {
  beforeEach(() => {
    WebSocketRoute.clear();
  });

  test("defines WebSocket route", () => {
    const handlers = {
      message: (ws, data) => {},
    };

    WebSocketRoute.ws("/ws/chat", handlers);

    expect(WebSocketRoute.routes.size).toBe(1);
    const route = WebSocketRoute.get("/ws/chat");
    expect(route.path).toBe("/ws/chat");
    expect(route.handlers).toBe(handlers);
  });

  test("gets all routes", () => {
    WebSocketRoute.ws("/ws/chat", {});
    WebSocketRoute.ws("/ws/notifications", {});

    const routes = WebSocketRoute.all();

    expect(routes).toHaveLength(2);
  });

  test("clears all routes", () => {
    WebSocketRoute.ws("/ws/chat", {});
    WebSocketRoute.clear();

    expect(WebSocketRoute.routes.size).toBe(0);
  });

  test("convenience ws function works", () => {
    ws("/ws/test", {});

    expect(WebSocketRoute.routes.size).toBe(1);
  });

  test("stores route options", () => {
    const options = { auth: true, middleware: [] };
    WebSocketRoute.ws("/ws/secure", {}, options);

    const route = WebSocketRoute.get("/ws/secure");
    expect(route.options).toBe(options);
  });
});

describe("WebSocket Authenticator", () => {
  test("creates authenticator", () => {
    const authenticator = new WebSocketAuthenticator();
    expect(authenticator).toBeDefined();
  });

  test("extracts token from query parameter", () => {
    const authenticator = new WebSocketAuthenticator();
    const request = {
      url: "ws://localhost:3000/ws?token=test-token-123",
      headers: new Map(),
    };

    const token = authenticator.tokenExtractor(request);

    expect(token).toBe("test-token-123");
  });

  test("extracts token from authorization header", () => {
    const authenticator = new WebSocketAuthenticator();
    const request = {
      url: "ws://localhost:3000/ws",
      headers: {
        get: (name) => {
          if (name === "authorization") return "Bearer test-token-123";
          return null;
        },
      },
    };

    const token = authenticator.tokenExtractor(request);

    expect(token).toBe("test-token-123");
  });

  test("extracts token from websocket protocol", () => {
    const authenticator = new WebSocketAuthenticator();
    const request = {
      url: "ws://localhost:3000/ws",
      headers: {
        get: (name) => {
          if (name === "sec-websocket-protocol") return "token, test-token-123";
          return null;
        },
      },
    };

    const token = authenticator.tokenExtractor(request);

    expect(token).toBe("test-token-123");
  });

  test("returns null when no token found", () => {
    const authenticator = new WebSocketAuthenticator();
    const request = {
      url: "ws://localhost:3000/ws",
      headers: {
        get: () => null,
      },
    };

    const token = authenticator.tokenExtractor(request);

    expect(token).toBeNull();
  });

  test("authenticates WebSocket connection", async () => {
    const mockAuthenticator = {
      authenticate: async (ctx) => {
        if (ctx.headers.authorization === "Bearer valid-token") {
          return { id: 1, email: "test@example.com" };
        }
        return null;
      },
    };

    const wsAuth = new WebSocketAuthenticator({
      authenticator: mockAuthenticator,
    });

    const request = {
      url: "ws://localhost:3000/ws?token=valid-token",
      headers: { get: () => null },
    };

    const ws = { data: {} };

    const user = await wsAuth.authenticate(request, ws);

    expect(user).toBeDefined();
    expect(user.id).toBe(1);
    expect(ws.data.authenticated).toBe(true);
    expect(ws.data.user).toBe(user);
  });

  test("returns null for invalid token", async () => {
    const mockAuthenticator = {
      authenticate: async () => null,
    };

    const wsAuth = new WebSocketAuthenticator({
      authenticator: mockAuthenticator,
    });

    const request = {
      url: "ws://localhost:3000/ws?token=invalid",
      headers: { get: () => null },
    };

    const ws = { data: {} };

    const user = await wsAuth.authenticate(request, ws);

    expect(user).toBeNull();
  });

  test("required middleware closes connection on failure", async () => {
    const mockAuthenticator = {
      authenticate: async () => null,
    };

    const wsAuth = new WebSocketAuthenticator({
      authenticator: mockAuthenticator,
    });

    const request = {
      url: "ws://localhost:3000/ws",
      headers: { get: () => null },
    };

    let closed = false;
    let closeCode = null;
    const ws = {
      data: {},
      close: (code, reason) => {
        closed = true;
        closeCode = code;
      },
    };

    const middleware = wsAuth.required();
    const result = await middleware(request, ws);

    expect(result).toBe(false);
    expect(closed).toBe(true);
    expect(closeCode).toBe(4401);
  });

  test("optional middleware doesn't close connection on failure", async () => {
    const mockAuthenticator = {
      authenticate: async () => null,
    };

    const wsAuth = new WebSocketAuthenticator({
      authenticator: mockAuthenticator,
    });

    const request = {
      url: "ws://localhost:3000/ws",
      headers: { get: () => null },
    };

    let closed = false;
    const ws = {
      data: {},
      close: () => {
        closed = true;
      },
    };

    const middleware = wsAuth.optional();
    const result = await middleware(request, ws);

    expect(result).toBe(true);
    expect(closed).toBe(false);
  });
});
