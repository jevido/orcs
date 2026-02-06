import { HttpException } from "./HttpException.js";

export class ValidationException extends HttpException {
  constructor(errors = {}, message = "Validation failed") {
    super(422, message, errors);
    this.errors = errors;
    this.name = "ValidationException";
  }
}
