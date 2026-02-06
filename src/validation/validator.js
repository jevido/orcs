/**
 * Simple JSON schema validator for OpenAPI request bodies.
 * Zero external dependencies.
 */

export class Validator {
  /**
   * Validates data against a JSON schema
   * @param {*} data - Data to validate
   * @param {Object} schema - JSON schema object
   * @returns {Object} { valid: boolean, errors: {} }
   */
  static validate(data, schema) {
    const errors = {};

    if (!schema) {
      return { valid: true, errors };
    }

    // Handle type validation
    if (schema.type && !this.validateType(data, schema.type)) {
      errors._root = [`must be of type ${schema.type}`];
      return { valid: false, errors };
    }

    // Handle object validation
    if (schema.type === "object") {
      return this.validateObject(data, schema);
    }

    // Handle array validation
    if (schema.type === "array") {
      return this.validateArray(data, schema);
    }

    // Handle string validation
    if (schema.type === "string") {
      return this.validateString(data, schema);
    }

    // Handle number/integer validation
    if (schema.type === "number" || schema.type === "integer") {
      return this.validateNumber(data, schema);
    }

    return { valid: true, errors };
  }

  static validateType(data, type) {
    if (data === null || data === undefined) {
      return false;
    }

    switch (type) {
      case "string":
        return typeof data === "string";
      case "number":
        return typeof data === "number" && !isNaN(data);
      case "integer":
        return Number.isInteger(data);
      case "boolean":
        return typeof data === "boolean";
      case "array":
        return Array.isArray(data);
      case "object":
        return (
          typeof data === "object" && !Array.isArray(data) && data !== null
        );
      case "null":
        return data === null;
      default:
        return true;
    }
  }

  static validateObject(data, schema) {
    const errors = {};

    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      errors._root = ["must be an object"];
      return { valid: false, errors };
    }

    const properties = schema.properties || {};
    const required = schema.required || [];

    // Check required fields
    for (const field of required) {
      if (
        !(field in data) ||
        data[field] === undefined ||
        data[field] === null
      ) {
        errors[field] = ["is required"];
      }
    }

    // Validate each property
    for (const [key, value] of Object.entries(data)) {
      if (!properties[key]) {
        // Skip validation for unknown properties (OpenAPI allows additionalProperties)
        continue;
      }

      const propSchema = properties[key];
      const result = this.validateValue(value, propSchema, key);
      if (!result.valid) {
        // Normalize errors to always be an array at the field level
        if (Array.isArray(result.errors)) {
          errors[key] = result.errors;
        } else if (result.errors._root) {
          // If there's a _root error, flatten it to the field level
          errors[key] = result.errors._root;
        } else {
          // Nested object errors - keep as is for now
          errors[key] = result.errors;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateArray(data, schema) {
    const errors = {};

    if (!Array.isArray(data)) {
      errors._root = ["must be an array"];
      return { valid: false, errors };
    }

    // Validate minItems
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors._root = [`must have at least ${schema.minItems} items`];
    }

    // Validate maxItems
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors._root = [`must have at most ${schema.maxItems} items`];
    }

    // Validate items
    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        const result = this.validateValue(data[i], schema.items, `[${i}]`);
        if (!result.valid) {
          errors[`[${i}]`] = result.errors;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateString(data, schema) {
    const errors = [];

    if (typeof data !== "string") {
      errors.push("must be a string");
      return { valid: false, errors };
    }

    // Validate minLength
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push(`must be at least ${schema.minLength} characters long`);
    }

    // Validate maxLength
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push(`must be at most ${schema.maxLength} characters long`);
    }

    // Validate pattern (regex)
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(data)) {
        errors.push(`must match pattern ${schema.pattern}`);
      }
    }

    // Validate format
    if (schema.format) {
      const formatError = this.validateFormat(data, schema.format);
      if (formatError) {
        errors.push(formatError);
      }
    }

    // Validate enum
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push(`must be one of: ${schema.enum.join(", ")}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateNumber(data, schema) {
    const errors = [];

    if (typeof data !== "number" || isNaN(data)) {
      errors.push("must be a number");
      return { valid: false, errors };
    }

    // Integer check
    if (schema.type === "integer" && !Number.isInteger(data)) {
      errors.push("must be an integer");
    }

    // Validate minimum
    if (schema.minimum !== undefined) {
      if (schema.exclusiveMinimum && data <= schema.minimum) {
        errors.push(`must be greater than ${schema.minimum}`);
      } else if (!schema.exclusiveMinimum && data < schema.minimum) {
        errors.push(`must be at least ${schema.minimum}`);
      }
    }

    // Validate maximum
    if (schema.maximum !== undefined) {
      if (schema.exclusiveMaximum && data >= schema.maximum) {
        errors.push(`must be less than ${schema.maximum}`);
      } else if (!schema.exclusiveMaximum && data > schema.maximum) {
        errors.push(`must be at most ${schema.maximum}`);
      }
    }

    // Validate multipleOf
    if (schema.multipleOf !== undefined && data % schema.multipleOf !== 0) {
      errors.push(`must be a multiple of ${schema.multipleOf}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateValue(value, schema, fieldName) {
    // Handle null/undefined
    if (value === null || value === undefined) {
      if (schema.nullable || schema.type === "null") {
        return { valid: true, errors: [] };
      }
      return { valid: false, errors: ["is required"] };
    }

    // Validate by type
    const result = this.validate(value, schema);
    return result;
  }

  static validateFormat(value, format) {
    switch (format) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return "must be a valid email address";
        }
        break;

      case "uri":
      case "url":
        try {
          new URL(value);
        } catch {
          return "must be a valid URL";
        }
        break;

      case "uuid":
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          return "must be a valid UUID";
        }
        break;

      case "date":
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value) || isNaN(Date.parse(value))) {
          return "must be a valid date (YYYY-MM-DD)";
        }
        break;

      case "date-time":
        if (isNaN(Date.parse(value))) {
          return "must be a valid date-time";
        }
        break;

      // Add more formats as needed
    }

    return null;
  }
}
