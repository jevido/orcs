import { ws } from "@jevido/orcs";

/**
 * WebSocket Routes
 *
 * Define WebSocket endpoints for real-time communication.
 * Uncomment and customize as needed.
 */

// Example WebSocket endpoint
// ws("/ws/echo", {
//   message(ws, message) {
//     // Echo back the message
//     ws.send(message);
//   },
//   open(ws) {
//     console.log("WebSocket connected");
//     ws.send(JSON.stringify({ type: "connected", message: "Welcome!" }));
//   },
//   close(ws) {
//     console.log("WebSocket disconnected");
//   },
// });

// Example chat room
// ws("/ws/chat", {
//   message(ws, message) {
//     // Broadcast to all connected clients
//     ws.publish("chat", message);
//   },
//   open(ws) {
//     ws.subscribe("chat");
//     ws.send(JSON.stringify({ type: "info", message: "Joined chat room" }));
//   },
//   close(ws) {
//     ws.unsubscribe("chat");
//   },
// });
