/**
 * db:rollback command - rolls back the last batch of migrations
 */

import { Migrator } from "../../src/database/migrator.js";
import { closeConnection } from "../../src/database/connection.js";

export default async function dbRollback(args) {
  const steps = args[0] ? parseInt(args[0]) : 1;

  console.log(`\n🔄 Rolling back last ${steps} batch(es)...\n`);

  try {
    const migrator = new Migrator();
    const { rolledBack } = await migrator.rollback(steps);

    if (rolledBack.length === 0) {
      console.log("");
    } else {
      console.log(`\n✅ Rolled back ${rolledBack.length} migration(s)\n`);
    }

    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error(`\n${error.stack}\n`);
    await closeConnection();
    process.exit(1);
  }
}
