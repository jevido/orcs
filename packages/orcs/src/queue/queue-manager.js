/**
 * Queue Manager
 *
 * Manages job queues with support for multiple drivers (memory, database).
 */

import { getLogger } from "../logging/logger.js";

let queueManagerInstance = null;

export class QueueManager {
  constructor(config = {}) {
    this.driver = config.driver || "memory";
    this.logger = config.logger || getLogger();
    this.connection = null;
    this.queues = new Map(); // queueName -> driver instance
  }

  /**
   * Get or create a queue
   */
  async getQueue(name = "default") {
    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    const QueueDriver = await this.resolveDriver(this.driver);
    const queue = new QueueDriver(name, {
      logger: this.logger,
      connection: this.connection,
    });

    await queue.connect();
    this.queues.set(name, queue);
    return queue;
  }

  /**
   * Push a job to the queue
   */
  async push(job, options = {}) {
    const queueName = options.queue || job.queue || "default";
    const queue = await this.getQueue(queueName);
    return queue.push(job, options);
  }

  /**
   * Pop a job from the queue
   */
  async pop(queueName = "default") {
    const queue = await this.getQueue(queueName);
    return queue.pop();
  }

  /**
   * Get queue size
   */
  async size(queueName = "default") {
    const queue = await this.getQueue(queueName);
    return queue.size();
  }

  /**
   * Clear a queue
   */
  async clear(queueName = "default") {
    const queue = await this.getQueue(queueName);
    return queue.clear();
  }

  /**
   * Get queue statistics
   */
  async stats(queueName = "default") {
    const queue = await this.getQueue(queueName);
    return queue.stats();
  }

  /**
   * Set database connection for database driver
   */
  setConnection(connection) {
    this.connection = connection;
  }

  /**
   * Resolve queue driver
   */
  async resolveDriver(name) {
    switch (name) {
      case "memory":
        const { MemoryQueue } = await import("./drivers/memory-queue.js");
        return MemoryQueue;
      case "database":
        const { DatabaseQueue } = await import("./drivers/database-queue.js");
        return DatabaseQueue;
      default:
        throw new Error(`Unknown queue driver: ${name}`);
    }
  }

  /**
   * Close all queues
   */
  async close() {
    for (const [name, queue] of this.queues) {
      await queue.disconnect();
    }
    this.queues.clear();
  }
}

/**
 * Get the global queue manager instance
 */
export function getQueueManager() {
  if (!queueManagerInstance) {
    throw new Error(
      "Queue manager not initialized. Call setQueueManager() first.",
    );
  }
  return queueManagerInstance;
}

/**
 * Set the global queue manager instance
 */
export function setQueueManager(manager) {
  queueManagerInstance = manager;
}
