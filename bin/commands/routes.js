/**
 * Routes command - displays all registered routes
 */

import { boot } from "../../bootstrap/app.js";

export default async function routes(args) {
  try {
    // Boot the application to register all routes
    const { app } = await boot();
    const routeCollection = app.routeCollection();
    const allRoutes = routeCollection.all();

    if (allRoutes.length === 0) {
      console.log("\n⚠️  No routes registered\n");
      process.exit(0);
    }

    // Group routes by method
    const routesByMethod = {};
    for (const route of allRoutes) {
      if (!routesByMethod[route.method]) {
        routesByMethod[route.method] = [];
      }
      routesByMethod[route.method].push(route);
    }

    console.log(
      "\n╔══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                      Registered Routes                       ║",
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝\n",
    );

    const methodOrder = ["GET", "POST", "PUT", "PATCH", "DELETE"];
    const methodColors = {
      GET: "\x1b[32m", // Green
      POST: "\x1b[33m", // Yellow
      PUT: "\x1b[34m", // Blue
      PATCH: "\x1b[35m", // Magenta
      DELETE: "\x1b[31m", // Red
    };
    const reset = "\x1b[0m";

    for (const method of methodOrder) {
      const methodRoutes = routesByMethod[method];
      if (!methodRoutes) continue;

      for (const route of methodRoutes) {
        const color = methodColors[method] || "";
        const methodPadded = method.padEnd(7);
        const path = route.path;
        const summary = route.meta?.summary || "";
        const middleware =
          route.middleware?.length > 0
            ? ` [${route.middleware.length} middleware]`
            : "";

        console.log(`  ${color}${methodPadded}${reset} ${path}${middleware}`);
        if (summary) {
          console.log(`          ${summary}`);
        }
      }
    }

    console.log(`\n  Total routes: ${allRoutes.length}\n`);

    // Stop the server since we're just listing routes
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Failed to load routes: ${error.message}\n`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
