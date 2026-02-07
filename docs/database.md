# Database

ORCS includes a built-in database layer powered by Bun's native SQL support. Zero external dependencies, support for PostgreSQL, MySQL, and SQLite.

## Configuration

Configure your database connection in `config/database.js` or using the `DATABASE_URL` environment variable:

```bash
# PostgreSQL (recommended)
DATABASE_URL="postgres://user:password@localhost:5432/mydb"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# SQLite
DATABASE_URL="sqlite://storage/database.sqlite"
```

## Local Development with Docker

Start a PostgreSQL database locally using Docker Compose:

```bash
# Start PostgreSQL in the background
docker-compose up -d

# Check database status
docker-compose ps

# View logs
docker-compose logs -f postgres

# Stop database
docker-compose down

# Stop and remove data
docker-compose down -v
```

The database will be available at `postgres://orcs:orcs@localhost:5432/orcs` (already configured in `.env.example`).

**First time setup:**

```bash
# Copy environment file
cp .env.example .env

# Start database
docker-compose up -d

# Wait for database to be ready (check with docker-compose ps)
# Then run migrations
bun orcs db:migrate
```

## Query Builder

ORCS provides a fluent query builder for constructing SQL queries:

```js
import { DB } from "./src/index.js";

// Select all users
const users = await DB("users").get();

// Where clause
const activeUsers = await DB("users")
  .where("active", true)
  .where("age", ">=", 18)
  .get();

// Select specific columns
const emails = await DB("users")
  .select("id", "email")
  .where("verified", true)
  .get();

// Order and limit
const topUsers = await DB("users")
  .orderBy("created_at", "DESC")
  .limit(10)
  .get();

// Get first result
const user = await DB("users").where("email", "john@example.com").first();

// Insert
const newUser = await DB("users").insert({
  name: "Alice",
  email: "alice@example.com",
});

// Update
await DB("users").where("id", 1).update({ name: "Bob" });

// Delete
await DB("users").where("id", 1).delete();

// Joins
const posts = await DB("posts")
  .join("users", "posts.user_id", "=", "users.id")
  .select("posts.*", "users.name as author_name")
  .get();
```

## Raw SQL

For complex queries, use Bun's SQL directly:

```js
import { sql } from "bun";

// Tagged template literals (safe from SQL injection)
const users = await sql`
  SELECT * FROM users
  WHERE created_at > ${since}
  ORDER BY name
`;

// Transactions
await sql.begin(async (tx) => {
  await tx`INSERT INTO users (name) VALUES (${"Alice"})`;
  await tx`UPDATE accounts SET balance = balance - 100`;
});
```

## Migrations

Migrations provide version control for your database schema.

**Create a migration:**

```bash
bun orcs make:migration create_users_table
```

This creates a timestamped migration file in `database/migrations/`:

```js
import { Migration } from "../../src/database/migration.js";

export default class CreateUsersTable extends Migration {
  async up(db) {
    await db.unsafe(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async down(db) {
    await db.unsafe(`DROP TABLE IF EXISTS users`);
  }
}
```

**Run migrations:**

```bash
# Run all pending migrations
bun orcs db:migrate

# Rollback last batch
bun orcs db:rollback

# Reset all migrations
bun orcs db:reset

# Check migration status
bun orcs db:status
```

## Transactions

Execute multiple queries in a transaction:

```js
import { transaction } from "./src/index.js";

await transaction(async (tx) => {
  await tx`INSERT INTO users (name) VALUES (${"Alice"})`;
  await tx`UPDATE accounts SET balance = balance - 100 WHERE user_id = 1`;
  // Auto-commits if no errors, auto-rolls back on error
});
```

## Models

ORCS includes an Active Record-style ORM for working with database records using classes. Models provide a clean, object-oriented API on top of the query builder.

**Define a model:**

```js
// app/models/user.js
import { Model } from "../../src/index.js";

export class User extends Model {
  // Table name (auto-inferred as "users" from class name)
  // static table = "users";

  // Primary key (default: "id")
  // static primaryKey = "id";

  // Enable timestamps (default: true)
  static timestamps = true;

  // Enable soft deletes (default: false)
  static softDeletes = false;

  // Cast attributes to native types
  static casts = {
    active: "boolean",
    age: "integer",
    metadata: "json",
  };

  // Hide attributes when converting to JSON
  static hidden = ["password"];
}
```

**Creating records:**

```js
import { User } from "./app/models/user.js";

// Create and save
const user = await User.create({
  name: "John Doe",
  email: "john@example.com",
  age: 25,
});

// Or create instance then save
const user = new User({
  name: "Jane Doe",
  email: "jane@example.com",
});
await user.save();
```

**Finding records:**

```js
// Find by primary key
const user = await User.find(1);

// Find or throw error
const user = await User.findOrFail(1);

// Find by column value
const users = await User.where("active", true);
const users = await User.where("age", ">=", 18);

// Get all records
const users = await User.all();

// Get first record
const user = await User.first();

// Count records
const count = await User.count();
```

**Updating records:**

```js
// Update instance
const user = await User.find(1);
user.setAttribute("name", "New Name");
await user.save();

// Update multiple records
await User.query().where("active", false).update({ verified: false });
```

**Deleting records:**

```js
// Delete instance
const user = await User.find(1);
await user.destroy();

// Soft delete (if enabled)
await user.destroy(); // Sets deleted_at timestamp

// Force delete (hard delete)
await user.forceDelete();

// Delete multiple records
await User.query().where("active", false).delete();
```

**Working with attributes:**

```js
const user = new User({
  name: "John",
  age: "25", // Will be cast to integer
  active: "1", // Will be cast to boolean
  metadata: '{"key": "value"}', // Will be cast to object
});

// Get attribute
const name = user.getAttribute("name");

// Check if model has unsaved changes
if (user.isDirty()) {
  await user.save();
}

// Get changed attributes
const changes = user.getDirty();

// Refresh from database
await user.refresh();

// Convert to JSON (hidden fields removed)
const json = user.toJSON();
```

**Advanced queries:**

Since models use the query builder under the hood, you can chain any query builder methods:

```js
// Complex queries
const users = await User.query()
  .where("active", true)
  .where("age", ">=", 18)
  .orderBy("created_at", "DESC")
  .limit(10)
  .get();

// Joins
const posts = await Post.query()
  .join("users", "posts.user_id", "=", "users.id")
  .select("posts.*", "users.name as author_name")
  .get();
```

**Timestamps:**

When `timestamps = true`, models automatically manage `created_at` and `updated_at`:

```js
const user = await User.create({ name: "John" });
// created_at and updated_at are set automatically

user.setAttribute("name", "Jane");
await user.save();
// updated_at is automatically updated
```

**Soft Deletes:**

Enable soft deletes to mark records as deleted without removing them:

```js
export class User extends Model {
  static softDeletes = true;
  static deletedAtColumn = "deleted_at";
}

// Soft delete
await user.destroy(); // Sets deleted_at timestamp

// Queries automatically exclude soft-deleted records
const users = await User.all(); // Only returns non-deleted

// Force delete
await user.forceDelete(); // Permanently deletes
```

**Custom table names:**

```js
export class BlogPost extends Model {
  static table = "posts"; // Override auto-inferred "blog_posts"
}
```
