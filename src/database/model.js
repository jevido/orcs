/**
 * Model Base Class
 *
 * Active Record-style ORM for ORCS. Provides a clean API for working with
 * database records using classes that represent your tables.
 *
 * Features:
 * - Automatic table name inference from class name
 * - Query builder integration
 * - Timestamps (created_at, updated_at)
 * - Soft deletes (optional)
 * - Attribute casting
 * - Instance methods for persistence
 */

import { DB } from "./query-builder.js";

export class Model {
  /**
   * The table associated with the model
   * Override this in your model if it doesn't follow convention
   */
  static table = null;

  /**
   * The primary key for the model
   */
  static primaryKey = "id";

  /**
   * Indicates if the model should be timestamped
   */
  static timestamps = true;

  /**
   * The name of the "created at" column
   */
  static createdAtColumn = "created_at";

  /**
   * The name of the "updated at" column
   */
  static updatedAtColumn = "updated_at";

  /**
   * Indicates if the model uses soft deletes
   */
  static softDeletes = false;

  /**
   * The name of the "deleted at" column
   */
  static deletedAtColumn = "deleted_at";

  /**
   * The attributes that should be cast to native types
   * Example: { active: 'boolean', age: 'integer', metadata: 'json' }
   */
  static casts = {};

  /**
   * The attributes that should be hidden for serialization
   */
  static hidden = [];

  /**
   * Create a new model instance
   * @param {object} attributes - Initial attributes
   */
  constructor(attributes = {}) {
    this.attributes = {};
    this.original = {};
    this.exists = false;

    this.fill(attributes);

    // Set original to current attributes so we can track changes
    this.original = { ...this.attributes };
  }

  /**
   * Get the table name for the model
   */
  static getTable() {
    if (this.table) return this.table;

    // Convert class name to snake_case plural
    // User -> users, BlogPost -> blog_posts
    const className = this.name;
    const snakeCase = className
      .replace(/([A-Z])/g, (match, offset) =>
        offset > 0 ? `_${match.toLowerCase()}` : match.toLowerCase(),
      )
      .toLowerCase();

    return `${snakeCase}s`;
  }

  /**
   * Begin a query on the model
   * @returns {QueryBuilder}
   */
  static query() {
    let builder = DB(this.getTable());

    // Apply soft delete scope if enabled
    if (this.softDeletes) {
      builder = builder.whereNull(this.deletedAtColumn);
    }

    return builder;
  }

  /**
   * Get all records
   */
  static async all() {
    const records = await this.query().get();
    return records.map((record) => this.hydrate(record));
  }

  /**
   * Find a record by primary key
   */
  static async find(id) {
    const record = await this.query().where(this.primaryKey, id).first();
    return record ? this.hydrate(record) : null;
  }

  /**
   * Find a record by primary key or throw
   */
  static async findOrFail(id) {
    const record = await this.find(id);
    if (!record) {
      throw new Error(`${this.name} with ${this.primaryKey} ${id} not found`);
    }
    return record;
  }

  /**
   * Find records by column value
   */
  static async where(column, operator, value) {
    // Support where(column, value) shorthand
    if (value === undefined) {
      value = operator;
      operator = "=";
    }

    const records = await this.query().where(column, operator, value).get();
    return records.map((record) => this.hydrate(record));
  }

  /**
   * Find first record matching conditions
   */
  static async first() {
    const record = await this.query().first();
    return record ? this.hydrate(record) : null;
  }

  /**
   * Create a new record
   */
  static async create(attributes) {
    const instance = new this(attributes);
    await instance.save();
    return instance;
  }

  /**
   * Update records matching query
   */
  static async update(attributes) {
    if (this.timestamps) {
      attributes[this.updatedAtColumn] = new Date().toISOString();
    }

    return await this.query().update(attributes);
  }

  /**
   * Delete records (soft or hard depending on model config)
   */
  static async delete() {
    if (this.softDeletes) {
      return await this.query().update({
        [this.deletedAtColumn]: new Date().toISOString(),
      });
    }

    return await this.query().delete();
  }

  /**
   * Get count of records
   */
  static async count() {
    return await this.query().count();
  }

  /**
   * Hydrate a model instance from database record
   */
  static hydrate(record) {
    const instance = new this();
    instance.exists = true;
    instance.original = { ...record };
    instance.fill(record);
    return instance;
  }

  /**
   * Fill the model with attributes
   */
  fill(attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      this.setAttribute(key, value);
    }
    return this;
  }

  /**
   * Set an attribute
   */
  setAttribute(key, value) {
    // Apply casting
    const cast = this.constructor.casts[key];
    if (cast) {
      value = this.castAttribute(value, cast);
    }

    this.attributes[key] = value;
  }

  /**
   * Get an attribute
   */
  getAttribute(key) {
    return this.attributes[key];
  }

  /**
   * Cast an attribute to a native type
   */
  castAttribute(value, cast) {
    if (value === null) return null;

    switch (cast) {
      case "integer":
      case "int":
        return parseInt(value);
      case "float":
      case "double":
        return parseFloat(value);
      case "boolean":
      case "bool":
        return Boolean(value);
      case "string":
        return String(value);
      case "json":
      case "object":
      case "array":
        return typeof value === "string" ? JSON.parse(value) : value;
      case "date":
        return value instanceof Date ? value : new Date(value);
      default:
        return value;
    }
  }

  /**
   * Get the primary key value
   */
  getKey() {
    return this.getAttribute(this.constructor.primaryKey);
  }

  /**
   * Save the model (insert or update)
   */
  async save() {
    if (this.exists) {
      return await this.performUpdate();
    } else {
      return await this.performInsert();
    }
  }

  /**
   * Perform an insert operation
   */
  async performInsert() {
    const attributes = { ...this.attributes };

    // Add timestamps
    if (this.constructor.timestamps) {
      const now = new Date().toISOString();
      attributes[this.constructor.createdAtColumn] = now;
      attributes[this.constructor.updatedAtColumn] = now;
    }

    const result = await DB(this.constructor.getTable()).insert(attributes);

    // Update instance with result
    this.fill(result);
    this.exists = true;
    this.original = { ...this.attributes };

    return this;
  }

  /**
   * Perform an update operation
   */
  async performUpdate() {
    const dirty = this.getDirty();

    if (Object.keys(dirty).length === 0) {
      return this; // No changes
    }

    // Add updated_at timestamp
    if (this.constructor.timestamps) {
      dirty[this.constructor.updatedAtColumn] = new Date().toISOString();
    }

    await DB(this.constructor.getTable())
      .where(this.constructor.primaryKey, this.getKey())
      .update(dirty);

    // Refresh from database to get the updated record
    const fresh = await DB(this.constructor.getTable())
      .where(this.constructor.primaryKey, this.getKey())
      .first();

    this.fill(fresh);
    this.original = { ...this.attributes };

    return this;
  }

  /**
   * Delete the model (soft or hard)
   */
  async destroy() {
    if (!this.exists) {
      throw new Error("Cannot delete a model that does not exist");
    }

    if (this.constructor.softDeletes) {
      this.setAttribute(
        this.constructor.deletedAtColumn,
        new Date().toISOString(),
      );
      return await this.save();
    }

    await DB(this.constructor.getTable())
      .where(this.constructor.primaryKey, this.getKey())
      .delete();

    this.exists = false;
    return this;
  }

  /**
   * Force delete (hard delete even with soft deletes)
   */
  async forceDelete() {
    if (!this.exists) {
      throw new Error("Cannot delete a model that does not exist");
    }

    await DB(this.constructor.getTable())
      .where(this.constructor.primaryKey, this.getKey())
      .delete();

    this.exists = false;
    return this;
  }

  /**
   * Refresh the model from database
   */
  async refresh() {
    if (!this.exists) {
      throw new Error("Cannot refresh a model that does not exist");
    }

    const fresh = await DB(this.constructor.getTable())
      .where(this.constructor.primaryKey, this.getKey())
      .first();

    if (!fresh) {
      throw new Error("Model not found in database");
    }

    this.fill(fresh);
    this.original = { ...this.attributes };

    return this;
  }

  /**
   * Get the attributes that have been changed
   */
  getDirty() {
    const dirty = {};

    for (const [key, value] of Object.entries(this.attributes)) {
      // Include if:
      // 1. Key doesn't exist in original (new attribute)
      // 2. Value is different from original
      if (!(key in this.original) || value !== this.original[key]) {
        dirty[key] = value;
      }
    }

    return dirty;
  }

  /**
   * Determine if the model has been modified
   */
  isDirty() {
    return Object.keys(this.getDirty()).length > 0;
  }

  /**
   * Convert the model to a plain object
   */
  toJSON() {
    const json = { ...this.attributes };

    // Remove hidden attributes
    for (const key of this.constructor.hidden) {
      delete json[key];
    }

    return json;
  }

  /**
   * Convert the model to a string
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}
