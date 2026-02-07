import { ConfigRepository } from "../config/config-repository.js";
import { Route } from "../routing/router.js";
import { openApiRegistry } from "../openapi/registry.js";
import { createServer } from "../http/server.js";
import { ExceptionHandler } from "../errors/handler.js";

export class Application {
  #providers = [];
  #config;
  #basePath;

  constructor({ basePath } = {}) {
    this.#basePath = basePath || process.cwd();
    this.#config = new ConfigRepository();
    this.exceptionHandler = new ExceptionHandler();
    this.authenticator = null;
  }

  get basePath() {
    return this.#basePath;
  }

  get config() {
    return this.#config;
  }

  async loadConfig() {
    const configPath = this.#basePath + "/config";

    try {
      const [appConfig, httpConfig, openapiConfig, authConfig, loggingConfig] =
        await Promise.all([
          import(configPath + "/app.js").then((m) => m.default),
          import(configPath + "/http.js").then((m) => m.default),
          import(configPath + "/openapi.js").then((m) => m.default),
          import(configPath + "/auth.js")
            .then((m) => m.default)
            .catch(() => ({})), // Auth config is optional
          import(configPath + "/logging.js")
            .then((m) => m.default)
            .catch(() => ({})), // Logging config is optional
        ]);

      this.#config = new ConfigRepository({
        app: appConfig,
        http: httpConfig,
        openapi: openapiConfig,
        auth: authConfig,
        logging: loggingConfig,
      });

      // Push OpenAPI info to the registry
      openApiRegistry.setInfo({
        title: openapiConfig.title,
        version: openapiConfig.version,
        ...(openapiConfig.description
          ? { description: openapiConfig.description }
          : {}),
      });
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  register(provider) {
    this.#providers.push(provider);
    provider.register();
  }

  async boot() {
    for (const provider of this.#providers) {
      await provider.boot();
    }
  }

  serve() {
    return createServer(this);
  }

  withExceptionHandler(handler) {
    this.exceptionHandler = handler;
    return this;
  }

  useGlobalMiddleware(middlewares) {
    for (const mw of middlewares) {
      Route.use(mw);
    }
    return this;
  }

  registerMiddleware(map) {
    for (const [name, fn] of Object.entries(map)) {
      Route.middleware(name, fn);
    }
    return this;
  }

  routeCollection() {
    return Route.collection();
  }

  getGlobalMiddleware() {
    return Route.globalMiddleware();
  }
}
