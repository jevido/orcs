/**
 * Database Configuration
 *
 * Configure database connection settings.
 * Uses Bun's native SQL support (PostgreSQL, MySQL, SQLite)
 */

export default {
  /*
  |--------------------------------------------------------------------------
  | Default Database Connection
  |--------------------------------------------------------------------------
  |
  | Connection string for your database.
  | Bun automatically detects the adapter based on the URL format:
  | - postgres:// or postgresql:// → PostgreSQL
  | - mysql:// or mysql2:// → MySQL
  | - sqlite:// or file:// or :memory: → SQLite
  |
  | Falls back to DATABASE_URL environment variable if not specified.
  |
  */

  connection: Bun.env.DATABASE_URL || "postgres://localhost:5432/orcs",

  /*
  |--------------------------------------------------------------------------
  | Connection Pool Settings
  |--------------------------------------------------------------------------
  |
  | Configure connection pooling for PostgreSQL and MySQL.
  | SQLite doesn't use connection pooling.
  |
  */

  pool: {
    max: parseInt(Bun.env.DB_POOL_MAX || "20"), // Maximum connections
    idleTimeout: parseInt(Bun.env.DB_IDLE_TIMEOUT || "30"), // Seconds
    maxLifetime: parseInt(Bun.env.DB_MAX_LIFETIME || "0"), // Seconds (0 = forever)
    connectionTimeout: parseInt(Bun.env.DB_CONNECTION_TIMEOUT || "30"), // Seconds
  },

  /*
  |--------------------------------------------------------------------------
  | Migrations Path
  |--------------------------------------------------------------------------
  |
  | Path to your migration files relative to project root
  |
  */

  migrations: "database/migrations",

  /*
  |--------------------------------------------------------------------------
  | Seeds Path
  |--------------------------------------------------------------------------
  |
  | Path to your seed files relative to project root
  |
  */

  seeds: "database/seeds",
};
