import {
  normalizeRequestBody,
  normalizeResponses,
  normalizeParameters,
} from "./SchemaBuilder.js";

class OpenApiRegistry {
  #paths = {};
  #info = { title: "ORCS API", version: "0.1.0" };

  setInfo(info) {
    this.#info = { ...this.#info, ...info };
  }

  addPath(path, method, meta) {
    if (!meta || (!meta.summary && !meta.responses && !meta.requestBody)) {
      return;
    }

    // Convert :param to {param} for OpenAPI path format
    const openApiPath = path.replace(/:([^/]+)/g, "{$1}");

    if (!this.#paths[openApiPath]) {
      this.#paths[openApiPath] = {};
    }

    const operation = {};
    if (meta.summary) operation.summary = meta.summary;
    if (meta.description) operation.description = meta.description;
    if (meta.tags && meta.tags.length > 0) operation.tags = meta.tags;
    if (meta.operationId) operation.operationId = meta.operationId;

    const parameters = normalizeParameters(meta.parameters);
    if (parameters) operation.parameters = parameters;

    const requestBody = normalizeRequestBody(meta.requestBody);
    if (requestBody) operation.requestBody = requestBody;

    const responses = normalizeResponses(meta.responses);
    if (responses) operation.responses = responses;

    this.#paths[openApiPath][method] = operation;
  }

  getPaths() {
    return this.#paths;
  }

  getInfo() {
    return this.#info;
  }

  reset() {
    this.#paths = {};
  }
}

export const openApiRegistry = new OpenApiRegistry();
