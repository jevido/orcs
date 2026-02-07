# OpenAPI

OpenAPI is not a bolt-on — it is generated directly from your route definitions.

## Interactive Documentation

Visit `/docs` in your browser for a beautiful, interactive API documentation UI powered by Scalar:

```
GET /docs
```

The documentation automatically loads your OpenAPI spec and provides:

- **Try it out** — test your API endpoints directly from the browser
- **Code examples** — auto-generated request examples in multiple languages
- **Type definitions** — clear schemas for request/response bodies
- **Dark mode** — automatically matches your system preferences

## Accessing the Spec

The spec is served automatically at:

```
GET /openapi.json
```

It returns a complete OpenAPI 3.1.0 document built from every route that includes metadata.

## Programmatic Access

```js
import { generateOpenApiDocument } from "./src/index.js";

const spec = generateOpenApiDocument();
console.log(JSON.stringify(spec, null, 2));
```

## What Gets Included

Any route with a `summary`, `requestBody`, or `responses` in its metadata gets an OpenAPI entry. Routes without metadata (inline handlers with no second argument) are silently skipped.

Path parameters like `:id` are automatically converted to OpenAPI format `{id}`.
