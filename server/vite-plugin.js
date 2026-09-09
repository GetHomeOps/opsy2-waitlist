import { getRequestListener } from "@hono/node-server";

export function foundingApiPlugin() {
  return {
    name: "founding-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] || "";
        if (!url.startsWith("/api/") && url !== "/api") {
          next();
          return;
        }

        try {
          const mod = await server.ssrLoadModule("/server/app.js");
          const listener = getRequestListener(mod.app.fetch);
          await listener(req, res);
        } catch (error) {
          console.error("[founding-api]", error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: error.message || "Internal server error." }));
          }
        }
      });
    },
  };
}
