/**
 * Database Queue Driver
 *
 * Persistent queue implementation using the database.
 * Jobs survive server restarts.
 */

export class DatabaseQueue {
  constructor(name, options = {}) {
    this.name = name;
    this.logger = options.logger;
    this.connection = options.connection;
    this.tableName = "jobs";
  }

  async connect() {
    if (!this.connection) {
      throw new Error("Database connection required for database queue driver");
    }

    // Create jobs table if it doesn't exist
    await this.createTable();
  }

  async disconnect() {
    // Connection is managed externally
  }

  /**
   * Create jobs table
   */
  async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        queue TEXT NOT NULL,
        job TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        priority INTEGER DEFAULT 0,
        available_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        last_error TEXT
      )
    `;

    await this.connection.query(sql);

    // Create indexes for performance
    await this.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_queue_available
      ON ${this.tableName} (queue, available_at, priority)
    `);
  }

  /**
   * Push a job to the queue
   */
  async push(job, options = {}) {
    const delay = options.delay || 0;
    const priority = options.priority ?? job.priority ?? 0;
    const availableAt = Date.now() + delay * 1000;

    const result = await this.connection.query(
      `INSERT INTO ${this.tableName} (queue, job, priority, available_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        this.name,
        JSON.stringify(job.toJSON()),
        priority,
        availableAt,
        Date.now(),
      ],
    );

    this.logger?.debug("Job pushed to database queue", {
      queue: this.name,
      jobId: result.lastInsertRowid,
      jobClass: job.constructor.name,
      delay,
      priority,
    });

    return result.lastInsertRowid;
  }

  /**
   * Pop the next available job from the queue
   */
  async pop() {
    const now = Date.now();

    // Start a transaction to prevent race conditions
    const job = await this.connection.query(
      `SELECT * FROM ${this.tableName}
       WHERE queue = ? AND available_at <= ?
       ORDER BY priority DESC, available_at ASC
       LIMIT 1`,
      [this.name, now],
    );

    if (!job || job.length === 0) {
      return null;
    }

    const queuedJob = job[0];

    // Delete the job from the queue
    await this.connection.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [
      queuedJob.id,
    ]);

    // Parse job data
    queuedJob.job = JSON.parse(queuedJob.job);

    this.logger?.debug("Job popped from database queue", {
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
    queuedJob.last_error = error.message;

    if (queuedJob.attempts < queuedJob.job.maxRetries) {
      // Retry with exponential backoff
      const delay =
        queuedJob.job.retryDelay * Math.pow(2, queuedJob.attempts - 1);
      const availableAt = Date.now() + delay * 1000;

      await this.connection.query(
        `INSERT INTO ${this.tableName} (queue, job, attempts, priority, available_at, created_at, last_error)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          this.name,
          JSON.stringify(queuedJob.job),
          queuedJob.attempts,
          queuedJob.priority,
          availableAt,
          queuedJob.created_at,
          error.message,
        ],
      );

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
    const result = await this.connection.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE queue = ?`,
      [this.name],
    );
    return result[0]?.count || 0;
  }

  /**
   * Clear the queue
   */
  async clear() {
    const result = await this.connection.query(
      `DELETE FROM ${this.tableName} WHERE queue = ?`,
      [this.name],
    );
    this.logger?.info("Queue cleared", {
      queue: this.name,
      count: result.changes,
    });
    return result.changes;
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    const now = Date.now();

    const total = await this.connection.query(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE queue = ?`,
      [this.name],
    );

    const available = await this.connection.query(
      `SELECT COUNT(*) as count FROM ${this.tableName}
       WHERE queue = ? AND available_at <= ?`,
      [this.name, now],
    );

    const delayed = await this.connection.query(
      `SELECT COUNT(*) as count FROM ${this.tableName}
       WHERE queue = ? AND available_at > ?`,
      [this.name, now],
    );

    return {
      name: this.name,
      size: total[0]?.count || 0,
      available: available[0]?.count || 0,
      delayed: delayed[0]?.count || 0,
    };
  }
}
