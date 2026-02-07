import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  getConnection,
  closeConnection,
  transaction,
  DB,
} from "../src/index.js";

// Use in-memory SQLite for testing
process.env.DATABASE_URL = ":memory:";

// Create test table
beforeAll(async () => {
  const db = getConnection();

  // Create users table
  await db.unsafe(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      age INTEGER,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create posts table for join tests
  await db.unsafe(`
    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Insert test data
  await db.unsafe(`
    INSERT INTO users (name, email, age, active) VALUES
    ('Alice', 'alice@example.com', 25, 1),
    ('Bob', 'bob@example.com', 30, 1),
    ('Charlie', 'charlie@example.com', 35, 0)
  `);

  await db.unsafe(`
    INSERT INTO posts (user_id, title, content) VALUES
    (1, 'First Post', 'Hello world'),
    (1, 'Second Post', 'Another post'),
    (2, 'Bobs Post', 'Bob was here')
  `);
});

afterAll(async () => {
  await closeConnection();
});

describe("Database Connection", () => {
  test("can connect to database", async () => {
    const db = getConnection();
    expect(db).toBeDefined();

    const result = await db.unsafe("SELECT 1 as test");
    expect(result[0].test).toBe(1);
  });

  test("reuses same connection", () => {
    const db1 = getConnection();
    const db2 = getConnection();
    expect(db1).toBe(db2);
  });
});

describe("Query Builder - SELECT", () => {
  test("can select all records", async () => {
    const users = await DB("users").get();
    expect(users.length).toBe(3);
  });

  test("can select specific columns", async () => {
    const users = await DB("users").select("name", "email").get();
    expect(users[0].name).toBeDefined();
    expect(users[0].email).toBeDefined();
    expect(users[0].age).toBeUndefined();
  });

  test("can use where clause", async () => {
    const users = await DB("users").where("name", "Alice").get();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  test("can use where with operator", async () => {
    const users = await DB("users").where("age", ">=", 30).get();
    expect(users.length).toBe(2);
  });

  test("can chain multiple where clauses", async () => {
    const users = await DB("users")
      .where("age", ">=", 25)
      .where("active", 1)
      .get();
    expect(users.length).toBe(2);
  });

  test("can use orWhere clause", async () => {
    const users = await DB("users")
      .where("name", "Alice")
      .orWhere("name", "Bob")
      .get();
    expect(users.length).toBe(2);
  });

  test("can use whereIn clause", async () => {
    const users = await DB("users").whereIn("name", ["Alice", "Bob"]).get();
    expect(users.length).toBe(2);
  });

  test("can use whereNotIn clause", async () => {
    const users = await DB("users").whereNotIn("name", ["Alice", "Bob"]).get();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Charlie");
  });

  test("can use whereNull clause", async () => {
    // Insert user with null age
    await DB("users").insert({
      name: "Dave",
      email: "dave@example.com",
      age: null,
    });

    const users = await DB("users").whereNull("age").get();
    expect(users.length).toBeGreaterThan(0);

    // Cleanup
    await DB("users").where("name", "Dave").delete();
  });

  test("can use whereNotNull clause", async () => {
    const users = await DB("users").whereNotNull("age").get();
    expect(users.length).toBe(3);
  });

  test("can order results", async () => {
    const users = await DB("users").orderBy("age", "DESC").get();
    expect(users[0].age).toBe(35);
  });

  test("can limit results", async () => {
    const users = await DB("users").limit(2).get();
    expect(users.length).toBe(2);
  });

  test("can offset results", async () => {
    const users = await DB("users").orderBy("id").offset(1).limit(2).get();
    expect(users.length).toBe(2);
    expect(users[0].name).toBe("Bob");
  });

  test("can get first result", async () => {
    const user = await DB("users").where("name", "Alice").first();
    expect(user).toBeDefined();
    expect(user.name).toBe("Alice");
  });

  test("returns null when first finds nothing", async () => {
    const user = await DB("users").where("name", "Nonexistent").first();
    expect(user).toBeNull();
  });

  test("can get single column value", async () => {
    const email = await DB("users").where("name", "Alice").value("email");
    expect(email).toBe("alice@example.com");
  });

  test("can count results", async () => {
    const count = await DB("users").count();
    expect(count).toBe(3);
  });

  test("can count with where clause", async () => {
    const count = await DB("users").where("active", 1).count();
    expect(count).toBe(2);
  });
});

describe("Query Builder - JOINS", () => {
  test("can perform inner join", async () => {
    const results = await DB("posts")
      .join("users", "posts.user_id", "=", "users.id")
      .select("posts.title", "users.name")
      .get();

    expect(results.length).toBe(3);
    expect(results[0].title).toBeDefined();
    expect(results[0].name).toBeDefined();
  });

  test("can perform left join", async () => {
    const results = await DB("users")
      .leftJoin("posts", "users.id", "=", "posts.user_id")
      .select("users.name", "posts.title")
      .get();

    expect(results.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Query Builder - INSERT", () => {
  test("can insert a record", async () => {
    const user = await DB("users").insert({
      name: "Eve",
      email: "eve@example.com",
      age: 28,
    });

    expect(user).toBeDefined();
    expect(user.name).toBe("Eve");
    expect(user.email).toBe("eve@example.com");
  });

  test("inserted record is retrievable", async () => {
    const user = await DB("users").where("email", "eve@example.com").first();
    expect(user).toBeDefined();
    expect(user.name).toBe("Eve");
  });
});

describe("Query Builder - UPDATE", () => {
  test("can update records", async () => {
    const results = await DB("users").where("name", "Eve").update({ age: 29 });

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);

    // Verify update
    const user = await DB("users").where("name", "Eve").first();
    expect(user.age).toBe(29);
  });

  test("can update multiple records", async () => {
    await DB("users").where("active", 1).update({ active: 0 });

    const activeCount = await DB("users").where("active", 1).count();
    expect(activeCount).toBe(0);

    // Restore for other tests
    await DB("users").where("active", 0).update({ active: 1 });
  });
});

describe("Query Builder - DELETE", () => {
  test("can delete records", async () => {
    // First check the record exists
    let user = await DB("users").where("name", "Eve").first();
    expect(user).toBeDefined();

    // Delete it
    await DB("users").where("name", "Eve").delete();

    // Verify deletion
    user = await DB("users").where("name", "Eve").first();
    expect(user).toBeNull();
  });
});

describe("Transactions", () => {
  test("commits successful transaction", async () => {
    await transaction(async (tx) => {
      await tx.unsafe(`
        INSERT INTO users (name, email, age) VALUES ('Frank', 'frank@example.com', 40)
      `);
      await tx.unsafe(`
        INSERT INTO users (name, email, age) VALUES ('Grace', 'grace@example.com', 45)
      `);
    });

    // Verify both inserts succeeded
    const frank = await DB("users").where("name", "Frank").first();
    const grace = await DB("users").where("name", "Grace").first();

    expect(frank).toBeDefined();
    expect(grace).toBeDefined();
  });

  test("rolls back failed transaction", async () => {
    const initialCount = await DB("users").count();

    try {
      await transaction(async (tx) => {
        await tx.unsafe(`
          INSERT INTO users (name, email, age) VALUES ('Henry', 'henry@example.com', 50)
        `);

        // This will fail due to duplicate email
        await tx.unsafe(`
          INSERT INTO users (name, email) VALUES ('Duplicate', 'henry@example.com')
        `);
      });
    } catch (error) {
      // Expected to fail
    }

    // Verify rollback - count should be unchanged
    const finalCount = await DB("users").count();
    expect(finalCount).toBe(initialCount);

    // Verify Henry was not inserted
    const henry = await DB("users").where("name", "Henry").first();
    expect(henry).toBeNull();
  });
});

describe("Raw SQL", () => {
  test("can execute raw queries", async () => {
    const db = getConnection();
    const results = await db.unsafe(
      "SELECT * FROM users WHERE age > $1 ORDER BY age",
      [25],
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].age).toBeGreaterThan(25);
  });

  test("can use tagged template literals", async () => {
    const db = getConnection();
    const minAge = 30;

    const results = await db`
      SELECT * FROM users WHERE age >= ${minAge}
    `;

    expect(results.length).toBeGreaterThan(0);
    results.forEach((user) => {
      expect(user.age).toBeGreaterThanOrEqual(30);
    });
  });
});
