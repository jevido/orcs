/**
 * db:status command - shows migration status
 */

import { Migrator } from "../../src/database/migrator.js";
import { closeConnection } from "../../src/database/connection.js";
import { Application } from "../../src/core/application.js";

export default async function dbStatus(args) {
  try {
    const app = new Application({ basePath: process.cwd() });
    await app.loadConfig();
    const migrationsPath = app.config.get(
      "database.migrations",
      "database/migrations",
    );
    const migrator = new Migrator(migrationsPath);
    const status = await migrator.status();

    if (status.length === 0) {
      console.log("\n⚠️  No migrations found\n");
      await closeConnection();
      process.exit(0);
    }

    console.log(
      "\n╔══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                     Migration Status                        ║",
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝\n",
    );

    const executed = status.filter((m) => m.executed);
    const pending = status.filter((m) => !m.executed);

    if (executed.length > 0) {
      console.log("✅ Executed:\n");
      for (const migration of executed) {
        const date = migration.executed_at
          ? new Date(migration.executed_at).toLocaleString()
          : "";
        console.log(`  [Batch ${migration.batch}] ${migration.name}`);
        if (date) {
          console.log(`             ${date}`);
        }
      }
      console.log("");
    }

    if (pending.length > 0) {
      console.log("⏳ Pending:\n");
      for (const migration of pending) {
        console.log(`  ${migration.name}`);
      }
      console.log("");
    }

    console.log(
      `Total: ${status.length} | Executed: ${executed.length} | Pending: ${pending.length}\n`,
    );

    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    await closeConnection();
    process.exit(1);
  }
}
