/**
 * ORCS Application Entry Point
 */
import { boot } from "./bootstrap/app.js";

const { server, app } = await boot();

console.log(`🚀 ${app.config.get("app.name")} is running!`);
console.log(`   URL: ${server.url.origin}`);
console.log(`   Docs: ${server.url.origin}/docs`);
