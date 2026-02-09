#!/usr/bin/env bun

/**
 * Test Command
 *
 * Runs the test suite using Bun's built-in test runner.
 */

export default async function (args = []) {
  console.log("Running tests...\n");

  // Run bun test with any additional arguments
  const proc = Bun.spawn(["bun", "test", ...args], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const exitCode = await proc.exited;
  process.exit(exitCode);
}
