/**
 * Memory Queue Driver
 *
 * In-memory queue implementation for development and testing.
 * Jobs are stored in memory and lost on restart.
 */

export class MemoryQueue {
  constructor(name, options = {}) {
    this.name = name;
    this.logger = options.logger;
    this.jobs = []; // Array of { job, id, availableAt, priority }
    this.nextId = 1;
    this.stats = {
      pushed: 0,
      processed: 0,
      failed: 0,
    };
  }

  async connect() {
    // No connection needed for memory queue
  }

  async disconnect() {
    // No disconnection needed
  }

  /**
   * Push a job to the queue
   */
  async push(job, options = {}) {
    const delay = options.delay || 0;
    const priority = options.priority ?? job.priority ?? 0;
    const availableAt = Date.now() + delay * 1000;

    const queuedJob = {
      id: this.nextId++,
      job: job.toJSON(),
      availableAt,
      priority,
      attempts: 0,
      createdAt: Date.now(),
    };

    this.jobs.push(queuedJob);
    this.stats.pushed++;

    // Sort by priority (higher first) and then by availableAt (earlier first)
    this.jobs.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.availableAt - b.availableAt; // Earlier first
    });

    this.logger?.debug("Job pushed to memory queue", {
      queue: this.name,
      jobId: queuedJob.id,
      jobClass: job.constructor.name,
      delay,
      priority,
    });

    return queuedJob.id;
  }

  /**
   * Pop the next available job from the queue
   */
  async pop() {
    const now = Date.now();

    // Find first available job
    const index = this.jobs.findIndex((job) => job.availableAt <= now);

    if (index === -1) {
      return null;
    }

    const queuedJob = this.jobs.splice(index, 1)[0];

    this.logger?.debug("Job popped from memory queue", {
      queue: this.name,
      jobId: queuedJob.id,
      jobClass: queuedJob.job.class,
    });

    return queuedJob;
  }

  /**
   * Mark a job as failed and potentially retry
   */
  async fail(queuedJob, error) {
    queuedJob.attempts++;
    queuedJob.lastError = error.message;

    if (queuedJob.attempts < queuedJob.job.maxRetries) {
      // Retry with exponential backoff
      const delay =
        queuedJob.job.retryDelay * Math.pow(2, queuedJob.attempts - 1);
      queuedJob.availableAt = Date.now() + delay * 1000;

      this.jobs.push(queuedJob);
      this.jobs.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.availableAt - b.availableAt;
      });

      this.logger?.warn("Job failed, retrying", {
        queue: this.name,
        jobId: queuedJob.id,
        attempts: queuedJob.attempts,
        maxRetries: queuedJob.job.maxRetries,
        retryIn: delay,
        error: error.message,
      });

      return { retrying: true, delay };
    } else {
      this.stats.failed++;

      this.logger?.error("Job failed permanently", {
        queue: this.name,
        jobId: queuedJob.id,
        attempts: queuedJob.attempts,
        error: error.message,
      });

      return { retrying: false };
    }
  }

  /**
   * Mark a job as successfully processed
   */
  async complete(queuedJob) {
    this.stats.processed++;

    this.logger?.debug("Job completed", {
      queue: this.name,
      jobId: queuedJob.id,
      jobClass: queuedJob.job.class,
    });
  }

  /**
   * Get queue size
   */
  async size() {
    return this.jobs.length;
  }

  /**
   * Clear the queue
   */
  async clear() {
    const count = this.jobs.length;
    this.jobs = [];
    this.logger?.info("Queue cleared", { queue: this.name, count });
    return count;
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    const now = Date.now();
    const available = this.jobs.filter((job) => job.availableAt <= now).length;
    const delayed = this.jobs.filter((job) => job.availableAt > now).length;

    return {
      name: this.name,
      size: this.jobs.length,
      available,
      delayed,
      ...this.stats,
    };
  }
}
