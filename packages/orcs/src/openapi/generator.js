import { openApiRegistry } from "./registry.js";

export function generateOpenApiDocument() {
  const info = openApiRegistry.getInfo();
  const paths = openApiRegistry.getPaths();

  return {
    openapi: "3.1.0",
    info: {
      title: info.title,
      version: info.version,
      ...(info.description ? { description: info.description } : {}),
    },
    paths,
  };
}
