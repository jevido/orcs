/**
 * Simple query builder for Bun SQL
 * Provides a fluent interface for building SQL queries
 */

import { getConnection } from "./connection.js";

export class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.whereClauses = [];
    this.selectColumns = ["*"];
    this.orderByClause = null;
    this.limitValue = null;
    this.offsetValue = null;
    this.joins = [];
  }

  /**
   * Specify columns to select
   */
  select(...columns) {
    this.selectColumns = columns.length > 0 ? columns : ["*"];
    return this;
  }

  /**
   * Add a WHERE clause
   */
  where(column, operator, value) {
    // Support where(column, value) syntax
    if (arguments.length === 2) {
      value = operator;
      operator = "=";
    }

    this.whereClauses.push({ column, operator, value });
    return this;
  }

  /**
   * Add an OR WHERE clause
   */
  orWhere(column, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = "=";
    }

    this.whereClauses.push({ column, operator, value, or: true });
    return this;
  }

  /**
   * WHERE IN clause
   */
  whereIn(column, values) {
    this.whereClauses.push({ column, operator: "IN", values });
    return this;
  }

  /**
   * WHERE NOT IN clause
   */
  whereNotIn(column, values) {
    this.whereClauses.push({ column, operator: "NOT IN", values });
    return this;
  }

  /**
   * WHERE NULL clause
   */
  whereNull(column) {
    this.whereClauses.push({ column, operator: "IS NULL" });
    return this;
  }

  /**
   * WHERE NOT NULL clause
   */
  whereNotNull(column) {
    this.whereClauses.push({ column, operator: "IS NOT NULL" });
    return this;
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(column, direction = "ASC") {
    this.orderByClause = { column, direction: direction.toUpperCase() };
    return this;
  }

  /**
   * Add LIMIT clause
   */
  limit(value) {
    this.limitValue = value;
    return this;
  }

  /**
   * Add OFFSET clause
   */
  offset(value) {
    this.offsetValue = value;
    return this;
  }

  /**
   * Add JOIN clause
   */
  join(table, first, operator, second) {
    this.joins.push({ type: "INNER", table, first, operator, second });
    return this;
  }

  /**
   * Add LEFT JOIN clause
   */
  leftJoin(table, first, operator, second) {
    this.joins.push({ type: "LEFT", table, first, operator, second });
    return this;
  }

  /**
   * Build and execute the SELECT query
   */
  async get() {
    const db = getConnection();
    const { query, params } = this.buildSelect();

    // Use Bun's SQL tagged template
    return await db.unsafe(query, params);
  }

  /**
   * Get the first result
   */
  async first() {
    this.limit(1);
    const results = await this.get();
    return results[0] || null;
  }

  /**
   * Get a single column value
   */
  async value(column) {
    this.select(column);
    const result = await this.first();
    return result ? result[column] : null;
  }

  /**
   * Get count of results
   */
  async count() {
    const db = getConnection();
    const { query, params } = this.buildCount();
    const results = await db.unsafe(query, params);
    return results[0]?.count || 0;
  }

  /**
   * Insert a record
   */
  async insert(data) {
    const db = getConnection();
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const query = `INSERT INTO ${this.table} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;

    const results = await db.unsafe(query, values);
    return results[0];
  }

  /**
   * Update records
   */
  async update(data) {
    const db = getConnection();
    const entries = Object.entries(data);
    const setClauses = entries
      .map(([key], i) => `${key} = $${i + 1}`)
      .join(", ");
    const values = entries.map(([_, value]) => value);

    const { whereClause, whereParams } = this.buildWhere(values.length);
    const allParams = [...values, ...whereParams];

    const query = `UPDATE ${this.table} SET ${setClauses}${whereClause} RETURNING *`;

    return await db.unsafe(query, allParams);
  }

  /**
   * Delete records
   */
  async delete() {
    const db = getConnection();
    const { whereClause, whereParams } = this.buildWhere(0);

    const query = `DELETE FROM ${this.table}${whereClause}`;

    const result = await db.unsafe(query, whereParams);
    return result;
  }

  /**
   * Build SELECT query
   */
  buildSelect() {
    let query = `SELECT ${this.selectColumns.join(", ")} FROM ${this.table}`;
    let paramIndex = 0;
    const params = [];

    // Add JOINs
    for (const join of this.joins) {
      query += ` ${join.type} JOIN ${join.table} ON ${join.first} ${join.operator} ${join.second}`;
    }

    // Add WHERE
    const { whereClause, whereParams } = this.buildWhere(paramIndex);
    query += whereClause;
    params.push(...whereParams);

    // Add ORDER BY
    if (this.orderByClause) {
      query += ` ORDER BY ${this.orderByClause.column} ${this.orderByClause.direction}`;
    }

    // Add LIMIT
    if (this.limitValue !== null) {
      query += ` LIMIT ${this.limitValue}`;
    }

    // Add OFFSET
    if (this.offsetValue !== null) {
      query += ` OFFSET ${this.offsetValue}`;
    }

    return { query, params };
  }

  /**
   * Build COUNT query
   */
  buildCount() {
    let query = `SELECT COUNT(*) as count FROM ${this.table}`;
    const { whereClause, whereParams } = this.buildWhere(0);
    query += whereClause;

    return { query, params: whereParams };
  }

  /**
   * Build WHERE clause
   */
  buildWhere(startIndex = 0) {
    if (this.whereClauses.length === 0) {
      return { whereClause: "", whereParams: [] };
    }

    const conditions = [];
    const params = [];
    let paramIndex = startIndex + 1;

    for (let i = 0; i < this.whereClauses.length; i++) {
      const clause = this.whereClauses[i];
      const prefix = i === 0 ? " WHERE " : clause.or ? " OR " : " AND ";

      if (clause.operator === "IN" || clause.operator === "NOT IN") {
        const placeholders = clause.values
          .map(() => `$${paramIndex++}`)
          .join(", ");
        conditions.push(
          `${prefix}${clause.column} ${clause.operator} (${placeholders})`,
        );
        params.push(...clause.values);
      } else if (
        clause.operator === "IS NULL" ||
        clause.operator === "IS NOT NULL"
      ) {
        conditions.push(`${prefix}${clause.column} ${clause.operator}`);
      } else {
        conditions.push(
          `${prefix}${clause.column} ${clause.operator} $${paramIndex++}`,
        );
        params.push(clause.value);
      }
    }

    return {
      whereClause: conditions.join(""),
      whereParams: params,
    };
  }
}

/**
 * Create a new query builder for a table
 */
export function table(tableName) {
  return new QueryBuilder(tableName);
}

/**
 * Shorthand for creating a query builder
 */
export function DB(tableName) {
  return new QueryBuilder(tableName);
}
