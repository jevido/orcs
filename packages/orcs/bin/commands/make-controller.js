/**
 * make:controller command - generates a new controller
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

export default async function makeController(args) {
  if (args.length === 0) {
    console.error("\nController name is required");
    console.log("\nUsage: bun orcs make:controller <ControllerName>\n");
    console.log("Examples:");
    console.log("  bun orcs make:controller UserController");
    console.log("  bun orcs make:controller PostController\n");
    process.exit(1);
  }

  const name = args[0];

  // Ensure name ends with "Controller"
  const controllerName = name.endsWith("Controller")
    ? name
    : `${name}Controller`;

  // Convert to kebab-case for filename
  const fileName = controllerName
    .replace(/Controller$/, "-controller")
    .replace(/([A-Z])/g, (match, letter, index) =>
      index === 0 ? letter.toLowerCase() : `-${letter.toLowerCase()}`,
    );

  const filePath = resolve(
    process.cwd(),
    "app",
    "controllers",
    `${fileName}.js`,
  );

  // Check if file already exists
  if (existsSync(filePath)) {
    console.error(`\nController already exists: ${filePath}\n`);
    process.exit(1);
  }

  // Ensure directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Generate controller content
  const content = generateControllerContent(controllerName);

  // Write file
  try {
    writeFileSync(filePath, content, "utf-8");
    console.log(`\nController created: ${filePath}`);
    console.log(`\nExample usage in routes/api.js:`);
    console.log(
      `\nimport { ${controllerName} } from "../app/controllers/${fileName}.js";`,
    );
    console.log(
      `\nRoute.get("/resource", { summary: "List" }, ${controllerName}.index);`,
    );
    console.log(
      `Route.post("/resource", { summary: "Create" }, ${controllerName}.store);\n`,
    );
  } catch (error) {
    console.error(`\nFailed to create controller: ${error.message}\n`);
    process.exit(1);
  }
}

function generateControllerContent(className) {
  return `/**
 * ${className}
 *
 * Handle requests for a specific resource.
 * Each method receives the request context (ctx).
 */

export class ${className} {
  /**
   * Display a listing of the resource
   */
  static async index(ctx) {
    // Example: List all resources
    return ctx.json({
      data: [],
      meta: { total: 0 },
    });
  }

  /**
   * Store a newly created resource
   */
  static async store(ctx) {
    // Example: Create a new resource
    const data = ctx.body;

    // TODO: Validate and store the resource

    return ctx.json(
      { message: "Resource created", data },
      201
    );
  }

  /**
   * Display the specified resource
   */
  static async show(ctx) {
    // Example: Get a single resource by ID
    const { id } = ctx.params;

    // TODO: Find the resource
    const resource = null; // Replace with actual lookup

    if (!resource) {
      ctx.abort(404, "Resource not found");
    }

    return ctx.json({ data: resource });
  }

  /**
   * Update the specified resource
   */
  static async update(ctx) {
    // Example: Update a resource by ID
    const { id } = ctx.params;
    const data = ctx.body;

    // TODO: Find and update the resource

    return ctx.json({
      message: "Resource updated",
      data: { id, ...data },
    });
  }

  /**
   * Remove the specified resource
   */
  static async destroy(ctx) {
    // Example: Delete a resource by ID
    const { id } = ctx.params;

    // TODO: Find and delete the resource

    return ctx.json({ message: "Resource deleted" });
  }
}
`;
}
