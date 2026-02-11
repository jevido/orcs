/**
 * make:middleware command - generates a new middleware
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

export default async function makeMiddleware(args) {
  if (args.length === 0) {
    console.error("\nMiddleware name is required");
    console.log("\nUsage: bun orcs make:middleware <name>\n");
    console.log("Examples:");
    console.log("  bun orcs make:middleware auth");
    console.log("  bun orcs make:middleware rateLimit\n");
    process.exit(1);
  }

  const name = args[0];

  // Convert to kebab-case for filename
  const fileName = name.replace(/([A-Z])/g, (match, letter, index) =>
    index === 0 ? letter.toLowerCase() : `-${letter.toLowerCase()}`,
  );

  const filePath = resolve(
    process.cwd(),
    "app",
    "middleware",
    `${fileName}.js`,
  );

  // Check if file already exists
  if (existsSync(filePath)) {
    console.error(`\nMiddleware already exists: ${filePath}\n`);
    process.exit(1);
  }

  // Ensure directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Generate middleware content
  const functionName = name.replace(/[-_]/g, "");
  const content = generateMiddlewareContent(functionName);

  // Write file
  try {
    writeFileSync(filePath, content, "utf-8");
    console.log(`\nMiddleware created: ${filePath}`);
    console.log(
      `\nRegister globally in app/providers/app-service-provider.js:`,
    );
    console.log(
      `\nimport { ${functionName} } from "../middleware/${fileName}.js";`,
    );
    console.log(`this.app.useGlobalMiddleware([${functionName}]);`);
    console.log(`\nOr register by name:`);
    console.log(`this.app.registerMiddleware({ ${name}: ${functionName} });`);
    console.log(`\nThen use in routes:`);
    console.log(`Route.group({ middleware: ["${name}"] }, () => { ... });\n`);
  } catch (error) {
    console.error(`\nFailed to create middleware: ${error.message}\n`);
    process.exit(1);
  }
}

function generateMiddlewareContent(name) {
  return `/**
 * ${name} middleware
 *
 * Middleware functions use the onion model:
 * - Receive ctx (context) and next (function to call the next middleware/handler)
 * - Perform pre-processing before calling await next()
 * - Perform post-processing after calling await next()
 * - Always return the result of await next() to pass the response through
 */

export async function ${name}(ctx, next) {
  // Pre-processing (runs before the handler)
  console.log(\`[\${ctx.method}] \${ctx.path}\`);

  // Call the next middleware or handler
  const result = await next();

  // Post-processing (runs after the handler)
  // You can modify the response here if needed

  return result;
}
`;
}
