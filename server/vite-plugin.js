import { getRequestListener } from "@hono/node-server";

function isApiPath(url) {
  const pathname = url?.split("?")[0] || "";
  return pathname.startsWith("/api/") || pathname === "/api";
}

function sendApiError(res, error) {
  console.error("[founding-api]", error);
  if (!res.headersSent) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: error.message || "Internal server error." }));
  }
}

export function foundingApiPlugin() {
  return {
    name: "founding-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!isApiPath(req.url)) {
          next();
          return;
        }

        try {
          const mod = await server.ssrLoadModule("/server/app.js");
          const listener = getRequestListener(mod.app.fetch);
          await listener(req, res);
        } catch (error) {
          sendApiError(res, error);
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!isApiPath(req.url)) {
          next();
          return;
        }

        try {
          const { app } = await import("./app.js");
          const listener = getRequestListener(app.fetch);
          await listener(req, res);
        } catch (error) {
          sendApiError(res, error);
        }
      });
    },
  };
}
