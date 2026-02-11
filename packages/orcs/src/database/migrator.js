/**
 * Migration runner
 * Manages running and rolling back database migrations
 */

import { getConnection, transaction } from "./connection.js";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

export class Migrator {
  constructor(migrationsPath = "database/migrations") {
    this.migrationsPath = resolve(process.cwd(), migrationsPath);
  }

  /**
   * Ensure migrations table exists
   */
  async ensureMigrationsTable() {
    const db = getConnection();

    // Create migrations table if it doesn't exist
    await db.unsafe(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        batch INTEGER NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get list of migration files
   */
  getMigrationFiles() {
    try {
      const files = readdirSync(this.migrationsPath);
      return files
        .filter((f) => f.endsWith(".js"))
        .sort()
        .map((f) => ({
          name: f.replace(".js", ""),
          path: resolve(this.migrationsPath, f),
        }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get executed migrations from database
   */
  async getExecutedMigrations() {
    const db = getConnection();
    const result = await db.unsafe(`
      SELECT name, batch, executed_at
      FROM migrations
      ORDER BY id ASC
    `);
    return result;
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations() {
    await this.ensureMigrationsTable();

    const allMigrations = this.getMigrationFiles();
    const executed = await this.getExecutedMigrations();
    const executedNames = new Set(executed.map((m) => m.name));

    return allMigrations.filter((m) => !executedNames.has(m.name));
  }

  /**
   * Run pending migrations
   */
  async migrate() {
    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      console.log("No pending migrations");
      return { migrated: [], batch: 0 };
    }

    // Get next batch number
    const db = getConnection();
    const batchResult = await db.unsafe(`
      SELECT COALESCE(MAX(batch), 0) + 1 as next_batch FROM migrations
    `);
    const batch = batchResult[0].next_batch;

    const migrated = [];

    for (const migration of pending) {
      try {
        console.log(`⏳ Migrating: ${migration.name}`);

        // Import migration
        const { default: MigrationClass } = await import(migration.path);
        const instance = new MigrationClass();

        // Run migration in a transaction
        await transaction(async (tx) => {
          await instance.up(tx);

          // Record migration
          await tx.unsafe(
            `INSERT INTO migrations (name, batch) VALUES ($1, $2)`,
            [migration.name, batch],
          );
        });

        migrated.push(migration.name);
        console.log(`Migrated:  ${migration.name}`);
      } catch (error) {
        console.error(`\nMigration failed: ${migration.name}`);
        console.error(error.message);
        throw error;
      }
    }

    return { migrated, batch };
  }

  /**
   * Rollback last batch of migrations
   */
  async rollback(steps = 1) {
    await this.ensureMigrationsTable();

    const db = getConnection();

    // Get migrations to rollback
    const result = await db.unsafe(
      `
      SELECT name, batch
      FROM migrations
      WHERE batch IN (
        SELECT DISTINCT batch
        FROM migrations
        ORDER BY batch DESC
        LIMIT $1
      )
      ORDER BY id DESC
    `,
      [steps],
    );

    if (result.length === 0) {
      console.log("No migrations to rollback");
      return { rolledBack: [] };
    }

    const rolledBack = [];

    for (const migration of result) {
      try {
        console.log(`⏳ Rolling back: ${migration.name}`);

        // Find migration file
        const migrationFiles = this.getMigrationFiles();
        const migrationFile = migrationFiles.find(
          (m) => m.name === migration.name,
        );

        if (!migrationFile) {
          throw new Error(`Migration file not found: ${migration.name}`);
        }

        // Import migration
        const { default: MigrationClass } = await import(migrationFile.path);
        const instance = new MigrationClass();

        // Run rollback in a transaction
        await transaction(async (tx) => {
          await instance.down(tx);

          // Remove migration record
          await tx.unsafe(`DELETE FROM migrations WHERE name = $1`, [
            migration.name,
          ]);
        });

        rolledBack.push(migration.name);
        console.log(`Rolled back: ${migration.name}`);
      } catch (error) {
        console.error(`\nRollback failed: ${migration.name}`);
        console.error(error.message);
        throw error;
      }
    }

    return { rolledBack };
  }

  /**
   * Reset database (rollback all migrations)
   */
  async reset() {
    const executed = await this.getExecutedMigrations();
    if (executed.length === 0) {
      console.log("No migrations to reset");
      return { rolledBack: [] };
    }

    const batches = Math.max(...executed.map((m) => m.batch));
    return await this.rollback(batches);
  }

  /**
   * Get migration status
   */
  async status() {
    await this.ensureMigrationsTable();

    const all = this.getMigrationFiles();
    const executed = await this.getExecutedMigrations();
    const executedMap = new Map(executed.map((m) => [m.name, m]));

    return all.map((migration) => {
      const exec = executedMap.get(migration.name);
      return {
        name: migration.name,
        executed: !!exec,
        batch: exec?.batch || null,
        executed_at: exec?.executed_at || null,
      };
    });
  }
}
