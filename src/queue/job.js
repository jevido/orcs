/**
 * Base Job Class
 *
 * Extend this class to create custom jobs that can be dispatched to the queue.
 *
 * @example
 * export class SendEmailJob extends Job {
 *   async handle() {
 *     const { to, subject, body } = this.data;
 *     // Send email logic
 *   }
 * }
 *
 * // Dispatch the job
 * await SendEmailJob.dispatch({ to: 'user@example.com', subject: 'Hello' });
 */
export class Job {
  /**
   * Maximum number of times to retry the job
   */
  static maxRetries = 3;

  /**
   * Number of seconds to wait before retrying
   */
  static retryDelay = 60;

  /**
   * Queue name for this job type
   */
  static queue = "default";

  /**
   * Job priority (higher = more important)
   */
  static priority = 0;

  /**
   * Job timeout in seconds
   */
  static timeout = 300;

  constructor(data = {}) {
    this.data = data;
    this.attempts = 0;
    this.maxRetries = this.constructor.maxRetries;
    this.retryDelay = this.constructor.retryDelay;
    this.queue = this.constructor.queue;
    this.priority = this.constructor.priority;
    this.timeout = this.constructor.timeout;
  }

  /**
   * Handle the job (override this method)
   */
  async handle() {
    throw new Error("Job handle method must be implemented");
  }

  /**
   * Called when the job fails after all retries
   */
  async failed(error) {
    // Override to handle job failure
  }

  /**
   * Dispatch a job to the queue
   */
  static async dispatch(data = {}, options = {}) {
    const job = new this(data);
    const queue = await this.getQueue();

    await queue.push(job, {
      delay: options.delay || 0,
      priority: options.priority ?? job.priority,
      queue: options.queue || job.queue,
    });

    return job;
  }

  /**
   * Dispatch a job with a delay
   */
  static async dispatchAfter(seconds, data = {}) {
    return this.dispatch(data, { delay: seconds });
  }

  /**
   * Get the queue instance
   */
  static async getQueue() {
    // Import dynamically to avoid circular dependencies
    const { getQueueManager } = await import("./queue-manager.js");
    return getQueueManager();
  }

  /**
   * Serialize job to JSON
   */
  toJSON() {
    return {
      class: this.constructor.name,
      data: this.data,
      attempts: this.attempts,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      queue: this.queue,
      priority: this.priority,
      timeout: this.timeout,
    };
  }

  /**
   * Deserialize job from JSON
   */
  static fromJSON(json, jobClass) {
    const job = new jobClass(json.data);
    job.attempts = json.attempts || 0;
    job.maxRetries = json.maxRetries;
    job.retryDelay = json.retryDelay;
    job.queue = json.queue;
    job.priority = json.priority;
    job.timeout = json.timeout;
    return job;
  }
}
