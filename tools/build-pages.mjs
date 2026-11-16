#!/usr/bin/env node
/**
 * Civium Estate — static page generator
 *
 * Reads  data/properties.json, data/contact.json, data/areas.json (optional), index.html
 * Writes properties/index.html            (all-properties hub)
 *        properties/<slug>/index.html     (one page per ACTIVE listing)
 *        areas/<area>/index.html          (one page per area with >=1 active listing)
 *        sitemap.xml                      (home + all generated pages)
 *        data/.page-state.json            (remembers when each page last changed → sitemap <lastmod>)
 *
 * Why: the home page draws listings with JavaScript on a single URL. Search engines
 * rank real pages, so each listing and each area gets its own crawlable HTML page.
 *
 * Run:  node tools/build-pages.mjs        (no dependencies, Node 18+)
 * It runs automatically in GitHub Actions whenever listings change (.github/workflows/build-pages.yml).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://civiumestate.com";
const BUSINESS_ID = SITE + "/#business";
const TODAY = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const readJSON = (p, fallback) => { try { return JSON.parse(read(p)); } catch { return fallback; } };

// ───────────────────────── labels (keep in sync with js/script.js) ─────────────────────────
const LOCATION_LABELS = {
  saltlake: "Salt Lake", newtown: "New Town", rajarhat: "Rajarhat", embypass: "EM Bypass", howrah: "Howrah",
  ballygunge: "Ballygunge", alipore: "Alipore / New Alipore", behala: "Behala", parkstreet: "Park Street",
  camacstreet: "Camac Street", elginroad: "Elgin Road", dankuni: "Dankuni", barasat: "Barasat"
};
const TYPE_LABELS = {
  "2bhk": "2 BHK", "3bhk": "3 BHK", "4bhk": "4 BHK", "5bhk": "5 BHK", villa: "Villa", plot: "Plot / Land",
  office: "Office / Co-working", retail: "Retail / Showroom", warehouse: "Warehouse / Storage"
};

// ───────────────────────── helpers ─────────────────────────
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const prettify = k => String(k).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, c => c.toUpperCase());
const locLabel = k => LOCATION_LABELS[k] || prettify(k || "");
const typeLabel = k => TYPE_LABELS[k] || prettify(k || "");
const abs = p => /^https?:/i.test(p) ? p : SITE + "/" + String(p).replace(/^\/+/, "");
const root = p => /^https?:/i.test(p) ? p : "/" + String(p).replace(/^\/+/, "");
const hash = s => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);

// MUST match propSlugs() in js/script.js
function slugify(t) {
  return String(t || "").toLowerCase().replace(/&/g, " and ").replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "property";
}
function assignSlugs(list) {
  const used = new Set(), out = new Map();
  for (const p of list) if (p.slug) { const s = slugify(p.slug); if (!used.has(s)) { used.add(s); out.set(p.id, s); } }
  for (const p of list) {
    if (out.has(p.id)) continue;
    const base = slugify(p.title); let s = base, i = 2;
    while (used.has(s)) s = base + "-" + (i++);
    used.add(s); out.set(p.id, s);
  }
  return out;
}

function fmtPrice(lakh) {
  if (!(lakh > 0)) return "";
  return lakh >= 100 ? `₹${+(lakh / 100).toFixed(2)} Cr` : `₹${+lakh.toFixed(2)} Lac`;
}
function plain(desc) {
  return String(desc || "").replace(/\p{Extended_Pictographic}/gu, "").replace(/\uFE0F/g, "").replace(/\s*\|\s*/g, ". ").replace(/\s+/g, " ").replace(/^[\s.]+/, "").trim();
}
function clip(s, n) { s = String(s); if (s.length <= n) return s; const c = s.slice(0, n - 1); return c.slice(0, c.lastIndexOf(" ") > 80 ? c.lastIndexOf(" ") : c.length).replace(/[,.;:\s]+$/, "") + "…"; }

function parseVideo(src) {
  const u = String(src || "").trim();
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  if (m) return { kind: "youtube", label: "YouTube", embed: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0&playsinline=1`, thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`, watch: `https://www.youtube.com/watch?v=${m[1]}` };
  m = u.match(/instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(reels?|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (m) { const pth = /^(p|tv)$/i.test(m[1]) ? "p" : "reel"; return { kind: "instagram", label: "Instagram", embed: `https://www.instagram.com/${pth}/${m[2]}/embed/`, thumb: "", watch: `https://www.instagram.com/${pth}/${m[2]}/` }; }
  return { kind: "file", src: u };
}

function guessIcon(key) {
  const k = key.toLowerCase();
  const map = [[/metro|subway/, "🚇"], [/rail|station/, "🚆"], [/hospital|clinic/, "🏥"], [/school|college|universit/, "🏫"], [/airport/, "✈️"], [/mall|market|shop/, "🛍️"],
    [/park|garden|lake/, "🌳"], [/hotel/, "🏨"], [/bank/, "🏦"], [/fuel/, "⛽"], [/rera/, "📋"], [/develop|builder/, "🏗️"], [/area|size|sqft|plot/, "📐"],
    [/unit|tower|floor/, "🏢"], [/parking/, "🚗"], [/power|lift|water/, "🔧"], [/facing/, "🧭"], [/vastu/, "🕉️"], [/furnish/, "🛋️"], [/possession/, "🔑"], [/age/, "📅"]];
  for (const [re, i] of map) if (re.test(k)) return i;
  return "🔹";
}
const KEY_ORDER = ["facing", "vastu", "floor", "parking", "furnished", "ageOfProperty", "possession", "powerBackup"];
const SKIP = new Set(["mapLink", "geo", "totalFloors"]);
function fmtVal(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : null;
  if (typeof v === "object") return v.name ? v.name + (v.distanceKm != null ? ` (${v.distanceKm} km)` : "") : null;
  return String(v);
}
function detailRows(p) {
  const a = p.attributes || {};
  const keys = [...KEY_ORDER.filter(k => k in a), ...Object.keys(a).filter(k => !KEY_ORDER.includes(k))];
  const rows = [], nearby = [];
  for (const k of keys) {
    if (SKIP.has(k)) continue;
    const v = a[k];
    if (v && typeof v === "object" && !Array.isArray(v)) { if (v.name) nearby.push({ label: prettify(k.replace(/^nearest/, "")), icon: guessIcon(k), text: fmtVal(v) }); continue; }
    let val = fmtVal(v); if (val === null) continue;
    if (k === "floor") val = `${v} of ${a.totalFloors || "?"}`;
    rows.push({ label: k === "vastu" ? "Vastu compliant" : prettify(k), icon: guessIcon(k), text: val });
  }
  return { rows, nearby };
}

// ───────────────────────── shared chrome (copied from index.html so it never drifts) ─────────────────────────
const indexHtml = read("index.html");
const grab = (re, what) => { const m = indexHtml.match(re); if (!m) throw new Error("Could not find " + what + " in index.html"); return m[0]; };
const fixLinks = h => h.replace(/href="#/g, 'href="/#').replace(/(src|href)="images\//g, '$1="/images/');
const HEADER = fixLinks(grab(/<header class="header">[\s\S]*?<\/header>/, "header"));
const FOOTER = fixLinks(grab(/<footer class="seo-footer">[\s\S]*?<\/footer>/, "footer"));
const WA_FLOAT = fixLinks(grab(/<a class="whatsapp-float"[\s\S]*?<\/a>/, "WhatsApp button"));
const FONTS = grab(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, "fonts link");
const FAVICONS = `<link rel="icon" type="image/png" href="/images/logo-icon.png">\n  <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">`;

const contact = (readJSON("data/contact.json", {}).contact) || {};
const PHONE_RAW = (contact.phoneRaw || "+916290781373").replace(/\D/g, "");
const PHONE_TEL = "+" + PHONE_RAW;
const PHONE_SHOW = contact.phone || "+91 62907 81373";

function layout({ title, description, canonical, ogImage, ogType = "website", jsonld = [], body, robots = "index, follow, max-image-preview:large" }) {
  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:site_name" content="Civium Estate">
  <meta property="og:locale" content="en_IN">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
  ${FAVICONS}
${jsonld.map(j => `  <script type="application/ld+json">\n${JSON.stringify(j, null, 2).replace(/</g, "\\u003c")}\n  </script>`).join("\n")}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/pages.css">
  ${FONTS}
</head>
<body class="page-gen">
  ${HEADER}

${body}

  ${FOOTER}

  ${WA_FLOAT}

  <script src="/js/pages.js"></script>
</body>
</html>
`;
}

const breadcrumbLD = items => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it[0], item: it[1] }))
});
const crumbsHTML = items => `<nav class="pg-crumbs" aria-label="Breadcrumb"><ol>${items.map((it, i) => i < items.length - 1 ? `<li><a href="${esc(it[2])}">${esc(it[0])}</a></li>` : `<li aria-current="page">${esc(it[0])}</li>`).join("")}</ol></nav>`;

// ───────────────────────── data ─────────────────────────
const root_ = readJSON("data/properties.json", { properties: [] });
const all = root_.properties || [];
const slugs = assignSlugs(all);
const active = all.filter(p => p.active !== false);
const areasData = readJSON("data/areas.json", {});
const pageUrl = p => `${SITE}/properties/${slugs.get(p.id)}/`;
const pagePath = p => `/properties/${slugs.get(p.id)}/`;
const areaPath = loc => `/areas/${slugify(loc)}/`;
const firstImage = p => (p.media || []).find(m => m.type === "image");
const heroImg = p => { const m = firstImage(p); return m ? abs(m.src) : SITE + "/images/og-image.jpg"; };

// ───────────────────────── components ─────────────────────────
function cardHTML(p) {
  const img = firstImage(p);
  return `<article class="pg-card${p.soldOut ? " pg-card--sold" : ""}">
    <a class="pg-card-media" href="${pagePath(p)}" tabindex="-1" aria-hidden="true">${img ? `<img src="${esc(root(img.src))}" alt="${esc(p.title)}" loading="lazy" decoding="async">` : ""}${p.badge ? `<span class="pg-badge">${esc(p.badge)}</span>` : ""}${p.soldOut ? '<span class="pg-sold">SOLD OUT</span>' : ""}</a>
    <div class="pg-card-body">
      <h3><a href="${pagePath(p)}">${esc(p.title)}</a></h3>
      <p class="pg-card-meta">${esc(typeLabel(p.type))} · ${esc(locLabel(p.location))}, Kolkata</p>
      <p class="pg-card-price">${esc(p.priceLabel || fmtPrice(p.price))}</p>
      <a class="pg-link" href="${pagePath(p)}">View details →</a>
    </div></article>`;
}

function ctaHTML(waText) {
  return `<div class="pg-cta">
    <a class="pg-btn pg-btn--wa" href="https://wa.me/${PHONE_RAW}?text=${encodeURIComponent(waText)}" target="_blank" rel="noopener">💬 WhatsApp us</a>
    <a class="pg-btn pg-btn--call" href="tel:${PHONE_TEL}">📞 Call ${esc(PHONE_SHOW)}</a>
  </div>`;
}

function galleryHTML(p) {
  const slides = (p.media || []).map((m, i) => {
    if (m.type === "video") {
      const v = parseVideo(m.src);
      if (v.kind === "file") return `<div class="pg-slide"><video src="${esc(v.src)}" controls playsinline preload="none"></video></div>`;
      return `<div class="pg-slide pg-video" data-embed="${esc(v.embed)}" data-kind="${v.kind}"${v.thumb ? ` style="background-image:url('${esc(v.thumb)}')"` : ""}>
        <button type="button" class="pg-play" aria-label="Play ${v.label} video">▶</button><span class="pg-vlabel">${v.label} video</span>
        <a class="pg-vopen" href="${esc(v.watch)}" target="_blank" rel="noopener">Open on ${v.label} ↗</a></div>`;
    }
    return `<div class="pg-slide"><img src="${esc(root(m.src))}" alt="${esc(p.title)}${i ? " – photo " + (i + 1) : ""}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></div>`;
  });
  if (!slides.length) return "";
  const multi = slides.length > 1;
  return `<div class="pg-gallery" data-count="${slides.length}">
    <div class="pg-track">${slides.join("")}</div>
    ${multi ? `<button type="button" class="pg-arrow pg-prev" aria-label="Previous">‹</button><button type="button" class="pg-arrow pg-next" aria-label="Next">›</button><span class="pg-count">1 / ${slides.length}</span>` : ""}
  </div>`;
}

// ───────────────────────── property page ─────────────────────────
function propertyPage(p) {
  const url = pageUrl(p), area = locLabel(p.location), type = typeLabel(p.type);
  const { rows, nearby } = detailRows(p);
  const price = p.priceLabel || fmtPrice(p.price);
  const intent = p.category === "commercial" ? "Commercial Property" : "Property";
  const title = `${p.title} – ${type} for Sale in ${area}, Kolkata | Civium Estate`;
  const d = plain(p.description);
  const description = clip(`${p.title}: ${type} for sale in ${area}, Kolkata${price ? " at " + price : ""}. ${d}`, 158);
  const related = active.filter(o => o.id !== p.id && o.location === p.location).slice(0, 3);
  const mapQ = (p.attributes && p.attributes.mapLink) || `${area}, Kolkata`;
  const crumbs = [["Home", SITE + "/", "/"], ["Properties", SITE + "/properties/", "/properties/"], [area, SITE + areaPath(p.location), areaPath(p.location)], [p.title, url, pagePath(p)]];
  const imgs = (p.media || []).filter(m => m.type === "image").map(m => abs(m.src));
  const ld = [{
    "@context": "https://schema.org", "@type": "RealEstateListing", "@id": url + "#listing", url, name: p.title, description: d || description,
    inLanguage: "en-IN", ...(imgs.length ? { image: imgs } : {}), provider: { "@id": BUSINESS_ID },
    ...(p.price > 0 ? { offers: { "@type": "Offer", priceCurrency: "INR", price: Math.round(p.price * 100000), availability: p.soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock", seller: { "@id": BUSINESS_ID }, url } } : {}),
    about: { "@type": "Place", name: p.title, address: { "@type": "PostalAddress", addressLocality: area + ", Kolkata", addressRegion: "West Bengal", addressCountry: "IN" } }
  }, breadcrumbLD(crumbs)];
  const waText = `Hi Civium Estate, I'm interested in "${p.title}" (${url}). Could you please share more details?`;

  const body = `<main class="pg-main">
  <div class="container">
    ${crumbsHTML(crumbs)}
    <header class="pg-head">
      <p class="pg-eyebrow">${esc(intent)} · ${esc(type)} · ${esc(area)}</p>
      <h1>${esc(p.title)}</h1>
      <p class="pg-sub">${esc(type)} for sale in ${esc(area)}, Kolkata</p>
    </header>
    <div class="pg-layout">
      <div class="pg-left">
        ${galleryHTML(p)}
        ${d ? `<section class="pg-sec"><h2>About this property</h2><p>${esc(d)}</p></section>` : ""}
        ${p.unitTypes && p.unitTypes.length ? `<section class="pg-sec"><h2>Unit configurations</h2><div class="pg-table-wrap"><table class="pg-table"><thead><tr><th>Configuration</th><th>Size</th><th>Parking</th><th>Price</th></tr></thead><tbody>${p.unitTypes.map(u => `<tr><td>${esc(u.config || "")}</td><td>${esc(u.size || "")}</td><td>${esc(u.parking || "")}</td><td>${esc(u.price || "")}</td></tr>`).join("")}</tbody></table></div></section>` : ""}
        ${rows.length ? `<section class="pg-sec"><h2>Key details</h2><dl class="pg-details">${rows.map(r => `<div><dt><span aria-hidden="true">${r.icon}</span> ${esc(r.label)}</dt><dd>${esc(r.text)}</dd></div>`).join("")}</dl></section>` : ""}
        ${nearby.length ? `<section class="pg-sec"><h2>Nearby</h2><ul class="pg-nearby">${nearby.map(n => `<li><span aria-hidden="true">${n.icon}</span> <strong>${esc(n.label)}:</strong> ${esc(n.text)}</li>`).join("")}</ul><p class="pg-note">Distances are approximate.</p></section>` : ""}
        <section class="pg-sec"><h2>Location</h2><p>${esc(mapQ)}</p><p><a class="pg-link" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(mapQ)}" target="_blank" rel="noopener">View approximate location on Google Maps ↗</a></p><p class="pg-note">The exact address is shared when you enquire.</p></section>
      </div>
      <aside class="pg-right">
        <div class="pg-box">
          ${p.badge ? `<span class="pg-badge pg-badge--inline">${esc(p.badge)}</span>` : ""}
          ${p.oldPriceLabel ? `<p class="pg-old">${esc(p.oldPriceLabel)}</p>` : ""}
          <p class="pg-price">${esc(price)}</p>
          ${p.soldOut ? '<p class="pg-soldnote">This property has been sold. <a href="/properties/">See similar properties</a>.</p>' : ctaHTML(waText)}
          <p class="pg-box-note">Civium Estate · ${esc(contact.address && contact.address.line2 || "Salt Lake Sector V, Kolkata")}</p>
        </div>
      </aside>
    </div>
    ${related.length ? `<section class="pg-sec pg-related"><h2>More properties in ${esc(area)}</h2><div class="pg-grid">${related.map(cardHTML).join("")}</div></section>` : ""}
    <p class="pg-more"><a class="pg-link" href="${areaPath(p.location)}">All properties in ${esc(area)} →</a> &nbsp; <a class="pg-link" href="/properties/">All properties in Kolkata →</a></p>
  </div>
</main>`;
  return layout({ title, description, canonical: url, ogImage: heroImg(p), ogType: "website", jsonld: ld, body });
}

// ───────────────────────── area + hub pages ─────────────────────────
function priceRange(list) {
  const ps = list.map(p => p.price).filter(n => n > 0); if (!ps.length) return "";
  const lo = Math.min(...ps), hi = Math.max(...ps);
  return lo === hi ? `at ${fmtPrice(lo)}` : `from ${fmtPrice(lo)} to ${fmtPrice(hi)}`;
}
function areaPage(loc, list) {
  const area = locLabel(loc), url = SITE + areaPath(loc);
  const types = [...new Set(list.map(p => typeLabel(p.type)))];
  const n = list.length;
  const title = `Properties for Sale in ${area}, Kolkata – ${types.slice(0, 3).join(", ")} | Civium Estate`;
  const editorial = areasData[loc] && (Array.isArray(areasData[loc].intro) ? areasData[loc].intro : areasData[loc].intro ? [areasData[loc].intro] : []);
  const auto = `Civium Estate currently lists ${n} ${n === 1 ? "property" : "properties"} for sale in ${area}, Kolkata, ${priceRange(list)}. Available: ${types.join(", ")}. Call or WhatsApp us for site visits, floor plans and the latest availability.`;
  const description = clip(`${n} ${n === 1 ? "property" : "properties"} for sale in ${area}, Kolkata ${priceRange(list)} – ${types.join(", ")}. Verified listings from Civium Estate.`, 158);
  const crumbs = [["Home", SITE + "/", "/"], ["Properties", SITE + "/properties/", "/properties/"], [area, url, areaPath(loc)]];
  const ld = [{
    "@context": "https://schema.org", "@type": "CollectionPage", "@id": url + "#page", url, name: `Properties for Sale in ${area}, Kolkata`, inLanguage: "en-IN",
    isPartOf: { "@id": SITE + "/#website" }, about: { "@type": "Place", name: area + ", Kolkata" },
    mainEntity: { "@type": "ItemList", numberOfItems: n, itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: pageUrl(p), name: p.title })) }
  }, breadcrumbLD(crumbs)];
  const others = [...new Set(active.map(p => p.location))].filter(l => l !== loc);
  const body = `<main class="pg-main"><div class="container">
    ${crumbsHTML(crumbs)}
    <header class="pg-head"><p class="pg-eyebrow">Kolkata · ${esc(area)}</p><h1>Properties for Sale in ${esc(area)}, Kolkata</h1></header>
    <section class="pg-sec">${(editorial && editorial.length ? editorial : [auto]).map(t => `<p class="pg-lead">${esc(t)}</p>`).join("")}</section>
    <div class="pg-grid">${list.map(cardHTML).join("")}</div>
    <section class="pg-sec pg-contact"><h2>Looking for something specific in ${esc(area)}?</h2><p>Tell us your budget and requirements and we will shortlist options for you.</p>${ctaHTML(`Hi Civium Estate, I'm looking for a property in ${area}, Kolkata. Could you please help?`)}</section>
    ${others.length ? `<p class="pg-more">Also browse: ${others.map(l => `<a class="pg-link" href="${areaPath(l)}">${esc(locLabel(l))}</a>`).join(" · ")} · <a class="pg-link" href="/properties/">All of Kolkata</a></p>` : ""}
  </div></main>`;
  return layout({ title, description, canonical: url, ogImage: heroImg(list[0]), jsonld: ld, body });
}

function hubPage() {
  const url = SITE + "/properties/";
  const locs = [...new Set(active.map(p => p.location))];
  const title = "Properties for Sale in Kolkata – Flats, Offices & More | Civium Estate";
  const description = clip(`Browse ${active.length} ${active.length === 1 ? "property" : "properties"} for sale in Kolkata ${priceRange(active)} – ${[...new Set(active.map(p => typeLabel(p.type)))].join(", ")}. Civium Estate, Salt Lake Sector V.`, 158);
  const crumbs = [["Home", SITE + "/", "/"], ["Properties", url, "/properties/"]];
  const ld = [{
    "@context": "https://schema.org", "@type": "CollectionPage", "@id": url + "#page", url, name: "Properties for Sale in Kolkata", inLanguage: "en-IN", isPartOf: { "@id": SITE + "/#website" },
    mainEntity: { "@type": "ItemList", numberOfItems: active.length, itemListElement: active.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: pageUrl(p), name: p.title })) }
  }, breadcrumbLD(crumbs)];
  const body = `<main class="pg-main"><div class="container">
    ${crumbsHTML(crumbs)}
    <header class="pg-head"><p class="pg-eyebrow">Civium Estate</p><h1>Properties for Sale in Kolkata</h1></header>
    <section class="pg-sec"><p class="pg-lead">${active.length ? `Browse ${active.length} ${active.length === 1 ? "property" : "properties"} currently available across Kolkata. Each listing has photos, key details and nearby places. Call or WhatsApp us to arrange a site visit.` : "New listings are being added. Please contact us for current availability."}</p>
    ${locs.length ? `<p class="pg-more">By area: ${locs.map(l => `<a class="pg-link" href="${areaPath(l)}">${esc(locLabel(l))}</a>`).join(" · ")}</p>` : ""}</section>
    <div class="pg-grid">${active.map(cardHTML).join("")}</div>
    <section class="pg-sec pg-contact"><h2>Can't find what you need?</h2><p>We also have off-market options. Share your requirement and we will get back to you.</p>${ctaHTML("Hi Civium Estate, I'm looking for a property in Kolkata. Could you please help?")}</section>
  </div></main>`;
  return layout({ title, description, canonical: url, ogImage: active[0] ? heroImg(active[0]) : SITE + "/images/og-image.jpg", jsonld: ld, body });
}

// ───────────────────────── write everything ─────────────────────────
const state = readJSON("data/.page-state.json", {});
const next = {};
const sitemap = [];
function emit(relUrl, html) {
  const file = path.join(ROOT, relUrl.replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  const h = hash(html);
  next[relUrl] = { hash: h, lastmod: state[relUrl] && state[relUrl].hash === h ? state[relUrl].lastmod : TODAY };
  sitemap.push([SITE + relUrl, next[relUrl].lastmod]);
}

for (const d of ["properties", "areas"]) fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });

emit("/properties/", hubPage());
const byLoc = new Map();
for (const p of active) { if (!byLoc.has(p.location)) byLoc.set(p.location, []); byLoc.get(p.location).push(p); }
for (const [loc, list] of byLoc) emit(areaPath(loc), areaPage(loc, list));
for (const p of active) emit(pagePath(p), propertyPage(p));

// home page entry: changes when index.html or the set of active listings changes
const homeHash = hash(indexHtml + JSON.stringify(active.map(p => [p.id, p.title, p.priceLabel, p.soldOut])));
next["/"] = { hash: homeHash, lastmod: state["/"] && state["/"].hash === homeHash ? state["/"].lastmod : TODAY };
sitemap.unshift([SITE + "/", next["/"].lastmod]);

fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map(([u, d]) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${d}</lastmod>\n  </url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, "data/.page-state.json"), JSON.stringify(next, null, 2) + "\n");
console.log(`Built ${active.length} property page(s), ${byLoc.size} area page(s), hub, sitemap (${sitemap.length} URLs).`);
