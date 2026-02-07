#!/usr/bin/env bun

import { mkdirSync, cpSync, existsSync } from "fs";
import { join } from "path";
import { $ } from "bun";

const projectName = process.argv[2];

if (!projectName) {
  console.error("❌ Error: Project name is required\n");
  console.log("Usage: bunx @jevido/create-orcs-app <project-name>\n");
  console.log("Example:");
  console.log("  bunx @jevido/create-orcs-app my-api");
  process.exit(1);
}

const projectPath = join(process.cwd(), projectName);

if (existsSync(projectPath)) {
  console.error(`❌ Error: Directory "${projectName}" already exists`);
  process.exit(1);
}

console.log(`\n🚀 Creating ORCS project: ${projectName}\n`);

// Create project directory
mkdirSync(projectPath, { recursive: true });

// Copy template
const templatePath = join(import.meta.dir, "../templates/default");
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
console.log(`
✅ Created ${projectName}

Next steps:
  cd ${projectName}
  bun run dev

Visit http://localhost:42069/docs

📚 Documentation: https://github.com/jevido/orcs
`);
