#!/usr/bin/env bun

/**
 * ORCS CLI - Command-line interface for ORCS framework
 */

import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const commands = {
  serve: () => import("./commands/serve.js"),
  dev: () => import("./commands/dev.js"),
  routes: () => import("./commands/routes.js"),
  test: () => import("./commands/test.js"),
  "make:controller": () => import("./commands/make-controller.js"),
  "make:middleware": () => import("./commands/make-middleware.js"),
  "make:provider": () => import("./commands/make-provider.js"),
  "make:migration": () => import("./commands/make-migration.js"),
  "db:migrate": () => import("./commands/db-migrate.js"),
  "db:rollback": () => import("./commands/db-rollback.js"),
  "db:reset": () => import("./commands/db-reset.js"),
  "db:status": () => import("./commands/db-status.js"),
  "queue:work": () => import("./commands/queue-work.js"),
  "queue:stats": () => import("./commands/queue-stats.js"),
  "queue:clear": () => import("./commands/queue-clear.js"),
};

async function main() {
  const args = process.argv.slice(2);

  if (
    args.length === 0 ||
    args[0] === "help" ||
    args[0] === "--help" ||
    args[0] === "-h"
  ) {
    showHelp();
    process.exit(0);
  }

  const [commandName, ...commandArgs] = args;

  // Check if command exists
  if (!commands[commandName]) {
    console.error(`\n❌ Unknown command: ${commandName}\n`);
    showHelp();
    process.exit(1);
  }

  try {
    // Dynamically import and execute the command
    const { default: command } = await commands[commandName]();
    await command(commandArgs);
  } catch (error) {
    console.error(`\n❌ Error executing command: ${error.message}\n`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                          ORCS CLI                            ║
║           Opinionated Runtime for Contractual Services       ║
╚══════════════════════════════════════════════════════════════╝

Usage: bun orcs <command> [options]

Commands:
  serve                 Start the HTTP server
  dev                   Start the dev server (hot reload)
  routes                Display all registered routes
  test                  Run the test suite
  make:controller       Generate a new controller
  make:middleware       Generate a new middleware
  make:provider         Generate a new service provider
  make:migration        Generate a new migration
  db:migrate            Run pending migrations
  db:rollback           Rollback last batch of migrations
  db:reset              Reset all migrations
  db:status             Show migration status
  queue:work            Start queue worker to process jobs
  queue:stats           Show queue statistics
  queue:clear           Clear all jobs from a queue

Options:
  -h, --help           Show this help message

Examples:
  bun orcs serve
  bun orcs dev
  bun orcs routes
  bun orcs test
  bun orcs make:controller UserController
  bun orcs make:middleware auth
  bun orcs make:provider CacheServiceProvider
  bun orcs make:migration create_users_table
  bun orcs db:migrate
  bun orcs db:rollback
  bun orcs db:status

For more information, visit: https://github.com/yourusername/orcs
`);
}

main();
