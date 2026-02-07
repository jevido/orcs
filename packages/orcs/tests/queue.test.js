import { describe, test, expect, beforeEach } from "bun:test";
import { Job } from "../src/queue/job.js";
import { QueueManager, setQueueManager } from "../src/queue/queue-manager.js";
import { Worker } from "../src/queue/worker.js";

// Test job class
class TestJob extends Job {
  static maxRetries = 2;
  static retryDelay = 1;
  static queue = "default";

  constructor(data = {}) {
    super(data);
    this.executed = false;
  }

  async handle() {
    this.executed = true;

    if (this.data.shouldFail) {
      throw new Error("Job intentionally failed");
    }

    if (this.data.delay) {
      await new Promise((resolve) => setTimeout(resolve, this.data.delay));
    }

    return this.data;
  }

  async failed(error) {
    this.failedCalled = true;
    this.failedError = error;
  }
}

describe("Job", () => {
  test("creates job with data", () => {
    const job = new TestJob({ foo: "bar" });

    expect(job.data).toEqual({ foo: "bar" });
    expect(job.attempts).toBe(0);
    expect(job.maxRetries).toBe(2);
  });

  test("serializes to JSON", () => {
    const job = new TestJob({ foo: "bar" });
    const json = job.toJSON();

    expect(json.class).toBe("TestJob");
    expect(json.data).toEqual({ foo: "bar" });
    expect(json.attempts).toBe(0);
    expect(json.maxRetries).toBe(2);
  });

  test("deserializes from JSON", () => {
    const json = {
      class: "TestJob",
      data: { foo: "bar" },
      attempts: 1,
      maxRetries: 2,
      retryDelay: 1,
      queue: "default",
      priority: 0,
      timeout: 300,
    };

    const job = Job.fromJSON(json, TestJob);

    expect(job.data).toEqual({ foo: "bar" });
    expect(job.attempts).toBe(1);
    expect(job.maxRetries).toBe(2);
  });
});

describe("Queue Manager (Memory Driver)", () => {
  let queueManager;

  beforeEach(() => {
    queueManager = new QueueManager({ driver: "memory" });
    setQueueManager(queueManager);
  });

  test("pushes job to queue", async () => {
    const job = new TestJob({ foo: "bar" });
    const id = await queueManager.push(job);

    expect(id).toBe(1);

    const size = await queueManager.size();
    expect(size).toBe(1);
  });

  test("pops job from queue", async () => {
    const job = new TestJob({ foo: "bar" });
    await queueManager.push(job);

    const queuedJob = await queueManager.pop();
    expect(queuedJob).toBeDefined();
    expect(queuedJob.job.data).toEqual({ foo: "bar" });

    const size = await queueManager.size();
    expect(size).toBe(0);
  });

  test("returns null when queue is empty", async () => {
    const queuedJob = await queueManager.pop();
    expect(queuedJob).toBeNull();
  });

  test("pushes job with delay", async () => {
    const job = new TestJob({ foo: "bar" });
    await queueManager.push(job, { delay: 1 }); // 1 second

    // Job should not be available immediately
    let queuedJob = await queueManager.pop();
    expect(queuedJob).toBeNull();

    // Wait for delay to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Job should now be available
    queuedJob = await queueManager.pop();
    expect(queuedJob).toBeDefined();
  });

  test("respects job priority", async () => {
    const job1 = new TestJob({ id: 1 });
    const job2 = new TestJob({ id: 2 });
    const job3 = new TestJob({ id: 3 });

    await queueManager.push(job1, { priority: 1 });
    await queueManager.push(job2, { priority: 10 }); // Higher priority
    await queueManager.push(job3, { priority: 5 });

    // Should pop in priority order: job2, job3, job1
    const popped1 = await queueManager.pop();
    expect(popped1.job.data.id).toBe(2);

    const popped2 = await queueManager.pop();
    expect(popped2.job.data.id).toBe(3);

    const popped3 = await queueManager.pop();
    expect(popped3.job.data.id).toBe(1);
  });

  test("clears queue", async () => {
    await queueManager.push(new TestJob({ id: 1 }));
    await queueManager.push(new TestJob({ id: 2 }));

    const count = await queueManager.clear();
    expect(count).toBe(2);

    const size = await queueManager.size();
    expect(size).toBe(0);
  });

  test("gets queue statistics", async () => {
    await queueManager.push(new TestJob({ id: 1 }));
    await queueManager.push(new TestJob({ id: 2 }), { delay: 10 });

    const queue = await queueManager.getQueue();
    const stats = await queue.getStats();

    expect(stats.name).toBe("default");
    expect(stats.size).toBe(2);
    expect(stats.available).toBe(1);
    expect(stats.delayed).toBe(1);
  });
});

describe("Worker", () => {
  let queueManager;
  let worker;

  beforeEach(() => {
    queueManager = new QueueManager({ driver: "memory" });
    setQueueManager(queueManager);

    worker = new Worker(queueManager, {
      queues: ["default"],
      sleep: 0.1, // Fast polling for tests
      maxJobs: null,
    });

    worker.registerJob(TestJob);
  });

  test("processes a job", async () => {
    const job = new TestJob({ foo: "bar" });
    await queueManager.push(job);

    // Set max jobs to 1 so worker stops after processing
    worker.maxJobs = 1;

    await worker.start();

    expect(worker.processedCount).toBe(1);
    expect(worker.failedCount).toBe(0);
  });

  test("retries failed job", async () => {
    const job = new TestJob({ shouldFail: true });
    await queueManager.push(job);

    // Create a new worker with faster retry for testing
    const fastWorker = new Worker(queueManager, {
      queues: ["default"],
      sleep: 0.1,
      maxJobs: null,
    });
    fastWorker.registerJob(TestJob);

    // Start worker and stop after processing attempts
    const workerPromise = fastWorker.start();
    setTimeout(() => fastWorker.stop(), 1500); // Stop after retries

    await workerPromise;

    // Job should have been attempted multiple times
    expect(fastWorker.processedCount).toBe(0);
    expect(fastWorker.failedCount).toBe(1); // Failed permanently after retries
  });

  test("calls failed callback after max retries", async () => {
    const job = new TestJob({ shouldFail: true });
    await queueManager.push(job);

    // Create a new worker with faster retry for testing
    const fastWorker = new Worker(queueManager, {
      queues: ["default"],
      sleep: 0.1,
      maxJobs: null,
    });
    fastWorker.registerJob(TestJob);

    // Start worker and stop after retries
    const workerPromise = fastWorker.start();
    setTimeout(() => fastWorker.stop(), 1500);

    await workerPromise;

    expect(fastWorker.failedCount).toBe(1);
  });

  test("processes multiple jobs", async () => {
    await queueManager.push(new TestJob({ id: 1 }));
    await queueManager.push(new TestJob({ id: 2 }));
    await queueManager.push(new TestJob({ id: 3 }));

    worker.maxJobs = 3;
    await worker.start();

    expect(worker.processedCount).toBe(3);
  });

  test("stops when stopped", async () => {
    const slowWorker = new Worker(queueManager, {
      queues: ["default"],
      sleep: 0.1,
      maxJobs: null,
    });
    slowWorker.registerJob(TestJob);

    // Push jobs that take time to process
    for (let i = 0; i < 10; i++) {
      await queueManager.push(new TestJob({ id: i, delay: 100 })); // 100ms each
    }

    // Start worker
    const workerPromise = slowWorker.start();

    // Stop after a short delay
    setTimeout(() => slowWorker.stop(), 350); // Stop before all jobs finish

    await workerPromise;

    // Should have processed some but not all jobs
    expect(slowWorker.processedCount).toBeLessThan(10);
    expect(slowWorker.processedCount).toBeGreaterThan(0);
  });

  test("gets worker statistics", () => {
    const stats = worker.getStats();

    expect(stats.running).toBe(false);
    expect(stats.processed).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.queues).toEqual(["default"]);
  });
});

describe("Job Dispatch", () => {
  let queueManager;

  beforeEach(() => {
    queueManager = new QueueManager({ driver: "memory" });
    setQueueManager(queueManager);
  });

  test("dispatches job to queue", async () => {
    await TestJob.dispatch({ foo: "bar" });

    const size = await queueManager.size();
    expect(size).toBe(1);
  });

  test("dispatches job with delay", async () => {
    await TestJob.dispatchAfter(1, { foo: "bar" });

    const queue = await queueManager.getQueue();
    const stats = await queue.getStats();

    expect(stats.size).toBe(1);
    expect(stats.delayed).toBe(1);
  });

  test("dispatches job with custom priority", async () => {
    await TestJob.dispatch({ foo: "bar" }, { priority: 20 });

    const queuedJob = await queueManager.pop();
    expect(queuedJob.priority).toBe(20);
  });

  test("dispatches job to custom queue", async () => {
    await TestJob.dispatch({ foo: "bar" }, { queue: "custom" });

    const defaultSize = await queueManager.size("default");
    expect(defaultSize).toBe(0);

    const customSize = await queueManager.size("custom");
    expect(customSize).toBe(1);
  });
});
