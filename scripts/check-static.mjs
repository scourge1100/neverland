#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const required = ["index.html", "writing/index.html", "projects/index.html", "about/index.html", "experience/index.html", "search/index.html", "mermaid.js", "rss.xml", "sitemap.xml", "robots.txt", "api/public/content.json", "api/public/github.json", "staticwebapp.config.json", "404/index.html"];
let failed = false;
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) { console.error(`FAIL missing ${file}`); failed = true; }
  else console.log(`OK   ${file}`);
}
const content = JSON.parse(fs.readFileSync(path.join(root, "api/public/content.json"), "utf8"));
for (const item of [...content.writings, ...content.projects]) {
  const route = path.join(root, item.type === "project" ? "projects" : "writing", item.slug, "index.html");
  if (!fs.existsSync(route)) { console.error(`FAIL missing route for ${item.slug}`); failed = true; }
}
const neverlandProject = fs.readFileSync(path.join(root, "projects", "neverland", "index.html"), "utf8");
if (!neverlandProject.includes('class="mermaid"') || !neverlandProject.includes('/mermaid.js')) {
  console.error("FAIL Mermaid diagram was not rendered into the Neverland project page");
  failed = true;
}
for (const html of ["index.html", "writing/index.html", "projects/index.html"]) {
  const value = fs.readFileSync(path.join(root, html), "utf8");
  if (value.includes("/auth/oidc") || value.includes("Outline API configuration")) { console.error(`FAIL server-only reference in ${html}`); failed = true; }
}
for (const html of fs.readdirSync(root, { recursive: true }).filter((file) => file.endsWith(".html"))) {
  const value = fs.readFileSync(path.join(root, html), "utf8");
  for (const match of value.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const link = match[1];
    if (!link.startsWith("/") || link.startsWith("//")) continue;
    const pathname = decodeURIComponent(link.split(/[?#]/)[0]);
    const candidates = [path.join(root, pathname), path.join(root, pathname, "index.html")];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      console.error(`FAIL broken internal link ${link} in ${html}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log(`Static build verified: ${content.writings.length} writing, ${content.projects.length} projects, ${content.pages.length} pages`);
