import { env } from "../src/config/env.js";

export default {
  title: env("OPENAPI_TITLE", "ORCS API"),
  version: env("OPENAPI_VERSION", "0.1.0"),
  description: env("OPENAPI_DESCRIPTION", ""),
};
