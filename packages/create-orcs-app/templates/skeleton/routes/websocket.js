import { ws } from "@jevido/orcs";

/**
 * WebSocket Routes
 *
 * Define WebSocket endpoints for real-time communication.
 */

// Echo WebSocket - echoes messages back to sender
ws("/ws/echo", {
  message(ws, message) {
    // TODO: Implement echo logic or customize
    ws.send(JSON.stringify({
      type: "echo",
      data: message,
      timestamp: new Date().toISOString(),
    }));
  },
  open(ws) {
    console.log("🔌 WebSocket connected: /ws/echo");
    // TODO: Send welcome message or initialize connection
  },
  close(ws) {
    console.log("🔌 WebSocket disconnected: /ws/echo");
    // TODO: Cleanup logic
  },
});

// Chat Room WebSocket - broadcasts to all connected clients
ws("/ws/chat", {
  message(ws, message) {
    // TODO: Implement chat room logic
    // Parse message, validate, broadcast to room
    const data = typeof message === "string" ? JSON.parse(message) : message;

    ws.publish("chat-room", JSON.stringify({
      type: "message",
      user: data.user || "Anonymous",
      message: data.message,
      timestamp: new Date().toISOString(),
    }));
  },
  open(ws) {
    console.log("🔌 User joined chat room");
    ws.subscribe("chat-room");
    // TODO: Notify others, load chat history, etc.
  },
  close(ws) {
    console.log("🔌 User left chat room");
    ws.unsubscribe("chat-room");
    // TODO: Notify others, cleanup
  },
});

// Notifications WebSocket - server-side push notifications
ws("/ws/notifications", {
  message(ws, message) {
    // TODO: Handle subscription logic
    const data = typeof message === "string" ? JSON.parse(message) : message;

    if (data.action === "subscribe") {
      ws.subscribe(`notifications-${data.userId}`);
      // TODO: Send pending notifications, mark as delivered, etc.
    }
  },
  open(ws) {
    console.log("🔌 Connected to notifications");
    // TODO: Authentication check, send initial state
  },
  close(ws) {
    console.log("🔌 Disconnected from notifications");
    // TODO: Cleanup subscriptions
  },
});

// Add your WebSocket routes here
