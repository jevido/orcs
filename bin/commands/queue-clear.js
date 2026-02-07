/**
 * Clear all jobs from a queue
 */

import { boot } from "../../bootstrap/app.js";

export default async function (args = []) {
  const queueName = args[0] || "default";

  // Parse options
  const force = args.includes("--force") || args.includes("-f");

  if (!force) {
    console.log(`\nThis will clear all jobs from the "${queueName}" queue.`);
    console.log("Use --force to confirm.\n");
    process.exit(1);
  }

  // Boot the application
  const { app } = await boot();

  // Get queue manager from app
  if (!app.queueManager) {
    console.error("Error: Queue manager not initialized");
    process.exit(1);
  }

  try {
    const queue = await app.queueManager.getQueue(queueName);
    const count = await queue.clear();

    console.log(`\nCleared ${count} jobs from "${queueName}" queue.\n`);

    // Close connection and exit
    await app.queueManager.close();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
