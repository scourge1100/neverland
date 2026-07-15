#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const root = path.resolve(process.argv[2] || "dist");
const port = Number(process.env.PORT || 4173);
const types = { ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain" };

http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
  const requested = path.resolve(root, `.${pathname}`);
  if (!requested.startsWith(`${root}${path.sep}`) && requested !== root) { res.writeHead(403).end("Forbidden"); return; }
  const candidates = [requested, path.join(requested, "index.html")];
  const target = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || path.join(root, "404", "index.html");
  const status = target.endsWith(path.join("404", "index.html")) ? 404 : 200;
  res.writeHead(status, { "content-type": `${types[path.extname(target)] || "text/html"}; charset=utf-8` });
  fs.createReadStream(target).pipe(res);
}).listen(port, "127.0.0.1", () => console.log(`Neverland static preview: http://localhost:${port}`));
