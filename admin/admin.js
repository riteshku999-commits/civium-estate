/* Civium Estate — Listings Manager
 * Static single-page app. Reads/writes data/properties.json (and photos in
 * images/properties/) in the GitHub repo using a personal access token, in ONE
 * atomic commit per save. GitHub Pages then republishes the site.
 * Nearby places: OpenStreetMap (Nominatim + Overpass + OSRM) — free, no keys.
 * Optional AI suggestions: a small Cloudflare Worker (see /worker).
 */
(() => {
  "use strict";

  // ───────────────────────── helpers ─────────────────────────
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LS_KEY = "civium_admin_cfg_v1";
  const DATA_PATH = "data/properties.json";
  const IMG_DIR = "images/properties";
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const prettify = k => String(k).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, c => c.toUpperCase());
  const camel = s => {
    const w = String(s).replace(/[^A-Za-z0-9 ]+/g, " ").trim().split(/\s+/).filter(Boolean);
    return w.map((x, i) => i === 0 ? x.charAt(0).toLowerCase() + x.slice(1) : x.charAt(0).toUpperCase() + x.slice(1)).join("");
  };
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");

  function b64ToText(b64) {
    const bin = atob(b64.replace(/\s/g, ""));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  }
  const blobToB64 = blob => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(",")[1]);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });

  let toastTimer;
  function toast(msg, isErr) {
    const t = $("toast");
    t.textContent = msg; t.className = "toast" + (isErr ? " err" : ""); t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, isErr ? 6000 : 3000);
  }
  const busy = (on, text) => { $("busy").hidden = !on; if (text) $("busyText").textContent = text; };
  const show = name => ["viewLogin", "viewList", "viewForm"].forEach(v => { $(v).hidden = v !== name; window.scrollTo(0, 0); });

  // ───────────────────────── config ─────────────────────────
  let cfg = { token: "", repo: "riteshku999-commits/civium-estate", branch: "main", worker: "" };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(LS_KEY) || "{}")); } catch (e) { /* ignore */ }
  const saveCfg = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ } };

  // ───────────────────────── GitHub API ─────────────────────────
  async function gh(path, opts = {}) {
    const r = await fetch("https://api.github.com/repos/" + cfg.repo + path, {
      ...opts, cache: "no-store",
      headers: {
        Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", ...(opts.body ? { "Content-Type": "application/json" } : {})
      }
    });
    if (!r.ok) {
      let m = ""; try { m = (await r.json()).message; } catch (e) { /* ignore */ }
      const err = new Error(m || ("GitHub error " + r.status)); err.status = r.status; throw err;
    }
    return r.status === 204 ? null : r.json();
  }

  async function fetchProps(ref) {
    const f = await gh("/contents/" + DATA_PATH + "?ref=" + encodeURIComponent(ref || cfg.branch));
    let text;
    if (f.content) text = b64ToText(f.content);
    else text = b64ToText((await gh("/git/blobs/" + f.sha)).content);
    const root = JSON.parse(text);
    if (!root || !Array.isArray(root.properties)) throw new Error("properties.json has an unexpected format");
    return root;
  }

  /** Apply `mutate(list)` to the LATEST properties.json and commit it (plus photo uploads / deletions) atomically. */
  async function publish({ mutate, uploads = [], deletes = [], message }) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ref = await gh("/git/ref/heads/" + encodeURIComponent(cfg.branch));
      const headSha = ref.object.sha;
      const head = await gh("/git/commits/" + headSha);
      const root = await fetchProps(headSha);
      const before = JSON.stringify(root.properties);
      root.properties = mutate(root.properties) || root.properties;
      if (!uploads.length && !deletes.length && JSON.stringify(root.properties) === before) return root;

      const tree = [];
      for (const u of uploads) {
        const blob = await gh("/git/blobs", { method: "POST", body: JSON.stringify({ content: await blobToB64(u.blob), encoding: "base64" }) });
        tree.push({ path: u.path, mode: "100644", type: "blob", sha: blob.sha });
      }
      for (const p of deletes) tree.push({ path: p, mode: "100644", type: "blob", sha: null });
      tree.push({ path: DATA_PATH, mode: "100644", type: "blob", content: JSON.stringify(root, null, 2) + "\n" });

      const newTree = await gh("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
      const commit = await gh("/git/commits", { method: "POST", body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }) });
      try {
        await gh("/git/refs/heads/" + encodeURIComponent(cfg.branch), { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) });
      } catch (e) {
        if (e.status === 422 && attempt === 0) { await sleep(800); continue; }   // someone else committed — redo on the new head
        throw e;
      }
      return root;
    }
    throw new Error("Could not save because the site was changing at the same time. Please try again.");
  }

  // ───────────────────────── state ─────────────────────────
  const S = {
    props: [], root: null,
    editing: null,        // original property object (or null for new)
    isNew: true,
    media: [],            // [{type, src, pending?, blob?, preview?}]
    nearby: [],           // [{key,label,icon,on,name,km}]
    attrs: [],            // [{key,label,baseLabel,value,kind:'text'|'bool'|'number'}]
    units: [],
    geo: null,            // {lat, lon, label}
    previews: {}          // repo path -> object URL (so new photos show before the site redeploys)
  };

  // ───────────────────────── reference data ─────────────────────────
  const TYPES = {
    residential: [["2bhk", "2 BHK"], ["3bhk", "3 BHK"], ["4bhk", "4 BHK"], ["5bhk", "5 BHK"], ["villa", "Villa"], ["plot", "Plot / Land"]],
    commercial: [["office", "Office / Co-working"], ["retail", "Retail / Showroom"], ["warehouse", "Warehouse / Storage"]]
  };
  const LOCATIONS = {
    saltlake: "Salt Lake", newtown: "New Town", rajarhat: "Rajarhat", embypass: "EM Bypass", howrah: "Howrah",
    ballygunge: "Ballygunge", alipore: "Alipore / New Alipore", behala: "Behala", parkstreet: "Park Street",
    camacstreet: "Camac Street", elginroad: "Elgin Road", dankuni: "Dankuni", barasat: "Barasat"
  };

  // attribute suggestions by property kind: [key, label]
  const SUGGEST = {
    flat: [["facing", "Facing"], ["floor", "Floor"], ["totalFloors", "Total floors"], ["vastu", "Vastu compliant"], ["parking", "Parking"], ["furnished", "Furnished"],
      ["ageOfProperty", "Age of property"], ["possession", "Possession"], ["carpetArea", "Carpet area"], ["superBuiltUpArea", "Super built-up area"],
      ["bathrooms", "Bathrooms"], ["balconies", "Balconies"], ["powerBackup", "Power backup"], ["developer", "Developer"], ["reraNo", "RERA number"],
      ["totalUnits", "Total units"], ["landArea", "Land area"], ["towerElevation", "Tower elevation"], ["amenities", "Amenities"]],
    villa: [["plotArea", "Plot area"], ["builtUpArea", "Built-up area"], ["bedrooms", "Bedrooms"], ["facing", "Facing"], ["vastu", "Vastu compliant"], ["parking", "Parking"],
      ["floors", "Floors"], ["furnished", "Furnished"], ["ageOfProperty", "Age of property"], ["possession", "Possession"], ["gatedCommunity", "Gated community"],
      ["roadWidth", "Road width"], ["reraNo", "RERA number"], ["developer", "Developer"]],
    plot: [["plotArea", "Plot area"], ["facing", "Facing"], ["roadWidth", "Road width"], ["cornerPlot", "Corner plot"], ["boundaryWall", "Boundary wall"],
      ["titleStatus", "Title / ownership"], ["landUse", "Land use"], ["possession", "Possession"], ["developer", "Developer"], ["reraNo", "RERA number"]],
    office: [["carpetArea", "Carpet area"], ["floor", "Floor"], ["totalFloors", "Total floors"], ["furnished", "Furnishing"], ["washrooms", "Washrooms"], ["parking", "Parking"],
      ["powerBackup", "Power backup"], ["lifts", "Lifts"], ["fireSafety", "Fire safety"], ["ageOfProperty", "Age of property"], ["possession", "Possession"],
      ["developer", "Developer"], ["reraNo", "RERA number"]],
    retail: [["carpetArea", "Carpet area"], ["frontage", "Frontage"], ["floor", "Floor"], ["footfall", "Footfall"], ["parking", "Parking"], ["powerBackup", "Power backup"],
      ["ageOfProperty", "Age of property"], ["possession", "Possession"], ["developer", "Developer"], ["reraNo", "RERA number"]],
    warehouse: [["landArea", "Plot area"], ["builtUpArea", "Built-up area"], ["clearHeight", "Clear height"], ["loadingDocks", "Loading docks"], ["floorLoadCapacity", "Floor load capacity"],
      ["roadAccess", "Road access"], ["powerLoad", "Power load"], ["possession", "Possession"], ["reraNo", "RERA number"]]
  };
  const suggestKind = t => (SUGGEST[t] ? t : (TYPES.commercial.some(x => x[0] === t) ? "office" : "flat"));

  // nearby place categories (OpenStreetMap tags)
  const NB = {
    nearestMetro:    { label: "Metro station", icon: "🚇", r: 12000, q: ['["railway"="station"]["station"="subway"]["name"]'] },
    nearestRailway:  { label: "Railway station", icon: "🚆", r: 20000, q: ['["railway"="station"]["station"!="subway"]["station"!="light_rail"]["name"]', '["railway"="halt"]["name"]'] },
    nearestHospital: { label: "Hospital", icon: "🏥", r: 12000, q: ['["amenity"="hospital"]["name"]'] },
    nearestSchool:   { label: "School / college", icon: "🏫", r: 8000, q: ['["amenity"~"^(school|college|university)$"]["name"]'] },
    nearestAirport:  { label: "Airport", icon: "✈️", r: 70000, q: ['["aeroway"="aerodrome"]["iata"]["name"]'] },
    nearestMall:     { label: "Shopping mall", icon: "🛍️", r: 12000, q: ['["shop"="mall"]["name"]'] },
    nearestMarket:   { label: "Market / supermarket", icon: "🛒", r: 6000, q: ['["amenity"="marketplace"]["name"]', '["shop"="supermarket"]["name"]'] },
    nearestPark:     { label: "Park", icon: "🌳", r: 6000, q: ['["leisure"="park"]["name"]'] },
    nearestHotel:    { label: "Hotel", icon: "🏨", r: 5000, q: ['["tourism"="hotel"]["name"]'] },
    nearestBank:     { label: "Bank", icon: "🏦", r: 3000, q: ['["amenity"="bank"]["name"]'] },
    nearestFuel:     { label: "Fuel station", icon: "⛽", r: 8000, q: ['["amenity"="fuel"]["name"]'] }
  };
  const NB_SETS = {
    flat: ["nearestMetro", "nearestRailway", "nearestHospital", "nearestSchool", "nearestMall", "nearestMarket", "nearestPark", "nearestAirport"],
    office: ["nearestMetro", "nearestRailway", "nearestAirport", "nearestHospital", "nearestHotel", "nearestBank", "nearestMall"],
    retail: ["nearestMetro", "nearestRailway", "nearestMall", "nearestMarket", "nearestBank", "nearestHospital", "nearestAirport"],
    warehouse: ["nearestRailway", "nearestAirport", "nearestFuel", "nearestHospital"]
  };
  const nbSet = t => NB_SETS[t] || NB_SETS[suggestKind(t)] || NB_SETS.flat;
  const nbInfo = key => NB[key] || { label: prettify(String(key).replace(/^nearest/, "Nearest ")), icon: "📍" };

  // ───────────────────────── login ─────────────────────────
  async function login() {
    const token = $("tokenInput").value.trim() || cfg.token;
    const repo = $("repoInput").value.trim() || cfg.repo;
    const branch = $("branchInput").value.trim() || "main";
    const worker = $("workerInput").value.trim().replace(/\/+$/, "");
    const err = $("loginError"); err.hidden = true;
    if (!token) { err.textContent = "Please paste your access token."; err.hidden = false; return; }
    cfg = { token, repo, branch, worker };
    busy(true, "Signing in…");
    try {
      const info = await gh("");
      if (info.permissions && info.permissions.push === false) throw new Error("This token can read but not change the site. Ask for a token with “Contents: Read and write”.");
      await loadList();
      saveCfg();
      show("viewList");
    } catch (e) {
      err.textContent = e.status === 401 ? "That token wasn't accepted (it may have expired). Please check it." :
        e.status === 404 ? "Can't find the repository with this token. Check the token and repository name." : e.message;
      err.hidden = false;
      cfg.token = "";
    } finally { busy(false); }
  }

  async function loadList() {
    S.root = await fetchProps();
    S.props = S.root.properties;
    renderList();
  }

  function logout() {
    cfg.token = ""; saveCfg(); $("tokenInput").value = ""; show("viewLogin");
  }

  // ───────────────────────── list view ─────────────────────────
  const imgSrc = src => {
    if (!src) return "";
    if (S.previews[src]) return S.previews[src];
    return /^https?:/i.test(src) ? src : "../" + src;
  };

  function renderList() {
    const el = $("propList");
    $("listCount").textContent = S.props.length + (S.props.length === 1 ? " property" : " properties");
    if (!S.props.length) { el.innerHTML = '<div class="empty">No properties yet.<br>Tap “Add new property” to create the first one.</div>'; return; }
    el.innerHTML = S.props.map((p, i) => {
      const cover = (p.media || []).find(m => m.type === "image");
      const tags = [
        p.active === false ? '<span class="tag warn">Hidden</span>' : '<span class="tag on">Live</span>',
        p.soldOut ? '<span class="tag warn">Sold out</span>' : "",
        p.isHotDeal ? '<span class="tag">Hot deal</span>' : "",
        p.featured ? '<span class="tag">Featured</span>' : "",
        `<span class="tag">${esc(p.category === "commercial" ? "Commercial" : "Residential")}</span>`
      ].join("");
      return `<article class="prop ${p.active === false ? "hidden-prop" : ""}" data-id="${esc(p.id)}">
        <div class="prop-top">
          ${cover ? `<img class="prop-thumb" src="${esc(imgSrc(cover.src))}" alt="" loading="lazy">` : '<div class="prop-thumb"></div>'}
          <div class="prop-info"><h3>${esc(p.title)}</h3><p>${esc(p.priceLabel || "")}</p><p>${esc(LOCATIONS[p.location] || prettify(p.location || ""))} · ${esc(String(p.type || "").toUpperCase())}</p>
          <div class="tags">${tags}</div></div>
        </div>
        <div class="prop-actions">
          <button data-act="edit">✏️ Edit</button>
          <button data-act="active">${p.active === false ? "👁 Show" : "🙈 Hide"}</button>
          <button data-act="sold">${p.soldOut ? "↩ Unsold" : "🔴 Sold"}</button>
          <button data-act="up" ${i === 0 ? "disabled" : ""}>⬆ Move up</button>
          <button data-act="down" ${i === S.props.length - 1 ? "disabled" : ""}>⬇ Move down</button>
          <button data-act="del" class="danger">🗑 Delete</button>
        </div></article>`;
    }).join("");
  }

  async function quickChange(id, fn, msg, busyText) {
    busy(true, busyText || "Saving…");
    try {
      const root = await publish({ mutate: list => { const p = list.find(x => x.id === id); if (p) fn(p, list); return list; }, message: msg });
      S.root = root; S.props = root.properties; renderList();
      toast("Saved. The website updates in about a minute.");
    } catch (e) { toast("Not saved: " + e.message, true); } finally { busy(false); }
  }

  function onListClick(e) {
    const btn = e.target.closest("button[data-act]"); if (!btn) return;
    const id = btn.closest(".prop").dataset.id;
    const p = S.props.find(x => x.id === id); if (!p) return;
    const act = btn.dataset.act;
    if (act === "edit") return openForm(p);
    if (act === "active") return quickChange(id, x => { x.active = x.active === false; }, `${p.active === false ? "Show" : "Hide"} ${p.title}`);
    if (act === "sold") return quickChange(id, x => { x.soldOut = !x.soldOut; }, `${p.soldOut ? "Unmark" : "Mark"} ${p.title} sold out`);
    if (act === "up" || act === "down") {
      return quickChange(id, (x, list) => {
        const i = list.indexOf(x), j = act === "up" ? i - 1 : i + 1;
        if (j >= 0 && j < list.length) { list.splice(i, 1); list.splice(j, 0, x); }
      }, `Reorder ${p.title}`);
    }
    if (act === "del") {
      if (!confirm(`Delete “${p.title}” permanently?\n\nThis removes it and its uploaded photos from the website. (If you only want to take it off the site for now, use Hide instead.)`)) return;
      const files = (p.media || []).map(m => m.src).filter(s => s && s.startsWith(IMG_DIR + "/"));
      busy(true, "Deleting…");
      publish({
        mutate: list => list.filter(x => x.id !== id),
        deletes: files.filter(f => !S.props.some(o => o.id !== id && (o.media || []).some(m => m.src === f))),
        message: `Delete property: ${p.title}`
      }).then(root => { S.root = root; S.props = root.properties; renderList(); toast("Deleted."); })
        .catch(err => toast("Not deleted: " + err.message, true))
        .finally(() => busy(false));
    }
  }

  // ───────────────────────── form: setup ─────────────────────────
  function fillSelect(sel, options, value) {
    sel.innerHTML = options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("");
    if (value !== undefined) sel.value = value;
  }

  function typeOptions(category, extra) {
    const list = [...(TYPES[category] || [])];
    const have = new Set(list.map(x => x[0]));
    S.props.filter(p => p.category === category).forEach(p => { if (p.type && !have.has(p.type)) { have.add(p.type); list.push([p.type, prettify(p.type)]); } });
    if (extra && !have.has(extra)) list.push([extra, prettify(extra)]);
    list.push(["__custom", "Other (type a name)…"]);
    return list;
  }

  function locationOptions(extra) {
    const map = { ...LOCATIONS };
    S.props.forEach(p => { if (p.location && !map[p.location]) map[p.location] = prettify(p.location); });
    if (extra && !map[extra]) map[extra] = prettify(extra);
    return [...Object.entries(map).sort((a, b) => a[1].localeCompare(b[1])), ["__custom", "Other (type a name)…"]];
  }

  function autoPriceLabel() {
    const n = parseFloat($("fPrice").value);
    if (!(n > 0)) return "";
    const lakh = $("fPriceUnit").value === "crore" ? n * 100 : n;
    const txt = lakh >= 100 ? `₹${+(lakh / 100).toFixed(2)} Cr` : `₹${+lakh.toFixed(2)} Lac`;
    return txt + ($("fOnwards").checked ? " Onwards" : "");
  }
  function refreshPriceLabel() { if ($("fPriceLabel").dataset.manual !== "1") $("fPriceLabel").value = autoPriceLabel(); }

  function openForm(p) {
    S.editing = p || null; S.isNew = !p;
    const d = p || {};
    $("formTitle").textContent = p ? p.title : "New property";
    ["fTitle", "fDesc", "fBadge", "fOldPrice", "fMapLink", "fTypeCustom", "fLocationCustom", "linkInput"].forEach(id => $(id).value = "");
    document.querySelectorAll(".invalid").forEach(x => x.classList.remove("invalid"));

    const cat = d.category || "residential";
    $("fCategory").value = cat;
    fillSelect($("fType"), typeOptions(cat, d.type), d.type || (TYPES[cat][0][0]));
    fillSelect($("fLocation"), locationOptions(d.location), d.location || "saltlake");
    $("fTypeCustomWrap").hidden = true; $("fLocationCustomWrap").hidden = true;

    $("fTitle").value = d.title || "";
    $("fDesc").value = d.description || "";
    $("fBadge").value = d.badge || (p ? "" : "FEATURED");
    $("fOldPrice").value = d.oldPriceLabel || "";
    // price
    if (d.price >= 100) { $("fPrice").value = +(d.price / 100).toFixed(4); $("fPriceUnit").value = "crore"; }
    else { $("fPrice").value = d.price ? d.price : ""; $("fPriceUnit").value = "lakh"; }
    $("fOnwards").checked = p ? /onwards/i.test(d.priceLabel || "") : true;
    $("fPriceLabel").value = d.priceLabel || ""; $("fPriceLabel").dataset.manual = p ? "1" : "0";
    if (!p) refreshPriceLabel();

    $("fActive").checked = d.active !== false;
    $("fFeatured").checked = !!d.featured;
    $("fHot").checked = !!d.isHotDeal;
    $("fSold").checked = !!d.soldOut;

    // media
    S.media = (d.media || []).map(m => ({ ...m }));
    renderPhotos();

    // location / nearby
    const a = d.attributes || {};
    $("fMapLink").value = a.mapLink || "";
    S.geo = a.geo && a.geo.lat ? { lat: a.geo.lat, lon: a.geo.lon, label: "Saved location" } : null;
    renderGeoChosen();
    $("geoPick").hidden = true; $("nearbyStatus").hidden = true; $("aiBox").hidden = true;
    $("aiBtn").hidden = !cfg.worker;
    S.nearby = Object.entries(a)
      .filter(([, v]) => v && typeof v === "object" && v.name !== undefined)
      .map(([key, v]) => ({ key, ...nbInfo(key), on: true, name: v.name, km: v.distanceKm ?? "" }));
    renderNearby();

    // attributes
    const SKIP = new Set(["mapLink", "geo"]);
    S.attrs = Object.entries(a)
      .filter(([k, v]) => !SKIP.has(k) && v !== null && v !== undefined && v !== "" && typeof v !== "object")
      .map(([key, v]) => {
        const label = (SUGGEST_LABELS[key]) || prettify(key);
        return { key, label, baseLabel: label, value: typeof v === "boolean" ? (v ? "Yes" : "No") : String(v), kind: typeof v === "boolean" ? "bool" : typeof v === "number" ? "number" : "text" };
      });
    renderAttrs(); renderChips();

    S.units = (d.unitTypes || []).map(u => ({ ...u }));
    renderUnits();

    show("viewForm");
    $("nearbyBtn").disabled = !S.geo;
  }
  const SUGGEST_LABELS = {};
  Object.values(SUGGEST).flat().forEach(([k, l]) => { if (!(k in SUGGEST_LABELS)) SUGGEST_LABELS[k] = l; });

  // ───────────────────────── form: photos ─────────────────────────
  function renderPhotos() {
    $("photoGrid").innerHTML = S.media.map((m, i) => {
      const body = m.type === "video" ? '<div class="vid">🎬</div>' : `<img src="${esc(m.preview || imgSrc(m.src))}" alt="Photo ${i + 1}">`;
      return `<div class="ph" data-i="${i}">${body}
        ${i === 0 && m.type === "image" ? '<span class="cover">COVER</span>' : ""}${m.pending ? '<span class="new">NEW</span>' : ""}
        <div class="ph-ctl"><button type="button" data-ph="left" ${i === 0 ? "disabled" : ""} aria-label="Move earlier">◀</button>
        <button type="button" data-ph="del" aria-label="Remove">🗑</button>
        <button type="button" data-ph="right" ${i === S.media.length - 1 ? "disabled" : ""} aria-label="Move later">▶</button></div></div>`;
    }).join("");
  }

  async function shrinkImage(file, maxDim = 1600, quality = 0.82) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch (e) {
      bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); });
    }
    const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const c = document.createElement("canvas"); c.width = Math.round(w * scale); c.height = Math.round(h * scale);
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error("Could not process image")), "image/jpeg", quality));
  }

  async function addFiles(files) {
    if (!files || !files.length) return;
    busy(true, "Preparing photos…");
    try {
      for (const f of files) {
        if (!f.type.startsWith("image/")) { toast("Skipped " + f.name + " (not a photo)", true); continue; }
        const blob = await shrinkImage(f);
        S.media.push({ type: "image", pending: true, blob, preview: URL.createObjectURL(blob) });
      }
      renderPhotos();
    } catch (e) { toast("Could not use that photo: " + e.message, true); } finally { busy(false); }
  }

  // ───────────────────────── form: location & nearby ─────────────────────────
  function renderGeoChosen() {
    const el = $("geoChosen");
    if (!S.geo) { el.hidden = true; return; }
    el.hidden = false; el.classList.add("ok");
    el.innerHTML = `📍 Location set: <strong>${esc(S.geo.label || "")}</strong><br><span class="muted">${(+S.geo.lat).toFixed(4)}, ${(+S.geo.lon).toFixed(4)}</span>`;
    $("nearbyBtn").disabled = false;
  }

  async function geocode() {
    const q = $("fMapLink").value.trim();
    if (!q) { toast("Type the address or area first.", true); return; }
    busy(true, "Searching the map…");
    try {
      const r = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&q=" + encodeURIComponent(q));
      const res = await r.json();
      const box = $("geoPick");
      if (!res.length) { box.hidden = false; box.innerHTML = '<div class="notice">Nothing found. Try a simpler name, e.g. “Action Area III, New Town” or use “I’m at the site”.</div>'; return; }
      box.hidden = false;
      box.innerHTML = res.map((x, i) => `<button type="button" class="btn btn-secondary" data-geo="${i}">${esc(x.display_name)}</button>`).join("");
      box._res = res;
    } catch (e) { toast("Map search failed: " + e.message, true); } finally { busy(false); }
  }

  function useGps() {
    if (!navigator.geolocation) { toast("This phone can't share its location.", true); return; }
    busy(true, "Getting your location…");
    navigator.geolocation.getCurrentPosition(async pos => {
      S.geo = { lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Your current location" };
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat=${S.geo.lat}&lon=${S.geo.lon}`);
        const j = await r.json();
        if (j && j.display_name) {
          S.geo.label = j.display_name;
          if (!$("fMapLink").value.trim()) {
            const ad = j.address || {};
            $("fMapLink").value = [ad.road, ad.neighbourhood || ad.suburb, ad.city || ad.town || ad.county, ad.state].filter(Boolean).join(", ");
          }
        }
      } catch (e) { /* non-fatal */ }
      renderGeoChosen(); busy(false);
    }, err => { busy(false); toast("Couldn't get location: " + err.message, true); }, { enableHighAccuracy: true, timeout: 20000 });
  }

  const rad = x => x * Math.PI / 180;
  function hav(lat1, lon1, lat2, lon2) {
    const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
  async function overpass(query) {
    let last;
    for (const url of OVERPASS) {
      try {
        const r = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(query), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        if (!r.ok) throw new Error("HTTP " + r.status);
        return (await r.json()).elements || [];
      } catch (e) { last = e; }
    }
    throw last;
  }

  async function fetchNearby() {
    if (!S.geo) { toast("Set the location first (Find on map / I'm at the site).", true); return; }
    const type = currentType();
    const keys = nbSet(type);
    const { lat, lon } = S.geo;
    const status = $("nearbyStatus"); status.hidden = false;
    $("nearbyBtn").disabled = true;
    const found = {};   // key -> [{name, lat, lon, d}]
    try {
      for (const key of keys) {
        const c = NB[key];
        status.textContent = `Looking up ${c.label.toLowerCase()}…`;
        const parts = c.q.map(f => `nwr(around:${c.r},${lat},${lon})${f};`).join("");
        let els = [];
        try { els = await overpass(`[out:json][timeout:25];(${parts});out center tags;`); } catch (e) { status.textContent = `Couldn't look up ${c.label.toLowerCase()} (server busy) — skipping.`; await sleep(600); continue; }
        const cand = els.map(el => {
          const la = el.lat ?? el.center?.lat, lo = el.lon ?? el.center?.lon;
          return la == null ? null : { name: (el.tags && (el.tags["name:en"] || el.tags.name)) || "", lat: la, lon: lo, d: hav(lat, lon, la, lo) };
        }).filter(x => x && x.name).sort((a, b) => a.d - b.d);
        // de-duplicate by name, keep 3 nearest distinct
        const seen = new Set(); const top = [];
        for (const x of cand) { if (!seen.has(x.name)) { seen.add(x.name); top.push(x); } if (top.length >= 3) break; }
        if (top.length) found[key] = top;
        await sleep(350);
      }

      // road distances for all candidates in one OSRM call (fallback: straight-line × 1.3)
      status.textContent = "Measuring distances…";
      const flat = Object.entries(found).flatMap(([key, arr]) => arr.map(x => ({ key, x })));
      let roadOK = false;
      if (flat.length) {
        try {
          const coords = [`${lon},${lat}`, ...flat.map(f => `${f.x.lon},${f.x.lat}`)].join(";");
          const r = await fetch(`https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance`);
          const j = await r.json();
          if (j.distances && j.distances[0]) { flat.forEach((f, i) => { const m = j.distances[0][i + 1]; if (m != null) { f.x.road = m; } }); roadOK = true; }
        } catch (e) { /* fall back */ }
      }
      let added = 0;
      for (const [key, arr] of Object.entries(found)) {
        arr.forEach(x => { x.km = x.road != null ? x.road / 1000 : x.d * 1.3 / 1000; });
        const best = arr.sort((a, b) => a.km - b.km)[0];
        const row = { key, ...nbInfo(key), on: true, name: best.name, km: Math.round(best.km * 10) / 10 };
        const i = S.nearby.findIndex(n => n.key === key);
        if (i >= 0) S.nearby[i] = row; else S.nearby.push(row);
        added++;
      }
      // keep a stable, sensible order
      const order = Object.keys(NB);
      S.nearby.sort((a, b) => (order.indexOf(a.key) + 1 || 99) - (order.indexOf(b.key) + 1 || 99));
      renderNearby();
      status.textContent = added
        ? `Found ${added} nearby places${roadOK ? " (driving distances)" : " (approximate — straight-line distance × 1.3)"}. Please check them below.`
        : "No places found automatically. You can add them by hand in “More details”.";
    } catch (e) {
      status.textContent = "Something went wrong: " + e.message;
    } finally { $("nearbyBtn").disabled = false; }
  }

  function renderNearby() {
    $("nearbyList").innerHTML = S.nearby.map((n, i) => `
      <div class="nb" data-i="${i}">
        <input type="checkbox" data-nb="on" ${n.on ? "checked" : ""} aria-label="Include">
        <div class="nb-label">${esc(n.icon)} ${esc(n.label)} · distance in km below</div>
        <input class="nb-name" data-nb="name" value="${esc(n.name)}" aria-label="Name">
        <input class="nb-km" data-nb="km" inputmode="decimal" value="${esc(n.km)}" aria-label="Distance in km" placeholder="Distance (km)">
        <button type="button" class="x nb-del" data-nb="del" aria-label="Remove">✕</button>
      </div>`).join("");
  }

  function currentType() {
    const v = $("fType").value;
    return v === "__custom" ? slug($("fTypeCustom").value) : v;
  }

  // ───────────────────────── form: attributes ─────────────────────────
  function renderAttrs() {
    $("attrRows").innerHTML = S.attrs.map((a, i) => `
      <div class="attr" data-i="${i}">
        <input data-at="label" value="${esc(a.label)}" placeholder="Detail (e.g. Facing)" aria-label="Detail name">
        ${a.kind === "bool"
          ? `<select data-at="value" aria-label="Value"><option value="">—</option><option ${a.value === "Yes" ? "selected" : ""}>Yes</option><option ${a.value === "No" ? "selected" : ""}>No</option></select>`
          : `<input data-at="value" value="${esc(a.value)}" placeholder="Value" aria-label="Value">`}
        <button type="button" class="x" data-at="del" aria-label="Remove">✕</button>
      </div>`).join("");
    renderChips();
  }

  function renderChips() {
    const kind = suggestKind(currentType());
    const have = new Set(S.attrs.map(a => a.key));
    $("suggestChips").innerHTML = SUGGEST[kind].filter(([k]) => !have.has(k))
      .map(([k, l]) => `<button type="button" class="chip" data-chip="${esc(k)}" data-label="${esc(l)}">＋ ${esc(l)}</button>`).join("");
  }

  function addAttr(key, label, value = "", focus = true) {
    const kind = ["vastu", "gatedCommunity", "cornerPlot", "boundaryWall", "reraApproved"].includes(key) ? "bool" : "text";
    S.attrs.push({ key: key || camel(label), label, baseLabel: label, value, kind });
    renderAttrs();
    if (focus) { const rows = $("attrRows").querySelectorAll(".attr"); const last = rows[rows.length - 1]; (last.querySelector('[data-at="value"]') || last.querySelector("input")).focus(); }
  }

  // ───────────────────────── form: units ─────────────────────────
  function renderUnits() {
    $("unitRows").innerHTML = S.units.map((u, i) => `
      <div class="unit" data-i="${i}">
        <input class="unit-wide" data-un="config" value="${esc(u.config || "")}" placeholder="Configuration, e.g. 3 BHK + 3T">
        <input data-un="size" value="${esc(u.size || "")}" placeholder="Size, e.g. 2510 Sq.Ft">
        <input data-un="parking" value="${esc(u.parking || "")}" placeholder="Parking, e.g. 2 Covered">
        <input data-un="price" value="${esc(u.price || "")}" placeholder="Price, e.g. ₹3.25 Cr Onwards">
        <button type="button" class="x" data-un="del">✕ Remove</button>
      </div>`).join("");
  }

  // ───────────────────────── form: AI helper ─────────────────────────
  async function askAI() {
    const prop = collect(true);
    busy(true, "Asking AI…");
    try {
      const r = await fetch(cfg.worker, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + cfg.token },
        body: JSON.stringify({ property: prop, nearby: S.nearby.filter(n => n.on).map(n => ({ label: n.label, name: n.name, km: n.km })) })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || ("HTTP " + r.status));
      const box = $("aiBox"); box.hidden = false; box.classList.remove("ok");
      const withVal = (j.attributes || []).filter(a => a.value !== null && a.value !== "" && a.value !== undefined);
      const without = (j.attributes || []).filter(a => a.value === null || a.value === "" || a.value === undefined);
      box.innerHTML = `
        ${j.description ? `<p><strong>Suggested description</strong><br>${esc(j.description)}</p><button type="button" class="btn btn-secondary btn-sm" data-ai="desc">Use this description</button><br><br>` : ""}
        ${withVal.length ? `<p><strong>Suggested details</strong> (tap to add)</p><div class="chips">${withVal.map((a, i) => `<button type="button" class="chip" data-ai="attr" data-i="${i}">＋ ${esc(a.label)}: ${esc(a.value)}</button>`).join("")}</div>` : ""}
        ${without.length ? `<p><strong>Worth asking the owner</strong> (tap to add an empty field)</p><div class="chips">${without.map((a, i) => `<button type="button" class="chip" data-ai="ask" data-i="${i}">＋ ${esc(a.label)}</button>`).join("")}</div>` : ""}
        <p class="hint">AI suggestions use only the details above and nearby places. Always check them before publishing.</p>`;
      box._ai = { desc: j.description, withVal, without };
    } catch (e) { toast("AI helper: " + e.message, true); } finally { busy(false); }
  }

  // ───────────────────────── form: collect + validate + save ─────────────────────────
  function collect(forAI) {
    const cat = $("fCategory").value;
    const typeVal = $("fType").value === "__custom" ? slug($("fTypeCustom").value) : $("fType").value;
    const locVal = $("fLocation").value === "__custom" ? slug($("fLocationCustom").value) : $("fLocation").value;
    const n = parseFloat($("fPrice").value);
    const price = n > 0 ? Math.round((($("fPriceUnit").value === "crore" ? n * 100 : n)) * 100) / 100 : 0;
    const budget = price < 50 ? "under50" : price < 100 ? "50-100" : price < 200 ? "1cr+" : "2cr+";

    // attributes
    const attributes = {};
    S.attrs.forEach(a => {
      const label = a.label.trim(); const key = (label === a.baseLabel ? a.key : camel(label));
      const raw = String(a.value || "").trim();
      if (!label || !raw || !key) return;
      let v = raw;
      if (a.kind === "bool" || /^(yes|no)$/i.test(raw)) v = /^yes$/i.test(raw);
      else if (a.kind === "number" && !isNaN(+raw)) v = +raw;
      attributes[key] = v;
    });
    S.nearby.forEach(nb => {
      if (!nb.on || !String(nb.name).trim()) return;
      const km = parseFloat(nb.km);
      attributes[nb.key] = { name: String(nb.name).trim(), distanceKm: isNaN(km) ? 0 : km };
    });
    const addr = $("fMapLink").value.trim(); if (addr) attributes.mapLink = addr;
    if (S.geo) attributes.geo = { lat: Math.round(S.geo.lat * 1e5) / 1e5, lon: Math.round(S.geo.lon * 1e5) / 1e5 };

    const units = S.units.filter(u => (u.config || "").trim()).map(u => ({ config: u.config.trim(), size: (u.size || "").trim(), parking: (u.parking || "").trim(), price: (u.price || "").trim() }));

    const base = S.editing ? { ...S.editing } : {};
    const p = {
      ...base,
      id: base.id || "",
      title: $("fTitle").value.trim(),
      description: $("fDesc").value.trim(),
      category: cat,
      isHotDeal: $("fHot").checked,
      featured: $("fFeatured").checked,
      badge: $("fBadge").value.trim() || "FEATURED",
      badgeClass: base.badgeClass || "featured",
      price, priceLabel: $("fPriceLabel").value.trim() || autoPriceLabel(),
      budget,
      location: locVal, type: typeVal,
      soldOut: $("fSold").checked,
      active: $("fActive").checked,
      attributes
    };
    const old = $("fOldPrice").value.trim(); if (old) p.oldPriceLabel = old; else delete p.oldPriceLabel;
    if (units.length) p.unitTypes = units; else delete p.unitTypes;
    if (!forAI) p.media = S.media;   // caller replaces pending entries with repo paths
    return p;
  }

  function validate(p) {
    const bad = [];
    const mark = (id, cond) => { const f = $(id).closest(".field"); if (f) f.classList.toggle("invalid", !cond); if (!cond) bad.push(id); };
    mark("fTitle", !!p.title);
    mark("fDesc", !!p.description);
    mark("fPrice", p.price > 0);
    mark("fMapLink", !!$("fMapLink").value.trim());
    mark("fType", !!p.type); mark("fLocation", !!p.location);
    if ($("fType").value === "__custom") mark("fTypeCustom", !!p.type);
    if ($("fLocation").value === "__custom") mark("fLocationCustom", !!p.location);
    if (!S.media.some(m => m.type === "image")) bad.push("photos");
    return bad;
  }

  async function saveForm(e) {
    e.preventDefault();
    const p = collect(false);
    const bad = validate(p);
    if (bad.length) {
      if (bad[0] === "photos") toast("Please add at least one photo.", true);
      else { toast("Please fill in the highlighted fields.", true); const el = $(bad[0]); el.closest("details")?.setAttribute("open", ""); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
      return;
    }
    busy(true, "Saving… this can take a little while if there are photos.");
    try {
      const isNew = S.isNew;
      let id = p.id;
      const uploads = [];
      const stamp = Date.now().toString(36);
      let n = 0;
      // keep deletions: repo photos that were removed in the form
      const keep = new Set(S.media.map(m => m.src).filter(Boolean));
      const removed = ((S.editing && S.editing.media) || []).map(m => m.src).filter(s => s && s.startsWith(IMG_DIR + "/") && !keep.has(s));
      const mutate = list => {
        if (isNew) {
          const max = list.reduce((m, x) => Math.max(m, parseInt(String(x.id).replace(/\D/g, ""), 10) || 0), 0);
          id = "p-" + String(max + 1).padStart(3, "0");
        }
        p.id = id;
        p.media = S.media.map(m => {
          if (m.pending) {
            if (!m._path) { m._path = `${IMG_DIR}/${id}-${stamp}-${++n}.jpg`; uploads.push({ path: m._path, blob: m.blob }); S.previews[m._path] = m.preview; }
            return { type: "image", src: m._path };
          }
          return { type: m.type, src: m.src };
        });
        const i = list.findIndex(x => x.id === id);
        if (i >= 0) list[i] = p; else list.push(p);
        return list;
      };
      // run mutate once up front so uploads/ids are known, then publish (publish re-runs mutate on the freshest data)
      mutate(JSON.parse(JSON.stringify(S.props)));
      const doneUploads = uploads.slice();
      const root = await publish({
        mutate: list => { const mm = mutate(list); return mm; },
        uploads: doneUploads, deletes: removed,
        message: `${isNew ? "Add" : "Update"} property: ${p.title}`
      });
      S.root = root; S.props = root.properties; renderList(); show("viewList");
      toast("Saved! The website will update in about a minute.");
    } catch (err) {
      toast("Not saved: " + err.message, true);
    } finally { busy(false); }
  }

  // ───────────────────────── events ─────────────────────────
  function wire() {
    $("loginBtn").addEventListener("click", login);
    $("tokenInput").addEventListener("keydown", e => { if (e.key === "Enter") login(); });
    $("logoutBtn").addEventListener("click", logout);
    $("addBtn").addEventListener("click", () => openForm(null));
    $("backBtn").addEventListener("click", () => { if (confirm("Leave without saving?")) show("viewList"); });
    $("propList").addEventListener("click", onListClick);
    $("propForm").addEventListener("submit", saveForm);

    // category / type / location
    $("fCategory").addEventListener("change", () => {
      const cat = $("fCategory").value;
      fillSelect($("fType"), typeOptions(cat), TYPES[cat][0][0]);
      $("fTypeCustomWrap").hidden = true; renderChips();
    });
    $("fType").addEventListener("change", () => { $("fTypeCustomWrap").hidden = $("fType").value !== "__custom"; renderChips(); });
    $("fTypeCustom").addEventListener("input", renderChips);
    $("fLocation").addEventListener("change", () => { $("fLocationCustomWrap").hidden = $("fLocation").value !== "__custom"; });

    // price
    ["fPrice", "fPriceUnit", "fOnwards"].forEach(id => { $(id).addEventListener("input", refreshPriceLabel); $(id).addEventListener("change", refreshPriceLabel); });
    $("fPriceLabel").addEventListener("input", () => { $("fPriceLabel").dataset.manual = "1"; });

    // photos
    $("camInput").addEventListener("change", e => { addFiles([...e.target.files]); e.target.value = ""; });
    $("galInput").addEventListener("change", e => { addFiles([...e.target.files]); e.target.value = ""; });
    $("linkAddBtn").addEventListener("click", () => {
      const u = $("linkInput").value.trim();
      if (!/^https?:\/\//i.test(u)) { toast("Enter a full web link starting with https://", true); return; }
      S.media.push({ type: $("linkType").value, src: u }); $("linkInput").value = ""; renderPhotos();
    });
    $("photoGrid").addEventListener("click", e => {
      const b = e.target.closest("button[data-ph]"); if (!b) return;
      const i = +b.closest(".ph").dataset.i;
      if (b.dataset.ph === "del") S.media.splice(i, 1);
      else { const j = b.dataset.ph === "left" ? i - 1 : i + 1; if (S.media[j]) { [S.media[i], S.media[j]] = [S.media[j], S.media[i]]; } }
      renderPhotos();
    });

    // location
    $("findBtn").addEventListener("click", geocode);
    $("gpsBtn").addEventListener("click", useGps);
    $("geoPick").addEventListener("click", e => {
      const b = e.target.closest("button[data-geo]"); if (!b) return;
      const x = $("geoPick")._res[+b.dataset.geo];
      S.geo = { lat: +x.lat, lon: +x.lon, label: x.display_name };
      $("geoPick").hidden = true; renderGeoChosen();
    });
    $("nearbyBtn").addEventListener("click", fetchNearby);
    $("nearbyList").addEventListener("input", e => {
      const row = e.target.closest(".nb"); if (!row) return; const n = S.nearby[+row.dataset.i]; const f = e.target.dataset.nb;
      if (f === "name") n.name = e.target.value; if (f === "km") n.km = e.target.value; if (f === "on") n.on = e.target.checked;
    });
    $("nearbyList").addEventListener("click", e => {
      const b = e.target.closest('button[data-nb="del"]'); if (!b) return;
      S.nearby.splice(+b.closest(".nb").dataset.i, 1); renderNearby();
    });
    $("aiBtn").addEventListener("click", askAI);
    $("aiBox").addEventListener("click", e => {
      const b = e.target.closest("button[data-ai]"); if (!b) return; const ai = $("aiBox")._ai; if (!ai) return;
      if (b.dataset.ai === "desc") { $("fDesc").value = ai.desc; toast("Description replaced."); }
      if (b.dataset.ai === "attr") { const a = ai.withVal[+b.dataset.i]; addAttr(a.key || camel(a.label), a.label, String(a.value), false); b.disabled = true; }
      if (b.dataset.ai === "ask") { const a = ai.without[+b.dataset.i]; addAttr(a.key || camel(a.label), a.label, "", true); b.disabled = true; }
    });

    // attributes
    $("attrAddBtn").addEventListener("click", () => { S.attrs.push({ key: "", label: "", baseLabel: "", value: "", kind: "text" }); renderAttrs(); const r = $("attrRows").querySelectorAll(".attr"); r[r.length - 1].querySelector("input").focus(); });
    $("attrRows").addEventListener("input", e => {
      const row = e.target.closest(".attr"); if (!row) return; const a = S.attrs[+row.dataset.i];
      if (e.target.dataset.at === "label") a.label = e.target.value; if (e.target.dataset.at === "value") a.value = e.target.value;
    });
    $("attrRows").addEventListener("change", e => { const row = e.target.closest(".attr"); if (row && e.target.tagName === "SELECT") S.attrs[+row.dataset.i].value = e.target.value; });
    $("attrRows").addEventListener("click", e => { const b = e.target.closest('button[data-at="del"]'); if (!b) return; S.attrs.splice(+b.closest(".attr").dataset.i, 1); renderAttrs(); });
    $("suggestChips").addEventListener("click", e => { const b = e.target.closest("button[data-chip]"); if (b) addAttr(b.dataset.chip, b.dataset.label); });

    // units
    $("unitAddBtn").addEventListener("click", () => { S.units.push({ config: "", size: "", parking: "", price: "" }); renderUnits(); });
    $("unitRows").addEventListener("input", e => { const row = e.target.closest(".unit"); if (row && e.target.dataset.un) S.units[+row.dataset.i][e.target.dataset.un] = e.target.value; });
    $("unitRows").addEventListener("click", e => { const b = e.target.closest('button[data-un="del"]'); if (b) { S.units.splice(+b.closest(".unit").dataset.i, 1); renderUnits(); } });
  }

  // ───────────────────────── boot ─────────────────────────
  async function boot() {
    wire();
    $("repoInput").value = cfg.repo; $("branchInput").value = cfg.branch; $("workerInput").value = cfg.worker || "";
    if (cfg.token) {
      busy(true, "Loading listings…");
      try { await loadList(); show("viewList"); }
      catch (e) { cfg.token = ""; $("loginError").textContent = e.status === 401 ? "Your session expired. Please paste a fresh token." : e.message; $("loginError").hidden = false; show("viewLogin"); }
      finally { busy(false); }
    }
  }
  boot();
})();
