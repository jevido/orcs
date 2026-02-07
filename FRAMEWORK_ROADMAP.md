# ORCS Framework Extraction Roadmap

Transform ORCS from a monolithic repository into a framework that can be installed and used in new projects.

## Current State

**Problem:**
- Framework code (`src/`) and business logic (`app/`, `routes/`) are mixed in one repo
- No way to start a new project using ORCS
- Users would have to clone this repo and delete example code

**Goal:**
- Separate framework from application code
- Publish ORCS as an installable package
- Provide a project scaffolder (`create-orcs-app`)
- Allow users to: `bunx create-orcs-app my-project`

## Proposed Architecture

```
orcs/                           # Main framework package
├── src/                        # Framework internals (what gets published)
├── bin/                        # CLI tools (orcs command)
├── package.json                # Package metadata for npm
└── README.md                   # Framework documentation

create-orcs-app/                # Project scaffolder (separate package)
├── templates/
│   └── default/                # Default project template
│       ├── app/                # Application code
│       ├── routes/             # Route definitions
│       ├── config/             # Configuration
│       ├── bootstrap/          # Bootstrap files
│       └── server.js           # Entry point
└── bin/
    └── create-orcs-app.js      # CLI tool

orcs-starter/                   # Example/reference project (separate repo)
├── app/                        # Example application
├── routes/                     # Example routes
└── ...                         # Full example app
```

## Phase 1: Package Preparation

**Goal:** Prepare the framework for npm publishing

### Tasks:

1. **Update package.json**
   - [ ] Set proper package name (e.g., `@orcs/framework` or just `orcs`)
   - [ ] Add package description and keywords
   - [ ] Set main entry point: `"main": "./src/index.js"`
   - [ ] Add bin commands: `"bin": { "orcs": "./bin/orcs.js" }`
   - [ ] Define files to include: `"files": ["src", "bin", "LICENSE"]`
   - [ ] Add repository, bugs, homepage URLs
   - [ ] Set license (MIT)
   - [ ] Add peer dependencies if needed

2. **Clean up exports**
   - [ ] Review `src/index.js` - ensure all public APIs are exported
   - [ ] Document what's public vs internal
   - [ ] Remove any business logic from `src/`

3. **Review dependencies**
   - [ ] Confirm "zero dependencies" - no production deps needed
   - [ ] Move any dev dependencies to devDependencies

4. **Add package documentation**
   - [ ] Create CHANGELOG.md
   - [ ] Add CONTRIBUTING.md
   - [ ] Add LICENSE file (MIT)

## Phase 2: Create Project Scaffolder

**Goal:** Build `create-orcs-app` to generate new projects

### Tasks:

1. **Create separate package**
   ```
   create-orcs-app/
   ├── bin/
   │   └── create-orcs-app.js    # Main CLI
   ├── templates/
   │   └── default/               # Default template
   ├── package.json
   └── README.md
   ```

2. **Build CLI tool**
   - [ ] Accept project name as argument
   - [ ] Create project directory
   - [ ] Copy template files
   - [ ] Initialize package.json with ORCS as dependency
   - [ ] Run `bun install` automatically
   - [ ] Show success message with next steps

3. **Create default template**
   - [ ] Minimal `app/` structure
   - [ ] Basic routes (health check)
   - [ ] Configuration files
   - [ ] Bootstrap files
   - [ ] server.js entry point
   - [ ] .env.example
   - [ ] .gitignore
   - [ ] README.md for new projects

4. **Template features**
   - [ ] Simple welcome route
   - [ ] Health check endpoint
   - [ ] Example controller (optional)
   - [ ] Basic service provider
   - [ ] Docker setup (optional)

## Phase 3: Repository Restructuring

**Goal:** Separate framework from example code

### Option A: Single Repo with Example

Keep everything in one repo but clearly separate framework from example:

```
orcs/
├── src/                    # Framework (published)
├── bin/                    # CLI (published)
├── example/                # Example app (NOT published)
│   ├── app/
│   ├── routes/
│   ├── config/
│   └── server.js
├── create-orcs-app/        # Scaffolder (separate package)
├── docs/                   # Documentation
├── tests/                  # Framework tests
└── package.json            # Framework package
```

### Option B: Monorepo with Workspaces

Use Bun workspaces to manage multiple packages:

```
orcs/
├── packages/
│   ├── orcs/               # Framework package
│   │   ├── src/
│   │   ├── bin/
│   │   └── package.json
│   └── create-orcs-app/    # Scaffolder package
│       └── package.json
├── example/                # Example app
└── package.json            # Root workspace config
```

### Option C: Separate Repositories

Create separate repos for clarity:

- `orcs/orcs` - Framework
- `orcs/create-orcs-app` - Scaffolder
- `orcs/starter` - Example/starter project

### Tasks (Choose Option A for simplicity):

1. **Move current app code to example/**
   - [ ] Move `app/` → `example/app/`
   - [ ] Move `routes/` → `example/routes/`
   - [ ] Move `config/` → `example/config/`
   - [ ] Move `bootstrap/` → `example/bootstrap/`
   - [ ] Move `server.js` → `example/server.js`
   - [ ] Move `.env.example` → `example/.env.example`

2. **Update package.json files array**
   - [ ] Ensure only `src/` and `bin/` are published
   - [ ] Add `.npmignore` to exclude example/, tests/, docs/

3. **Update import paths in example**
   - [ ] Change `./src/index.js` to `orcs` in example code
   - [ ] Test that example works with local framework

## Phase 4: Publishing Setup

**Goal:** Prepare for npm publishing

### Tasks:

1. **Set up npm account**
   - [ ] Create npm account if needed
   - [ ] Verify email
   - [ ] Enable 2FA

2. **Choose package name**
   - [ ] Check availability on npm
   - [ ] Options: `orcs`, `@orcs/core`, `@orcs/framework`, `orcs-framework`
   - [ ] Consider scoped package for namespace protection

3. **Versioning strategy**
   - [ ] Start with 0.1.0 (beta)
   - [ ] Use semantic versioning
   - [ ] Document breaking changes

4. **Pre-publish checklist**
   - [ ] Run `bun test` - all tests pass
   - [ ] Run `npm pack` - review package contents
   - [ ] Test local installation in new project
   - [ ] Update README with installation instructions

5. **Publish**
   - [ ] `npm publish --access public` (if scoped)
   - [ ] Tag release on GitHub
   - [ ] Announce on social media

## Phase 5: Developer Experience

**Goal:** Make ORCS easy to adopt and use

### Tasks:

1. **Update main README**
   - [ ] Add installation instructions
   - [ ] Show `bunx create-orcs-app` usage
   - [ ] Update examples to use package import
   - [ ] Add "Creating a Project" guide

2. **Create new guides**
   - [ ] docs/installation.md
   - [ ] docs/getting-started.md
   - [ ] docs/upgrading.md

3. **Add examples**
   - [ ] Simple API example
   - [ ] WebSocket chat example
   - [ ] Job queue example
   - [ ] Full-stack app example

4. **Testing the DX**
   - [ ] Test creating new project: `bunx create-orcs-app test-app`
   - [ ] Test following quick start guide
   - [ ] Get feedback from fresh users

## Phase 6: Ecosystem & Tooling

**Goal:** Build supporting tools and resources

### Tasks:

1. **CLI enhancements**
   - [ ] `orcs new <name>` - create new project (alternative to create-orcs-app)
   - [ ] `orcs add <feature>` - add features to existing project
   - [ ] `orcs upgrade` - upgrade framework version

2. **Starter templates**
   - [ ] Minimal template (API only)
   - [ ] Full template (with DB, auth, etc.)
   - [ ] Microservice template
   - [ ] Monolith template

3. **IDE extensions**
   - [ ] VS Code snippets
   - [ ] Route autocomplete
   - [ ] OpenAPI preview

4. **Community**
   - [ ] Create Discord server
   - [ ] Set up GitHub Discussions
   - [ ] Create example projects repo

## Implementation Steps (Recommended Order)

### Step 1: Quick Win - Make it Installable (1-2 hours)
1. Update package.json with proper metadata
2. Test local installation: `bun link` in framework, `bun link orcs` in test project
3. Verify imports work: `import { Route } from "orcs"`

### Step 2: Create Scaffolder (2-3 hours)
1. Build basic `create-orcs-app` CLI
2. Create minimal template
3. Test end-to-end: scaffold → install → run

### Step 3: Restructure Repo (1-2 hours)
1. Move current code to `example/`
2. Update paths and imports
3. Add `.npmignore`

### Step 4: Publish (1 hour)
1. Choose package name
2. Test with `npm pack`
3. Publish to npm
4. Test installation: `bunx create-orcs-app test`

### Step 5: Polish (ongoing)
1. Update documentation
2. Create more examples
3. Get community feedback

## Success Criteria

✅ Users can run: `bunx create-orcs-app my-app`
✅ Generated project has ORCS as a dependency in package.json
✅ Generated project imports from `orcs`, not local paths
✅ Framework can be updated independently: `bun update orcs`
✅ Documentation clearly shows how to start new projects
✅ Example app demonstrates framework usage without being part of it

## Breaking Changes to Consider

When separating framework from app, these changes might be needed:

1. **Import paths**
   - Before: `import { Route } from "./src/index.js"`
   - After: `import { Route } from "orcs"`

2. **Configuration**
   - Framework should not depend on specific config file locations
   - Make paths configurable

3. **CLI commands**
   - `bun orcs` should work when ORCS is installed as dependency
   - Need to resolve bin path correctly

4. **File structure assumptions**
   - Framework shouldn't assume `app/`, `routes/` exist
   - Let users organize their code however they want

## Next Steps

Choose an approach and start with Step 1 (Quick Win) to validate the concept before doing full restructure.

**Recommended: Start with Option A (Single Repo with Example)**
- Simplest to maintain
- Easy to test changes
- Example serves as integration test
- Can split later if needed

Would you like to proceed with this approach?
