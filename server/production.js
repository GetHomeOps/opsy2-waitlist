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

// Canonical host redirect: bounce the Railway default domain (*.up.railway.app)
// to the app's custom Cloudflare domain so visitors never get stuck on the
// Railway URL (e.g. clicking "Back to landing" from the admin dashboard).
// NOTE: this is the app domain (waitlist.heyopsy.com), NOT the marketing site
// at heyopsy.com, which is a separate site without these routes. Scoped to
// browser GET navigations and non-API paths, so Stripe webhooks (POST) and
// Railway's health check (Host: healthcheck.railway.app) are left untouched.
const CANONICAL_HOST = (process.env.CANONICAL_HOST || "waitlist.heyopsy.com").trim();

server.use("*", async (c, next) => {
  const host = (c.req.header("host") || "").toLowerCase();
  if (
    c.req.method === "GET" &&
    host.endsWith(".up.railway.app") &&
    host !== CANONICAL_HOST &&
    !c.req.path.startsWith("/api")
  ) {
    const target = new URL(c.req.url);
    target.protocol = "https:";
    target.host = CANONICAL_HOST;
    target.port = "";
    return c.redirect(target.toString(), 301);
  }
  return next();
});

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
