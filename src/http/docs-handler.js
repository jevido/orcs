/**
 * Generates an HTML page for interactive API documentation
 */
export function createDocsHandler(config) {
  const title = config.get("openapi.title", "API Documentation");
  const specUrl =
    config.get("app.url", "http://localhost:42069") + "/openapi.json";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <script
    id="api-reference"
    data-url="${escapeHtml(specUrl)}"
    data-configuration='{"theme":"purple","layout":"modern","defaultOpenAllTags":true}'></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest"></script>
</body>
</html>`;

  return () => {
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  };
}

function escapeHtml(str) {
  const div = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(str).replace(/[&<>"']/g, (char) => div[char]);
}
