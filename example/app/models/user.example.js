/**
 * User Model (Example)
 *
 * This is an example of how to define a model in your application.
 * Models provide an Active Record-style ORM for working with database records.
 *
 * Copy this to app/models/user.js and customize as needed.
 */

import { Model } from "@jevido/orcs";

export class User extends Model {
  /**
   * The table associated with the model
   * If not specified, it will be inferred from the class name:
   * User -> users, BlogPost -> blog_posts
   */
  // static table = "users";

  /**
   * The primary key for the model
   * Default: "id"
   */
  // static primaryKey = "id";

  /**
   * Indicates if the model should be timestamped
   * When true, created_at and updated_at are automatically managed
   * Default: true
   */
  static timestamps = true;

  /**
   * The name of the "created at" column
   * Default: "created_at"
   */
  // static createdAtColumn = "created_at";

  /**
   * The name of the "updated at" column
   * Default: "updated_at"
   */
  // static updatedAtColumn = "updated_at";

  /**
   * Indicates if the model uses soft deletes
   * When true, deletes only set deleted_at timestamp instead of removing the record
   * Default: false
   */
  static softDeletes = false;

  /**
   * The name of the "deleted at" column
   * Default: "deleted_at"
   */
  // static deletedAtColumn = "deleted_at";

  /**
   * The attributes that should be cast to native types
   * Supported casts: string, integer, int, float, double, boolean, bool, json, object, array, date
   */
  static casts = {
    active: "boolean", // Cast active column to boolean
    age: "integer", // Cast age column to integer
    metadata: "json", // Parse JSON string to object
    verified_at: "date", // Parse to Date object
  };

  /**
   * The attributes that should be hidden when converting to JSON
   * Useful for hiding sensitive fields like passwords
   */
  static hidden = ["password", "remember_token"];

  /**
   * Example: Get user's full name
   */
  getFullName() {
    return `${this.getAttribute("first_name")} ${this.getAttribute("last_name")}`;
  }

  /**
   * Example: Check if user is an admin
   */
  isAdmin() {
    return this.getAttribute("role") === "admin";
  }

  /**
   * Example: Get user's posts (if you have a Post model)
   */
  async posts() {
    const Post = (await import("./post.js")).Post;
    return await Post.where("user_id", this.getKey());
  }
}
