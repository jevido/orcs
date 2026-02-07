/**
 * Queue Configuration
 *
 * Configure background job queue behavior for your application.
 */

export default {
  /*
  |--------------------------------------------------------------------------
  | Default Queue Driver
  |--------------------------------------------------------------------------
  |
  | The queue driver to use for background jobs.
  |
  | Supported: "memory", "database"
  |
  | - memory: Fast in-memory queue (lost on restart)
  | - database: Persistent queue using database (survives restarts)
  |
  */
  driver: Bun.env.QUEUE_DRIVER || "memory",

  /*
  |--------------------------------------------------------------------------
  | Default Queue Name
  |--------------------------------------------------------------------------
  |
  | The default queue name to use when dispatching jobs.
  |
  */
  default: Bun.env.QUEUE_DEFAULT || "default",

  /*
  |--------------------------------------------------------------------------
  | Worker Configuration
  |--------------------------------------------------------------------------
  |
  | Configuration for the queue worker process.
  |
  */
  worker: {
    // Queues to process (in order of priority)
    queues: (Bun.env.QUEUE_WORKER_QUEUES || "default")
      .split(",")
      .map((q) => q.trim()),

    // Seconds to wait between polls when queue is empty
    sleep: parseInt(Bun.env.QUEUE_WORKER_SLEEP) || 3,

    // Maximum number of jobs to process before stopping (null = infinite)
    maxJobs: Bun.env.QUEUE_WORKER_MAX_JOBS
      ? parseInt(Bun.env.QUEUE_WORKER_MAX_JOBS)
      : null,
  },
};
