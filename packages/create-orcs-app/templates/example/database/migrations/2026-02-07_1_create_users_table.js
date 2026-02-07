import { Migration } from "@jevido/orcs";

export default class CreateUsersTable extends Migration {
  async up() {
    await this.createTable("users", (table) => {
      table.id();
      table.string("email").unique().notNull();
      table.string("password").notNull();
      table.string("name").notNull();
      table.string("api_token").nullable();
      table.timestamps();
    });
  }

  async down() {
    await this.dropTable("users");
  }
}
