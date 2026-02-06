/**
 * Compiles path patterns into token arrays and matches them against request paths.
 * Supports :param for named parameters and * for wildcard catch-all.
 */

export function compilePath(path) {
  const segments = path.split("/").filter(Boolean);
  const tokens = [];
  let score = 0;

  for (const segment of segments) {
    if (segment.startsWith(":")) {
      tokens.push({ type: "param", name: segment.slice(1) });
      score += 1;
    } else if (segment === "*") {
      tokens.push({ type: "wildcard" });
      score += 0;
    } else {
      tokens.push({ type: "static", value: segment });
      score += 2;
    }
  }

  return { tokens, score };
}

export function matchPath(compiled, pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const { tokens } = compiled;
  const params = {};

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "wildcard") {
      params["*"] = "/" + segments.slice(i).map(decodeURIComponent).join("/");
      return params;
    }

    if (i >= segments.length) return null;

    if (token.type === "static") {
      if (segments[i] !== token.value) return null;
    } else if (token.type === "param") {
      params[token.name] = decodeURIComponent(segments[i]);
    }
  }

  if (tokens.length !== segments.length) return null;

  return params;
}
