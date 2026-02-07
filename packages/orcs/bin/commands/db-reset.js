/**
 * db:reset command - rolls back all migrations
 */

import { Migrator } from "../../src/database/migrator.js";
import { closeConnection } from "../../src/database/connection.js";

export default async function dbReset(args) {
  console.log("\n🔄 Resetting database (rolling back all migrations)...\n");

  try {
    const migrator = new Migrator();
    const { rolledBack } = await migrator.reset();

    if (rolledBack.length === 0) {
      console.log("");
    } else {
      console.log(
        `\n✅ Reset complete. Rolled back ${rolledBack.length} migration(s)\n`,
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
