# CLI Tooling

ORCS includes a command-line interface for common tasks:

```bash
bun orcs <command> [options]
```

## CLI Alias (Optional)

For convenience, you can create a shell alias to run `orcs` without typing `bun`:

**Option 1: Shell Alias (Bash/Zsh)**

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
alias orcs="bun orcs"
```

Or for a global alias that works in any ORCS project:

```bash
# Detect your shell and add the alias
if [ -f ~/.zshrc ]; then
  echo 'alias orcs="bun orcs"' >> ~/.zshrc
  source ~/.zshrc
  echo "✅ Added to ~/.zshrc"
elif [ -f ~/.bashrc ]; then
  echo 'alias orcs="bun orcs"' >> ~/.bashrc
  source ~/.bashrc
  echo "✅ Added to ~/.bashrc"
fi

# Test it
orcs --help

```

Then reload your shell:

```bash
source ~/.bashrc  # or source ~/.zshrc
```

Now you can run:

```bash
orcs serve
orcs routes
orcs test
orcs make:controller UserController
```

**Option 2: Add to PATH**

Make the CLI globally accessible:

```bash
# Make executable (if not already)
chmod +x bin/orcs.js

# Create a symlink in your local bin
mkdir -p ~/.local/bin
ln -s $(pwd)/bin/orcs.js ~/.local/bin/orcs

# Make sure ~/.local/bin is in your PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## Available Commands

**Server Management:**

```bash
# Start the HTTP server
bun orcs serve
```

**Introspection:**

```bash
# List all registered routes
bun orcs routes
```

**Testing:**

```bash
# Run the test suite
bun orcs test

# Run specific test file
bun orcs test tests/model.test.js

# Run tests with additional Bun test options
bun orcs test --watch
```

**Code Generation:**

```bash
# Generate a new controller
bun orcs make:controller UserController

# Generate a new middleware
bun orcs make:middleware auth

# Generate a new service provider
bun orcs make:provider CacheServiceProvider
```

## Examples

**Creating a resource controller:**

```bash
bun orcs make:controller PostController
```

Generates `app/controllers/post-controller.js` with CRUD methods (index, store, show, update, destroy).

**Creating middleware:**

```bash
bun orcs make:middleware rateLimit
```

Generates `app/middleware/rate-limit.js` with the onion model pattern already set up.

**Viewing routes:**

```bash
bun orcs routes
```

Displays a formatted table of all registered routes with their methods, paths, and metadata.
