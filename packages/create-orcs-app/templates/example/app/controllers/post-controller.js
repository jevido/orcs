/**
 * Post Controller
 *
 * Example controller showing database operations with the ORM.
 */
export class PostController {
  /**
   * List all posts
   */
  static async index(ctx) {
    // Example using query builder
    // const posts = await DB.table('posts')
    //   .select('*')
    //   .where('status', 'published')
    //   .orderBy('created_at', 'desc')
    //   .get();

    // Mock data for example
    const posts = [
      {
        id: 1,
        title: "Getting Started with ORCS",
        content: "Learn how to build APIs with ORCS...",
        status: "published",
        user_id: 1,
        created_at: new Date().toISOString(),
      },
    ];

    return ctx.json({
      data: posts,
      meta: {
        total: posts.length,
      },
    });
  }

  /**
   * Create a new post
   */
  static async store(ctx) {
    const { title, content, status } = ctx.body;
    const userId = ctx.user?.id || 1;

    // Example using query builder
    // const postId = await DB.table('posts').insert({
    //   user_id: userId,
    //   title,
    //   content,
    //   status: status || 'draft',
    //   created_at: new Date(),
    //   updated_at: new Date(),
    // });
    //
    // const post = await DB.table('posts').where('id', postId).first();

    // Mock response
    const post = {
      id: 1,
      user_id: userId,
      title,
      content,
      status: status || "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return ctx.json({ data: post }, 201);
  }

  /**
   * Get a specific post
   */
  static async show(ctx) {
    const { id } = ctx.params;

    // Example using query builder
    // const post = await DB.table('posts')
    //   .where('id', id)
    //   .first();
    //
    // if (!post) {
    //   return ctx.abort(404, 'Post not found');
    // }

    // Mock response
    const post = {
      id: parseInt(id),
      title: "Getting Started with ORCS",
      content: "Learn how to build APIs with ORCS...",
      status: "published",
      user_id: 1,
      created_at: new Date().toISOString(),
    };

    return ctx.json({ data: post });
  }

  /**
   * Update a post
   */
  static async update(ctx) {
    const { id } = ctx.params;
    const { title, content, status } = ctx.body;

    // Example using query builder
    // await DB.table('posts')
    //   .where('id', id)
    //   .update({
    //     title,
    //     content,
    //     status,
    //     updated_at: new Date(),
    //   });
    //
    // const post = await DB.table('posts').where('id', id).first();

    // Mock response
    const post = {
      id: parseInt(id),
      title,
      content,
      status,
      updated_at: new Date().toISOString(),
    };

    return ctx.json({ data: post });
  }

  /**
   * Delete a post
   */
  static async destroy(ctx) {
    const { id } = ctx.params;

    // Example using query builder
    // await DB.table('posts').where('id', id).delete();

    return ctx.json({
      message: "Post deleted successfully",
    });
  }
}
