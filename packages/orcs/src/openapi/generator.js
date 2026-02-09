import { openApiRegistry } from "./registry.js";

export function generateOpenApiDocument() {
  const info = openApiRegistry.getInfo();
  const paths = openApiRegistry.getPaths();
  const components = openApiRegistry.getComponents();
  const security = openApiRegistry.getGlobalSecurity();

  const document = {
    openapi: "3.1.0",
    info: {
      title: info.title,
      version: info.version,
      ...(info.description ? { description: info.description } : {}),
    },
    paths,
  };

  if (components && Object.keys(components).length > 0) {
    document.components = components;
  }

  if (security) {
    document.security = security;
  }

  return document;
}
