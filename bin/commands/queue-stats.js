/**
 * Show queue statistics
 */

import { boot } from "../../bootstrap/app.js";

export default async function (args = []) {
  const queueName = args[0] || "default";

  // Boot the application
  const { app } = await boot();

  // Get queue manager from app
  if (!app.queueManager) {
    console.error("Error: Queue manager not initialized");
    process.exit(1);
  }

  try {
    const queue = await app.queueManager.getQueue(queueName);
    const stats = await queue.getStats();

    console.log(`\nQueue: ${stats.name}`);
    console.log(`Driver: ${app.config.get("queue.driver", "memory")}`);
    console.log("─".repeat(40));
    console.log(`Total jobs:     ${stats.size}`);
    console.log(`Available:      ${stats.available}`);
    console.log(`Delayed:        ${stats.delayed}`);

    if (stats.processed !== undefined) {
      console.log(`Processed:      ${stats.processed}`);
    }
    if (stats.failed !== undefined) {
      console.log(`Failed:         ${stats.failed}`);
    }
    if (stats.pushed !== undefined) {
      console.log(`Pushed:         ${stats.pushed}`);
    }

    console.log("");

    // Close connection and exit
    await app.queueManager.close();
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
