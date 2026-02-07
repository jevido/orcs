/**
 * WebSocket Routes
 *
 * Define WebSocket endpoints for your application.
 * Uncomment and customize the examples below as needed.
 */

import { ws } from "../src/index.js";

// Example: Echo WebSocket for testing
ws("/ws/echo", {
  connect: (ws, payload) => {
    console.log(`Client ${ws.data.clientId} connected to echo`);

    // Send welcome message
    ws.send(
      JSON.stringify({
        event: "welcome",
        payload: { message: "Connected to echo server" },
      }),
    );
  },

  message: (ws, payload) => {
    console.log(`Echo: ${JSON.stringify(payload)}`);

    // Echo the message back
    const manager = ws.data.manager;
    manager.send(ws, "echo", {
      original: payload,
      timestamp: new Date().toISOString(),
    });
  },

  disconnect: (ws, payload) => {
    console.log(`Client ${ws.data.clientId} disconnected from echo`);
  },
});

/*
// Example: Chat room WebSocket
ws("/ws/chat", {
  connect: (ws, payload) => {
    console.log(`Client ${ws.data.clientId} connected to chat`);
  },

  join: (ws, payload) => {
    const { room } = payload;
    const manager = ws.data.manager;
    manager.joinRoom(ws.data.clientId, room);
    manager.broadcastToRoom(room, "user-joined", {
      userId: ws.data.clientId,
      room,
    });
  },

  message: (ws, payload) => {
    const { room, text } = payload;
    const manager = ws.data.manager;
    manager.broadcastToRoom(
      room,
      "message",
      {
        from: ws.data.clientId,
        text,
        timestamp: new Date().toISOString(),
      },
      { except: [ws.data.clientId] },
    );
  },

  leave: (ws, payload) => {
    const { room } = payload;
    const manager = ws.data.manager;
    manager.leaveRoom(ws.data.clientId, room);
    manager.broadcastToRoom(room, "user-left", {
      userId: ws.data.clientId,
      room,
    });
  },

  disconnect: (ws, payload) => {
    console.log(`Client ${ws.data.clientId} disconnected from chat`);
  },
});

// Example: Notifications WebSocket (authenticated)
ws(
  "/ws/notifications",
  {
    connect: (ws, payload) => {
      if (!ws.data.authenticated) {
        ws.close(4401, "Authentication required");
        return;
      }

      const userId = ws.data.user.id;
      const manager = ws.data.manager;
      manager.joinRoom(ws.data.clientId, `user:${userId}`);

      console.log(`User ${userId} connected to notifications`);
    },

    disconnect: (ws, payload) => {
      console.log(`User disconnected from notifications`);
    },
  },
  {
    auth: { required: true },
  },
);
*/
