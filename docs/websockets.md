# WebSocket Support

ORCS includes built-in WebSocket support using Bun's native WebSocket implementation. Build real-time features like chat, notifications, and live updates with zero external dependencies.

## Basic Setup

Define WebSocket routes in `routes/websocket.js`:

```js
import { ws } from "./src/index.js";

ws("/ws/chat", {
  // Handle connection
  connect: (ws, payload) => {
    console.log(`Client ${ws.data.clientId} connected`);
  },

  // Handle custom events
  message: (ws, payload) => {
    const { text } = payload;
    // Echo message back
    ws.send(JSON.stringify({ event: "message", payload: { text } }));
  },

  // Handle disconnection
  disconnect: (ws, payload) => {
    console.log(`Client ${ws.data.clientId} disconnected`);
  },
});
```

## Client-Side Connection

```js
const ws = new WebSocket("ws://localhost:42069/ws/chat");

ws.onopen = () => {
  console.log("Connected!");

  // Send a message
  ws.send(
    JSON.stringify({
      event: "message",
      payload: { text: "Hello!" },
    }),
  );
};

ws.onmessage = (event) => {
  const { event: eventName, payload } = JSON.parse(event.data);
  console.log(`Received ${eventName}:`, payload);
};
```

## Rooms and Broadcasting

WebSocket manager supports rooms for organizing connections:

```js
ws("/ws/chat", {
  join: (ws, payload) => {
    const { room } = payload;
    const manager = ws.data.manager;

    // Join room
    manager.joinRoom(ws.data.clientId, room);

    // Notify room
    manager.broadcastToRoom(room, "user-joined", {
      userId: ws.data.clientId,
    });
  },

  message: (ws, payload) => {
    const { room, text } = payload;
    const manager = ws.data.manager;

    // Broadcast to everyone in room except sender
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
  },
});
```

## Broadcasting Methods

```js
const manager = ws.data.manager;

// Broadcast to all connected clients
manager.broadcast("announcement", {
  message: "Server restarting in 5 minutes",
});

// Broadcast to specific room
manager.broadcastToRoom("lobby", "update", { count: 42 });

// Broadcast to room except specific clients
manager.broadcastToRoom("lobby", "update", data, { except: ["client-123"] });

// Send to specific client
manager.sendToClient("client-456", "notification", { type: "info" });
```

## Authentication

Authenticate WebSocket connections using tokens:

```js
ws(
  "/ws/private",
  {
    connect: (ws, payload) => {
      // Check if authenticated
      if (!ws.data.authenticated) {
        ws.close(4401, "Unauthorized");
        return;
      }

      console.log(`User ${ws.data.user.id} connected`);
    },
  },
  {
    auth: { required: true },
  },
);
```

**Client-side with token:**

```js
// Option 1: Query parameter
const ws = new WebSocket(
  "ws://localhost:42069/ws/private?token=YOUR_JWT_TOKEN",
);

// Option 2: Authorization header (if supported by client)
const ws = new WebSocket("ws://localhost:42069/ws/private", {
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
  },
});

// Option 3: Subprotocol
const ws = new WebSocket("ws://localhost:42069/ws/private", [
  "token",
  "YOUR_JWT_TOKEN",
]);
```

## WebSocket Manager

The WebSocket manager provides connection and room management:

```js
import { WebSocketManager } from "./src/index.js";

const manager = new WebSocketManager({
  idleTimeout: 120, // seconds
  maxPayloadLength: 16 * 1024 * 1024, // 16MB
});

// Register event handlers
manager.on("message", (ws, payload) => {
  // Handle message event
});

// Get connection statistics
const stats = manager.getStats();
console.log(stats);
// { connections: 42, rooms: 5, averageRoomSize: 8.4 }

// Get clients in a room
const clients = manager.getRoomClients("lobby");

// Get rooms a client is in
const rooms = manager.getClientRooms("client-123");

// Disconnect a client
manager.disconnect("client-123", 1000, "Kicked");
```

## WebSocket Context

Each WebSocket connection has a context with useful information:

```js
ws.data.clientId; // Unique client ID
ws.data.connectedAt; // Connection timestamp
ws.data.authenticated; // Authentication status
ws.data.user; // User object (if authenticated)
ws.data.manager; // WebSocket manager instance
```

## Configuration

Configure WebSocket behavior in `config/websocket.js` and `.env`:

```bash
# .env
WS_IDLE_TIMEOUT=120
WS_MAX_PAYLOAD_LENGTH=16777216
WS_AUTH_ENABLED=true
WS_AUTH_REQUIRED=false
```

```js
// config/websocket.js
export default {
  idleTimeout: 120,
  maxPayloadLength: 16 * 1024 * 1024,
  auth: {
    enabled: true,
    required: false,
  },
};
```

## Example: Chat Application

```js
// routes/websocket.js
import { ws } from "./src/index.js";

ws("/ws/chat", {
  connect: (ws, payload) => {
    const manager = ws.data.manager;

    // Join general room
    manager.joinRoom(ws.data.clientId, "general");

    // Welcome message
    manager.send(ws, "welcome", {
      message: "Welcome to chat!",
      clientId: ws.data.clientId,
    });

    // Notify others
    manager.broadcastToRoom(
      "general",
      "user-joined",
      { clientId: ws.data.clientId },
      { except: [ws.data.clientId] },
    );
  },

  message: (ws, payload) => {
    const { room, text } = payload;
    const manager = ws.data.manager;

    // Broadcast message to room
    manager.broadcastToRoom(room, "message", {
      from: ws.data.clientId,
      text,
      timestamp: new Date().toISOString(),
    });
  },

  typing: (ws, payload) => {
    const { room } = payload;
    const manager = ws.data.manager;

    // Notify room about typing
    manager.broadcastToRoom(
      room,
      "user-typing",
      { clientId: ws.data.clientId },
      { except: [ws.data.clientId] },
    );
  },

  disconnect: (ws, payload) => {
    const manager = ws.data.manager;

    // Notify general room
    manager.broadcastToRoom("general", "user-left", {
      clientId: ws.data.clientId,
    });
  },
});
```

## Example: Notifications

```js
ws(
  "/ws/notifications",
  {
    connect: (ws, payload) => {
      const userId = ws.data.user.id;
      const manager = ws.data.manager;

      // Join user-specific room
      manager.joinRoom(ws.data.clientId, `user:${userId}`);

      // Send unread count
      manager.send(ws, "unread-count", { count: 5 });
    },
  },
  { auth: { required: true } },
);

// Send notification to specific user
function notifyUser(userId, notification) {
  manager.broadcastToRoom(`user:${userId}`, "notification", notification);
}
```

## Error Handling

WebSocket errors are automatically logged:

```js
ws("/ws/chat", {
  message: (ws, payload) => {
    try {
      // Your logic
    } catch (error) {
      // Send error to client
      ws.send(
        JSON.stringify({
          event: "error",
          payload: { message: "Something went wrong" },
        }),
      );
    }
  },
});
```
