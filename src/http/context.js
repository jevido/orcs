import { HttpException } from "../errors/http-exception.js";

export class Context {
  constructor({
    req,
    params = {},
    query = {},
    body = null,
    headers = {},
    app = null,
  }) {
    this.req = req;
    this.params = params;
    this.query = query;
    this.body = body;
    this.headers = headers;
    this.method = req.method;
    this.path = new URL(req.url).pathname;
    this.app = app;
    this.user = null;
    this.authenticated = false;
  }

  json(data, status = 200) {
    return Response.json(data, { status });
  }

  redirect(url, status = 302) {
    return Response.redirect(url, status);
  }

  abort(status, message, details = null) {
    throw new HttpException(status, message, details);
  }
}
