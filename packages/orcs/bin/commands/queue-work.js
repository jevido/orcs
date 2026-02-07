/**
 * Start queue worker to process background jobs
 */

// Import from user's project directory, not framework
const { boot } = await import(process.cwd() + "/bootstrap/app.js");
import { Worker } from "../../src/queue/worker.js";

export default async function (args = []) {
  console.log("Starting queue worker...\n");

  // Parse options
  const options = parseArgs(args);

  // Boot the application
  const { app } = await boot();

  // Get queue manager from app
  if (!app.queueManager) {
    console.error("Error: Queue manager not initialized");
    process.exit(1);
  }

  // Create worker
  const worker = new Worker(app.queueManager, {
    queues:
      options.queues || app.config.get("queue.worker.queues", ["default"]),
    sleep: options.sleep || app.config.get("queue.worker.sleep", 3),
    maxJobs: options.maxJobs || app.config.get("queue.worker.maxJobs"),
    logger: app.logger,
    jobRegistry: app.jobRegistry || new Map(),
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nShutting down worker...");
    worker.stop();
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down worker...");
    worker.stop();
  });

  // Start worker
  await worker.start();
}

function parseArgs(args) {
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--queue" || arg === "-q") {
      options.queues = args[++i].split(",");
    } else if (arg === "--sleep" || arg === "-s") {
      options.sleep = parseInt(args[++i]);
    } else if (arg === "--max-jobs" || arg === "-m") {
      options.maxJobs = parseInt(args[++i]);
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Usage: orcs queue:work [options]

Start a worker to process background jobs from the queue.

Options:
  -q, --queue <names>   Queues to process (comma-separated)
  -s, --sleep <seconds> Seconds to wait between polls (default: 3)
  -m, --max-jobs <num>  Maximum jobs to process before stopping
  -h, --help            Show this help message

Examples:
  orcs queue:work
  orcs queue:work --queue default,high,low
  orcs queue:work --sleep 5 --max-jobs 100
`);
}
