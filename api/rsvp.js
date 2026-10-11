// POST /api/rsvp { rid, name, attend: "yes"|"no", guests, note, website? } -> { ok }
//   rid = random id kept in the guest's browser, so a guest can update their own answer.
// GET  /api/rsvp?key=ADMIN_KEY -> { items } (couple only; key lives in env ADMIN_KEY)
// DELETE /api/rsvp?key=ADMIN_KEY&id=<rid>
import { clean, body, limited, sameOrigin, save, readAll, send, remove, keyOk } from "./_store.js";

const MAX_GUESTS = Number(process.env.MAX_GUESTS || 2);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (!keyOk(req.query?.key)) return send(res, 401, { error: "unauthorized" });
      const items = await readAll("rsvp/", 2000);
      return send(res, 200, { items });
    }
    if (req.method === "POST") {
      if (!sameOrigin(req)) return send(res, 403, { error: "forbidden" });
      const b = body(req);
      if (b.website) return send(res, 200, { ok: true }); // honeypot
      const rid = String(b.rid || "");
      const name = clean(b.name, 60), note = clean(b.note, 300);
      const attend = b.attend === "yes" ? "yes" : b.attend === "no" ? "no" : null;
      if (!/^[a-z0-9]{16,40}$/.test(rid) || name.length < 2 || !attend) return send(res, 400, { error: "invalid" });
      const guests = attend === "yes" ? Math.min(MAX_GUESTS, Math.max(1, parseInt(b.guests, 10) || 1)) : 0;
      if (limited(req)) return send(res, 429, { error: "rate_limited" });
      await save(`rsvp/${rid}.json`, { name, attend, guests, note, t: Date.now() }, true);
      return send(res, 201, { ok: true });
    }
    if (req.method === "DELETE") {
      if (!keyOk(req.query?.key)) return send(res, 401, { error: "unauthorized" });
      const id = String(req.query?.id || "");
      if (!/^[a-z0-9]{16,40}$/.test(id)) return send(res, 400, { error: "invalid" });
      await remove(`rsvp/${id}.json`);
      return send(res, 200, { ok: true });
    }
    res.setHeader("Allow", "GET, POST, DELETE");
    return send(res, 405, { error: "method_not_allowed" });
  } catch (e) {
    console.error("rsvp", e);
    return send(res, 500, { error: "storage_unavailable" });
  }
}
