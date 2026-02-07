/**
 * db:migrate command - runs pending migrations
 */

import { Migrator } from "../../src/database/migrator.js";
import { closeConnection } from "../../src/database/connection.js";

export default async function dbMigrate(args) {
  console.log("\n🔄 Running migrations...\n");

  try {
    const migrator = new Migrator();
    const { migrated, batch } = await migrator.migrate();

    if (migrated.length === 0) {
      console.log("");
    } else {
      console.log(
        `\n✅ Migrated ${migrated.length} migration(s) in batch ${batch}\n`,
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
