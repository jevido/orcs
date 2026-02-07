/**
 * Serve command - starts the HTTP server
 */

// Import from user's project directory, not framework
const { boot } = await import(process.cwd() + "/bootstrap/app.js");

export default async function serve(args) {
  console.log("🚀 Starting ORCS server...\n");

  try {
    const { server, app } = await boot();

    const port = app.config.get("http.port", 3000);
    const env = app.config.get("app.env", "development");
    const appName = app.config.get("app.name", "ORCS");

    console.log(`✅ ${appName} is running!`);
    console.log(``);
    console.log(`   Environment: ${env}`);
    console.log(`   Port:        ${port}`);
    console.log(`   URL:         ${server.url.origin}`);
    console.log(``);
    console.log(`   Health:      ${server.url.origin}/api/health`);
    console.log(`   Docs:        ${server.url.origin}/docs`);
    console.log(`   OpenAPI:     ${server.url.origin}/openapi.json`);
    console.log(``);
    console.log(`Press Ctrl+C to stop\n`);

    // Keep the process running
    await new Promise(() => {});
  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
