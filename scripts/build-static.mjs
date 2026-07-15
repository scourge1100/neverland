#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const outDir = path.join(root, "dist");
const contentDir = path.join(root, "content");
const siteDir = path.join(root, "config", "site");
const baseUrl = (process.env.SITE_URL || "http://localhost:4173").replace(/\/$/, "");
const githubUsername = process.env.GITHUB_USERNAME || "scourge1100";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
}

function markdownToHtml(markdown) {
  const normalized = markdown.replace(/^#\s+.*(?:\r?\n)+/, "");
  const lines = normalized.split(/\r?\n/);
  const html = [];
  let inCode = false;
  let code = [];
  let codeLanguage = "";
  let list = "";
  const closeList = () => { if (list) { html.push(`</${list}>`); list = ""; } };
  for (const line of lines) {
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
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 1, 5);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const bullet = line.match(/^\s*[*-]\s+(.+)$/);
    if (bullet) {
      if (list !== "ul") { closeList(); list = "ul"; html.push("<ul>"); }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      if (list !== "ol") { closeList(); list = "ol"; html.push("<ol>"); }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }
    closeList();
    if (!line.trim()) continue;
    if (line.startsWith("> ")) html.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
    else html.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  closeList();
  if (inCode) html.push(codeLanguage === "mermaid" ? `<pre class="mermaid">${escapeHtml(code.join("\n"))}</pre>` : `<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return html.join("\n");
}

function parseMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const meta = {};
  let body = raw;
  if (raw.startsWith("---\n")) {
    const end = raw.indexOf("\n---", 4);
    if (end !== -1) {
      const frontmatter = raw.slice(4, end).trim();
      body = raw.slice(end + 4).replace(/^\r?\n/, "");
      let currentKey = "";
      for (const line of frontmatter.split(/\r?\n/)) {
        if (/^\s*-\s+/.test(line) && currentKey) {
          meta[currentKey] = Array.isArray(meta[currentKey]) ? meta[currentKey] : [];
          meta[currentKey].push(line.replace(/^\s*-\s+/, "").replace(/^["']|["']$/g, ""));
          continue;
        }
        const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (!match) continue;
        currentKey = match[1];
        const value = match[2].trim();
        meta[currentKey] = value ? value.replace(/^["']|["']$/g, "") : [];
      }
    }
  }
  const type = meta.type === "project" ? "project" : meta.type === "page" ? "page" : "writing";
  const title = meta.title || body.match(/^#\s+(.+)$/m)?.[1] || path.basename(filePath, ".md");
  const publishedAt = meta.publishedAt || "2026-07-15T00:00:00.000Z";
  if (Number.isNaN(new Date(publishedAt).getTime())) throw new Error(`Invalid publishedAt in ${filePath}`);
  return {
    id: path.relative(contentDir, filePath),
    slug: meta.slug || path.basename(filePath, ".md"),
    type,
    title,
    summary: meta.summary || title,
    category: meta.category || (type === "project" ? "Project" : "Work Note"),
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    role: meta.role || "",
    period: meta.period || "",
    featured: meta.featured === "true" || meta.featured === true,
    publishedAt: new Date(publishedAt).toISOString(),
    updatedAt: new Date(meta.updatedAt || publishedAt).toISOString(),
    text: body.trim(),
  };
}

function walkMarkdown(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walkMarkdown(target) : entry.name.endsWith(".md") ? [target] : [];
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function layout({ title, description, body, canonical = "/" }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle} — Neverland</title><meta name="description" content="${safeDescription}"><meta property="og:type" content="website"><meta property="og:title" content="${safeTitle} — Neverland"><meta property="og:description" content="${safeDescription}"><meta property="og:image" content="${baseUrl}/og-default.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${baseUrl}${canonical}"><link rel="alternate" type="application/rss+xml" title="Neverland RSS" href="/rss.xml"><link rel="icon" href="/og-default.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css?v=20260716-1"><script type="module" src="/mermaid.js"></script></head><body><header class="site-header"><a class="brand" href="/"><span class="brand-mark">N</span><span>Neverland</span></a><nav class="main-nav"><a href="/writing">Writing</a><a href="/projects">Projects</a><a href="/about">About</a></nav><a class="admin-link" href="https://github.com/${escapeHtml(githubUsername)}" rel="me">GitHub ↗</a></header><main class="page-shell">${body}</main><footer class="site-footer"><div class="section-shell footer-inner"><div><span class="brand-mark inverse-mark">N</span><strong>Neverland</strong></div><p>Built as a living archive.</p></div></footer></body></html>`;
}

function cards(items, emptyText) {
  if (!items.length) return `<p class="empty-state">${escapeHtml(emptyText)}</p>`;
  return `<div class="archive-list">${items.map((item) => `<article><div class="article-meta"><a href="/categories/${encodeURIComponent(item.category)}">${escapeHtml(item.category)}</a><time datetime="${item.publishedAt}">${formatDate(item.publishedAt)}</time></div><h2><a href="/${item.type === "project" ? "projects" : "writing"}/${encodeURIComponent(item.slug)}">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.summary)}</p><div class="tag-row">${item.tags.map((tag) => `<a href="/tags/${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`).join("")}</div></article>`).join("")}</div>`;
}

function facets(items) {
  const categories = [...new Set(items.map((item) => item.category))].sort();
  const years = [...new Set(items.map((item) => new Date(item.publishedAt).getFullYear()))].sort((a, b) => b - a);
  return `<nav class="facets" aria-label="기록 분류"><div><strong>Categories</strong>${categories.map((category) => `<a href="/categories/${encodeURIComponent(category)}">${escapeHtml(category)}</a>`).join("")}</div><div><strong>Archive</strong>${years.map((year) => `<a href="/archive/${year}">${year}</a>`).join("")}</div><a class="search-shortcut" href="/search">Search ↗</a></nav>`;
}

function writeRoute(route, contents) {
  const relative = route === "/" ? "index.html" : path.join(decodeURIComponent(route.replace(/^\//, "")), "index.html");
  const target = path.join(outDir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function writeFile(relative, contents) {
  const target = path.join(outDir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

async function loadGithub() {
  if (process.env.SKIP_GITHUB === "1") return null;
  const headers = { accept: "application/vnd.github+json", "user-agent": "neverland-static-build" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const request = async (pathname) => {
    const response = await fetch(`https://api.github.com${pathname}`, { headers });
    if (!response.ok) throw new Error(`GitHub API failed (${response.status})`);
    return response.json();
  };
  try {
    const [profile, repos] = await Promise.all([
      request(`/users/${encodeURIComponent(githubUsername)}`),
      request(`/users/${encodeURIComponent(githubUsername)}/repos?type=owner&sort=pushed&per_page=6`),
    ]);
    return {
      username: profile.login,
      name: profile.name || profile.login,
      profileUrl: profile.html_url,
      avatarUrl: profile.avatar_url,
      bio: profile.bio || "",
      publicRepos: profile.public_repos,
      followers: profile.followers,
      repositories: repos.filter((repo) => !repo.fork).slice(0, 4).map((repo) => ({
        name: repo.name, description: repo.description || "", url: repo.html_url,
        language: repo.language || "", stars: repo.stargazers_count, pushedAt: repo.pushed_at,
      })),
      events: [],
    };
  } catch (error) {
    console.warn(`WARN ${error.message}; GitHub section will use its fallback.`);
    return null;
  }
}

async function main() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const items = walkMarkdown(contentDir).map(parseMarkdown).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const slugs = new Set();
  for (const item of items) {
    const key = `${item.type}:${item.slug}`;
    if (slugs.has(key)) throw new Error(`Duplicate content slug: ${key}`);
    slugs.add(key);
  }
  const content = {
    writings: items.filter((item) => item.type === "writing"),
    projects: items.filter((item) => item.type === "project"),
    pages: items.filter((item) => item.type === "page"),
  };
  const all = [...content.writings, ...content.projects];

  for (const asset of ["styles.css", "app.js", "mermaid.js", "og-default.png", "og-default.svg"]) {
    fs.copyFileSync(path.join(siteDir, asset), path.join(outDir, asset));
  }
  let home = fs.readFileSync(path.join(siteDir, "index.html"), "utf8")
    .replaceAll("https://localhost:3443", baseUrl)
    .replace('<a class="admin-link" href="/auth/oidc">Write <span aria-hidden="true">↗</span></a>', `<a class="admin-link" href="https://github.com/${githubUsername}" rel="me">GitHub <span aria-hidden="true">↗</span></a>`)
    .replaceAll("20260715-3", "20260715-4");
  writeRoute("/", home);

  writeRoute("/writing", layout({ title: "Writing", description: "문제 해결 과정과 배운 것을 기록한 글", canonical: "/writing", body: `<section class="page-heading"><p class="section-number">WRITING</p><h1>기록</h1><p>문제를 해결한 과정과 다시 활용할 수 있는 배움을 남깁니다.</p></section>${facets(content.writings)}${cards(content.writings, "아직 공개된 글이 없습니다.")}` }));
  writeRoute("/projects", layout({ title: "Projects", description: "역할과 해결 과정이 담긴 대표 프로젝트", canonical: "/projects", body: `<section class="page-heading"><p class="section-number">PROJECTS</p><h1>프로젝트</h1><p>배경, 역할, 판단과 결과가 드러나는 작업을 정리합니다.</p></section>${cards(content.projects, "프로젝트 case study를 준비하고 있습니다.")}` }));

  for (const page of content.pages) {
    const label = page.slug.toUpperCase();
    writeRoute(`/${page.slug}`, layout({ title: page.title, description: page.summary, canonical: `/${page.slug}`, body: `<article class="article-page about-page"><header><p class="section-number">${escapeHtml(label)}</p><h1>${escapeHtml(page.title)}</h1><p class="article-lead">${escapeHtml(page.summary)}</p></header><div class="prose">${markdownToHtml(page.text)}</div></article>` }));
  }

  for (const item of all) {
    const route = `/${item.type === "project" ? "projects" : "writing"}/${encodeURIComponent(item.slug)}`;
    const facts = item.type === "project" ? `<dl class="project-facts"><div><dt>Role</dt><dd>${escapeHtml(item.role || "Project contributor")}</dd></div><div><dt>Period</dt><dd>${escapeHtml(item.period || formatDate(item.publishedAt))}</dd></div></dl>` : "";
    const body = `<article class="article-page"><header><p class="section-number">${escapeHtml(item.category)}</p><h1>${escapeHtml(item.title)}</h1><p class="article-lead">${escapeHtml(item.summary)}</p>${facts}<div class="article-meta"><time datetime="${item.publishedAt}">${formatDate(item.publishedAt)}</time><span>${item.tags.map((tag) => `#${escapeHtml(tag)}`).join(" · ")}</span></div></header><div class="prose">${markdownToHtml(item.text)}</div></article>`;
    writeRoute(route, layout({ title: item.title, description: item.summary, canonical: route, body }));
  }

  for (const tag of [...new Set(all.flatMap((item) => item.tags))]) {
    const matches = all.filter((item) => item.tags.includes(tag));
    writeRoute(`/tags/${encodeURIComponent(tag)}`, layout({ title: `#${tag}`, description: `${tag} 태그의 글과 프로젝트`, canonical: `/tags/${encodeURIComponent(tag)}`, body: `<section class="page-heading"><p class="section-number">TAG</p><h1>#${escapeHtml(tag)}</h1></section>${cards(matches, "이 태그의 콘텐츠가 없습니다.")}` }));
  }
  for (const category of [...new Set(all.map((item) => item.category))]) {
    const matches = all.filter((item) => item.category === category);
    writeRoute(`/categories/${encodeURIComponent(category)}`, layout({ title: category, description: `${category} 카테고리의 글과 프로젝트`, canonical: `/categories/${encodeURIComponent(category)}`, body: `<section class="page-heading"><p class="section-number">CATEGORY</p><h1>${escapeHtml(category)}</h1></section>${cards(matches, "이 카테고리의 콘텐츠가 없습니다.")}` }));
  }
  for (const year of [...new Set(all.map((item) => new Date(item.publishedAt).getFullYear()))]) {
    const matches = all.filter((item) => new Date(item.publishedAt).getFullYear() === year);
    writeRoute(`/archive/${year}`, layout({ title: String(year), description: `${year}년 기록`, canonical: `/archive/${year}`, body: `<section class="page-heading"><p class="section-number">ARCHIVE</p><h1>${year}</h1></section>${cards(matches, "이 연도의 콘텐츠가 없습니다.")}` }));
  }

  const searchBody = `<section class="page-heading"><p class="section-number">SEARCH</p><h1>검색</h1><form class="search-form" id="search-form"><input name="q" placeholder="글과 프로젝트 검색" aria-label="검색어"><button>검색</button></form></section><div id="search-results"><p class="empty-state">검색어를 입력하세요.</p></div><script src="/search.js" defer></script>`;
  writeRoute("/search", layout({ title: "Search", description: "Neverland 통합 검색", canonical: "/search", body: searchBody }));
  writeFile("search.js", `const form=document.getElementById("search-form");const input=form.elements.q;const target=document.getElementById("search-results");const esc=(v)=>String(v).replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);function render(items){if(!items.length){target.innerHTML='<p class="empty-state">검색 결과가 없습니다.</p>';return;}target.innerHTML='<div class="archive-list">'+items.map((item)=>'<article><div class="article-meta"><span>'+esc(item.category)+'</span></div><h2><a href="/'+(item.type==="project"?"projects":"writing")+'/'+encodeURIComponent(item.slug)+'">'+esc(item.title)+'</a></h2><p>'+esc(item.summary)+'</p></article>').join("")+'</div>';}fetch("/api/public/content.json").then((r)=>r.json()).then((content)=>{const all=[...content.writings,...content.projects];const run=()=>{const q=input.value.trim().toLowerCase();const url=new URL(location.href);q?url.searchParams.set("q",q):url.searchParams.delete("q");history.replaceState({},"",url);if(!q){target.innerHTML='<p class="empty-state">검색어를 입력하세요.</p>';return;}render(all.filter((item)=>[item.title,item.summary,item.category,...item.tags,item.text].join(" ").toLowerCase().includes(q)));};form.addEventListener("submit",(event)=>{event.preventDefault();run();});input.value=new URLSearchParams(location.search).get("q")||"";if(input.value)run();}).catch(()=>{target.innerHTML='<p class="empty-state">검색 데이터를 불러오지 못했습니다.</p>';});`);

  writeFile("api/public/content.json", JSON.stringify(content, null, 2));
  writeFile("api/public/github.json", JSON.stringify(await loadGithub(), null, 2));
  const rssItems = content.writings.map((item) => `<item><title>${escapeHtml(item.title)}</title><link>${baseUrl}/writing/${encodeURIComponent(item.slug)}</link><guid>${baseUrl}/writing/${encodeURIComponent(item.slug)}</guid><pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate><description>${escapeHtml(item.summary)}</description></item>`).join("");
  writeFile("rss.xml", `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Neverland</title><link>${baseUrl}</link><description>만든 것과 배운 것을 기록합니다.</description><language>ko</language>${rssItems}</channel></rss>`);
  const urls = ["/", "/writing", "/projects", "/about", "/experience", "/search", ...all.map((item) => `/${item.type === "project" ? "projects" : "writing"}/${encodeURIComponent(item.slug)}`)];
  writeFile("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((route) => `<url><loc>${baseUrl}${route}</loc></url>`).join("")}</urlset>`);
  writeFile("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
  writeRoute("/404", layout({ title: "Not found", description: "페이지를 찾을 수 없습니다.", canonical: "/404", body: '<section class="page-heading"><h1>페이지를 찾을 수 없습니다.</h1><a href="/">홈으로 돌아가기</a></section>' }));
  fs.copyFileSync(path.join(root, "staticwebapp.config.json"), path.join(outDir, "staticwebapp.config.json"));

  console.log(`Built ${items.length} content documents and ${all.length} public entries in ${outDir}`);
  if (baseUrl.startsWith("http://localhost")) console.warn("WARN SITE_URL is not set; canonical URLs use the local preview URL.");
}

main().catch((error) => { console.error(error); process.exit(1); });
