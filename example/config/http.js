export default {
  port: parseInt(Bun.env.PORT || "42069", 10),
  idleTimeout: parseInt(Bun.env.SERVER_IDLE_TIMEOUT || "60", 10),
  cors: {
    enabled: Bun.env.CORS_ENABLED === "true" || Bun.env.CORS_ENABLED === "1",
    origins: ["*"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    headers: ["Content-Type", "Authorization"],
    credentials: true,
  },
};
