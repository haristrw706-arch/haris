// Shared helpers: private Vercel Blob storage, validation, basic abuse protection.
import { put, list, get } from "@vercel/blob";

const ACCESS = "private";
const hits = new Map();

export const clean = (s, n) =>
  String(s ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+\n/g, "\n")
    .trim()
    .slice(0, n);

export function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return {}; }
}

// Best-effort per-instance rate limit: max `n` writes per minute per IP.
export function limited(req, n = 6) {
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > n;
}

export function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
}

export async function save(pathname, data, overwrite = false) {
  await put(pathname, JSON.stringify(data), {
    access: ACCESS,
    addRandomSuffix: false,
    allowOverwrite: overwrite,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function readAll(prefix, max = 300) {
  const blobs = [];
  let cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor && blobs.length < 5000);
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const items = await Promise.all(
    blobs.slice(0, max).map(async (b) => {
      try {
        const r = await get(b.pathname, { access: ACCESS, useCache: false });
        if (!r || r.statusCode !== 200) return null;
        return await new Response(r.stream).json();
      } catch { return null; }
    })
  );
  return items.filter(Boolean);
}

export function send(res, status, data, cache = "no-store") {
  res.setHeader("Cache-Control", cache);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.status(status).json(data);
}
