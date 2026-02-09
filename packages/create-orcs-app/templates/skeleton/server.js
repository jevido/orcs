import { boot } from "./bootstrap/app.js";

const { server } = await boot();

console.log(`🚀 ORCS running on ${server.url}`);
console.log(`📚 Docs: ${server.url}docs`);
