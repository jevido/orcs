/**
 * make:model command - generates a new model
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

export default async function makeModel(args) {
  if (args.length === 0) {
    console.error("\nModel name is required");
    console.log("\nUsage: bun orcs make:model <ModelName>\n");
    console.log("Examples:");
    console.log("  bun orcs make:model User");
    console.log("  bun orcs make:model BlogPost\n");
    process.exit(1);
  }

  const name = args[0];

  // Convert to kebab-case for filename
  const fileName = name
    .replace(/([A-Z])/g, (match, letter, index) =>
      index === 0 ? letter.toLowerCase() : `-${letter.toLowerCase()}`,
    );

  const filePath = resolve(
    process.cwd(),
    "app",
    "models",
    `${fileName}.js`,
  );

  // Check if file already exists
  if (existsSync(filePath)) {
    console.error(`\nModel already exists: ${filePath}\n`);
    process.exit(1);
  }

  // Ensure directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Generate model content
  const content = generateModelContent(name);

  // Write file
  try {
    writeFileSync(filePath, content, "utf-8");
    console.log(`\nModel created: ${filePath}`);
    console.log(`\nUsage:`);
    console.log(
      `\nimport { ${name} } from "../app/models/${fileName}.js";`,
    );
    console.log(`\nconst record = await ${name}.find(1);`);
    console.log(`const all = await ${name}.all();`);
    console.log(`const created = await ${name}.create({ name: "example" });\n`);
  } catch (error) {
    console.error(`\nFailed to create model: ${error.message}\n`);
    process.exit(1);
  }
}

function generateModelContent(className) {
  return `import { Model } from "@jevido/orcs/database/model.js";

export class ${className} extends Model {
  /**
   * The table associated with the model.
   * Defaults to the snake_case plural of the class name.
   */
  // static table = "${toSnakeCasePlural(className)}";

  /**
   * The attributes that should be cast to native types.
   */
  // static casts = {};

  /**
   * The attributes that should be hidden for serialization.
   */
  // static hidden = [];

  /**
   * Indicates if the model uses soft deletes.
   */
  // static softDeletes = false;
}
`;
}

function toSnakeCasePlural(name) {
  const snake = name
    .replace(/([A-Z])/g, (match, offset) =>
      offset > 0 ? `_${match.toLowerCase()}` : match.toLowerCase(),
    )
    .toLowerCase();
  return `${snake}s`;
}
