import { compilePath } from "./route-compiler.js";
import { RouteCollection } from "./route-collection.js";
import { openApiRegistry } from "../openapi/registry.js";

const collection = new RouteCollection();
const globalMiddleware = [];
const namedMiddleware = {};
const groupStack = [];

function currentGroup() {
  if (groupStack.length === 0) return { prefix: "", tags: [], middleware: [] };
  
  return groupStack.reduce(
    (merged, group) => ({
      prefix: merged.prefix + (group.prefix || ""),
      tags: [...merged.tags, ...(group.tags || [])],
      middleware: [...merged.middleware, ...(group.middleware || [])],
    }),
    { prefix: "", tags: [], middleware: [] },
  );
}

function resolveMiddleware(names) {
  if (!names || names.length === 0) return [];
  return names.map((name) => {
    if (typeof name === "function") return name;
    const [key, ...args] = name.split(":");
    const fn = namedMiddleware[key];
    if (!fn) throw new Error(`Unknown middleware: ${key}`);
    if (args.length > 0) return (ctx, next) => fn(ctx, next, ...args);
    return fn;
  });
}

function addRoute(method, path, meta, handler) {
  const group = currentGroup();
  const fullPath = group.prefix + path;
  const compiled = compilePath(fullPath);
  const routeMiddleware = resolveMiddleware(group.middleware);

  const route = {
    method: method.toUpperCase(),
    path: fullPath,
    compiled,
    handler: handler,
    middleware: routeMiddleware,
    meta: {
      ...meta,
      tags: [...group.tags, ...(meta.tags || [])],
    },
  };

  collection.add(route);
  openApiRegistry.addPath(fullPath, method.toLowerCase(), route.meta);

  return route;
}

export const Route = {
  get: (path, meta, handler) => addRoute("GET", path, meta, handler),
  post: (path, meta, handler) => addRoute("POST", path, meta, handler),
  put: (path, meta, handler) => addRoute("PUT", path, meta, handler),
  patch: (path, meta, handler) => addRoute("PATCH", path, meta, handler),
  delete: (path, meta, handler) => addRoute("DELETE", path, meta, handler),

  group(options, fn) {
    groupStack.push(options);
    try {
      const result = fn();
      if (result && typeof result.then === "function") {
        return result.finally(() => {
          groupStack.pop();
        });
      }
      groupStack.pop();
      return result;
    } catch (error) {
      groupStack.pop();
      throw error;
    }
  },

  use(fn) {
    globalMiddleware.push(fn);
  },

  middleware(name, fn) {
    namedMiddleware[name] = fn;
  },

  list() {
    return collection.all();
  },

  collection() {
    return collection;
  },

  globalMiddleware() {
    return [...globalMiddleware];
  },
};
