export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Range, Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const upstreamUrl = "https://gtavc-assets-proxy.joncode.workers.dev";
    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.set("Referer", "https://joncodeofficial.github.io/gta-vice-city-wasm/");
    upstreamHeaders.set("Origin", "https://joncodeofficial.github.io");

    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers: upstreamHeaders,
    });

    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
    headers.set("Content-Disposition", 'attachment; filename="game.tar.gz"');
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
