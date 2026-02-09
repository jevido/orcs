/**
 * WebSocket Routes (Example)
 *
 * Define WebSocket endpoints for your application.
 * Copy this to routes/websocket.js and customize as needed.
 */

import { ws } from "@jevido/orcs";

// Chat room WebSocket
ws("/ws/chat", {
  // Called when a client connects
  connect: (ws, payload) => {
    console.log(`Client ${ws.data.clientId} connected to chat`);

    // Send welcome message
    ws.send(
      JSON.stringify({
        event: "welcome",
        payload: { message: "Welcome to the chat!" },
      }),
    );
  },

  // Called when a client sends a message
  message: (ws, payload) => {
    const { room, text } = payload;

    // Broadcast message to all clients in the room
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

  // Called when a client joins a room
  join: (ws, payload) => {
    const { room } = payload;
    const manager = ws.data.manager;

    manager.joinRoom(ws.data.clientId, room);

    // Notify room members
    manager.broadcastToRoom(room, "user-joined", {
      userId: ws.data.clientId,
      room,
    });
  },

  // Called when a client leaves a room
  leave: (ws, payload) => {
    const { room } = payload;
    const manager = ws.data.manager;

    manager.leaveRoom(ws.data.clientId, room);

    // Notify room members
    manager.broadcastToRoom(room, "user-left", {
      userId: ws.data.clientId,
      room,
    });
  },

  // Called when a client disconnects
  disconnect: (ws, payload) => {
    console.log(`Client ${ws.data.clientId} disconnected from chat`);
  },
});

// Notifications WebSocket (authenticated)
ws(
  "/ws/notifications",
  {
    connect: (ws, payload) => {
      if (!ws.data.authenticated) {
        ws.close(4401, "Authentication required");
        return;
      }

      const userId = ws.data.user.id;

      // Join user-specific room
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

// Real-time updates WebSocket
ws("/ws/updates", {
  connect: (ws, payload) => {
    // Join general updates room
    const manager = ws.data.manager;
    manager.joinRoom(ws.data.clientId, "updates");
  },

  subscribe: (ws, payload) => {
    const { topic } = payload;
    const manager = ws.data.manager;

    // Join topic-specific room
    manager.joinRoom(ws.data.clientId, `topic:${topic}`);

    // Confirm subscription
    manager.send(ws, "subscribed", { topic });
  },

  unsubscribe: (ws, payload) => {
    const { topic } = payload;
    const manager = ws.data.manager;

    manager.leaveRoom(ws.data.clientId, `topic:${topic}`);

    // Confirm unsubscription
    manager.send(ws, "unsubscribed", { topic });
  },
});
