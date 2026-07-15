#!/usr/bin/env node
import fs from "node:fs";

function loadDotEnv(file = ".env") {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();
const baseUrl = (process.env.OUTLINE_BASE_URL || process.env.URL || "").replace(/\/$/, "");
const apiKey = process.env.OUTLINE_API_KEY;
const secret = process.env.UTILS_SECRET;
const name = "Neverland Blog Cache";
const url = process.env.OUTLINE_WEBHOOK_URL || "http://blog.local:4000/webhooks/outline";
const events = [
  "documents.create",
  "documents.update",
  "documents.publish",
  "documents.unpublish",
  "documents.archive",
  "documents.restore",
  "documents.delete",
];

if (!baseUrl || !apiKey || !secret) throw new Error("URL, OUTLINE_API_KEY and UTILS_SECRET are required");

async function outlineApi(endpoint, body) {
  const response = await fetch(`${baseUrl}/api/${endpoint}`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};
  if (!response.ok || result.ok === false) throw new Error(`Outline ${endpoint} failed (${response.status}): ${text.slice(0, 400)}`);
  return result.data;
}

const subscriptions = await outlineApi("webhookSubscriptions.list", { limit: 100 });
const existing = subscriptions.find((item) => item.name === name);
const payload = { name, url, secret, events };
const result = existing
  ? await outlineApi("webhookSubscriptions.update", { id: existing.id, ...payload })
  : await outlineApi("webhookSubscriptions.create", payload);

console.log(JSON.stringify({ action: existing ? "updated" : "created", id: result.id, name, url, events }, null, 2));
