/**
 * Base Migration class
 * All migrations should extend this class
 */

export class Migration {
  /**
   * Run the migration
   */
  async up(db) {
    throw new Error("Migration.up() must be implemented");
  }

  /**
   * Reverse the migration
   */
  async down(db) {
    throw new Error("Migration.down() must be implemented");
  }
}
