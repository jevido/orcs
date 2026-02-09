/**
 * Database connection manager
 * Uses Bun's native SQL support (PostgreSQL, MySQL, SQLite)
 */

import { sql, SQL } from "bun";

let connection = null;

/**
 * Get or create database connection
 * Automatically detects adapter from DATABASE_URL or connection string
 */
export function getConnection(connectionString = null) {
  if (connection) {
    return connection;
  }

  // Use default sql if no connection string provided
  if (!connectionString) {
    connection = sql;
    return connection;
  }

  // Create new SQL instance with custom connection
  connection = new SQL(connectionString);
  return connection;
}

/**
 * Close the database connection
 */
export async function closeConnection() {
  if (connection && connection !== sql) {
    await connection.close();
    connection = null;
  }
}

/**
 * Get a reserved connection from the pool
 * Useful for transactions or when you need an isolated connection
 */
export async function getReservedConnection() {
  const db = getConnection();
  return await db.reserve();
}

/**
 * Start a transaction
 */
export async function transaction(callback) {
  const db = getConnection();
  return await db.begin(callback);
}
