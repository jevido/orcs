import { ExceptionHandler } from "../../src/errors/Handler.js";

/**
 * Application-level exception handler.
 * Extend the framework's base handler to customize error rendering.
 */
export class AppExceptionHandler extends ExceptionHandler {
  // Override render(error, ctx) to customize error responses.
  // By default, the base handler formats HttpException as structured JSON
  // and hides stack traces in production.
}
