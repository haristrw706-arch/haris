// GET  /api/guestbook  -> { items: [{ name, msg, t }] }  (newest first, public)
// POST /api/guestbook  { name, msg, website? } -> { ok, item }
// DELETE /api/guestbook?key=ADMIN_KEY&id=<id>  (moderasi oleh mempelai)
import { clean, body, limited, sameOrigin, save, readAll, send, remove, keyOk } from "./_store.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const items = (await readAll("guestbook/", 300)).map((x) => ({
        id: x.id, name: clean(x.name, 60), msg: clean(x.msg, 500), t: Number(x.t) || 0,
      }));
      return send(res, 200, { items }, "public, s-maxage=10, stale-while-revalidate=60");
    }
    if (req.method === "POST") {
      if (!sameOrigin(req)) return send(res, 403, { error: "forbidden" });
      const b = body(req);
      if (b.website) return send(res, 200, { ok: true }); // honeypot
      const name = clean(b.name, 60), msg = clean(b.msg, 500);
      if (name.length < 2 || msg.length < 3) return send(res, 400, { error: "invalid" });
      if (limited(req)) return send(res, 429, { error: "rate_limited" });
      const t = Date.now();
      const id = `${t}-${Math.random().toString(36).slice(2, 10)}`;
      await save(`guestbook/${id}.json`, { name, msg, t });
      return send(res, 201, { ok: true, item: { id, name, msg, t } });
    }
    if (req.method === "DELETE") {
      if (!keyOk(req.query?.key)) return send(res, 401, { error: "unauthorized" });
      const id = String(req.query?.id || "");
      if (!/^[0-9]{10,16}-[a-z0-9]{1,12}$/.test(id)) return send(res, 400, { error: "invalid" });
      await remove(`guestbook/${id}.json`);
      return send(res, 200, { ok: true });
    }
    res.setHeader("Allow", "GET, POST, DELETE");
    return send(res, 405, { error: "method_not_allowed" });
  } catch (e) {
    console.error("guestbook", e);
    return send(res, 500, { error: "storage_unavailable" });
  }
}
