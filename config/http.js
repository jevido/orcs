import { env } from "../src/config/env.js";

export default {
  port: env.int("PORT", 42069),
  idleTimeout: env.int("SERVER_IDLE_TIMEOUT", 60),
  cors: {
    enabled: env.bool("CORS_ENABLED", false),
    origins: ["*"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    headers: ["Content-Type", "Authorization"],
    credentials: true,
  },
};
