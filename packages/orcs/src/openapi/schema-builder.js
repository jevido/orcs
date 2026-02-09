/**
 * Normalizes shorthand OpenAPI metadata into full OpenAPI 3.1.0 format.
 */

export function normalizeRequestBody(body) {
  if (!body) return undefined;

  // Already full OpenAPI format with content key
  if (body.content) return body;

  // Has a schema key — wrap in content
  if (body.schema) {
    return {
      required: body.required !== false,
      content: {
        "application/json": { schema: body.schema },
      },
    };
  }

  // Shorthand: plain object of properties { email: { type: "string" } }
  const properties = {};
  const required = [];

  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "object" && value !== null) {
      properties[key] = value;
      if (value.required !== false) {
        required.push(key);
      }
    }
  }

  return {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
      },
    },
  };
}

export function normalizeResponses(responses) {
  if (!responses) return undefined;

  const normalized = {};
  for (const [code, value] of Object.entries(responses)) {
    if (typeof value === "string") {
      normalized[code] = { description: value };
    } else {
      normalized[code] = value;
    }
  }
  return normalized;
}

export function normalizeParameters(parameters, pathParams = []) {
  if (!parameters) return undefined;

  if (Array.isArray(parameters)) return parameters;

  if (typeof parameters !== "object") return undefined;

  const pathParamSet = new Set(pathParams);

  return Object.entries(parameters)
    .map(([name, value]) => {
      if (value === null || value === undefined) return null;

      const {
        in: location,
        required,
        description,
        schema,
        ...schemaLike
      } = value;

      const paramIn =
        location || (pathParamSet.has(name) ? "path" : "query");

      const param = {
        name,
        in: paramIn,
        required: paramIn === "path" ? true : required === true,
      };

      if (description) param.description = description;

      const resolvedSchema = schema ||
        (Object.keys(schemaLike).length > 0 ? schemaLike : undefined);
      if (resolvedSchema) param.schema = resolvedSchema;

      return param;
    })
    .filter(Boolean);
}
