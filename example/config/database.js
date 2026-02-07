/**
 * Database Configuration
 *
 * Configure database connection settings.
 * Uses Bun's native SQL support (PostgreSQL, MySQL, SQLite)
 */

/**
 * Build a connection URL from individual DB_* environment variables.
 * Falls back to DATABASE_URL if set, or a default postgres URL.
 */
function buildConnectionUrl() {
  if (Bun.env.DATABASE_URL) {
    return Bun.env.DATABASE_URL;
  }

  const protocol = Bun.env.DB_CONNECTION || "postgres";
  const host = Bun.env.DB_HOST || "localhost";
  const port = Bun.env.DB_PORT || "5432";
  const database = Bun.env.DB_DATABASE || "orcs";
  const user = Bun.env.DB_USER || "";
  const password = Bun.env.DB_PASSWORD || "";

  const auth = user ? (password ? `${user}:${password}@` : `${user}@`) : "";

  return `${protocol}://${auth}${host}:${port}/${database}`;
}

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
  | Set DATABASE_URL for a full connection string, or use the individual
  | DB_* variables (DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USER,
  | DB_PASSWORD) to have the URL built automatically.
  |
  */

  connection: buildConnectionUrl(),

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
