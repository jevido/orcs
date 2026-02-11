/**
 * Serve command - starts the HTTP server (production)
 */

import { spawn } from "bun";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function serve(args) {
  const runner = resolve(__dirname, "_serve-worker.js");
  const hardwareThreads = navigator.hardwareConcurrency || 1;
  const requestedWorkers = Number.parseInt(
    process.env.ORCS_CLUSTER_WORKERS ?? "",
    10,
  );
  const workerCount =
    Number.isInteger(requestedWorkers) && requestedWorkers > 0
      ? requestedWorkers
      : hardwareThreads;

  console.log(
    `Starting ORCS server (cluster mode: ${workerCount} workers)...\n`,
  );

  const workers = new Array(workerCount);
  let shuttingDown = false;

  const spawnWorker = (index) => {
    const worker = spawn(["bun", runner], {
      cwd: process.cwd(),
      stdio: ["inherit", "inherit", "inherit"],
      env: {
        ...process.env,
        ORCS_CLUSTER_WORKER: "1",
        ORCS_CLUSTER_PRIMARY: index === 0 ? "1" : "0",
      },
    });

    worker.exited.then((code) => {
      if (shuttingDown) return;

      if (code !== 0) {
        console.error(`Worker ${index + 1} exited with code ${code}.`);
        shutdown(code);
        return;
      }
    });

    return worker;
  };

  for (let index = 0; index < workerCount; index++) {
    workers[index] = spawnWorker(index);
  }

  const shutdown = (exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;

    for (const worker of workers) {
      worker?.kill();
    }

    process.exit(exitCode);
  };

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));

  await Promise.all(workers.map((worker) => worker.exited));
}
