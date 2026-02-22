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
// 8. POPUP
// ─────────────────────────────────────────
const popup = document.getElementById("leadPopup");
const closePopupBtn = document.getElementById("closePopup");
if (closePopupBtn) closePopupBtn.addEventListener("click", () => popup.style.display = "none");
document.addEventListener("click", e => {
  if (e.target.matches(".ep-card-btn") && !e.target.disabled) popup.style.display = "flex";
});


// ─────────────────────────────────────────
// 9. CONTACT FORM
// ─────────────────────────────────────────
const contactForm    = document.getElementById("contactForm");
const successMessage = document.getElementById("successMessage");

const validateForm = fd => {
  let ok = true; const err = {};
  const name = fd.get("fullName")?.trim();
  if (!name || name.length < 2)                           { err.fullName = "Please enter a valid name"; ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.get("email")?.trim())) { err.email = "Please enter a valid email"; ok = false; }
  const ph = fd.get("phone")?.trim().replace(/[\s\-\(\)]/g,"");
  if (!/^[\+]?[0-9]{10,15}$/.test(ph))                   { err.phone = "Please enter a valid phone number"; ok = false; }
  if (!fd.get("propertyInterest"))                        { err.propertyInterest = "Please select an interest"; ok = false; }
  const msg = fd.get("message")?.trim();
  if (!msg || msg.length < 10)                            { err.message = "Message must be at least 10 characters"; ok = false; }
  return { isValid: ok, errors: err };
};

const displayErrors = errors => {
  document.querySelectorAll(".form-group").forEach(g => {
    g.classList.remove("error");
    const e = g.querySelector(".error-message");
    if (e) e.textContent = "";
  });
  Object.keys(errors).forEach(field => {
    const el = document.getElementById(field);
    if (el) {
      const g = el.closest(".form-group");
      g.classList.add("error");
      const e = g.querySelector(".error-message");
      if (e) e.textContent = errors[field];
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
      if (v.errors[this.id]) {
        g.classList.add("error");
        g.querySelector(".error-message").textContent = v.errors[this.id];
      } else {
        g.classList.remove("error");
        g.querySelector(".error-message").textContent = "";
      }
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
    if (item.type === "video") {
      return `<video class="media-layer${active}" src="${item.src}" muted loop playsinline preload="none" aria-label="${altText} – video tour"></video>`;
    }
    return `<img class="media-layer${active}" src="${item.src}" alt="${altText}${i > 0 ? ` – photo ${i+1}` : ""}" loading="${i === 0 ? "eager" : "lazy"}">`;
  }).join("");
  const dots = media.map((_, i) =>
    `<span class="media-dot${i === 0 ? " media-dot--active" : ""}"></span>`
  ).join("");
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
    layers[idx].classList.remove("media-layer--active");
    dots[idx]?.classList.remove("media-dot--active");
    if (layers[idx].tagName === "VIDEO") layers[idx].pause();
    idx = i;
    layers[idx].classList.add("media-layer--active");
    dots[idx]?.classList.add("media-dot--active");
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
// ║  DATA BOOTSTRAP — fetch both JSON files in parallel          ║
// ╚══════════════════════════════════════════════════════════════╝

document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    fetch("data/properties.json").then(r => r.ok ? r.json() : Promise.reject(r.status)),
    fetch("data/contact.json").then(r => r.ok ? r.json() : Promise.reject(r.status))
  ])
  .then(([propData, contactData]) => {
    initExploreProperties(propData.properties);
    renderContactInfo(contactData.contact);
  })
  .catch(err => {
    console.error("Failed to load data files:", err);
    const grid = document.getElementById("epGrid");
    if (grid) grid.innerHTML = `<p class="loading-text" style="color:#c5a47e;">Unable to load properties. Please try again later.</p>`;
  });
});


// ╔══════════════════════════════════════════════════════════════╗
// ║  EXPLORE PROPERTIES — unified section                        ║
// ╚══════════════════════════════════════════════════════════════╝

let epAllProperties = [];     // full dataset, never mutated
let epVisible       = 6;      // how many cards are showing
let epActiveTab     = "all";
let epSort          = "default";

// ── Build a single unified property card ──────────────────────
function buildPropertyCard(p, index) {
  const soldClass   = p.soldOut ? " ep-card--sold" : "";
  const featBadge   = p.featured ? `<div class="ep-badge ep-badge--featured">⭐ Featured</div>` : "";
  const hotBadge    = p.isHotDeal ? `<div class="ep-badge ep-badge--deal ${p.badgeClass}">${p.badge}</div>` : `<div class="ep-badge ep-badge--deal ${p.badgeClass}">${p.badge}</div>`;
  const soldOverlay = p.soldOut
    ? `<div class="ep-sold-overlay"><div class="ep-sold-text">SOLD OUT</div><p>This property has been successfully sold</p></div>`
    : "";
  const oldPrice = p.oldPriceLabel
    ? `<span class="ep-old-price">${p.oldPriceLabel}</span>` : "";
  const catLabel = p.category === "commercial" ? "Commercial" : "Residential";
  const catClass = p.category === "commercial" ? "ep-cat--commercial" : "ep-cat--residential";

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
         data-index="${index}">
      ${soldOverlay}
      <div class="ep-card-media">
        ${buildMediaStack(p.media, p.title)}
        ${hotBadge}
        ${featBadge}
        <span class="ep-cat-label ${catClass}">${catLabel}</span>
      </div>
      <div class="ep-card-body">
        <h3 class="ep-card-title">${p.title}</h3>
        <p class="ep-card-desc">${p.description}</p>
        <div class="ep-card-footer">
          <div class="ep-card-price">
            <span class="ep-price">${p.priceLabel}</span>
            ${oldPrice}
          </div>
          <button class="ep-card-btn"${p.soldOut ? " disabled" : ""}>
            ${p.soldOut ? "Sold Out" : "Enquire Now"}
          </button>
        </div>
      </div>
    </div>`;
}

// ── Filter helpers ─────────────────────────────────────────────
function getFilteredAndSorted() {
  const budget   = document.getElementById("epBudget")?.value   || "all";
  const location = document.getElementById("epLocation")?.value || "all";
  const type     = document.getElementById("epType")?.value     || "all";

  let result = epAllProperties.filter(p => {
    // Tab filter
    if (epActiveTab === "residential" && p.category !== "residential") return false;
    if (epActiveTab === "commercial"  && p.category !== "commercial")  return false;
    if (epActiveTab === "hotdeals"    && !p.isHotDeal)                 return false;
    // Dropdown filters
    if (budget   !== "all" && p.budget   !== budget)   return false;
    if (location !== "all" && p.location !== location) return false;
    if (type     !== "all" && p.type     !== type)     return false;
    return true;
  });

  // Sort
  result = [...result].sort((a, b) => {
    if (epSort === "price-low")  return a.price - b.price;
    if (epSort === "price-high") return b.price - a.price;
    if (epSort === "featured")   return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    return a.index - b.index; // default = JSON order
  });

  return result;
}

// ── Render cards into the grid ─────────────────────────────────
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
    grid.querySelectorAll(".ep-card").forEach(card => attachHoverSlideshow(card));
  }

  // Count label
  const countEl = document.querySelector(".ep-count");
  if (countEl) {
    const showing = Math.min(epVisible, filtered.length);
    countEl.textContent = filtered.length
      ? `Showing ${showing} of ${filtered.length} properties`
      : "";
  }

  // Load More button
  const loadMore = document.getElementById("epLoadMore");
  if (loadMore) {
    if (filtered.length <= epVisible) {
      loadMore.textContent = "All Properties Loaded";
      loadMore.disabled    = true;
    } else {
      loadMore.textContent = `Load More (${filtered.length - epVisible} remaining)`;
      loadMore.disabled    = false;
    }
  }

  updateChips();
}

// ── Active filter chips ────────────────────────────────────────
function updateChips() {
  const chipsEl  = document.getElementById("epChips");
  if (!chipsEl) return;

  const budget   = document.getElementById("epBudget");
  const location = document.getElementById("epLocation");
  const type     = document.getElementById("epType");
  const chips    = [];

  if (budget?.value   !== "all") chips.push({ label: budget.options[budget.selectedIndex].text,     clear: () => { budget.value   = "all"; onFilterChange(); } });
  if (location?.value !== "all") chips.push({ label: location.options[location.selectedIndex].text, clear: () => { location.value = "all"; onFilterChange(); } });
  if (type?.value     !== "all") chips.push({ label: type.options[type.selectedIndex].text,         clear: () => { type.value     = "all"; onFilterChange(); } });

  chipsEl.innerHTML = chips.map((c, i) =>
    `<span class="ep-chip" data-chip="${i}">${c.label} <button class="ep-chip-x" data-chip="${i}" aria-label="Remove filter">×</button></span>`
  ).join("");

  // Wire chip remove buttons
  chipsEl.querySelectorAll(".ep-chip-x").forEach(btn => {
    btn.addEventListener("click", () => { chips[+btn.dataset.chip].clear(); });
  });
}

function resetFilters() {
  document.getElementById("epBudget").value   = "all";
  document.getElementById("epLocation").value = "all";
  document.getElementById("epType").value     = "all";
  epVisible = 6;
  renderGrid();
}

function onFilterChange() { epVisible = 6; renderGrid(); }

// ── Initialise the whole section ──────────────────────────────
function initExploreProperties(properties) {
  // Stamp original index for stable default sort
  epAllProperties = properties.map((p, i) => ({ ...p, index: i }));

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
  ["epBudget", "epLocation", "epType"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", onFilterChange);
  });

  // Sort
  document.getElementById("epSort")?.addEventListener("change", function() {
    epSort    = this.value;
    epVisible = 6;
    renderGrid();
  });

  // Load more
  document.getElementById("epLoadMore")?.addEventListener("click", () => {
    epVisible += 6;
    renderGrid();
  });

  renderGrid();
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  CONTACT INFO INJECTION (from data/contact.json)            ║
// ╚══════════════════════════════════════════════════════════════╝

function renderContactInfo(c) {
  const panel = document.getElementById("contactInfoPanel");
  if (!panel) return;

  panel.innerHTML = `
    <h3>Contact Information</h3>

    <div class="info-item">
      <div class="info-icon">📧</div>
      <div class="info-content">
        <h4>Email</h4>
        <a href="mailto:${c.email}">${c.email}</a>
      </div>
    </div>

    <div class="info-item">
      <div class="info-icon">📱</div>
      <div class="info-content">
        <h4>Phone</h4>
        <a href="tel:${c.phoneRaw}">${c.phone}</a>
      </div>
    </div>

    <div class="info-item">
      <div class="info-icon">📍</div>
      <div class="info-content">
        <h4>Office Address</h4>
        <p>${c.address.line1}<br>${c.address.line2}<br>${c.address.line3}</p>
      </div>
    </div>

    <div class="info-item">
      <div class="info-icon">🕒</div>
      <div class="info-content">
        <h4>Business Hours</h4>
        <p>${c.hours.weekdays}<br>${c.hours.weekend}</p>
      </div>
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
