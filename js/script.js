// ==============================
// CIVIUM ESTATE — MAIN SCRIPT
// ==============================


// ─────────────────────────────────────────
// 1. MOBILE NAV TOGGLE
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".nav-toggle");
  const backdrop  = document.querySelector(".nav-backdrop");
  const navLinks  = document.querySelectorAll(".nav-links a");
  if (!toggleBtn || !backdrop) return;
  const openNav  = () => { document.body.classList.add("nav-open");    toggleBtn.setAttribute("aria-expanded", "true");  };
  const closeNav = () => { document.body.classList.remove("nav-open"); toggleBtn.setAttribute("aria-expanded", "false"); };
  toggleBtn.addEventListener("click",  () => document.body.classList.contains("nav-open") ? closeNav() : openNav());
  backdrop.addEventListener("click",   closeNav);
  navLinks.forEach(l => l.addEventListener("click", closeNav));
  document.addEventListener("keydown", e => e.key === "Escape" && closeNav());
});


// ─────────────────────────────────────────
// 2. SMOOTH SCROLL
// ─────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});


// ─────────────────────────────────────────
// 3. NAVBAR SCROLL TINT
// ─────────────────────────────────────────
window.addEventListener("scroll", () => {
  document.querySelector(".header").style.background =
    window.scrollY > 60 ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.7)";
});


// ─────────────────────────────────────────
// 4. AOS INIT
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (typeof AOS !== "undefined")
    AOS.init({ duration: 1000, easing: "ease-in-out", once: true, offset: 100 });
});


// ─────────────────────────────────────────
// 5. HERO PARALLAX
// ─────────────────────────────────────────
window.addEventListener("scroll", () => {
  const hero = document.querySelector(".hero-overlay");
  if (hero) hero.style.transform = `translateY(${window.scrollY * 0.2}px)`;
});


// ─────────────────────────────────────────
// 6. COUNTER
// ─────────────────────────────────────────
const startCounters = () => {
  document.querySelectorAll(".counter").forEach(counter => {
    const target = +counter.getAttribute("data-target");
    const step   = target / 200;
    const tick   = () => {
      const c = +counter.innerText;
      if (c < target) { counter.innerText = Math.ceil(c + step); setTimeout(tick, 10); }
      else counter.innerText = target;
    };
    tick();
  });
};
const credSec = document.querySelector(".credibility");
if (credSec) new IntersectionObserver((entries, obs) => {
  entries.forEach(e => { if (e.isIntersecting) { startCounters(); obs.disconnect(); } });
}).observe(credSec);


// ─────────────────────────────────────────
// 7. TESTIMONIAL SLIDER
// ─────────────────────────────────────────
let currentSlide = 0;
const testimonials = document.querySelectorAll(".testimonial");
if (testimonials.length) {
  const showSlide = i => { testimonials.forEach(s => s.classList.remove("active")); testimonials[i].classList.add("active"); };
  setInterval(() => { currentSlide = (currentSlide + 1) % testimonials.length; showSlide(currentSlide); }, 4000);
}


// ─────────────────────────────────────────
// 8. LEAD POPUP (Enquire Now button)
// ─────────────────────────────────────────
const popup = document.getElementById("leadPopup");
const closePopupBtn = document.getElementById("closePopup");
if (closePopupBtn) closePopupBtn.addEventListener("click", () => popup.style.display = "none");
// Delegated — works for dynamically rendered buttons
document.addEventListener("click", e => {
  if (e.target.matches(".ep-enquire-btn") && !e.target.disabled)
    popup.style.display = "flex";
});


// ─────────────────────────────────────────
// 9. CONTACT FORM
// ─────────────────────────────────────────
const contactForm    = document.getElementById("contactForm");
const successMessage = document.getElementById("successMessage");

const validateForm = fd => {
  let ok = true; const err = {};
  const name = fd.get("fullName")?.trim();
  if (!name || name.length < 2)                                      { err.fullName = "Please enter a valid name"; ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.get("email")?.trim()))  { err.email = "Please enter a valid email"; ok = false; }
  const ph = fd.get("phone")?.trim().replace(/[\s\-\(\)]/g, "");
  if (!/^[\+]?[0-9]{10,15}$/.test(ph))                              { err.phone = "Please enter a valid phone number"; ok = false; }
  if (!fd.get("propertyInterest"))                                   { err.propertyInterest = "Please select an interest"; ok = false; }
  const msg = fd.get("message")?.trim();
  if (!msg || msg.length < 10)                                       { err.message = "Message must be at least 10 characters"; ok = false; }
  return { isValid: ok, errors: err };
};

const displayErrors = errors => {
  document.querySelectorAll(".form-group").forEach(g => {
    g.classList.remove("error");
    const e = g.querySelector(".error-message"); if (e) e.textContent = "";
  });
  Object.keys(errors).forEach(field => {
    const el = document.getElementById(field);
    if (el) {
      const g = el.closest(".form-group"); g.classList.add("error");
      const e = g.querySelector(".error-message"); if (e) e.textContent = errors[field];
    }
  });
};

if (contactForm) {
  contactForm.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(contactForm);
    const v  = validateForm(fd);
    if (!v.isValid) { displayErrors(v.errors); return; }
    displayErrors({});
    const btn = contactForm.querySelector(".submit-btn");
    btn.disabled = true;
    btn.querySelector(".btn-text").style.display   = "none";
    btn.querySelector(".btn-loader").style.display = "inline-block";
    try {
      await new Promise(r => setTimeout(r, 1500));
      contactForm.style.display    = "none";
      successMessage.style.display = "block";
      contactForm.reset();
      setTimeout(() => {
        successMessage.style.display = "none";
        contactForm.style.display    = "flex";
        btn.disabled = false;
        btn.querySelector(".btn-text").style.display   = "inline-block";
        btn.querySelector(".btn-loader").style.display = "none";
      }, 5000);
    } catch { alert("Something went wrong. Please try again."); btn.disabled = false; }
  });

  contactForm.querySelectorAll("input,select,textarea").forEach(field => {
    field.addEventListener("blur", function() {
      const v = validateForm(new FormData(contactForm));
      const g = this.closest(".form-group");
      if (v.errors[this.id]) { g.classList.add("error"); g.querySelector(".error-message").textContent = v.errors[this.id]; }
      else                   { g.classList.remove("error"); g.querySelector(".error-message").textContent = ""; }
    });
  });
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  HOVER SLIDESHOW ENGINE                                      ║
// ╚══════════════════════════════════════════════════════════════╝

function buildMediaStack(media, altText) {
  if (!media || !media.length) return "";
  const hasVideo = media.some(m => m.type === "video");
  const layers = media.map((item, i) => {
    const active = i === 0 ? " media-layer--active" : "";
    if (item.type === "video")
      return `<video class="media-layer${active}" src="${item.src}" muted loop playsinline preload="none" aria-label="${altText} – video tour"></video>`;
    return `<img class="media-layer${active}" src="${item.src}" alt="${altText}${i > 0 ? ` – photo ${i+1}` : ""}" loading="${i === 0 ? "eager" : "lazy"}">`;
  }).join("");
  const dots = media.map((_, i) => `<span class="media-dot${i === 0 ? " media-dot--active" : ""}"></span>`).join("");
  return `<div class="media-stack"${hasVideo ? ' data-has-video="true"' : ""}>${layers}<div class="media-dots">${dots}</div></div>`;
}

function attachHoverSlideshow(card) {
  const stack  = card.querySelector(".media-stack");
  if (!stack) return;
  const layers = Array.from(stack.querySelectorAll(".media-layer"));
  const dots   = Array.from(stack.querySelectorAll(".media-dot"));
  if (layers.length <= 1) return;
  let idx = 0, timer = null;
  function goTo(i) {
    layers[idx].classList.remove("media-layer--active"); dots[idx]?.classList.remove("media-dot--active");
    if (layers[idx].tagName === "VIDEO") layers[idx].pause();
    idx = i;
    layers[idx].classList.add("media-layer--active"); dots[idx]?.classList.add("media-dot--active");
    if (layers[idx].tagName === "VIDEO") { layers[idx].currentTime = 0; layers[idx].play().catch(()=>{}); }
  }
  function advance() { goTo((idx + 1) % layers.length); timer = setTimeout(advance, 1200); }
  card.addEventListener("mouseenter", () => { timer = setTimeout(advance, 1200); });
  card.addEventListener("mouseleave", () => {
    clearTimeout(timer); timer = null;
    if (layers[idx].tagName === "VIDEO") layers[idx].pause();
    stack.classList.add("media-stack--no-transition");
    goTo(0);
    requestAnimationFrame(() => requestAnimationFrame(() => stack.classList.remove("media-stack--no-transition")));
  });
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  DATA BOOTSTRAP                                              ║
// ╚══════════════════════════════════════════════════════════════╝

document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    fetch("data/properties.json").then(r => r.ok ? r.json() : Promise.reject(r.status)),
    fetch("data/contact.json").then(r => r.ok ? r.json() : Promise.reject(r.status))
  ])
  .then(([propData, contactData]) => {
    // Filter out inactive properties before anything else
    const activeProperties = propData.properties.filter(p => p.active !== false);
    initExploreProperties(activeProperties);
    renderContactInfo(contactData.contact);
  })
  .catch(err => {
    console.error("Failed to load data files:", err);
    const grid = document.getElementById("epGrid");
    if (grid) grid.innerHTML = `<p class="loading-text" style="color:#c5a47e;">Unable to load properties. Please try again later.</p>`;
  });
});


// ╔══════════════════════════════════════════════════════════════╗
// ║  DYNAMIC FILTER POPULATION                                   ║
// ╚══════════════════════════════════════════════════════════════╝

// Pretty-print location keys → readable labels
const LOCATION_LABELS = {
  saltlake: "Salt Lake", newtown: "New Town", rajarhat: "Rajarhat",
  embypass: "EM Bypass", ballygunge: "Ballygunge", alipore: "Alipore / New Alipore",
  behala: "Behala", parkstreet: "Park Street", camacstreet: "Camac Street",
  elginroad: "Elgin Road", dankuni: "Dankuni", barasat: "Barasat"
};

const TYPE_LABELS = {
  "2bhk": "2 BHK", "3bhk": "3 BHK", "4bhk": "4 BHK", "5bhk": "5 BHK",
  villa: "Villa", office: "Office / Co-working", retail: "Retail / Showroom",
  warehouse: "Warehouse / Storage"
};

// Compute smart price brackets from actual price distribution
function computeBudgetBrackets(properties) {
  const prices  = properties.map(p => p.price).sort((a, b) => a - b);
  const min     = prices[0];
  const max     = prices[prices.length - 1];
  const brackets = [];

  // Strategy: use meaningful real-estate thresholds that fit the range
  const thresholds = [50, 75, 100, 150, 200, 300, 400, 500];

  let prev = 0;
  for (const t of thresholds) {
    if (t <= min) continue; // skip if below our cheapest
    if (t > max)  break;    // stop once above our most expensive

    const count = properties.filter(p => p.price > prev && p.price <= t).length;
    if (count === 0) continue; // skip empty brackets

    const label = prev === 0
      ? `Under ₹${t < 100 ? t + "L" : (t/100) + "Cr"}`
      : `₹${prev < 100 ? prev + "L" : (prev/100) + "Cr"} – ₹${t < 100 ? t + "L" : (t/100) + "Cr"}`;
    brackets.push({ value: `${prev}-${t}`, label, min: prev, max: t });
    prev = t;
  }
  // Final bracket: above last threshold up to max
  if (prev < max) {
    const count = properties.filter(p => p.price > prev).length;
    if (count > 0) {
      const label = `Above ₹${prev < 100 ? prev + "L" : (prev/100) + "Cr"}`;
      brackets.push({ value: `${prev}-99999`, label, min: prev, max: 99999 });
    }
  }
  return brackets;
}

function populateFilters(properties) {
  // ── Budget ──────────────────────────────────────────────────
  const budgetSel    = document.getElementById("epBudget");
  const budgetBrackets = computeBudgetBrackets(properties);
  budgetBrackets.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.value; opt.textContent = b.label;
    budgetSel.appendChild(opt);
  });

  // ── Location — grouped by category ─────────────────────────
  const locationSel = document.getElementById("epLocation");
  const resCats  = [...new Set(properties.filter(p => p.category === "residential").map(p => p.location))].sort();
  const commCats = [...new Set(properties.filter(p => p.category === "commercial").map(p => p.location))].sort();

  if (resCats.length) {
    const grp = document.createElement("optgroup"); grp.label = "Residential";
    resCats.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = loc; opt.textContent = LOCATION_LABELS[loc] || loc;
      grp.appendChild(opt);
    });
    locationSel.appendChild(grp);
  }
  if (commCats.length) {
    const grp = document.createElement("optgroup"); grp.label = "Commercial";
    commCats.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = loc; opt.textContent = LOCATION_LABELS[loc] || loc;
      grp.appendChild(opt);
    });
    locationSel.appendChild(grp);
  }

  // ── Type — grouped by category ──────────────────────────────
  const typeSel  = document.getElementById("epType");
  const resTypes  = [...new Set(properties.filter(p => p.category === "residential").map(p => p.type))].sort();
  const commTypes = [...new Set(properties.filter(p => p.category === "commercial").map(p => p.type))].sort();

  if (resTypes.length) {
    const grp = document.createElement("optgroup"); grp.label = "Residential";
    resTypes.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t; opt.textContent = TYPE_LABELS[t] || t;
      grp.appendChild(opt);
    });
    typeSel.appendChild(grp);
  }
  if (commTypes.length) {
    const grp = document.createElement("optgroup"); grp.label = "Commercial";
    commTypes.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t; opt.textContent = TYPE_LABELS[t] || t;
      grp.appendChild(opt);
    });
    typeSel.appendChild(grp);
  }

  // Store brackets globally for filter matching
  window._budgetBrackets = budgetBrackets;
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  PROPERTY DETAIL DRAWER                                      ║
// ╚══════════════════════════════════════════════════════════════╝

// Attribute config — icon, label, how to render value
const ATTR_CONFIG = {
  facing:          { icon: "🧭", label: "Facing" },
  vastu:           { icon: "🕉️",  label: "Vastu Compliant", render: v => v ? "Yes ✓" : "No ✗" },
  floor:           { icon: "🏢", label: "Floor",          render: (v, a) => `${v} of ${a.totalFloors || "?"}` },
  parking:         { icon: "🚗", label: "Parking" },
  furnished:       { icon: "🛋️",  label: "Furnished" },
  ageOfProperty:   { icon: "📅", label: "Age" },
  possession:      { icon: "🔑", label: "Possession" },
  powerBackup:     { icon: "⚡", label: "Power Backup" },
  nearestMetro:    { icon: "🚇", label: "Metro", render: v => `${v.name} (${v.distanceKm} km)` },
  nearestRailway:  { icon: "🚆", label: "Railway", render: v => `${v.name} (${v.distanceKm} km)` },
  nearestHospital: { icon: "🏥", label: "Hospital", render: v => `${v.name} (${v.distanceKm} km)` },
  nearestSchool:   { icon: "🏫", label: "School / College", render: v => `${v.name} (${v.distanceKm} km)` },
  nearestAirport:  { icon: "✈️",  label: "Airport", render: v => `${v.name} (${v.distanceKm} km)` }
  // mapLink handled separately
};

// Keys we explicitly skip when iterating (handled elsewhere or internal)
const SKIP_KEYS = new Set(["mapLink", "totalFloors"]);

function buildDrawerHTML(p) {
  const attrs = p.attributes || {};

  // Attribute pills
  const pills = Object.entries(attrs)
    .filter(([key]) => !SKIP_KEYS.has(key) && ATTR_CONFIG[key])
    .map(([key, val]) => {
      const cfg      = ATTR_CONFIG[key];
      const rendered = cfg.render ? cfg.render(val, attrs) : val;
      const isNegative = key === "vastu" && val === false;
      return `
        <div class="ep-attr-pill${isNegative ? " ep-attr-pill--negative" : ""}">
          <span class="ep-attr-icon">${cfg.icon}</span>
          <div class="ep-attr-text">
            <span class="ep-attr-label">${cfg.label}</span>
            <span class="ep-attr-value">${rendered}</span>
          </div>
        </div>`;
    }).join("");

  // Map button
  const mapBtn = attrs.mapLink
    ? `<a class="ep-map-btn"
          href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attrs.mapLink)}"
          target="_blank" rel="noopener noreferrer">
         📍 View Approximate Location on Map
       </a>` : "";

  const oldPrice = p.oldPriceLabel
    ? `<span class="ep-old-price" style="font-size:1rem;margin-left:8px;">${p.oldPriceLabel}</span>` : "";

  const catLabel = p.category === "commercial" ? "Commercial" : "Residential";

  return `
    <div class="ep-drawer-media">
      ${buildMediaStack(p.media, p.title)}
    </div>

    <div class="ep-drawer-info">
      <div class="ep-drawer-meta">
        <span class="ep-badge ep-badge--deal ${p.badgeClass}">${p.badge}</span>
        <span class="ep-cat-label ${p.category === "commercial" ? "ep-cat--commercial" : "ep-cat--residential"}" style="position:static;border-radius:12px;">${catLabel}</span>
      </div>

      <h2 class="ep-drawer-title">${p.title}</h2>
      <p class="ep-drawer-desc">${p.description}</p>

      <div class="ep-drawer-price">
        <span class="ep-price" style="font-size:1.8rem;">${p.priceLabel}</span>
        ${oldPrice}
      </div>

      ${pills ? `<div class="ep-attrs-grid">${pills}</div>` : ""}

      ${mapBtn}

      <button class="ep-enquire-btn ep-drawer-enquire${p.soldOut ? " disabled" : ""}"
              ${p.soldOut ? "disabled" : ""}>
        ${p.soldOut ? "🔴 Sold Out" : "📞 Enquire Now"}
      </button>
    </div>`;
}

// Open / close drawer
// Elements looked up at call-time (not at script load) to avoid null refs
function openDrawer(property) {
  const drawerEl    = document.getElementById("epDrawer");
  const drawerInner = document.getElementById("epDrawerInner");
  const drawerClose = document.getElementById("epDrawerClose");
  if (!drawerEl || !drawerInner) { console.error("Drawer elements not found in DOM"); return; }

  drawerInner.innerHTML = buildDrawerHTML(property);
  attachHoverSlideshow(drawerEl);
  drawerEl.classList.add("ep-drawer--open");
  document.body.classList.add("ep-drawer-active");
  setTimeout(() => drawerClose?.focus(), 50);
}

function closeDrawer() {
  const drawerEl    = document.getElementById("epDrawer");
  const drawerInner = document.getElementById("epDrawerInner");
  if (!drawerEl) return;
  drawerEl.classList.remove("ep-drawer--open");
  document.body.classList.remove("ep-drawer-active");
  if (drawerInner) drawerInner.innerHTML = "";
}

// Wire close button and backdrop — safe to do at DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("epDrawerClose")?.addEventListener("click", closeDrawer);
  document.getElementById("epDrawerBackdrop")?.addEventListener("click", closeDrawer);
});
document.addEventListener("keydown", e => {
  const drawerEl = document.getElementById("epDrawer");
  if (e.key === "Escape" && drawerEl?.classList.contains("ep-drawer--open")) closeDrawer();
});


// ╔══════════════════════════════════════════════════════════════╗
// ║  EXPLORE PROPERTIES — unified grid                           ║
// ╚══════════════════════════════════════════════════════════════╝

let epAllProperties = [];
let epVisible       = 6;
let epActiveTab     = "all";
let epSort          = "default";

function buildPropertyCard(p, index) {
  const soldClass   = p.soldOut ? " ep-card--sold" : "";
  const featBadge   = p.featured ? `<div class="ep-badge ep-badge--featured">⭐ Featured</div>` : "";
  const dealBadge   = `<div class="ep-badge ep-badge--deal ${p.badgeClass}">${p.badge}</div>`;
  const soldOverlay = p.soldOut
    ? `<div class="ep-sold-overlay"><div class="ep-sold-text">SOLD OUT</div><p>Successfully sold</p></div>` : "";
  const oldPrice    = p.oldPriceLabel ? `<span class="ep-old-price">${p.oldPriceLabel}</span>` : "";
  const catClass    = p.category === "commercial" ? "ep-cat--commercial" : "ep-cat--residential";
  const catLabel    = p.category === "commercial" ? "Commercial" : "Residential";

  // Tease 2–3 key attributes on the card face (metro, facing, furnished)
  const attrs     = p.attributes || {};
  const attrTeaser = [
    attrs.nearestMetro    ? `🚇 ${attrs.nearestMetro.distanceKm}km to metro` : null,
    attrs.facing          ? `🧭 ${attrs.facing} facing` : null,
    attrs.furnished       ? `🛋️ ${attrs.furnished}` : null,
    attrs.powerBackup     ? `⚡ ${attrs.powerBackup}` : null,
    attrs.possession      ? `🔑 ${attrs.possession}` : null
  ].filter(Boolean).slice(0, 3);

  const teaserHtml = attrTeaser.length
    ? `<div class="ep-card-teaser">${attrTeaser.map(t => `<span>${t}</span>`).join("")}</div>` : "";

  return `
    <div class="ep-card${soldClass}"
         data-id="${p.id}"
         data-category="${p.category}"
         data-ishotdeal="${p.isHotDeal}"
         data-featured="${p.featured}"
         data-price="${p.price}"
         data-budget="${p.budget}"
         data-location="${p.location}"
         data-type="${p.type}"
         data-index="${index}"
         role="button" tabindex="0"
         aria-label="View details for ${p.title}">
      ${soldOverlay}
      <div class="ep-card-media">
        ${buildMediaStack(p.media, p.title)}
        ${dealBadge}
        ${featBadge}
        <span class="ep-cat-label ${catClass}">${catLabel}</span>
      </div>
      <div class="ep-card-body">
        <h3 class="ep-card-title">${p.title}</h3>
        <p class="ep-card-desc">${p.description}</p>
        ${teaserHtml}
        <div class="ep-card-footer">
          <div class="ep-card-price">
            <span class="ep-price">${p.priceLabel}</span>
            ${oldPrice}
          </div>
          <button class="ep-card-details-btn">View Details →</button>
        </div>
      </div>
    </div>`;
}

// Filter matching for budget brackets
function matchesBudget(price, bracketValue) {
  if (bracketValue === "all") return true;
  const [min, max] = bracketValue.split("-").map(Number);
  return price > min && price <= max;
}

function getFilteredAndSorted() {
  const budgetVal  = document.getElementById("epBudget")?.value   || "all";
  const locationVal= document.getElementById("epLocation")?.value || "all";
  const typeVal    = document.getElementById("epType")?.value     || "all";

  let result = epAllProperties.filter(p => {
    if (epActiveTab === "residential" && p.category !== "residential") return false;
    if (epActiveTab === "commercial"  && p.category !== "commercial")  return false;
    if (epActiveTab === "hotdeals"    && !p.isHotDeal)                 return false;
    if (!matchesBudget(p.price, budgetVal))                            return false;
    if (locationVal !== "all" && p.location !== locationVal)           return false;
    if (typeVal     !== "all" && p.type     !== typeVal)               return false;
    return true;
  });

  return [...result].sort((a, b) => {
    if (epSort === "price-low")  return a.price - b.price;
    if (epSort === "price-high") return b.price - a.price;
    if (epSort === "featured")   return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    return a.index - b.index;
  });
}

function renderGrid() {
  const grid = document.getElementById("epGrid");
  if (!grid) return;

  const filtered = getFilteredAndSorted();
  const toShow   = filtered.slice(0, epVisible);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="ep-empty">
        <div class="ep-empty-icon">🔍</div>
        <h3>No properties found</h3>
        <p>Try adjusting your filters or browse a different tab.</p>
        <button class="ep-reset-btn" id="epResetBtn">Clear All Filters</button>
      </div>`;
    document.getElementById("epResetBtn")?.addEventListener("click", resetFilters);
  } else {
    grid.innerHTML = toShow.map((p, i) => buildPropertyCard(p, i)).join("");

    // Attach slideshow to each card
    grid.querySelectorAll(".ep-card").forEach(card => attachHoverSlideshow(card));

    // Open drawer on card click (but not when clicking the enquire button directly)
    grid.querySelectorAll(".ep-card").forEach(card => {
      const clickHandler = e => {
        if (e.target.closest(".ep-card-details-btn") || e.target.closest(".ep-enquire-btn")) return;
        const id = card.dataset.id;
        const property = epAllProperties.find(p => p.id === id);
        if (property) openDrawer(property);
      };
      card.addEventListener("click", clickHandler);
      card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") clickHandler(e); });

      // "View Details" button explicitly opens drawer
      card.querySelector(".ep-card-details-btn")?.addEventListener("click", e => {
        e.stopPropagation();
        const property = epAllProperties.find(p => p.id === card.dataset.id);
        if (property) openDrawer(property);
      });
    });
  }

  // Count label
  const countEl = document.querySelector(".ep-count");
  if (countEl) {
    const showing = Math.min(epVisible, filtered.length);
    countEl.textContent = filtered.length ? `Showing ${showing} of ${filtered.length} properties` : "";
  }

  // Load More
  const loadMore = document.getElementById("epLoadMore");
  if (loadMore) {
    if (filtered.length <= epVisible) {
      loadMore.textContent = "All Properties Loaded"; loadMore.disabled = true;
    } else {
      loadMore.textContent = `Load More (${filtered.length - epVisible} remaining)`; loadMore.disabled = false;
    }
  }

  updateChips();
}

// Active filter chips
function updateChips() {
  const chipsEl = document.getElementById("epChips"); if (!chipsEl) return;
  const budget   = document.getElementById("epBudget");
  const location = document.getElementById("epLocation");
  const type     = document.getElementById("epType");
  const chips = [];
  if (budget?.value   !== "all") chips.push({ label: budget.options[budget.selectedIndex].text,     clear: () => { budget.value   = "all"; onFilterChange(); } });
  if (location?.value !== "all") chips.push({ label: location.options[location.selectedIndex].text, clear: () => { location.value = "all"; onFilterChange(); } });
  if (type?.value     !== "all") chips.push({ label: type.options[type.selectedIndex].text,         clear: () => { type.value     = "all"; onFilterChange(); } });
  chipsEl.innerHTML = chips.map((c, i) =>
    `<span class="ep-chip">${c.label} <button class="ep-chip-x" data-chip="${i}" aria-label="Remove filter">×</button></span>`
  ).join("");
  chipsEl.querySelectorAll(".ep-chip-x").forEach(btn => btn.addEventListener("click", () => chips[+btn.dataset.chip].clear()));
}

function resetFilters() {
  document.getElementById("epBudget").value   = "all";
  document.getElementById("epLocation").value = "all";
  document.getElementById("epType").value     = "all";
  epVisible = 6; renderGrid();
}

function onFilterChange() { epVisible = 6; renderGrid(); }

function initExploreProperties(properties) {
  epAllProperties = properties.map((p, i) => ({ ...p, index: i }));

  // Populate filters dynamically from actual property data
  populateFilters(properties);

  // Tabs
  document.querySelectorAll(".ep-tab").forEach(btn => {
    btn.addEventListener("click", function() {
      document.querySelectorAll(".ep-tab").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      epActiveTab = this.dataset.tab;
      epVisible   = 6;
      renderGrid();
    });
  });

  // Dropdowns
  ["epBudget", "epLocation", "epType"].forEach(id =>
    document.getElementById(id)?.addEventListener("change", onFilterChange)
  );

  // Sort
  document.getElementById("epSort")?.addEventListener("change", function() {
    epSort = this.value; epVisible = 6; renderGrid();
  });

  // Load more
  document.getElementById("epLoadMore")?.addEventListener("click", () => { epVisible += 6; renderGrid(); });

  renderGrid();
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  CONTACT INFO INJECTION                                      ║
// ╚══════════════════════════════════════════════════════════════╝

function renderContactInfo(c) {
  const panel = document.getElementById("contactInfoPanel"); if (!panel) return;
  panel.innerHTML = `
    <h3>Contact Information</h3>
    <div class="info-item">
      <div class="info-icon">📧</div>
      <div class="info-content"><h4>Email</h4><a href="mailto:${c.email}">${c.email}</a></div>
    </div>
    <div class="info-item">
      <div class="info-icon">📱</div>
      <div class="info-content"><h4>Phone</h4><a href="tel:${c.phoneRaw}">${c.phone}</a></div>
    </div>
    <div class="info-item">
      <div class="info-icon">📍</div>
      <div class="info-content"><h4>Office Address</h4><p>${c.address.line1}<br>${c.address.line2}<br>${c.address.line3}</p></div>
    </div>
    <div class="info-item">
      <div class="info-icon">🕒</div>
      <div class="info-content"><h4>Business Hours</h4><p>${c.hours.weekdays}<br>${c.hours.weekend}</p></div>
    </div>
    <div class="social-links">
      <h4>Follow Us</h4>
      <div class="social-icons">
        <a href="${c.social.facebook}"  aria-label="Facebook">📘</a>
        <a href="${c.social.instagram}" aria-label="Instagram">📷</a>
        <a href="${c.social.linkedin}"  aria-label="LinkedIn">💼</a>
        <a href="${c.social.whatsapp}"  aria-label="WhatsApp">💬</a>
      </div>
    </div>`;
}
