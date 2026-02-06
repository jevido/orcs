import { compilePath } from "./RouteCompiler.js";
import { RouteCollection } from "./RouteCollection.js";
import { openApiRegistry } from "../openapi/Registry.js";

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

function addRoute(method, path, metaOrHandler, handler) {
  let meta = {};
  let routeHandler;

  if (typeof metaOrHandler === "function") {
    routeHandler = metaOrHandler;
  } else {
    meta = metaOrHandler || {};
    routeHandler = handler;
  }

  const group = currentGroup();
  const fullPath = group.prefix + path;
  const compiled = compilePath(fullPath);
  const routeMiddleware = resolveMiddleware(group.middleware);

  const route = {
    method: method.toUpperCase(),
    path: fullPath,
    compiled,
    handler: routeHandler,
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
  get: (path, metaOrHandler, handler) =>
    addRoute("GET", path, metaOrHandler, handler),
  post: (path, metaOrHandler, handler) =>
    addRoute("POST", path, metaOrHandler, handler),
  put: (path, metaOrHandler, handler) =>
    addRoute("PUT", path, metaOrHandler, handler),
  patch: (path, metaOrHandler, handler) =>
    addRoute("PATCH", path, metaOrHandler, handler),
  delete: (path, metaOrHandler, handler) =>
    addRoute("DELETE", path, metaOrHandler, handler),

  group(options, fn) {
    groupStack.push(options);
    fn();
    groupStack.pop();
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
