import { Migration } from "@jevido/orcs";

export default class CreatePostsTable extends Migration {
  async up() {
    await this.createTable("posts", (table) => {
      table.id();
      table.integer("user_id").notNull();
      table.string("title").notNull();
      table.text("content").notNull();
      table.string("status").default("draft");
      table.timestamps();

      table.foreign("user_id").references("users", "id").onDelete("CASCADE");
    });
  }

  async down() {
    await this.dropTable("posts");
  }
}
