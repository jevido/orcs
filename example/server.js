import { boot } from "./bootstrap/app.js";

const { server } = await boot();

console.log(`ORCS running on ${server.url}`);
