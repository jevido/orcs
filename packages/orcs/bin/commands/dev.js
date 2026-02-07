/**
 * Dev command - starts the HTTP server with hot reloading
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function dev(args) {
  console.log("🚀 Starting ORCS dev server (hot reload)...\n");

  const runner = resolve(__dirname, "_serve-runner.js");

  const proc = Bun.spawn(["bun", "--hot", runner], {
    cwd: process.cwd(),
    stdio: ["inherit", "inherit", "inherit"],
    env: process.env,
  });

  process.on("SIGINT", () => {
    proc.kill();
    process.exit(0);
  });

  await proc.exited;
}
