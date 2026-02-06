import { HttpException } from "../errors/HttpException.js";

export class Context {
  constructor({ req, params = {}, query = {}, body = null, headers = {} }) {
    this.req = req;
    this.params = params;
    this.query = query;
    this.body = body;
    this.headers = headers;
    this.method = req.method;
    this.path = new URL(req.url).pathname;
  }

  json(data, status = 200) {
    return Response.json(data, { status });
  }

  text(data, status = 200) {
    return new Response(String(data), {
      status,
      headers: { "Content-Type": "text/plain" },
    });
  }

  redirect(url, status = 302) {
    return Response.redirect(url, status);
  }

  abort(status, message, details = null) {
    throw new HttpException(status, message, details);
  }
}
