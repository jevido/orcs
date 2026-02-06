import { HttpException } from "./HttpException.js";
import { ValidationException } from "./ValidationException.js";

export class ExceptionHandler {
  render(error, ctx) {
    if (error instanceof ValidationException) {
      return Response.json(
        {
          error: "Validation Error",
          message: error.message,
          errors: error.errors,
        },
        { status: 422 },
      );
    }

    if (error instanceof HttpException) {
      return Response.json(
        {
          error: statusText(error.status),
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
        { status: error.status },
      );
    }

    const isDev = (Bun.env.APP_ENV || "development") !== "production";
    return Response.json(
      {
        error: "Internal Server Error",
        message: isDev ? error.message : "An unexpected error occurred",
        ...(isDev && error.stack ? { stack: error.stack } : {}),
      },
      { status: 500 },
    );
  }
}

function statusText(status) {
  const texts = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    409: "Conflict",
    422: "Validation Error",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return texts[status] || "Error";
}
