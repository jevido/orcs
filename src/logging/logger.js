/**
 * Logger
 *
 * Structured logging system with support for different log levels,
 * JSON output, and colored console output for development.
 *
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Structured JSON output
 * - Colorized console output for development
 * - Context enrichment (request ID, user ID, etc.)
 * - Zero external dependencies
 */

export class Logger {
  static LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  static COLORS = {
    debug: "\x1b[36m", // Cyan
    info: "\x1b[32m", // Green
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    bold: "\x1b[1m",
  };

  constructor(config = {}) {
    this.level = config.level || "info";
    this.format = config.format || "pretty"; // 'json' or 'pretty'
    this.context = config.context || {};
    this.output = config.output || process.stdout;
  }

  /**
   * Create a child logger with additional context
   */
  child(context) {
    return new Logger({
      level: this.level,
      format: this.format,
      context: { ...this.context, ...context },
      output: this.output,
    });
  }

  /**
   * Log a debug message
   */
  debug(message, meta = {}) {
    this.log("debug", message, meta);
  }

  /**
   * Log an info message
   */
  info(message, meta = {}) {
    this.log("info", message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message, meta = {}) {
    this.log("warn", message, meta);
  }

  /**
   * Log an error message
   */
  error(message, meta = {}) {
    this.log("error", message, meta);
  }

  /**
   * Core logging method
   */
  log(level, message, meta = {}) {
    // Check if this level should be logged
    if (Logger.LOG_LEVELS[level] < Logger.LOG_LEVELS[this.level]) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...meta,
    };

    // Handle Error objects
    if (meta.error instanceof Error) {
      logEntry.error = {
        name: meta.error.name,
        message: meta.error.message,
        stack: meta.error.stack,
      };
    }

    if (this.format === "json") {
      this.writeJson(logEntry);
    } else {
      this.writePretty(level, message, logEntry);
    }
  }

  /**
   * Write log entry as JSON
   */
  writeJson(entry) {
    this.output.write(JSON.stringify(entry) + "\n");
  }

  /**
   * Write log entry with pretty formatting and colors
   */
  writePretty(level, message, entry) {
    const color = Logger.COLORS[level];
    const reset = Logger.COLORS.reset;
    const dim = Logger.COLORS.dim;
    const bold = Logger.COLORS.bold;

    // Format timestamp
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();

    // Format level with color and padding
    const levelPadded = level.toUpperCase().padEnd(5);

    // Build the log line
    let line = `${dim}${timestamp}${reset} ${color}${levelPadded}${reset} ${bold}${message}${reset}`;

    // Add metadata (excluding timestamp, level, message)
    const meta = { ...entry };
    delete meta.timestamp;
    delete meta.level;
    delete meta.message;

    if (Object.keys(meta).length > 0) {
      line += ` ${dim}${JSON.stringify(meta)}${reset}`;
    }

    this.output.write(line + "\n");
  }

  /**
   * Create a logger instance from config
   */
  static create(config = {}) {
    return new Logger(config);
  }
}

/**
 * Default logger instance
 */
let defaultLogger = null;

/**
 * Get the default logger instance
 */
export function getLogger() {
  if (!defaultLogger) {
    defaultLogger = new Logger({
      level: Bun.env.LOG_LEVEL || "info",
      format: Bun.env.LOG_FORMAT || "pretty",
    });
  }
  return defaultLogger;
}

/**
 * Set the default logger instance
 */
export function setLogger(logger) {
  defaultLogger = logger;
}

/**
 * Convenience logging functions using default logger
 */
export function debug(message, meta) {
  getLogger().debug(message, meta);
}

export function info(message, meta) {
  getLogger().info(message, meta);
}

export function warn(message, meta) {
  getLogger().warn(message, meta);
}

export function error(message, meta) {
  getLogger().error(message, meta);
}
