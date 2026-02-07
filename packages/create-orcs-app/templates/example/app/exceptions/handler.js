import { ExceptionHandler } from "@jevido/orcs";

/**
 * Application Exception Handler
 *
 * Customize how your application handles errors and exceptions.
 */
export class Handler extends ExceptionHandler {
  /**
   * Handle an exception and return a response
   */
  async handle(error, ctx) {
    // Log the error
    if (error.status >= 500) {
      console.error("Server Error:", error);
    }

    // You can customize error responses here
    // For example, different formats for API vs HTML responses

    return super.handle(error, ctx);
  }

  /**
   * Determine if an error should be reported (logged)
   */
  shouldReport(error) {
    // Don't report validation errors or 404s
    if (error.status === 404 || error.status === 422) {
      return false;
    }

    return super.shouldReport(error);
  }
}
