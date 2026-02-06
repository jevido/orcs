export { env } from "../config/env.js";
import { HttpException } from "../errors/HttpException.js";

export function abort(status, message, details = null) {
  throw new HttpException(status, message, details);
}
