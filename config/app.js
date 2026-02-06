import { env } from "../src/config/env.js";

export default {
  name: env("APP_NAME", "ORCS"),
  env: env("APP_ENV", "development"),
  url: env("APP_URL", "http://localhost:42069"),
  debug: env.bool("APP_DEBUG", true),
};
