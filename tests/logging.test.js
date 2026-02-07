import { describe, test, expect, beforeEach } from "bun:test";
import { Logger, getLogger, setLogger } from "../src/logging/logger.js";
import { requestLogger, accessLog } from "../src/logging/middleware.js";

describe("Logger", () => {
  test("creates logger with default config", () => {
    const logger = new Logger();
    expect(logger.level).toBe("info");
    expect(logger.format).toBe("pretty");
  });

  test("creates logger with custom config", () => {
    const logger = new Logger({
      level: "debug",
      format: "json",
    });
    expect(logger.level).toBe("debug");
    expect(logger.format).toBe("json");
  });

  test("creates child logger with additional context", () => {
    const parent = new Logger({ context: { app: "test" } });
    const child = parent.child({ requestId: "123" });

    expect(child.context.app).toBe("test");
    expect(child.context.requestId).toBe("123");
  });

  test("respects log level filtering", () => {
    let output = "";
    const logger = new Logger({
      level: "warn",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    logger.debug("debug message");
    logger.info("info message");
    expect(output).toBe("");

    logger.warn("warn message");
    expect(output).toContain("warn message");
  });

  test("logs at debug level", () => {
    let output = "";
    const logger = new Logger({
      level: "debug",
      format: "json",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    logger.debug("debug message", { extra: "data" });

    const log = JSON.parse(output);
    expect(log.level).toBe("debug");
    expect(log.message).toBe("debug message");
    expect(log.extra).toBe("data");
  });

  test("logs at info level", () => {
    let output = "";
    const logger = new Logger({
      level: "info",
      format: "json",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    logger.info("info message", { userId: 123 });

    const log = JSON.parse(output);
    expect(log.level).toBe("info");
    expect(log.message).toBe("info message");
    expect(log.userId).toBe(123);
  });

  test("logs at warn level", () => {
    let output = "";
    const logger = new Logger({
      level: "warn",
      format: "json",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    logger.warn("warning message");

    const log = JSON.parse(output);
    expect(log.level).toBe("warn");
    expect(log.message).toBe("warning message");
  });

  test("logs at error level", () => {
    let output = "";
    const logger = new Logger({
      level: "error",
      format: "json",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    logger.error("error message");

    const log = JSON.parse(output);
    expect(log.level).toBe("error");
    expect(log.message).toBe("error message");
  });

  test("includes timestamp in logs", () => {
    let output = "";
    const logger = new Logger({
      format: "json",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    logger.info("test");

    const log = JSON.parse(output);
    expect(log.timestamp).toBeDefined();
    expect(new Date(log.timestamp)).toBeInstanceOf(Date);
  });

  test("includes context in logs", () => {
    let output = "";
    const logger = new Logger({
      format: "json",
      context: { app: "test-app", env: "test" },
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    logger.info("test");

    const log = JSON.parse(output);
    expect(log.app).toBe("test-app");
    expect(log.env).toBe("test");
  });

  test("handles Error objects", () => {
    let output = "";
    const logger = new Logger({
      format: "json",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    const error = new Error("Test error");
    logger.error("Error occurred", { error });

    const log = JSON.parse(output);
    expect(log.error).toBeDefined();
    expect(log.error.name).toBe("Error");
    expect(log.error.message).toBe("Test error");
    expect(log.error.stack).toBeDefined();
  });

  test("outputs JSON format correctly", () => {
    let output = "";
    const logger = new Logger({
      format: "json",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    logger.info("test message", { key: "value" });

    const log = JSON.parse(output);
    expect(log).toBeObject();
    expect(log.message).toBe("test message");
    expect(log.key).toBe("value");
  });

  test("outputs pretty format with colors", () => {
    let output = "";
    const logger = new Logger({
      format: "pretty",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    logger.info("test message");

    expect(output).toContain("test message");
    expect(output).toContain("INFO");
  });
});

describe("Global Logger Functions", () => {
  beforeEach(() => {
    // Reset default logger
    setLogger(null);
  });

  test("getLogger returns default logger", () => {
    const logger = getLogger();
    expect(logger).toBeInstanceOf(Logger);
  });

  test("getLogger returns same instance", () => {
    const logger1 = getLogger();
    const logger2 = getLogger();
    expect(logger1).toBe(logger2);
  });

  test("setLogger changes default logger", () => {
    const customLogger = new Logger({ level: "debug" });
    setLogger(customLogger);

    const logger = getLogger();
    expect(logger).toBe(customLogger);
    expect(logger.level).toBe("debug");
  });
});

describe("Request Logger Middleware", () => {
  test("creates request logger middleware", () => {
    const middleware = requestLogger();
    expect(middleware).toBeFunction();
  });

  test("attaches logger to context", async () => {
    const middleware = requestLogger();

    const ctx = {
      method: "GET",
      path: "/test",
      query: {},
      headers: {},
      logger: null,
    };

    let nextCalled = false;
    const next = async () => {
      nextCalled = true;
    };

    await middleware(ctx, next);

    expect(ctx.logger).toBeDefined();
    expect(ctx.logger).toBeInstanceOf(Logger);
    expect(nextCalled).toBe(true);
  });

  test("logs request start and completion", async () => {
    let output = "";
    const logger = new Logger({
      format: "json",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    const middleware = requestLogger({ logger });

    const ctx = {
      method: "GET",
      path: "/test",
      query: {},
      headers: {},
    };

    const next = async () => {};

    await middleware(ctx, next);

    const logs = output.split("\n").filter((line) => line.trim());
    expect(logs.length).toBeGreaterThanOrEqual(2);

    const startLog = JSON.parse(logs[0]);
    expect(startLog.message).toContain("Request started");
    expect(startLog.method).toBe("GET");
    expect(startLog.path).toBe("/test");

    const endLog = JSON.parse(logs[1]);
    expect(endLog.message).toContain("Request completed");
    expect(endLog.statusCode).toBeDefined();
    expect(endLog.duration).toBeDefined();
  });

  test("logs request errors", async () => {
    let output = "";
    const logger = new Logger({
      format: "json",
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    const middleware = requestLogger({ logger });

    const ctx = {
      method: "GET",
      path: "/test",
      query: {},
      headers: {},
    };

    const next = async () => {
      throw new Error("Test error");
    };

    try {
      await middleware(ctx, next);
    } catch (err) {
      // Expected
    }

    const logs = output.split("\n").filter((line) => line.trim());
    const errorLog = JSON.parse(logs[logs.length - 1]);

    expect(errorLog.level).toBe("error");
    expect(errorLog.message).toContain("Request failed");
    expect(errorLog.error).toBeDefined();
    expect(errorLog.error.message).toBe("Test error");
  });
});

describe("Access Log Middleware", () => {
  test("creates access log middleware", () => {
    const middleware = accessLog();
    expect(middleware).toBeFunction();
  });

  test("logs access in simple format", async () => {
    let output = "";
    const logger = new Logger({
      output: {
        write: (str) => {
          output += str;
        },
      },
    });

    const middleware = accessLog({ logger });

    const ctx = {
      method: "GET",
      path: "/test",
      headers: {},
    };

    const next = async () => {};

    await middleware(ctx, next);

    expect(output).toContain("GET /test");
    expect(output).toContain("200");
  });
});
