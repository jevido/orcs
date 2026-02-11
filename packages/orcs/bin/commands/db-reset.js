/**
 * db:reset command - rolls back all migrations
 */

import { Migrator } from "../../src/database/migrator.js";
import { closeConnection } from "../../src/database/connection.js";
import { Application } from "../../src/core/application.js";

export default async function dbReset(args) {
  console.log("\nResetting database (rolling back all migrations)...\n");

  try {
    const app = new Application({ basePath: process.cwd() });
    await app.loadConfig();
    const migrationsPath = app.config.get(
      "database.migrations",
      "database/migrations",
    );
    const migrator = new Migrator(migrationsPath);
    const { rolledBack } = await migrator.reset();

    if (rolledBack.length === 0) {
      console.log("");
    } else {
      console.log(
        `\nReset complete. Rolled back ${rolledBack.length} migration(s)\n`,
      );
    }

    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error(`\n${error.stack}\n`);
    await closeConnection();
    process.exit(1);
  }
}
