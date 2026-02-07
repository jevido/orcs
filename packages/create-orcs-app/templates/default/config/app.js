export default {
  name: Bun.env.APP_NAME || "ORCS",
  env: Bun.env.APP_ENV || "development",
  url: Bun.env.APP_URL || "http://localhost:42069",
  debug: Bun.env.APP_DEBUG === "true",
};
