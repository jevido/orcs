/**
 * WebSocket Manager
 *
 * Manages WebSocket connections, rooms, and broadcasting using Bun's native
 * WebSocket implementation. Zero external dependencies.
 *
 * Features:
 * - Connection management
 * - Room/channel support
 * - Broadcasting to rooms or all connections
 * - Event-based messaging
 * - Authentication support
 * - Automatic cleanup
 */

import { getLogger } from "../logging/logger.js";

export class WebSocketManager {
  constructor(config = {}) {
    this.connections = new Map(); // clientId -> { ws, data, rooms }
    this.rooms = new Map(); // roomName -> Set(clientId)
    this.handlers = new Map(); // eventName -> handler
    this.logger = config.logger || getLogger();
    this.idleTimeout = config.idleTimeout || 120; // seconds
    this.maxPayloadLength = config.maxPayloadLength || 16 * 1024 * 1024; // 16MB
  }

  /**
   * Get Bun WebSocket handlers
   */
  getHandlers() {
    return {
      idleTimeout: this.idleTimeout,
      maxPayloadLength: this.maxPayloadLength,

      open: (ws) => {
        // Merge manager data with route data
        ws.data.manager = this;
        this.handleOpen(ws);

        // Call route-specific open handler
        const route = ws.data.route;
        if (route?.handlers?.open) {
          route.handlers.open(ws);
        }
        if (route?.handlers?.connect) {
          route.handlers.connect(ws, { clientId: ws.data.clientId });
        }
      },

      message: (ws, message) => {
        this.handleMessage(ws, message);

        // Also call route-specific handler if it exists
        const route = ws.data.route;
        if (route?.handlers?.message && typeof message === "string") {
          try {
            const data = JSON.parse(message);
            const handler = route.handlers[data.event];
            if (handler) {
              handler(ws, data.payload);
            }
          } catch (e) {
            // Not JSON or no event, ignore
          }
        }
      },

      close: (ws, code, reason) => {
        // Call route-specific close handler first
        const route = ws.data.route;
        if (route?.handlers?.close) {
          route.handlers.close(ws, code, reason);
        }
        if (route?.handlers?.disconnect) {
          route.handlers.disconnect(ws, {
            clientId: ws.data.clientId,
            code,
            reason,
          });
        }

        this.handleClose(ws, code, reason);
      },

      drain: (ws) => {
        this.handleDrain(ws);

        const route = ws.data.route;
        if (route?.handlers?.drain) {
          route.handlers.drain(ws);
        }
      },

      error: (ws, error) => {
        this.handleError(ws, error);

        const route = ws.data.route;
        if (route?.handlers?.error) {
          route.handlers.error(ws, error);
        }
      },
    };
  }

  /**
   * Handle new WebSocket connection
   */
  handleOpen(ws) {
    const clientId = this.generateClientId();

    // Merge with existing data (preserve route and manager from upgrade)
    ws.data = {
      ...ws.data,
      clientId,
      connectedAt: new Date(),
      authenticated: ws.data.authenticated || false,
      user: ws.data.user || null,
    };

    this.connections.set(clientId, {
      ws,
      data: ws.data,
      rooms: new Set(),
    });

    this.logger.info("WebSocket connected", {
      clientId,
      totalConnections: this.connections.size,
    });

    // Emit connect event
    this.emit(ws, "connect", { clientId });
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(ws, message) {
    try {
      const data = typeof message === "string" ? JSON.parse(message) : message;
      const { event, payload } = data;

      if (!event) {
        this.logger.warn("Message without event type", {
          clientId: ws.data.clientId,
        });
        return;
      }

      this.logger.debug("WebSocket message received", {
        clientId: ws.data.clientId,
        event,
      });

      // Call registered handler for this event
      const handler = this.handlers.get(event);
      if (handler) {
        handler(ws, payload);
      } else {
        this.logger.debug("No handler for event", { event });
      }
    } catch (error) {
      this.logger.error("Error handling message", {
        clientId: ws.data.clientId,
        error: { message: error.message, stack: error.stack },
      });

      this.send(ws, "error", {
        message: "Invalid message format",
      });
    }
  }

  /**
   * Handle WebSocket close
   */
  handleClose(ws, code, reason) {
    const clientId = ws.data.clientId;
    const connection = this.connections.get(clientId);

    if (connection) {
      // Remove from all rooms
      for (const room of connection.rooms) {
        this.leaveRoom(clientId, room);
      }

      // Remove connection
      this.connections.delete(clientId);

      this.logger.info("WebSocket disconnected", {
        clientId,
        code,
        reason,
        totalConnections: this.connections.size,
      });

      // Emit disconnect event
      this.emit(ws, "disconnect", { clientId, code, reason });
    }
  }

  /**
   * Handle drain event (when buffered data is sent)
   */
  handleDrain(ws) {
    this.logger.debug("WebSocket drain", { clientId: ws.data.clientId });
  }

  /**
   * Handle WebSocket error
   */
  handleError(ws, error) {
    this.logger.error("WebSocket error", {
      clientId: ws.data?.clientId,
      error: { message: error.message, stack: error.stack },
    });
  }

  /**
   * Register an event handler
   */
  on(event, handler) {
    this.handlers.set(event, handler);
  }

  /**
   * Emit an event (for internal use)
   */
  emit(ws, event, payload) {
    const handler = this.handlers.get(event);
    if (handler) {
      handler(ws, payload);
    }
  }

  /**
   * Send a message to a specific client
   */
  send(ws, event, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, payload }));
    }
  }

  /**
   * Send a message to a specific client by ID
   */
  sendToClient(clientId, event, payload) {
    const connection = this.connections.get(clientId);
    if (connection) {
      this.send(connection.ws, event, payload);
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(event, payload, options = {}) {
    const { except = [] } = options;
    const message = JSON.stringify({ event, payload });

    let sent = 0;
    for (const [clientId, connection] of this.connections) {
      if (!except.includes(clientId)) {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(message);
          sent++;
        }
      }
    }

    this.logger.debug("Broadcast sent", { event, recipients: sent });
  }

  /**
   * Broadcast to a specific room
   */
  broadcastToRoom(room, event, payload, options = {}) {
    const { except = [] } = options;
    const clients = this.rooms.get(room);

    if (!clients) {
      return;
    }

    const message = JSON.stringify({ event, payload });
    let sent = 0;

    for (const clientId of clients) {
      if (!except.includes(clientId)) {
        const connection = this.connections.get(clientId);
        if (connection && connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(message);
          sent++;
        }
      }
    }

    this.logger.debug("Room broadcast sent", { room, event, recipients: sent });
  }

  /**
   * Join a room
   */
  joinRoom(clientId, room) {
    const connection = this.connections.get(clientId);
    if (!connection) {
      return false;
    }

    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }

    this.rooms.get(room).add(clientId);
    connection.rooms.add(room);

    this.logger.debug("Client joined room", { clientId, room });
    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(clientId, room) {
    const connection = this.connections.get(clientId);
    if (!connection) {
      return false;
    }

    const clients = this.rooms.get(room);
    if (clients) {
      clients.delete(clientId);
      if (clients.size === 0) {
        this.rooms.delete(room);
      }
    }

    connection.rooms.delete(room);

    this.logger.debug("Client left room", { clientId, room });
    return true;
  }

  /**
   * Get all clients in a room
   */
  getRoomClients(room) {
    const clients = this.rooms.get(room);
    return clients ? Array.from(clients) : [];
  }

  /**
   * Get all rooms a client is in
   */
  getClientRooms(clientId) {
    const connection = this.connections.get(clientId);
    return connection ? Array.from(connection.rooms) : [];
  }

  /**
   * Disconnect a client
   */
  disconnect(clientId, code = 1000, reason = "Normal closure") {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.ws.close(code, reason);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connections: this.connections.size,
      rooms: this.rooms.size,
      averageRoomSize:
        this.rooms.size > 0
          ? Array.from(this.rooms.values()).reduce(
              (sum, clients) => sum + clients.size,
              0,
            ) / this.rooms.size
          : 0,
    };
  }

  /**
   * Generate a unique client ID
   */
  generateClientId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
