/**
 * Example Controller
 *
 * This is a sample controller showing common patterns.
 * Feel free to modify or delete this file.
 */
export class ExampleController {
  /**
   * List all items
   */
  static async index(ctx) {
    return ctx.json({
      data: [],
      meta: {
        total: 0,
        page: 1,
      },
    });
  }

  /**
   * Create a new item
   */
  static async store(ctx) {
    const data = ctx.body;

    // Your business logic here
    const item = {
      id: 1,
      ...data,
      created_at: new Date().toISOString(),
    };

    return ctx.json({ data: item }, 201);
  }

  /**
   * Show a specific item
   */
  static async show(ctx) {
    const { id } = ctx.params;

    // Your business logic here
    const item = {
      id: parseInt(id),
      name: "Example Item",
      created_at: new Date().toISOString(),
    };

    return ctx.json({ data: item });
  }

  /**
   * Update an item
   */
  static async update(ctx) {
    const { id } = ctx.params;
    const data = ctx.body;

    // Your business logic here
    const item = {
      id: parseInt(id),
      ...data,
      updated_at: new Date().toISOString(),
    };

    return ctx.json({ data: item });
  }

  /**
   * Delete an item
   */
  static async destroy(ctx) {
    const { id } = ctx.params;

    // Your business logic here

    return ctx.json({ message: "Item deleted" });
  }
}
