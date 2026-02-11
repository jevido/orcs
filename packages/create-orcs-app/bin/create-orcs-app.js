#!/usr/bin/env bun

import { mkdirSync, cpSync, existsSync } from "fs";
import { join } from "path";
import { $ } from "bun";

const projectName = process.argv[2];

if (!projectName) {
  console.error("Error: Project name is required\n");
  console.log("Usage: bunx @jevido/create-orcs-app <project-name>\n");
  console.log("Example:");
  console.log("  bunx @jevido/create-orcs-app my-api");
  process.exit(1);
}

const projectPath = join(process.cwd(), projectName);

if (existsSync(projectPath)) {
  console.error(`Error: Directory "${projectName}" already exists`);
  process.exit(1);
}

console.log(`\n🚀 Creating ORCS project: ${projectName}\n`);

// Ask user what type of project
console.log("What would you like to create?\n");
console.log("  1) 📦 Example app - Full featured with all ORCS capabilities demonstrated");
console.log("     • Authentication (JWT)");
console.log("     • Database with migrations");
console.log("     • WebSockets (chat, echo, notifications)");
console.log("     • Background jobs");
console.log("     • Docker Compose setup");
console.log("     • All example code and documentation");
console.log("");
console.log("  2) 🏗️  Skeleton app - Clean structure, ready for your code");
console.log("     • Minimal boilerplate");
console.log("     • Basic health endpoint");
console.log("     • Empty directories for your code");
console.log("     • Ready to build from scratch");
console.log("");

const choice = prompt("Choose [1-2]:");

let templateName = "example";

if (choice === "2") {
  templateName = "skeleton";
} else if (choice !== "1") {
  console.log("\n⚠️  Invalid choice, using example template as default.\n");
}

const templatePath = join(import.meta.dir, `../templates/${templateName}`);

if (!existsSync(templatePath)) {
  console.error(`Error: Template "${templateName}" not found`);
  process.exit(1);
}

console.log(templateName === "skeleton"
  ? `\n🏗️  Creating clean skeleton app...\n`
  : `\n📦 Creating example app with full features...\n`
);

// Create project directory
mkdirSync(projectPath, { recursive: true });

// Copy template
cpSync(templatePath, projectPath, { recursive: true });

// Create package.json
const packageJson = {
  name: projectName,
  version: "0.1.0",
  type: "module",
  scripts: {
    dev: "bun --watch server.js",
    start: "bun server.js",
    test: "bun test",
  },
  dependencies: {
    "@jevido/orcs": "latest",
  },
};

await Bun.write(
  join(projectPath, "package.json"),
  JSON.stringify(packageJson, null, 2)
);

// Create .npmrc for GitHub Packages
const npmrc = `@jevido:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}
`;

await Bun.write(join(projectPath, ".npmrc"), npmrc);

// Create .env file
const env = `# Application
APP_NAME=${projectName}
APP_ENV=development
APP_URL=http://localhost:42069
PORT=42069

# GitHub Token (for package installation)
# Generate at: https://github.com/settings/tokens
# GITHUB_TOKEN=your_token_here
`;

await Bun.write(join(projectPath, ".env"), env);

// Install dependencies
console.log(`📦 Installing dependencies...\n`);

try {
  await $`cd ${projectPath} && bun install`;
} catch (error) {
  console.error("\n⚠️  Installation failed.");
  console.error("Make sure GITHUB_TOKEN is set:");
  console.error("  export GITHUB_TOKEN=your_token_here\n");
  process.exit(1);
}

// Success message
if (templateName === "skeleton") {
  console.log(`
Created ${projectName} (skeleton)

Your clean ORCS project is ready!

Next steps:
  cd ${projectName}

  # Start building
  bun orcs make:controller UserController
  bun orcs make:migration create_users_table

  # Start development server
  bun run dev

Visit http://localhost:42069/docs

📚 Documentation: https://github.com/jevido/orcs
`);
} else {
  console.log(`
Created ${projectName} (example app)

Your ORCS project with full examples is ready!

Next steps:
  cd ${projectName}

  # Optional: Start services (PostgreSQL, Redis, MinIO, Mailpit)
  docker compose up -d

  # Copy and configure environment
  cp .env.example .env

  # Run migrations
  bun orcs db:migrate

  # Start development server
  bun run dev

Visit http://localhost:42069/docs

Features included:
  • Authentication endpoints (JWT)
  • Database examples with migrations
  • WebSocket servers (echo, chat, notifications)
  • Background jobs
  • Docker Compose setup
  • Complete documentation

📚 Documentation: https://github.com/jevido/orcs
`);
}
