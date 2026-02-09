# Request Validation

ORCS automatically validates incoming request bodies against the OpenAPI schema defined in your routes. If validation fails, a structured 422 error is returned.

## Automatic Validation

```js
Route.post(
  "/api/users",
  {
    requestBody: {
      email: { type: "string", format: "email" },
      name: { type: "string", minLength: 2, maxLength: 50 },
      age: { type: "integer", minimum: 18 },
    },
  },
  UserController.store,
);
```

**Valid request:**

```json
{
  "email": "john@example.com",
  "name": "John Doe",
  "age": 25
}
```

→ Passes validation, handler executes

**Invalid request:**

```json
{
  "email": "not-an-email",
  "name": "J",
  "age": 17
}
```

→ Returns 422 with validation errors:

```json
{
  "error": "Validation Error",
  "message": "Validation failed",
  "errors": {
    "email": ["must be a valid email address"],
    "name": ["must be at least 2 characters long"],
    "age": ["must be at least 18"]
  }
}
```

## Supported Validations

- **Type**: `string`, `number`, `integer`, `boolean`, `array`, `object`
- **String**: `minLength`, `maxLength`, `pattern` (regex)
- **Number**: `minimum`, `maximum`, `multipleOf`, `exclusiveMinimum`, `exclusiveMaximum`
- **Format**: `email`, `url`, `uri`, `uuid`, `date`, `date-time`
- **Required fields**: All fields in shorthand `requestBody` are required by default

Validation happens automatically before your handler runs. No need for manual checks or third-party validation libraries.
