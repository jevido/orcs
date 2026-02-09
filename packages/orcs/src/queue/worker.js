/**
 * Queue Worker
 *
 * Processes jobs from the queue in the background.
 */

import { getLogger } from "../logging/logger.js";
import { Job } from "./job.js";

export class Worker {
  constructor(queueManager, options = {}) {
    this.queueManager = queueManager;
    this.queues = options.queues || ["default"];
    this.sleep = options.sleep || 3; // seconds between polls
    this.maxJobs = options.maxJobs || null; // null = infinite
    this.logger = options.logger || getLogger();
    this.jobRegistry = options.jobRegistry || new Map();
    this.running = false;
    this.processedCount = 0;
    this.failedCount = 0;
  }

  /**
   * Register a job class
   */
  registerJob(jobClass) {
    this.jobRegistry.set(jobClass.name, jobClass);
  }

  /**
   * Start the worker
   */
  async start() {
    this.running = true;
    this.logger.info("Worker started", {
      queues: this.queues,
      sleep: this.sleep,
    });

    while (this.running) {
      await this.processNextJob();

      if (this.maxJobs && this.processedCount >= this.maxJobs) {
        this.logger.info("Max jobs reached, stopping worker", {
          processed: this.processedCount,
        });
        break;
      }
    }

    this.logger.info("Worker stopped", {
      processed: this.processedCount,
      failed: this.failedCount,
    });
  }

  /**
   * Stop the worker
   */
  stop() {
    this.running = false;
  }

  /**
   * Process the next job from the queue
   */
  async processNextJob() {
    let jobFound = false;

    // Try each queue in order
    for (const queueName of this.queues) {
      const queue = await this.queueManager.getQueue(queueName);
      const queuedJob = await queue.pop();

      if (queuedJob) {
        jobFound = true;
        await this.handleJob(queue, queuedJob);
        break;
      }
    }

    if (!jobFound) {
      // No jobs available, sleep
      await this.sleepAsync(this.sleep * 1000);
    }
  }

  /**
   * Handle a single job
   */
  async handleJob(queue, queuedJob) {
    const startTime = Date.now();

    try {
      // Deserialize job
      const jobClass = this.jobRegistry.get(queuedJob.job.class);
      if (!jobClass) {
        throw new Error(
          `Job class not registered: ${queuedJob.job.class}. Register it with worker.registerJob()`,
        );
      }

      const job = Job.fromJSON(queuedJob.job, jobClass);
      job.attempts = queuedJob.attempts || 0;

      this.logger.info("Processing job", {
        queue: queue.name,
        jobId: queuedJob.id,
        jobClass: job.constructor.name,
        attempt: job.attempts + 1,
        maxRetries: job.maxRetries,
      });

      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Job timeout")), job.timeout * 1000);
      });

      // Execute job with timeout
      await Promise.race([job.handle(), timeoutPromise]);

      // Mark as complete
      await queue.complete(queuedJob);

      const duration = Date.now() - startTime;
      this.processedCount++;

      this.logger.info("Job completed", {
        queue: queue.name,
        jobId: queuedJob.id,
        jobClass: job.constructor.name,
        duration: `${duration}ms`,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error("Job failed", {
        queue: queue.name,
        jobId: queuedJob.id,
        jobClass: queuedJob.job.class,
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`,
      });

      // Retry or fail permanently
      const result = await queue.fail(queuedJob, error);

      if (!result.retrying) {
        this.failedCount++;

        // Call failed callback if job class is available
        try {
          const jobClass = this.jobRegistry.get(queuedJob.job.class);
          if (jobClass) {
            const job = Job.fromJSON(queuedJob.job, jobClass);
            await job.failed(error);
          }
        } catch (failedError) {
          this.logger.error("Error in job failed callback", {
            error: failedError.message,
          });
        }
      }
    }
  }

  /**
   * Sleep for a given duration
   */
  sleepAsync(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      running: this.running,
      processed: this.processedCount,
      failed: this.failedCount,
      queues: this.queues,
    };
  }
}
