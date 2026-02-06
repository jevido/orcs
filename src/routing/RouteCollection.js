import { matchPath } from "./RouteCompiler.js";

/**
 * Stores all registered routes and provides lookup by method + path.
 * Routes are sorted by score (specificity) for correct matching.
 */
export class RouteCollection {
  #routes = [];

  add(route) {
    this.#routes.push(route);
  }

  match(method, path) {
    const candidates = this.#routes
      .filter((r) => r.method === method.toUpperCase())
      .sort((a, b) => b.compiled.score - a.compiled.score);

    for (const route of candidates) {
      const params = matchPath(route.compiled, path);
      if (params !== null) {
        return { route, params };
      }
    }

    return null;
  }

  methodsFor(path) {
    const methods = new Set();
    for (const route of this.#routes) {
      const params = matchPath(route.compiled, path);
      if (params !== null) {
        methods.add(route.method);
      }
    }
    return [...methods];
  }

  all() {
    return [...this.#routes];
  }
}
