import { ws } from "@jevido/orcs";

/**
 * WebSocket Routes
 *
 * Define WebSocket endpoints for real-time communication.
 */

// Echo WebSocket - echoes messages back to sender
ws("/ws/echo", {
  message(ws, message) {
    console.log("📨 Echo received:", message);
    ws.send(JSON.stringify({
      type: "echo",
      data: message,
      timestamp: new Date().toISOString(),
    }));
  },
  open(ws) {
    console.log("🔌 WebSocket connected: /ws/echo");
    ws.send(JSON.stringify({
      type: "connected",
      message: "Connected to echo server. Send a message!",
    }));
  },
  close(ws) {
    console.log("🔌 WebSocket disconnected: /ws/echo");
  },
});

// Chat Room WebSocket - broadcasts to all connected clients
ws("/ws/chat", {
  message(ws, message) {
    console.log("💬 Chat message:", message);

    const data = typeof message === "string" ? JSON.parse(message) : message;

    // Broadcast to all subscribers
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

    // Notify others
    ws.publish("chat-room", JSON.stringify({
      type: "user-joined",
      message: "A user joined the chat",
      timestamp: new Date().toISOString(),
    }));

    // Welcome message to this user
    ws.send(JSON.stringify({
      type: "connected",
      message: "Welcome to the chat room!",
    }));
  },
  close(ws) {
    console.log("🔌 User left chat room");
    ws.unsubscribe("chat-room");

    // Notify others
    ws.publish("chat-room", JSON.stringify({
      type: "user-left",
      message: "A user left the chat",
      timestamp: new Date().toISOString(),
    }));
  },
});

// Notifications WebSocket - server-side push notifications
ws("/ws/notifications", {
  message(ws, message) {
    console.log("📬 Notification subscription:", message);

    const data = typeof message === "string" ? JSON.parse(message) : message;

    if (data.action === "subscribe") {
      ws.subscribe(`notifications-${data.userId}`);
      ws.send(JSON.stringify({
        type: "subscribed",
        message: "Subscribed to notifications",
      }));
    }
  },
  open(ws) {
    console.log("🔌 Connected to notifications");
    ws.send(JSON.stringify({
      type: "connected",
      message: "Send {action: 'subscribe', userId: YOUR_ID} to receive notifications",
    }));
  },
  close(ws) {
    console.log("🔌 Disconnected from notifications");
  },
});
