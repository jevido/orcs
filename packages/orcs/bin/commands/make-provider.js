/**
 * make:provider command - generates a new service provider
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

export default async function makeProvider(args) {
  if (args.length === 0) {
    console.error("\nProvider name is required");
    console.log("\nUsage: bun orcs make:provider <ProviderName>\n");
    console.log("Examples:");
    console.log("  bun orcs make:provider CacheServiceProvider");
    console.log("  bun orcs make:provider DatabaseServiceProvider\n");
    process.exit(1);
  }

  const name = args[0];

  // Ensure name ends with "ServiceProvider" or "Provider"
  let providerName = name;
  if (!providerName.endsWith("Provider")) {
    providerName = providerName.endsWith("Service")
      ? `${providerName}Provider`
      : `${providerName}ServiceProvider`;
  }

  // Convert to kebab-case for filename
  const fileName = providerName
    .replace(/ServiceProvider$/, "-service-provider")
    .replace(/Provider$/, "-provider")
    .replace(/([A-Z])/g, (match, letter, index) =>
      index === 0 ? letter.toLowerCase() : `-${letter.toLowerCase()}`,
    );

  const filePath = resolve(process.cwd(), "app", "providers", `${fileName}.js`);

  // Check if file already exists
  if (existsSync(filePath)) {
    console.error(`\nProvider already exists: ${filePath}\n`);
    process.exit(1);
  }

  // Ensure directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Generate provider content
  const content = generateProviderContent(providerName);

  // Write file
  try {
    writeFileSync(filePath, content, "utf-8");
    console.log(`\nProvider created: ${filePath}`);
    console.log(`\nRegister in bootstrap/providers.js:`);
    console.log(
      `\nimport { ${providerName} } from "../app/providers/${fileName}.js";`,
    );
    console.log(`\nexport default [`);
    console.log(`  AppServiceProvider,`);
    console.log(`  RouteServiceProvider,`);
    console.log(`  ${providerName}, // Add this line`);
    console.log(`];\n`);
  } catch (error) {
    console.error(`\nFailed to create provider: ${error.message}\n`);
    process.exit(1);
  }
}

function generateProviderContent(className) {
  return `import { ServiceProvider } from "../../src/core/service-provider.js";

/**
 * ${className}
 *
 * Service providers manage the application boot lifecycle.
 * Use register() for immediate setup and boot() for deferred initialization.
 */

export class ${className} extends ServiceProvider {
  /**
   * Register services
   *
   * Called immediately when the provider is registered.
   * Use this to register middleware, bind services, or configure the app.
   */
  register() {
    // Example: Register middleware
    // this.app.registerMiddleware({
    //   myMiddleware: async (ctx, next) => {
    //     await next();
    //   },
    // });

    // Example: Add configuration
    // this.app.config.set("myService.enabled", true);
  }

  /**
   * Boot services
   *
   * Called after ALL providers are registered.
   * Safe to depend on other providers' registrations here.
   * Can be async for database connections, external API calls, etc.
   */
  async boot() {
    // Example: Connect to a service
    // if (this.app.config.get("myService.enabled")) {
    //   await this.connectToService();
    // }

    // Example: Load additional routes
    // await import("../../routes/admin.js");
  }

  /**
   * Example helper method
   */
  // async connectToService() {
  //   // Connect to external service
  // }
}
`;
}
