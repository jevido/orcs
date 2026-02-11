# ORCS Framework with GitHub Packages

Use GitHub Packages registry to distribute ORCS framework. Free, integrated with GitHub, works great with Bun.

## Why GitHub Packages?

- Free for public packages
- Integrated with GitHub (same permissions, releases, etc.)
- Works with Bun's package manager
- Private packages included with GitHub subscription
- No separate registry account needed
- Scoped to your GitHub username/org

## How GitHub Packages Works

GitHub Packages uses npm-compatible protocol, so Bun works seamlessly:

```bash
# Publish (you)
bun publish

# Install (users)
bun add @yourusername/orcs
```

**Package will be at:** `https://github.com/yourusername/orcs/packages`

## Architecture

```
orcs/                               # Main repo
├── packages/
│   ├── orcs/                       # @yourusername/orcs
│   │   ├── src/                    # Framework code
│   │   ├── bin/                    # CLI tools
│   │   ├── package.json            # With GitHub registry config
│   │   └── .npmrc                  # GitHub Packages config
│   │
│   └── create-orcs-app/            # @yourusername/create-orcs-app
│       ├── bin/
│       ├── templates/
│       ├── package.json
│       └── .npmrc
│
├── example/                         # Example app (not published)
│   ├── app/
│   ├── routes/
│   └── server.js
│
├── bunfig.toml                      # Bun workspace config
└── package.json                     # Root workspace
```

## Step-by-Step Implementation

### Step 1: Set Up GitHub Packages (15 min)

1. **Create Personal Access Token (PAT)**

   Go to: https://github.com/settings/tokens

   Click: "Generate new token (classic)"

   Scopes needed:
   - `write:packages` - Upload packages
   - `read:packages` - Download packages
   - `delete:packages` - Delete packages (optional)

   Save token somewhere safe: `ghp_xxxxxxxxxxxxxxxxxxxx`

2. **Configure Git**

   ```bash
   # Add to your shell profile (~/.bashrc, ~/.zshrc)
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

3. **Test authentication**

   ```bash
   # Should return your username
   curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
   ```

### Step 2: Restructure Repository (1 hour)

```bash
# Create workspace structure
mkdir -p packages/orcs packages/create-orcs-app example

# Move framework code
mv src packages/orcs/
mv bin packages/orcs/
mv tests packages/orcs/

# Move app to example
mv app routes config bootstrap server.js .env.example example/

# Move docs (stays at root for GitHub Pages)
# docs/ stays at root
```

### Step 3: Configure Framework Package (30 min)

**packages/orcs/package.json:**

```json
{
  "name": "@yourusername/orcs",
  "version": "0.1.0",
  "description": "Opinionated Runtime for Contractual Services",
  "type": "module",
  "main": "./src/index.js",
  "exports": {
    ".": "./src/index.js"
  },
  "bin": {
    "orcs": "./bin/orcs.js"
  },
  "files": [
    "src",
    "bin",
    "LICENSE",
    "README.md"
  ],
  "scripts": {
    "test": "bun test",
    "prepublishOnly": "bun test"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/orcs.git"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "keywords": ["bun", "framework", "api", "openapi", "contract-first"],
  "author": "Your Name",
  "license": "MIT"
}
```

**packages/orcs/.npmrc:**

```ini
@yourusername:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### Step 4: Configure Create App Package (30 min)

**packages/create-orcs-app/package.json:**

```json
{
  "name": "@yourusername/create-orcs-app",
  "version": "0.1.0",
  "description": "Create ORCS applications",
  "type": "module",
  "bin": {
    "create-orcs-app": "./bin/create-orcs-app.js"
  },
  "files": [
    "bin",
    "templates"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/orcs.git",
    "directory": "packages/create-orcs-app"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "keywords": ["orcs", "scaffolding", "cli"],
  "author": "Your Name",
  "license": "MIT"
}
```

**packages/create-orcs-app/.npmrc:**

```ini
@yourusername:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**packages/create-orcs-app/bin/create-orcs-app.js:**

```javascript
#!/usr/bin/env bun

import { mkdirSync, cpSync, existsSync } from "fs";
import { join } from "path";
import { $ } from "bun";

const projectName = process.argv[2];

if (!projectName) {
  console.error("Usage: bunx @yourusername/create-orcs-app <project-name>");
  process.exit(1);
}

const projectPath = join(process.cwd(), projectName);

if (existsSync(projectPath)) {
  console.error(`Error: Directory ${projectName} already exists`);
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
    "@yourusername/orcs": "latest",
  },
};

await Bun.write(
  join(projectPath, "package.json"),
  JSON.stringify(packageJson, null, 2)
);

// Create .npmrc for GitHub Packages
const npmrc = `@yourusername:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}
`;

await Bun.write(join(projectPath, ".npmrc"), npmrc);

// Create .env.example
const envExample = `# Add your GitHub token for package installation
GITHUB_TOKEN=your_github_token_here

# Application
APP_NAME=${projectName}
APP_ENV=development
APP_URL=http://localhost:42069
PORT=42069
`;

await Bun.write(join(projectPath, ".env.example"), envExample);

// Install dependencies
console.log(`📦 Installing dependencies...\n`);
try {
  await $`cd ${projectPath} && bun install`;
} catch (error) {
  console.error("\n⚠️  Installation failed. Make sure GITHUB_TOKEN is set:");
  console.error("   export GITHUB_TOKEN=your_token_here\n");
  process.exit(1);
}

// Success message
console.log(`
Created ${projectName}

Next steps:
  cd ${projectName}

  # Set your GitHub token (if not already set)
  export GITHUB_TOKEN=your_token_here

  # Start the server
  bun run dev

Visit http://localhost:42069/docs

Documentation: https://github.com/yourusername/orcs
`);
```

### Step 5: Create Template (30 min)

**packages/create-orcs-app/templates/default/server.js:**

```javascript
import { createServer } from "@yourusername/orcs";

const app = await createServer({
  basePath: import.meta.dir,
});

await app.serve({
  port: process.env.PORT || 42069,
});

console.log(`🚀 Server running on http://localhost:${app.config.get("http.port")}`);
```

**packages/create-orcs-app/templates/default/routes/api.js:**

```javascript
import { Route } from "@yourusername/orcs";

Route.get(
  "/api/health",
  {
    summary: "Health check",
    responses: {
      200: { description: "Service is healthy" },
    },
  },
  (ctx) => ctx.json({ status: "ok", timestamp: new Date().toISOString() })
);
```

(Copy other template files from current `app/`, `config/`, `bootstrap/`)

### Step 6: Configure Bun Workspace (15 min)

**bunfig.toml (root):**

```toml
[install]
# Use GitHub Packages for @yourusername scope
scopes = {
  "@yourusername" = "https://npm.pkg.github.com"
}

[install.cache]
# Cache packages locally
dir = ".bun-cache"

[workspace]
members = [
  "packages/*"
]
```

**package.json (root):**

```json
{
  "name": "orcs-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "example"
  ],
  "scripts": {
    "test": "bun test packages/orcs/tests",
    "publish:framework": "cd packages/orcs && bun publish",
    "publish:cli": "cd packages/create-orcs-app && bun publish",
    "publish:all": "bun run publish:framework && bun run publish:cli"
  }
}
```

### Step 7: Update Example App (15 min)

**example/package.json:**

```json
{
  "name": "orcs-example",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch server.js",
    "start": "bun server.js",
    "test": "bun test"
  },
  "dependencies": {
    "@yourusername/orcs": "workspace:*"
  }
}
```

**example/.npmrc:**

```ini
@yourusername:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**Update imports in example/:**

```bash
# Find and replace in all example files
cd example
find . -name "*.js" -type f -exec sed -i 's|from "\.\./src/|from "@yourusername/orcs/|g' {} +
find . -name "*.js" -type f -exec sed -i 's|from "\.\./\.\./src/|from "@yourusername/orcs/|g' {} +
find . -name "*.js" -type f -exec sed -i 's|from "\./src/|from "@yourusername/orcs/|g' {} +
```

### Step 8: Test Locally (30 min)

```bash
# Install all workspace dependencies
bun install

# Test framework
cd packages/orcs
bun test

# Test example app
cd ../../example
bun run dev
# Visit http://localhost:42069
```

### Step 9: Publish to GitHub Packages (15 min)

```bash
# Make sure GITHUB_TOKEN is set
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Publish framework
cd packages/orcs
bun publish

# Publish CLI
cd ../create-orcs-app
bun publish
```

**Note:** First publish will create packages at:
- `https://github.com/yourusername/orcs/packages`

### Step 10: Configure GitHub Repository (10 min)

1. **Set package visibility to public** (if not already)
   - Go to package settings
   - Change visibility to "Public"

2. **Link package to repository**
   - GitHub should auto-link based on repository field
   - Verify at: `https://github.com/yourusername/orcs/packages`

3. **Add package badge to README**

   ```markdown
   [![GitHub Package](https://img.shields.io/github/v/release/yourusername/orcs?label=package)](https://github.com/yourusername/orcs/packages)
   ```

## User Experience

### For Users: Installing the Framework

1. **Set up GitHub token** (one-time)

   ```bash
   # Generate token at: https://github.com/settings/tokens
   # Needs: read:packages scope

   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

   # Add to shell profile for persistence
   echo 'export GITHUB_TOKEN=ghp_xxxx' >> ~/.zshrc
   ```

2. **Create project**

   ```bash
   bunx @yourusername/create-orcs-app my-project
   cd my-project
   bun run dev
   ```

3. **Or install manually**

   ```bash
   mkdir my-project
   cd my-project

   # Create .npmrc
   echo '@yourusername:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}' > .npmrc

   # Install
   bun add @yourusername/orcs
   ```

### Updating the Framework

```bash
bun update @yourusername/orcs
```

## Documentation Updates

### Update README.md (root)

```markdown
# ORCS

**Opinionated Runtime for Contractual Services**

## Installation

### Quick Start

```bash
# Set up GitHub token (one-time)
export GITHUB_TOKEN=your_github_token_here

# Create new project
bunx @yourusername/create-orcs-app my-project
cd my-project
bun run dev
```

### Manual Installation

```bash
# Create .npmrc
echo '@yourusername:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}' > .npmrc

# Install ORCS
bun add @yourusername/orcs
```

### Getting a GitHub Token

1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scope: `read:packages`
4. Copy token and export: `export GITHUB_TOKEN=ghp_xxx`

## Usage

```javascript
import { Route } from "@yourusername/orcs";

Route.get("/api/hello", {
  summary: "Say hello",
  responses: { 200: { description: "Success" } }
}, (ctx) => ctx.json({ message: "Hello, ORCS!" }));
```

[Rest of README...]
```

### Add docs/installation.md

```markdown
# Installation

## Prerequisites

- Bun 1.0 or higher
- GitHub account (for package access)
- GitHub Personal Access Token

## Getting a GitHub Token

ORCS is distributed via GitHub Packages, which requires authentication:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "ORCS Package Access"
4. Select scope: `read:packages`
5. Click "Generate token"
6. Copy the token: `ghp_xxxxxxxxxxxxxxxxxxxx`

**Save it somewhere safe!** You'll need it for installation.

## Setting Up Your Token

Add to your shell profile for persistent access:

```bash
# ~/.zshrc or ~/.bashrc
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

## Creating a New Project

### Option 1: Using create-orcs-app (Recommended)

```bash
bunx @yourusername/create-orcs-app my-project
cd my-project
bun run dev
```

This will:
- Create project structure
- Install dependencies
- Set up configuration
- Initialize git

### Option 2: Manual Setup

```bash
# Create project
mkdir my-project
cd my-project

# Create .npmrc for GitHub Packages
cat > .npmrc << 'EOF'
@yourusername:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
EOF

# Initialize package.json
cat > package.json << 'EOF'
{
  "name": "my-project",
  "type": "module",
  "dependencies": {
    "@yourusername/orcs": "latest"
  }
}
EOF

# Install
bun install

# Create server.js
cat > server.js << 'EOF'
import { createServer } from "@yourusername/orcs";

const app = await createServer();
await app.serve({ port: 42069 });
EOF

# Run
bun run server.js
```

## Troubleshooting

### Error: Unauthorized

```
error: GET https://npm.pkg.github.com/@yourusername/orcs - Unauthorized
```

**Solution:** Make sure GITHUB_TOKEN is set and has `read:packages` scope.

```bash
# Check if token is set
echo $GITHUB_TOKEN

# If not set
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### Error: Package not found

Make sure the package name in your `.npmrc` matches:

```ini
@yourusername:registry=https://npm.pkg.github.com
```

### Clearing Cache

If you're having issues, try clearing Bun's cache:

```bash
rm -rf .bun-cache
bun install --force
```
```

## Advantages of GitHub Packages

1. **Free for public packages** - No cost
2. **Integrated permissions** - Uses GitHub access control
3. **Automatic linking** - Packages linked to releases/tags
4. **Private packages** - Included with GitHub subscription
5. **Works with Bun** - Full compatibility
6. **No separate account** - Use existing GitHub account

## CI/CD with GitHub Actions

**Auto-publish on release:**

**.github/workflows/publish.yml:**

```yaml
name: Publish Packages

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test

      - name: Publish framework
        run: cd packages/orcs && bun publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Publish CLI
        run: cd packages/create-orcs-app && bun publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Migration Checklist

- [ ] Generate GitHub Personal Access Token
- [ ] Set GITHUB_TOKEN environment variable
- [ ] Restructure repository (workspace setup)
- [ ] Update package.json files with GitHub registry
- [ ] Create .npmrc files
- [ ] Update imports in example app
- [ ] Test locally with workspace
- [ ] Publish packages to GitHub
- [ ] Set packages to public visibility
- [ ] Update README with installation instructions
- [ ] Add installation documentation
- [ ] Test creating new project
- [ ] Set up CI/CD for auto-publishing

## Next Steps

Ready to implement this? We can start with the restructuring and then publish to GitHub Packages.

Want me to start with Step 2 (restructuring the repository)?
