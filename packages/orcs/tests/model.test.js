import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { getConnection, closeConnection, Model, DB } from "../src/index.js";

// Use in-memory SQLite for testing
process.env.DATABASE_URL = ":memory:";

// Define test models
class User extends Model {
  static casts = {
    active: "boolean",
    age: "integer",
  };

  static hidden = ["password"];
}

class Post extends Model {
  static timestamps = true;
}

class SoftDeleteUser extends Model {
  static table = "soft_users";
  static softDeletes = true;
}

// Create test tables
beforeAll(async () => {
  const db = getConnection();

  // Users table (drop if exists to avoid conflicts with other tests)
  await db.unsafe(`DROP TABLE IF EXISTS users`);
  await db.unsafe(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      age INTEGER,
      active INTEGER DEFAULT 1,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Posts table
  await db.unsafe(`DROP TABLE IF EXISTS posts`);
  await db.unsafe(`
    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Soft delete users table
  await db.unsafe(`DROP TABLE IF EXISTS soft_users`);
  await db.unsafe(`
    CREATE TABLE soft_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  await closeConnection();
});

describe("Model - Table Names", () => {
  test("infers table name from class name", () => {
    expect(User.getTable()).toBe("users");
    expect(Post.getTable()).toBe("posts");
  });

  test("uses custom table name when specified", () => {
    expect(SoftDeleteUser.getTable()).toBe("soft_users");
  });
});

describe("Model - Creating Records", () => {
  test("can create a new record", async () => {
    const user = await User.create({
      name: "John Doe",
      email: "john@example.com",
      age: 25,
      password: "secret",
    });

    expect(user.exists).toBe(true);
    expect(user.getAttribute("name")).toBe("John Doe");
    expect(user.getAttribute("email")).toBe("john@example.com");
    expect(user.getAttribute("age")).toBe(25);
    expect(user.getKey()).toBeDefined();
  });

  test("can create instance then save", async () => {
    const user = new User({
      name: "Jane Doe",
      email: "jane@example.com",
      age: "30", // Will be cast to integer
    });

    expect(user.exists).toBe(false);

    await user.save();

    expect(user.exists).toBe(true);
    expect(user.getKey()).toBeDefined();
  });

  test("automatically adds timestamps on create", async () => {
    const post = await Post.create({
      title: "Test Post",
      content: "Test content",
      user_id: 1,
    });

    expect(post.getAttribute("created_at")).toBeDefined();
    expect(post.getAttribute("updated_at")).toBeDefined();
  });
});

describe("Model - Finding Records", () => {
  test("can find by primary key", async () => {
    const created = await User.create({
      name: "Find Me",
      email: "findme@example.com",
      age: 20,
    });

    const found = await User.find(created.getKey());

    expect(found).toBeDefined();
    expect(found.getAttribute("name")).toBe("Find Me");
    expect(found.getAttribute("email")).toBe("findme@example.com");
  });

  test("returns null when record not found", async () => {
    const user = await User.find(99999);
    expect(user).toBeNull();
  });

  test("findOrFail throws when record not found", async () => {
    await expect(User.findOrFail(99999)).rejects.toThrow(
      "User with id 99999 not found",
    );
  });

  test("can find by column value", async () => {
    await User.create({
      name: "Search User",
      email: "search@example.com",
      age: 35,
    });

    const users = await User.where("email", "search@example.com");

    expect(users.length).toBe(1);
    expect(users[0].getAttribute("name")).toBe("Search User");
  });

  test("can get all records", async () => {
    const users = await User.all();
    expect(users.length).toBeGreaterThan(0);
  });

  test("can get first record", async () => {
    const user = await User.first();
    expect(user).toBeDefined();
    expect(user.getAttribute("name")).toBeDefined();
  });

  test("can count records", async () => {
    const count = await User.count();
    expect(count).toBeGreaterThan(0);
  });
});

describe("Model - Updating Records", () => {
  test("can update instance attributes", async () => {
    const user = await User.create({
      name: "Original Name",
      email: "original@example.com",
      age: 20,
    });

    user.setAttribute("name", "Updated Name");
    user.setAttribute("age", 25);

    expect(user.isDirty()).toBe(true);

    await user.save();

    // Verify in database
    const fresh = await User.find(user.getKey());
    expect(fresh.getAttribute("name")).toBe("Updated Name");
    expect(fresh.getAttribute("age")).toBe(25);
  });

  test("updates updated_at timestamp on save", async () => {
    const post = await Post.create({
      title: "Original",
      content: "Content",
      user_id: 1,
    });

    const originalUpdatedAt = post.getAttribute("updated_at");

    // Wait a bit to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    post.setAttribute("title", "Updated");
    await post.save();

    expect(post.getAttribute("updated_at")).not.toBe(originalUpdatedAt);
  });

  test("doesn't save if no changes", async () => {
    const user = await User.create({
      name: "No Change",
      email: "nochange@example.com",
      age: 20,
    });

    expect(user.isDirty()).toBe(false);

    // This should be a no-op
    await user.save();

    expect(user.exists).toBe(true);
  });

  test("can refresh from database", async () => {
    const user = await User.create({
      name: "Refresh Test",
      email: "refresh@example.com",
      age: 20,
    });

    // Update directly in database
    await DB("users").where("id", user.getKey()).update({ age: 99 });

    // Instance still has old value
    expect(user.getAttribute("age")).toBe(20);

    // Refresh from database
    await user.refresh();

    expect(user.getAttribute("age")).toBe(99);
  });
});

describe("Model - Deleting Records", () => {
  test("can delete instance", async () => {
    const user = await User.create({
      name: "Delete Me",
      email: "deleteme@example.com",
      age: 20,
    });

    const id = user.getKey();

    await user.destroy();

    expect(user.exists).toBe(false);

    // Verify deleted from database
    const found = await User.find(id);
    expect(found).toBeNull();
  });

  test("cannot delete non-existent model", async () => {
    const user = new User({ name: "Not Saved", email: "not@example.com" });

    await expect(user.destroy()).rejects.toThrow(
      "Cannot delete a model that does not exist",
    );
  });
});

describe("Model - Soft Deletes", () => {
  test("soft delete sets deleted_at timestamp", async () => {
    const user = await SoftDeleteUser.create({
      name: "Soft Delete",
      email: "soft@example.com",
    });

    await user.destroy();

    expect(user.exists).toBe(true); // Still exists
    expect(user.getAttribute("deleted_at")).toBeDefined();
  });

  test("soft deleted records excluded from queries", async () => {
    const user = await SoftDeleteUser.create({
      name: "Will Be Deleted",
      email: "willbedeleted@example.com",
    });

    const id = user.getKey();

    // Delete it
    await user.destroy();

    // Should not be found
    const found = await SoftDeleteUser.find(id);
    expect(found).toBeNull();
  });

  test("force delete permanently removes record", async () => {
    const user = await SoftDeleteUser.create({
      name: "Force Delete",
      email: "force@example.com",
    });

    const id = user.getKey();

    await user.forceDelete();

    expect(user.exists).toBe(false);

    // Verify completely gone from database
    const found = await DB("soft_users").where("id", id).first();
    expect(found).toBeNull();
  });
});

describe("Model - Attribute Casting", () => {
  test("casts integer attributes", async () => {
    const user = new User({
      name: "Cast Test",
      email: "cast@example.com",
      age: "42", // String will be cast to int
    });

    expect(user.getAttribute("age")).toBe(42);
    expect(typeof user.getAttribute("age")).toBe("number");
  });

  test("casts boolean attributes", async () => {
    const user = new User({
      name: "Bool Test",
      email: "bool@example.com",
      active: "1", // String will be cast to boolean
    });

    expect(user.getAttribute("active")).toBe(true);
    expect(typeof user.getAttribute("active")).toBe("boolean");
  });

  test("casts json attributes", async () => {
    class JsonModel extends Model {
      static table = "users";
      static casts = { metadata: "json" };
    }

    const user = new JsonModel({
      name: "JSON Test",
      email: "json@example.com",
      metadata: '{"key": "value"}', // String will be parsed
    });

    const metadata = user.getAttribute("metadata");
    expect(typeof metadata).toBe("object");
    expect(metadata.key).toBe("value");
  });
});

describe("Model - Serialization", () => {
  test("toJSON converts to plain object", () => {
    const user = new User({
      name: "JSON Test",
      email: "json@example.com",
      age: 25,
      password: "secret",
    });

    const json = user.toJSON();

    expect(json.name).toBe("JSON Test");
    expect(json.email).toBe("json@example.com");
    expect(json.age).toBe(25);
  });

  test("toJSON hides hidden attributes", () => {
    const user = new User({
      name: "Hidden Test",
      email: "hidden@example.com",
      password: "secret",
    });

    const json = user.toJSON();

    expect(json.password).toBeUndefined();
  });

  test("toString returns JSON string", () => {
    const user = new User({
      name: "String Test",
      email: "string@example.com",
    });

    const str = user.toString();
    const parsed = JSON.parse(str);

    expect(parsed.name).toBe("String Test");
    expect(parsed.email).toBe("string@example.com");
  });
});

describe("Model - Query Builder Integration", () => {
  test("can use query builder methods", async () => {
    await User.create({
      name: "Query Test 1",
      email: "query1@example.com",
      age: 20,
    });
    await User.create({
      name: "Query Test 2",
      email: "query2@example.com",
      age: 30,
    });

    const users = await User.query()
      .where("age", ">=", 20)
      .orderBy("age", "DESC")
      .get();

    expect(users.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Model - Change Tracking", () => {
  test("tracks dirty attributes", () => {
    const user = new User({
      name: "Original",
      email: "original@example.com",
      age: 20,
    });

    // Make some changes
    user.setAttribute("name", "Changed");
    user.setAttribute("age", 25);

    const dirty = user.getDirty();

    expect(dirty.name).toBe("Changed");
    expect(dirty.age).toBe(25);
    expect(dirty.email).toBeUndefined(); // Not changed
  });

  test("isDirty returns false for clean model", async () => {
    const user = await User.create({
      name: "Clean",
      email: "clean@example.com",
      age: 20,
    });

    expect(user.isDirty()).toBe(false);
  });

  test("isDirty returns true for modified model", async () => {
    const user = await User.create({
      name: "Will Change",
      email: "willchange@example.com",
      age: 20,
    });

    user.setAttribute("age", 25);

    expect(user.isDirty()).toBe(true);
  });
});
