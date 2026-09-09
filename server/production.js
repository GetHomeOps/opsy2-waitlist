import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { app as api } from "./app.js";

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");

if (!existsSync(path.join(distDir, "index.html"))) {
  console.error("Missing dist/index.html. Run `npm run build` before starting.");
  process.exit(1);
}

const server = new Hono();
server.route("/", api);
server.use("*", serveStatic({ root: distDir }));
server.get("*", serveStatic({ root: distDir, path: "index.html" }));

const port = Number(process.env.PORT) || 3000;

serve(
  {
    fetch: server.fetch,
    port,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`Listening on http://${info.address}:${info.port}`);
  },
);
