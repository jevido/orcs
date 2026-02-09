import {
  normalizeRequestBody,
  normalizeResponses,
  normalizeParameters,
} from "./schema-builder.js";

class OpenApiRegistry {
  #paths = {};
  #info = { title: "ORCS API", version: "0.1.0" };
  #components = { securitySchemes: {} };
  #globalSecurity = undefined;

  setInfo(info) {
    this.#info = { ...this.#info, ...info };
  }

  setComponents(components = {}) {
    if (!components || typeof components !== "object") return;
    this.#components = { ...this.#components, ...components };
  }

  addSecuritySchemes(schemes = {}) {
    if (!schemes || typeof schemes !== "object") return;
    this.#components.securitySchemes = {
      ...this.#components.securitySchemes,
      ...schemes,
    };
  }

  setGlobalSecurity(security) {
    if (!security) return;
    this.#globalSecurity = security;
  }

  addPath(path, method, meta) {
    if (!meta || (!meta.summary && !meta.responses && !meta.requestBody)) {
      return;
    }

    // Convert :param to {param} for OpenAPI path format
    const openApiPath = path.replace(/:([^/]+)/g, "{$1}");
    const pathParams = Array.from(openApiPath.matchAll(/\{([^}]+)\}/g)).map(
      ([, name]) => name,
    );

    if (!this.#paths[openApiPath]) {
      this.#paths[openApiPath] = {};
    }

    const operation = {};
    if (meta.summary) operation.summary = meta.summary;
    if (meta.description) operation.description = meta.description;
    if (meta.tags && meta.tags.length > 0) operation.tags = meta.tags;
    if (meta.operationId) operation.operationId = meta.operationId;

    const parameters = normalizeParameters(meta.parameters, pathParams);
    if (parameters) operation.parameters = parameters;

    const requestBody = normalizeRequestBody(meta.requestBody);
    if (requestBody) operation.requestBody = requestBody;

    const responses = normalizeResponses(meta.responses);
    if (responses) operation.responses = responses;

    if (meta.security) operation.security = meta.security;

    this.#paths[openApiPath][method] = operation;
  }

  getPaths() {
    return this.#paths;
  }

  getInfo() {
    return this.#info;
  }

  getComponents() {
    return this.#components;
  }

  getGlobalSecurity() {
    return this.#globalSecurity;
  }

  reset() {
    this.#paths = {};
    this.#components = { securitySchemes: {} };
    this.#globalSecurity = undefined;
  }
}

export const openApiRegistry = new OpenApiRegistry();
