import { Validator } from "./validator.js";
import { ValidationException } from "../errors/validation-exception.js";
import { normalizeRequestBody } from "../openapi/schema-builder.js";

/**
 * Creates validation middleware for a route's request body schema
 * @param {Object} requestBodyMeta - The requestBody metadata from route definition
 * @returns {Function} Middleware function
 */
export function createValidationMiddleware(requestBodyMeta) {
  if (!requestBodyMeta) {
    return null;
  }

  // Normalize the request body metadata to full OpenAPI format
  const normalizedBody = normalizeRequestBody(requestBodyMeta);

  // Extract the JSON schema from the normalized request body
  const jsonSchema =
    normalizedBody?.content?.["application/json"]?.schema || null;

  if (!jsonSchema) {
    return null;
  }

  // Return middleware that validates the request body
  return async (ctx, next) => {
    const { body } = ctx;

    // If body is required and missing, throw validation error
    if (normalizedBody.required && (body === null || body === undefined)) {
      throw new ValidationException({
        _body: ["request body is required"],
      });
    }

    // Skip validation if body is null and not required
    if (!normalizedBody.required && (body === null || body === undefined)) {
      return await next();
    }

    // Validate the body against the schema
    const result = Validator.validate(body, jsonSchema);

    if (!result.valid) {
      throw new ValidationException(result.errors);
    }

    // Validation passed, continue to next middleware/handler
    return await next();
  };
}
