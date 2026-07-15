#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function loadDotEnv(file = ".env") {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = { dryRun: false, file: "" };
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--title") {
      args.title = argv[++i];
    } else if (value === "--collection-id") {
      args.collectionId = argv[++i];
    } else if (value === "--collection") {
      args.collectionName = argv[++i];
    } else if (value === "--parent-id") {
      args.parentDocumentId = argv[++i];
    } else if (!args.file) {
      args.file = value;
    }
  }
  return args;
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

  const h1 = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return { meta, body, h1 };
}

function withNeverlandMeta(body, meta) {
  const publicMeta = {};
  for (const key of ["type", "slug", "summary", "category", "tags", "featured", "role", "period"]) {
    if (meta[key] !== undefined && meta[key] !== "" && (!Array.isArray(meta[key]) || meta[key].length)) {
      publicMeta[key] = meta[key];
    }
  }
  if (!Object.keys(publicMeta).length) return body;
  const encoded = Buffer.from(JSON.stringify(publicMeta), "utf8").toString("base64url");
  return `${body.trim()}\n\n<!-- neverland-meta:${encoded} -->`;
}

async function outlineApi(pathname, body) {
  const baseUrl = process.env.OUTLINE_BASE_URL || process.env.URL;
  const apiKey = process.env.OUTLINE_API_KEY;
  if (!baseUrl) throw new Error("OUTLINE_BASE_URL or URL is required");
  if (!apiKey) throw new Error("OUTLINE_API_KEY is required");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/${pathname}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Outline API returned non-JSON (${response.status}): ${text.slice(0, 300)}`);
  }
  if (!response.ok || json.ok === false) {
    throw new Error(`Outline API ${pathname} failed (${response.status}): ${JSON.stringify(json).slice(0, 600)}`);
  }
  return json;
}

async function resolveCollectionId(name) {
  if (!name) return "";
  const result = await outlineApi("collections.list", { limit: 100 });
  const collections = result.data || [];
  const found = collections.find((item) => item.name === name);
  if (!found) {
    throw new Error(`Collection not found: ${name}`);
  }
  return found.id;
}

async function findDocumentByTitle(title, collectionId) {
  const result = await outlineApi("documents.search", {
    query: title,
    collectionId,
    includeArchived: false,
  });
  const docs = result.data || [];
  return docs.find((doc) => doc.document?.title === title || doc.title === title)?.document || null;
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv);
  if (!args.file) {
    console.error("Usage: npm run outline:upload -- [--dry-run] [--title TITLE] [--collection NAME] file.md");
    process.exit(1);
  }

  const filePath = path.resolve(args.file);
  const { meta, body, h1 } = parseMarkdown(filePath);
  const title = args.title || meta.title || h1 || path.basename(filePath, path.extname(filePath));
  const collectionName = args.collectionName || meta.collection || process.env.OUTLINE_COLLECTION_NAME;
  const collectionId =
    args.collectionId ||
    process.env.OUTLINE_COLLECTION_ID ||
    (!args.dryRun && collectionName ? await resolveCollectionId(collectionName) : "");
  const parentDocumentId = args.parentDocumentId || meta.parentDocumentId || process.env.OUTLINE_PARENT_DOCUMENT_ID || "";
  const outlineText = withNeverlandMeta(body, meta);

  const payload = {
    title,
    text: outlineText,
    publish: true,
    collectionId,
  };
  if (parentDocumentId) payload.parentDocumentId = parentDocumentId;

  if (args.dryRun) {
    console.log(JSON.stringify({ action: "dry-run", payload }, null, 2));
    return;
  }

  if (!collectionId) {
    throw new Error("Collection is required. Set OUTLINE_COLLECTION_ID or OUTLINE_COLLECTION_NAME.");
  }

  const existing = await findDocumentByTitle(title, collectionId);
  if (existing?.id) {
    const updated = await outlineApi("documents.update", {
      id: existing.id,
      title,
      text: outlineText,
      publish: true,
    });
    console.log(JSON.stringify({ action: "updated", id: updated.data?.id || existing.id, title }, null, 2));
  } else {
    const created = await outlineApi("documents.create", payload);
    console.log(JSON.stringify({ action: "created", id: created.data?.id, title }, null, 2));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
