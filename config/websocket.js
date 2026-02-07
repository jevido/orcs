/**
 * WebSocket Configuration
 *
 * Configure WebSocket behavior for your application.
 */

export default {
  /*
  |--------------------------------------------------------------------------
  | Idle Timeout
  |--------------------------------------------------------------------------
  |
  | Time in seconds before an idle WebSocket connection is closed.
  |
  */
  idleTimeout: parseInt(Bun.env.WS_IDLE_TIMEOUT) || 120,

  /*
  |--------------------------------------------------------------------------
  | Max Payload Length
  |--------------------------------------------------------------------------
  |
  | Maximum size of a WebSocket message in bytes.
  | Default: 16MB
  |
  */
  maxPayloadLength: parseInt(Bun.env.WS_MAX_PAYLOAD_LENGTH) || 16 * 1024 * 1024,

  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  |
  | Enable authentication for WebSocket connections.
  |
  */
  auth: {
    enabled: Bun.env.WS_AUTH_ENABLED !== "false",
    required: Bun.env.WS_AUTH_REQUIRED === "true",
  },
};
