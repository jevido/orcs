/**
 * make:migration command - generates a new migration file
 */

import { writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

export default async function makeMigration(args) {
  if (args.length === 0) {
    console.error("\nMigration name is required");
    console.log("\nUsage: bun orcs make:migration <name>\n");
    console.log("Examples:");
    console.log("  bun orcs make:migration create_users_table");
    console.log("  bun orcs make:migration add_email_to_users\n");
    process.exit(1);
  }

  const name = args[0];
  const dir = resolve(process.cwd(), "database", "migrations");

  // Get today's date in Y-m-d format
  const today = new Date();
  const datePrefix = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // Find existing migrations for today and get the next increment
  const increment = getNextIncrement(dir, datePrefix);

  const fileName = `${datePrefix}_${increment}_${name}.js`;
  const filePath = resolve(dir, fileName);

  // Ensure directory exists
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Generate migration content
  const content = generateMigrationContent(name);

  // Write file
  try {
    writeFileSync(filePath, content, "utf-8");
    console.log(`\nMigration created: ${filePath}`);
    console.log(`\nRun the migration:`);
    console.log(`  bun orcs db:migrate\n`);
  } catch (error) {
    console.error(`\nFailed to create migration: ${error.message}\n`);
    process.exit(1);
  }
}

function generateMigrationContent(name) {
  const className = toPascalCase(name);

  return `import { Migration } from "../../src/database/migration.js";

/**
 * ${className} Migration
 */
export default class ${className} extends Migration {
  /**
   * Run the migration
   */
  async up(db) {
    // Example: Create a table
    await db.unsafe(\`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    \`);

    // Example: Create indexes
    await db.unsafe(\`
      CREATE INDEX idx_users_email ON users(email)
    \`);
  }

  /**
   * Reverse the migration
   */
  async down(db) {
    // Drop the table
    await db.unsafe(\`DROP TABLE IF EXISTS users\`);
  }
}
`;
}

function toPascalCase(str) {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function getNextIncrement(dir, datePrefix) {
  // Ensure directory exists
  if (!existsSync(dir)) {
    return 1;
  }

  try {
    const files = readdirSync(dir);

    // Find all migrations for today
    const todayMigrations = files
      .filter(f => f.startsWith(datePrefix) && f.endsWith('.js'))
      .map(f => {
        // Extract increment from filename: YYYY-MM-DD_INCREMENT_name.js
        const match = f.match(/^\d{4}-\d{2}-\d{2}_(\d+)_/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => !isNaN(n));

    if (todayMigrations.length === 0) {
      return 1;
    }

    // Return the next increment
    return Math.max(...todayMigrations) + 1;
  } catch (error) {
    return 1;
  }
}
