/**
 * Civium Estate — optional AI helper (Cloudflare Worker, free tier is enough)
 *
 * What it does: the admin page sends the draft listing + nearby places found on
 * OpenStreetMap; this worker asks Claude for (a) a polished description and
 * (b) extra details that suit this kind of property. It exists only because an
 * Anthropic API key must never be placed in a public web page.
 *
 * Security: the caller must send the same GitHub token the admin page uses
 * (Authorization: Bearer …). The worker checks that the token can PUSH to the
 * repo, so only people who can already edit the site can use it.
 *
 * Settings (Cloudflare dashboard → Worker → Settings → Variables):
 *   ANTHROPIC_API_KEY  (secret, required)
 *   ALLOWED_ORIGIN     default "https://civiumestate.com"
 *   GITHUB_REPO        default "riteshku999-commits/civium-estate"
 *   MODEL              default "claude-haiku-5-5"
 */
const SYSTEM = `You help a Kolkata real-estate broker complete a property listing for their website.
You receive a draft listing and nearby places (from OpenStreetMap, with distances).
Rules:
- NEVER invent facts: no developer names, RERA numbers, prices, possession dates, areas, floor counts or amenities unless they appear in the input.
- You MAY (1) rewrite the description in 1-2 appealing sentences using only the given facts, and (2) derive short highlights from the nearby data (e.g. "Connectivity": "Metro 1.5 km, airport 9 km").
- Also list extra details that are normally important for this kind of property but are missing (e.g. for an office: washrooms, power backup, lifts; for land: road width, facing). For those set "value" to null - the broker will ask the owner.
- Do not repeat details already present in the draft attributes.
- Keep labels short (1-3 words). Keys are camelCase.
Reply with ONLY JSON: {"description": string|null, "attributes": [{"key": string, "label": string, "value": string|null}]}
Return at most 8 attributes.`;

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || "https://civiumestate.com";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin"
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "POST only" }, 405);
    if (request.headers.get("Origin") && request.headers.get("Origin") !== origin) return json({ error: "Origin not allowed" }, 403);

    // 1. Caller must be able to push to the repo
    const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Missing token" }, 401);
    const repo = env.GITHUB_REPO || "riteshku999-commits/civium-estate";
    const gh = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "civium-ai-helper", Accept: "application/vnd.github+json" }
    });
    if (!gh.ok) return json({ error: "Token not accepted" }, 401);
    const info = await gh.json();
    if (!info.permissions || !info.permissions.push) return json({ error: "Token cannot edit this site" }, 403);

    // 2. Input
    let body;
    try { body = await request.json(); } catch { return json({ error: "Bad JSON" }, 400); }
    const p = body.property || {};
    const draft = {
      title: p.title, category: p.category, type: p.type, location: p.location, price: p.priceLabel,
      description: p.description, address: p.attributes && p.attributes.mapLink,
      attributes: Object.fromEntries(Object.entries(p.attributes || {}).filter(([, v]) => v === null || typeof v !== "object")),
      nearby: (body.nearby || []).slice(0, 20)
    };
    if (!env.ANTHROPIC_API_KEY) return json({ error: "AI helper is not configured (missing API key)" }, 500);

    // 3. Ask Claude
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: env.MODEL || "claude-haiku-5-5", max_tokens: 1200, system: SYSTEM,
        messages: [{ role: "user", content: JSON.stringify(draft) }]
      })
    });
    if (!r.ok) return json({ error: "AI service error (" + r.status + ")" }, 502);
    const out = await r.json();
    const text = (out.content || []).map(c => c.text || "").join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: "AI returned an unexpected answer" }, 502);
    try {
      const parsed = JSON.parse(m[0]);
      const attrs = Array.isArray(parsed.attributes) ? parsed.attributes.slice(0, 8).filter(a => a && a.label).map(a => ({
        key: String(a.key || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 40) || undefined,
        label: String(a.label).slice(0, 40),
        value: a.value === null || a.value === undefined ? null : String(a.value).slice(0, 200)
      })) : [];
      return json({ description: typeof parsed.description === "string" ? parsed.description.slice(0, 400) : null, attributes: attrs });
    } catch { return json({ error: "AI returned an unexpected answer" }, 502); }
  }
};
