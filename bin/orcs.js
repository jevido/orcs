#!/usr/bin/env bun

/**
 * ORCS CLI - Command-line interface for ORCS framework
 */

import { parseArgs } from "node:util";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const commands = {
  serve: () => import("./commands/serve.js"),
  routes: () => import("./commands/routes.js"),
  "make:controller": () => import("./commands/make-controller.js"),
  "make:middleware": () => import("./commands/make-middleware.js"),
  "make:provider": () => import("./commands/make-provider.js"),
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
  routes                Display all registered routes
  make:controller       Generate a new controller
  make:middleware       Generate a new middleware
  make:provider         Generate a new service provider

Options:
  -h, --help           Show this help message

Examples:
  bun orcs serve
  bun orcs routes
  bun orcs make:controller UserController
  bun orcs make:middleware auth
  bun orcs make:provider CacheServiceProvider

For more information, visit: https://github.com/yourusername/orcs
`);
}

main();
