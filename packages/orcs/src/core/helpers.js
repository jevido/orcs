import { HttpException } from "../errors/http-exception.js";

export function abort(status, message, details = null) {
  throw new HttpException(status, message, details);
}
