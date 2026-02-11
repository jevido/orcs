/**
 * Serve worker entrypoint - executed by the serve cluster manager.
 */

const { boot } = await import(process.cwd() + "/bootstrap/app.js");

try {
  const { server, app } = await boot();

  if (process.env.ORCS_CLUSTER_PRIMARY === "1") {
    const port = app.config.get("http.port", 3000);
    const env = app.config.get("app.env", "development");
    const appName = app.config.get("app.name", "ORCS");

    console.log(`${appName} is running!`);
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
  }
} catch (error) {
  console.error(`Failed to start server: ${error.message}`);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}
