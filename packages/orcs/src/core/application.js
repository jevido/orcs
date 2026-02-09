import { ConfigRepository } from "../config/config-repository.js";
import { Route } from "../routing/router.js";
import { openApiRegistry } from "../openapi/registry.js";
import { createServer } from "../http/server.js";
import { ExceptionHandler } from "../errors/handler.js";
import { getConnection } from "../database/connection.js";

export class Application {
  #providers = [];
  #config;
  #basePath;

  constructor({ basePath } = {}) {
    this.#basePath = basePath || process.cwd();
    this.#config = new ConfigRepository();
    this.exceptionHandler = new ExceptionHandler();
    this.authenticator = null;
    this.queueManager = null;
    this.jobRegistry = new Map();
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
      const [
        appConfig,
        httpConfig,
        openapiConfig,
        authConfig,
        loggingConfig,
        websocketConfig,
        queueConfig,
        databaseConfig,
      ] = await Promise.all([
        import(configPath + "/app.js").then((m) => m.default),
        import(configPath + "/http.js").then((m) => m.default),
        import(configPath + "/openapi.js").then((m) => m.default),
        import(configPath + "/auth.js")
          .then((m) => m.default)
          .catch(() => ({})), // Auth config is optional
        import(configPath + "/logging.js")
          .then((m) => m.default)
          .catch(() => ({})), // Logging config is optional
        import(configPath + "/websocket.js")
          .then((m) => m.default)
          .catch(() => ({})), // WebSocket config is optional
        import(configPath + "/queue.js")
          .then((m) => m.default)
          .catch(() => ({})), // Queue config is optional
        import(configPath + "/database.js")
          .then((m) => m.default)
          .catch(() => ({})), // Database config is optional
      ]);

      this.#config = new ConfigRepository({
        app: appConfig,
        http: httpConfig,
        openapi: openapiConfig,
        auth: authConfig,
        logging: loggingConfig,
        websocket: websocketConfig,
        queue: queueConfig,
        database: databaseConfig,
      });

      // Initialize database connection if configured
      if (databaseConfig.connection) {
        getConnection(databaseConfig.connection);
      }

      // Push OpenAPI info to the registry
      openApiRegistry.setInfo({
        title: openapiConfig.title,
        version: openapiConfig.version,
        ...(openapiConfig.description
          ? { description: openapiConfig.description }
          : {}),
      });

      if (openapiConfig.components) {
        openApiRegistry.setComponents(openapiConfig.components);
      }

      if (openapiConfig.securitySchemes) {
        openApiRegistry.addSecuritySchemes(openapiConfig.securitySchemes);
      }

      if (openapiConfig.security) {
        openApiRegistry.setGlobalSecurity(openapiConfig.security);
      }
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  register(provider) {
    this.#providers.push(provider);
    provider.register();
  }

  async boot() {
    // Initialize queue manager if configured
    await this.initializeQueueManager();

    for (const provider of this.#providers) {
      await provider.boot();
    }
  }

  async initializeQueueManager() {
    const queueConfig = this.#config.get("queue", {});

    if (queueConfig.driver) {
      const { QueueManager, setQueueManager } =
        await import("../queue/queue-manager.js");

      this.queueManager = new QueueManager({
        driver: queueConfig.driver,
        logger: this.logger,
      });

      // Set database connection if using database driver
      if (queueConfig.driver === "database" && this.db) {
        this.queueManager.setConnection(this.db);
      }

      // Set as global instance
      setQueueManager(this.queueManager);
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
