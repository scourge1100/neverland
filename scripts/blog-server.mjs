#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";

const port = Number(process.env.BLOG_PORT || 4000);
const outlineUrl = (process.env.OUTLINE_INTERNAL_URL || process.env.OUTLINE_BASE_URL || process.env.URL || "").replace(/\/$/, "");
const apiKey = process.env.OUTLINE_API_KEY || "";
const collectionName = process.env.OUTLINE_COLLECTION_NAME || "Portfolio";
const baseUrl = (process.env.BLOG_BASE_URL || process.env.URL || "http://localhost:4000").replace(/\/$/, "");
// 방문 집계(core 공통 모듈). 쿠키 없이 text/plain으로 보내 preflight를 피하고, 로컬 개발 주소에서는 보내지 않는다.
const visitBeacon = `<script>(function(){try{var h=location.hostname;if(h==='localhost'||h==='127.0.0.1'||h==='[::1]')return;var u='https://40.82.146.87.sslip.io/api/public/visits';var b=JSON.stringify({serviceType:'NEVERLAND',path:location.pathname});if(navigator.sendBeacon){navigator.sendBeacon(u,new Blob([b],{type:'text/plain'}));}else{fetch(u,{method:'POST',body:b,mode:'no-cors',keepalive:true,headers:{'Content-Type':'text/plain'}});}}catch(e){}})();</script>`;
const cacheTtl = Number(process.env.BLOG_CACHE_TTL_SECONDS || 60) * 1000;
const webhookSecret = process.env.OUTLINE_WEBHOOK_SECRET || "";
const homeTemplate = fs.readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
const homeTemplateEn = fs.readFileSync(new URL("../site/index.en.html", import.meta.url), "utf8");
let cache = { expiresAt: 0, content: null };
let githubCache = { expiresAt: 0, content: null };
const githubUsername = process.env.GITHUB_USERNAME || "";
const githubToken = process.env.GITHUB_TOKEN || "";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function xmlEscape(value = "") {
  return escapeHtml(value);
}

function formatDate(value, lang = "ko") {
  const options = lang === "en" ? { year: "numeric", month: "short", day: "numeric" } : { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ko-KR", options).format(new Date(value));
}

const I18N = {
  ko: {
    writing: { title: "Writing", desc: "문제 해결 과정과 배운 것을 기록한 글", h1: "기록", lead: "문제를 해결한 과정과 다시 활용할 수 있는 배움을 남깁니다.", empty: "아직 공개된 글이 없습니다." },
    projects: { title: "Projects", desc: "역할과 해결 과정이 담긴 대표 프로젝트", h1: "프로젝트", lead: "배경, 역할, 판단과 결과가 드러나는 작업을 정리합니다.", empty: "프로젝트 case study를 준비하고 있습니다." },
    pageMissing: (label) => ({ desc: `${label} 페이지를 준비하고 있습니다.`, h1: "페이지를 준비하고 있습니다." }),
    search: { title: "Search", desc: "Neverland 통합 검색", h1: "검색", placeholder: "글과 프로젝트 검색", button: "검색", none: "검색 결과가 없습니다.", enter: "검색어를 입력하세요." },
    tag: { desc: (t) => `${t} 태그의 글과 프로젝트`, empty: "이 태그의 콘텐츠가 없습니다." },
    archive: { desc: (y) => `${y}년 기록`, empty: "이 연도의 콘텐츠가 없습니다." },
    category: { desc: (c) => `${c} 카테고리의 글과 프로젝트`, empty: "이 카테고리의 콘텐츠가 없습니다." },
    notFound: { title: "Not found", desc: "페이지를 찾을 수 없습니다.", h1: "페이지를 찾을 수 없습니다.", home: "홈으로 돌아가기" },
    unavailable: { title: "Temporarily unavailable", desc: "콘텐츠를 불러오지 못했습니다.", h1: "콘텐츠를 불러오지 못했습니다.", p: "잠시 후 다시 시도해 주세요." },
    rss: "만든 것과 배운 것을 기록합니다.",
    facetsLabel: "기록 분류",
    footerLabel: "바닥글 메뉴",
  },
  en: {
    writing: { title: "Writing", desc: "Notes on problems I solved and what I learned", h1: "Writing", lead: "How I worked through problems, and what I took from them.", empty: "No posts yet." },
    projects: { title: "Projects", desc: "Projects with their background, role and results", h1: "Projects", lead: "Work, with the background, my role, the decisions and the results.", empty: "Project case studies are on the way." },
    pageMissing: (label) => ({ desc: `The ${label} page is not ready yet.`, h1: "This page is not ready yet." }),
    search: { title: "Search", desc: "Search Neverland", h1: "Search", placeholder: "Search posts and projects", button: "Search", none: "No results.", enter: "Enter a search term." },
    tag: { desc: (t) => `Posts and projects tagged ${t}`, empty: "Nothing is tagged with this yet." },
    archive: { desc: (y) => `Posts and projects from ${y}`, empty: "Nothing from this year." },
    category: { desc: (c) => `Posts and projects in ${c}`, empty: "Nothing in this category yet." },
    notFound: { title: "Not found", desc: "Page not found.", h1: "Page not found.", home: "Back to home" },
    unavailable: { title: "Temporarily unavailable", desc: "Content could not be loaded.", h1: "Content could not be loaded.", p: "Please try again in a moment." },
    rss: "Notes on what I build and how I build it.",
    facetsLabel: "Browse",
    footerLabel: "Footer",
  },
};

function periodStart(period = "") {
  const first = period.split(/[—–-]/)[0]?.trim();
  const match = first?.match(/^(\d{4})(?:\.(\d{1,2}))?/);
  if (!match) return 0;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) - 1 : 0;
  return new Date(year, month, 1).getTime();
}

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-|-$/g, "");
}

function extractMeta(text = "") {
  const match = text.match(/<!--\s*neverland-meta:([A-Za-z0-9_+/=-]+)\s*-->/);
  if (!match) return {};
  try { return JSON.parse(Buffer.from(match[1], "base64url").toString("utf8")); } catch { return {}; }
}

function stripMeta(text = "") {
  return text.replace(/\n?<!--\s*neverland-meta:[A-Za-z0-9_+/=-]+\s*-->\s*$/m, "").trim();
}

function summaryOf(text, fallback = "") {
  const plain = stripMeta(text)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\[\]()-]/g, " ")
    .replace(/\s+/g, " ").trim();
  return plain.slice(0, 150) || fallback;
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
    .replace(/\[([^\]]+)\]\((\/[^\s)]*)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(markdown) {
  const normalized = stripMeta(markdown).replace(/^#\s+.*(?:\r?\n)+/, "");
  const lines = normalized.split(/\r?\n/);
  const html = [];
  let inCode = false;
  let code = [];
  let codeLanguage = "";
  let list = "";
  const closeList = () => { if (list) { html.push(`</${list}>`); list = ""; } };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^```([A-Za-z0-9_-]+)?/);
    if (fence) {
      closeList();
      if (inCode) {
        html.push(codeLanguage === "mermaid" ? `<pre class="mermaid">${escapeHtml(code.join("\n"))}</pre>` : `<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        codeLanguage = "";
      } else {
        codeLanguage = (fence[1] || "").toLowerCase();
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) { code.push(line); continue; }
    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(lines[index + 1] || "")) {
      closeList();
      const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => inlineMarkdown(cell.trim()));
      const head = cells(line);
      const rows = [];
      index += 2;
      while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) { rows.push(cells(lines[index])); index += 1; }
      index -= 1;
      html.push(`<table><thead><tr>${head.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) { closeList(); const level = Math.min(heading[1].length + 1, 5); html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
    const bullet = line.match(/^\s*[*-]\s+(.+)$/);
    if (bullet) { if (list !== "ul") { closeList(); list = "ul"; html.push("<ul>"); } html.push(`<li>${inlineMarkdown(bullet[1])}</li>`); continue; }
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) { if (list !== "ol") { closeList(); list = "ol"; html.push("<ol>"); } html.push(`<li>${inlineMarkdown(ordered[1])}</li>`); continue; }
    closeList();
    if (!line.trim()) continue;
    if (line.startsWith("> ")) html.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
    else html.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  closeList();
  if (inCode) html.push(codeLanguage === "mermaid" ? `<pre class="mermaid">${escapeHtml(code.join("\n"))}</pre>` : `<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return html.join("\n");
}

async function outlineApi(endpoint, payload = {}) {
  if (!outlineUrl || !apiKey) throw new Error("Outline API configuration is missing");
  const response = await fetch(`${outlineUrl}/api/${endpoint}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      host: new URL(process.env.URL || baseUrl).host,
      "x-forwarded-proto": "https",
    },
    body: JSON.stringify(payload),
  });
  const raw = await response.text();
  let result;
  try { result = JSON.parse(raw); } catch { throw new Error(`Outline ${endpoint} returned non-JSON (${response.status})`); }
  if (!response.ok || result.ok === false) throw new Error(`Outline ${endpoint} failed (${response.status})`);
  return result.data;
}

async function loadContent(force = false) {
  if (!force && cache.content && Date.now() < cache.expiresAt) return cache.content;
  const collections = await outlineApi("collections.list", { limit: 100 });
  const collection = collections.find((item) => item.name === collectionName);
  if (!collection) throw new Error(`Outline collection not found: ${collectionName}`);
  const listed = await outlineApi("documents.list", { collectionId: collection.id, limit: 100, sort: "publishedAt", direction: "DESC" });
  const details = await Promise.all(listed.filter((item) => item.publishedAt).map((item) => outlineApi("documents.info", { id: item.id })));
  const items = details.map((doc) => {
    const meta = extractMeta(doc.text);
    const type = meta.type === "project" ? "project" : meta.type === "page" ? "page" : "writing";
    return {
      id: doc.id,
      slug: meta.slug || doc.urlId || slugify(doc.title),
      type,
      title: doc.title,
      summary: meta.summary || summaryOf(doc.text, doc.title),
      category: meta.category || (type === "project" ? "Project" : "Work Note"),
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      role: meta.role || "",
      period: meta.period || "",
      featured: meta.featured === true || meta.featured === "true",
      lang: meta.lang === "en" ? "en" : "ko",
      publishedAt: doc.publishedAt || doc.createdAt,
      updatedAt: doc.updatedAt,
      text: stripMeta(doc.text),
    };
  });
  const content = {
    writings: items.filter((item) => item.type === "writing"),
    projects: items.filter((item) => item.type === "project").sort((a, b) => periodStart(b.period) - periodStart(a.period)),
    pages: items.filter((item) => item.type === "page"),
  };
  cache = { expiresAt: Date.now() + cacheTtl, content };
  return content;
}

async function loadGithub() {
  if (!githubUsername) return null;
  if (githubCache.content && Date.now() < githubCache.expiresAt) return githubCache.content;
  const headers = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2026-03-10",
    "user-agent": "neverland-blog",
  };
  if (githubToken) headers.authorization = `Bearer ${githubToken}`;
  const request = async (path) => {
    const response = await fetch(`https://api.github.com${path}`, { headers });
    if (!response.ok) throw new Error(`GitHub API failed (${response.status})`);
    return response.json();
  };
  const [profile, repos, events] = await Promise.all([
    request(`/users/${encodeURIComponent(githubUsername)}`),
    request(`/users/${encodeURIComponent(githubUsername)}/repos?type=owner&sort=pushed&per_page=6`),
    request(`/users/${encodeURIComponent(githubUsername)}/events/public?per_page=12`),
  ]);
  const content = {
    username: profile.login,
    name: profile.name || profile.login,
    profileUrl: profile.html_url,
    avatarUrl: profile.avatar_url,
    bio: profile.bio || "",
    publicRepos: profile.public_repos,
    followers: profile.followers,
    repositories: repos.filter((repo) => !repo.fork).slice(0, 4).map((repo) => ({
      name: repo.name,
      description: repo.description || "",
      url: repo.html_url,
      language: repo.language || "",
      stars: repo.stargazers_count,
      pushedAt: repo.pushed_at,
    })),
    events: events.slice(0, 8).map((event) => ({
      id: event.id,
      type: event.type,
      repository: event.repo?.name || "",
      createdAt: event.created_at,
    })),
  };
  githubCache = { expiresAt: Date.now() + 10 * 60 * 1000, content };
  return content;
}

function layout({ title, description, body, canonical = "/", lang = "ko", alt = null }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const p = lang === "en" ? "/en" : "";
  const altLang = lang === "en" ? "ko" : "en";
  const altHref = alt || (altLang === "en" ? "/en/" : "/");
  const L = I18N[lang];
  const hreflang = alt ? `<link rel="alternate" hreflang="${lang}" href="${baseUrl}${canonical}"><link rel="alternate" hreflang="${altLang}" href="${baseUrl}${altHref}">` : "";
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle} — Neverland</title><meta name="description" content="${safeDescription}"><meta property="og:type" content="website"><meta property="og:title" content="${safeTitle} — Neverland"><meta property="og:description" content="${safeDescription}"><meta property="og:image" content="${baseUrl}/og-default.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${baseUrl}${canonical}">${hreflang}<link rel="alternate" type="application/rss+xml" title="Neverland RSS" href="${p}/rss.xml"><link rel="icon" href="/og-default.svg" type="image/svg+xml"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"><link rel="stylesheet" href="/styles.css?v=20261013-1"><script type="module" src="/mermaid.js"></script></head><body><header class="site-header"><a class="brand" href="${p || "/"}${p ? "/" : ""}">Neverland</a><nav class="main-nav"><a href="${p}/projects">Projects</a><a href="${p}/writing">Writing</a><a href="${p}/about">About</a><a class="lang-switch" href="${altHref}" hreflang="${altLang}" lang="${altLang}">${altLang === "en" ? "EN" : "KO"}</a><a class="admin-link" href="/auth/oidc">Write</a></nav></header><main class="page-shell">${body}</main><footer class="site-footer"><div class="section-shell footer-inner"><nav aria-label="${L.footerLabel}"><a href="${p}/about">About</a><a href="${p}/experience">Experience</a><a href="${p}/writing">Writing</a><a href="${p}/rss.xml">RSS</a></nav><p>© Neverland</p></div></footer>${visitBeacon}</body></html>`;
}

function cards(items, emptyText, lang = "ko") {
  const p = lang === "en" ? "/en" : "";
  if (!items.length) return `<p class="empty-state">${escapeHtml(emptyText)}</p>`;
  return `<div class="archive-list">${items.map((item) => `<article><div class="article-meta"><a href="${p}/categories/${encodeURIComponent(item.category)}">${escapeHtml(item.category)}</a>${item.type === "project" && item.period ? `<span>${escapeHtml(item.period)}</span>` : `<time datetime="${item.publishedAt}">${formatDate(item.publishedAt, lang)}</time>`}</div><h2><a href="${p}/${item.type === "project" ? "projects" : "writing"}/${encodeURIComponent(item.slug)}">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.summary)}</p><div class="tag-row">${item.tags.map((tag) => `<a href="${p}/tags/${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`).join("")}</div></article>`).join("")}</div>`;
}

function facets(items, lang = "ko") {
  const p = lang === "en" ? "/en" : "";
  const categories = [...new Set(items.map((item) => item.category))].sort();
  const years = [...new Set(items.map((item) => new Date(item.publishedAt).getFullYear()))].sort((a, b) => b - a);
  return `<nav class="facets" aria-label="${I18N[lang].facetsLabel}"><div><strong>Categories</strong>${categories.map((category) => `<a href="${p}/categories/${encodeURIComponent(category)}">${escapeHtml(category)}</a>`).join("")}</div><div><strong>Archive</strong>${years.map((year) => `<a href="${p}/archive/${year}">${year}</a>`).join("")}</div><a class="search-shortcut" href="${p}/search">Search ↗</a></nav>`;
}

function send(res, status, contentType, body, extra = {}) {
  res.writeHead(status, { "content-type": `${contentType}; charset=utf-8`, "cache-control": "public, max-age=60", ...extra });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function validWebhook(signatureHeader, rawBody) {
  if (!webhookSecret) return false;
  const parts = Object.fromEntries(String(signatureHeader || "").split(",").map((part) => part.split("=")));
  const signature = parts.s || parts.v1;
  if (!parts.t || !signature) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(`${parts.t}.${rawBody}`).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); } catch { return false; }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, baseUrl);
    if (req.method === "POST" && url.pathname === "/webhooks/outline") {
      const body = await readBody(req);
      if (!validWebhook(req.headers["outline-signature"], body)) return send(res, 401, "application/json", JSON.stringify({ ok: false }));
      let eventName = "unknown";
      try { eventName = JSON.parse(body.toString("utf8")).event || eventName; } catch {}
      console.log(`Outline webhook received: ${eventName}`);
      cache.expiresAt = 0;
      loadContent(true).catch((error) => console.error("Webhook refresh failed", error.message));
      return send(res, 200, "application/json", JSON.stringify({ ok: true }), { "cache-control": "no-store" });
    }

    let pathname = url.pathname;
    let lang = "ko";
    if (pathname === "/en" || pathname.startsWith("/en/")) { lang = "en"; pathname = pathname.slice(3) || "/"; }
    const L = I18N[lang];
    const p = lang === "en" ? "/en" : "";
    const altPrefix = lang === "en" ? "" : "/en";
    const altPath = (path) => (lang === "en" ? path : `/en${path === "/" ? "/" : path}`);

    if (req.method === "GET" && pathname === "/") {
      const template = lang === "en" ? homeTemplateEn : homeTemplate;
      return send(res, 200, "text/html", template.replaceAll("https://localhost:3443", baseUrl));
    }

    const content = await loadContent();
    const everything = [...content.writings, ...content.projects, ...content.pages];
    const hasPair = (item) => everything.some((other) => other.type === item.type && other.slug === item.slug && other.lang !== item.lang);
    const view = {
      writings: content.writings.filter((item) => item.lang === lang),
      projects: content.projects.filter((item) => item.lang === lang),
      pages: content.pages.filter((item) => item.lang === lang),
    };
    const all = [...view.writings, ...view.projects];
    const page = (title, description, body, extra = {}) => layout({ title, description, body, lang, canonical: `${p}${pathname}`, alt: altPath(pathname), ...extra });

    if (url.pathname === "/api/public/content.json") return send(res, 200, "application/json", JSON.stringify(content));
    if (url.pathname === "/api/public/github.json") {
      try { return send(res, 200, "application/json", JSON.stringify(await loadGithub())); }
      catch (error) { console.error(error.message); return send(res, 200, "application/json", "null", { "cache-control": "public, max-age=300" }); }
    }
    if (pathname === "/writing") return send(res, 200, "text/html", page(L.writing.title, L.writing.desc, `<section class="page-heading"><p class="section-number">WRITING</p><h1>${L.writing.h1}</h1><p>${L.writing.lead}</p></section>${facets(view.writings, lang)}${cards(view.writings, L.writing.empty, lang)}`));
    if (pathname === "/projects") return send(res, 200, "text/html", page(L.projects.title, L.projects.desc, `<section class="page-heading"><p class="section-number">PROJECTS</p><h1>${L.projects.h1}</h1><p>${L.projects.lead}</p></section>${cards(view.projects, L.projects.empty, lang)}`));
    if (pathname === "/about" || pathname === "/experience") {
      const slug = pathname.slice(1);
      const label = slug.toUpperCase();
      const found = view.pages.find((item) => item.slug === slug);
      if (!found) { const m = L.pageMissing(label); return send(res, 404, "text/html", page(label, m.desc, `<section class="page-heading"><p class="section-number">${label}</p><h1>${m.h1}</h1></section>`)); }
      return send(res, 200, "text/html", page(found.title, found.summary, `<article class="article-page about-page"><header><p class="section-number">${label}</p><h1>${escapeHtml(found.title)}</h1><p class="article-lead">${escapeHtml(found.summary)}</p></header><div class="prose">${markdownToHtml(found.text)}</div></article>`, hasPair(found) ? {} : { alt: `${altPrefix}/` || "/" }));
    }
    if (pathname === "/search") {
      const q = (url.searchParams.get("q") || "").trim().toLowerCase();
      const matches = q ? all.filter((item) => [item.title, item.summary, item.category, ...item.tags, item.text].join(" ").toLowerCase().includes(q)) : [];
      return send(res, 200, "text/html", page(L.search.title, L.search.desc, `<section class="page-heading"><p class="section-number">SEARCH</p><h1>${L.search.h1}</h1><form class="search-form"><input name="q" value="${escapeHtml(url.searchParams.get("q") || "")}" placeholder="${L.search.placeholder}" aria-label="${L.search.placeholder}"><button>${L.search.button}</button></form></section>${cards(matches, q ? L.search.none : L.search.enter, lang)}`, { alt: `${altPath("/search")}${url.search}` }));
    }
    const tagMatch = pathname.match(/^\/tags\/([^/]+)$/);
    if (tagMatch) { const tag = decodeURIComponent(tagMatch[1]); const matches = all.filter((item) => item.tags.includes(tag)); return send(res, 200, "text/html", page(`#${tag}`, L.tag.desc(tag), `<section class="page-heading"><p class="section-number">TAG</p><h1>#${escapeHtml(tag)}</h1></section>${cards(matches, L.tag.empty, lang)}`)); }
    const archiveMatch = pathname.match(/^\/archive\/(\d{4})$/);
    if (archiveMatch) { const year = archiveMatch[1]; const matches = all.filter((item) => String(new Date(item.publishedAt).getFullYear()) === year); return send(res, 200, "text/html", page(year, L.archive.desc(year), `<section class="page-heading"><p class="section-number">ARCHIVE</p><h1>${year}</h1></section>${cards(matches, L.archive.empty, lang)}`)); }
    const categoryMatch = pathname.match(/^\/categories\/([^/]+)$/);
    if (categoryMatch) { const category = decodeURIComponent(categoryMatch[1]); const matches = all.filter((item) => item.category === category); return send(res, 200, "text/html", page(category, L.category.desc(category), `<section class="page-heading"><p class="section-number">CATEGORY</p><h1>${escapeHtml(category)}</h1></section>${cards(matches, L.category.empty, lang)}`)); }
    const detailMatch = pathname.match(/^\/(writing|projects)\/([^/]+)$/);
    if (detailMatch) {
      const section = detailMatch[1];
      const item = all.find((entry) => entry.type === (section === "projects" ? "project" : "writing") && entry.slug === decodeURIComponent(detailMatch[2]));
      if (!item) return send(res, 404, "text/html", layout({ title: L.notFound.title, description: L.notFound.desc, lang, body: `<section class="page-heading"><h1>${L.notFound.h1}</h1><a href="${p || "/"}${p ? "/" : ""}">${L.notFound.home}</a></section>` }));
      const projectFacts = item.type === "project" ? `<dl class="project-facts"><div><dt>Role</dt><dd>${escapeHtml(item.role || "Project contributor")}</dd></div><div><dt>Period</dt><dd>${escapeHtml(item.period || formatDate(item.publishedAt, lang))}</dd></div></dl>` : "";
      const body = `<article class="article-page"><header><a class="back-link" href="${p}/${section}">← ${section === "projects" ? "Projects" : "Writing"}</a><p class="section-number">${escapeHtml(item.category)}</p><h1>${escapeHtml(item.title)}</h1><p class="article-lead">${escapeHtml(item.summary)}</p>${projectFacts}<div class="article-meta"><time datetime="${item.publishedAt}">${formatDate(item.publishedAt, lang)}</time><span>${item.tags.map((tag) => `#${escapeHtml(tag)}`).join(" · ")}</span></div></header><div class="prose">${markdownToHtml(item.text)}</div></article>`;
      return send(res, 200, "text/html", layout({ title: item.title, description: item.summary, canonical: `${p}${pathname}`, lang, alt: hasPair(item) ? `${altPrefix}/${section}/${encodeURIComponent(item.slug)}` : `${altPrefix}/${section}`, body }));
    }
    if (pathname === "/rss.xml") {
      const items = view.writings.map((item) => `<item><title>${xmlEscape(item.title)}</title><link>${baseUrl}${p}/writing/${encodeURIComponent(item.slug)}</link><guid>${baseUrl}${p}/writing/${encodeURIComponent(item.slug)}</guid><pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate><description>${xmlEscape(item.summary)}</description></item>`).join("");
      return send(res, 200, "application/rss+xml", `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Neverland</title><link>${baseUrl}${p}/</link><description>${L.rss}</description><language>${lang}</language>${items}</channel></rss>`);
    }
    if (pathname === "/sitemap.xml" && lang === "ko") {
      const base = ["/", "/writing", "/projects", "/about", "/experience"];
      const hasEn = everything.some((item) => item.lang === "en");
      const urls = [...base, ...(hasEn ? base.map((path) => (path === "/" ? "/en/" : `/en${path}`)) : []), ...[...content.writings, ...content.projects].map((item) => `${item.lang === "en" ? "/en" : ""}/${item.type === "project" ? "projects" : "writing"}/${encodeURIComponent(item.slug)}`)];
      return send(res, 200, "application/xml", `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${baseUrl}${path}</loc></url>`).join("")}</urlset>`);
    }
    if (pathname === "/robots.txt" && lang === "ko") return send(res, 200, "text/plain", `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
    return send(res, 404, "text/plain", "Not found");
  } catch (error) {
    console.error(error);
    send(res, 503, "text/html", layout({ title: "Temporarily unavailable", description: "콘텐츠를 불러오지 못했습니다.", body: '<section class="page-heading"><h1>콘텐츠를 불러오지 못했습니다.</h1><p>잠시 후 다시 시도해 주세요.</p></section>' }), { "cache-control": "no-store" });
  }
});

server.listen(port, "0.0.0.0", () => console.log(`Neverland blog listening on :${port}`));
