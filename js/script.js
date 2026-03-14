// ==============================
// CIVIUM ESTATE — MAIN SCRIPT
// ==============================


// ─────────────────────────────────────────
// 1. MOBILE NAV TOGGLE
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn  = document.querySelector(".nav-toggle");
  const closeBtn   = document.querySelector(".nav-close");
  const backdrop   = document.querySelector(".nav-backdrop");
  const navLinks   = document.querySelectorAll(".nav-links a");
  if (!toggleBtn || !backdrop) return;

  const openNav = () => {
    document.body.classList.add("nav-open");
    toggleBtn.setAttribute("aria-expanded", "true");
    toggleBtn.setAttribute("aria-hidden", "true");
    closeBtn?.removeAttribute("aria-hidden");
  };
  const closeNav = () => {
    document.body.classList.remove("nav-open");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.removeAttribute("aria-hidden");
    closeBtn?.setAttribute("aria-hidden", "true");
  };

  toggleBtn.addEventListener("click",  openNav);
  closeBtn?.addEventListener("click",  closeNav);
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
// 8. PROPERTY ENQUIRY MODAL
// ─────────────────────────────────────────
const enqModal       = document.getElementById("enquiryModal");
const enqBackdrop    = document.getElementById("enqBackdrop");
const enqCloseBtn    = document.getElementById("enqClose");
const enqForm        = document.getElementById("enquiryForm");
const enqSuccess     = document.getElementById("enqSuccess");
const enqPropertyName = document.getElementById("enqPropertyName");
const enqPropertyRef  = document.getElementById("enqPropertyRef");
const enqSuccessProp  = document.getElementById("enqSuccessProperty");

function openEnquiryModal(property) {
  // Close the property drawer first
  closeDrawer();
  // Small delay so drawer close animation doesn't clash
  setTimeout(() => {
    const title = (typeof property === "object" ? property.title : property) || "this property";
    enqPropertyName.textContent = title;
    if (enqSuccessProp) enqSuccessProp.textContent = title;
    // Store full property object on form for submission
    enqForm.dataset.property = typeof property === "object" ? JSON.stringify(property) : JSON.stringify({ title });
    // Reset form to clean state
    enqForm.style.display = "flex";
    enqSuccess.style.display = "none";
    enqForm.reset();
    clearEnqErrors();
    enqModal.classList.add("enq-modal--open");
    document.body.classList.add("enq-modal-active");
  }, 300);
}

function closeEnquiryModal() {
  enqModal.classList.remove("enq-modal--open");
  document.body.classList.remove("enq-modal-active");
}

function clearEnqErrors() {
  document.querySelectorAll(".enq-error").forEach(e => e.textContent = "");
}

// Open on Enquire Now click — pass full property object
document.addEventListener("click", e => {
  const btn = e.target.closest(".ep-enquire-btn");
  if (btn && !btn.disabled) {
    openEnquiryModal(_activeProperty || document.querySelector(".ep-drawer-title")?.textContent?.trim() || "this property");
  }
});

// Close handlers
enqCloseBtn?.addEventListener("click", closeEnquiryModal);
enqBackdrop?.addEventListener("click", closeEnquiryModal);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeEnquiryModal();
});

// Form submission
enqForm?.addEventListener("submit", async e => {
  e.preventDefault();
  clearEnqErrors();

  // Validate required fields
  const name  = document.getElementById("enqName").value.trim();
  const phone = document.getElementById("enqPhone").value.trim().replace(/[\s\-\(\)]/g, "");
  let valid = true;
  if (!name || name.length < 2) {
    document.getElementById("errEnqName").textContent = "Please enter your name";
    valid = false;
  }
  if (!/^[\+]?[0-9]{10,15}$/.test(phone)) {
    document.getElementById("errEnqPhone").textContent = "Please enter a valid phone number";
    valid = false;
  }
  if (!valid) return;

  const submitBtn = document.getElementById("enqSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.querySelector(".enq-btn-text").style.display  = "none";
  submitBtn.querySelector(".enq-btn-loader").style.display = "inline-block";

  // Parse stored property object for rich email
  let prop = {};
  try { prop = JSON.parse(enqForm.dataset.property || "{}"); } catch(ex) {}

  const purpose  = document.getElementById("enqPurpose").value  || "Not specified";
  const timeline = document.getElementById("enqTimeline").value || "Not specified";
  const userMsg  = document.getElementById("enqMessage").value.trim() || "No additional message";
  const attr     = prop.attributes || {};

  const propLines = [
    ["Property",   prop.title           || "—"],
    ["Price",      prop.priceLabel      || "—"],
    ["Type",       (prop.type||"—").toUpperCase()],
    ["Category",   prop.category ? prop.category.charAt(0).toUpperCase() + prop.category.slice(1) : "—"],
    ["Location",   prop.location ? prop.location.charAt(0).toUpperCase() + prop.location.slice(1) : "—"],
    ["Facing",     attr.facing          || "—"],
    ["Floor",      attr.floor           ? attr.floor + " / " + attr.totalFloors : "—"],
    ["Parking",    attr.parking         || "—"],
    ["Furnished",  attr.furnished       || "—"],
    ["Age",        attr.ageOfProperty   || "—"],
    ["Possession", attr.possession      || "—"],
    ["Vastu",      attr.vastu === true  ? "Yes" : attr.vastu === false ? "No" : "—"],
  ].map(function(r){ return r[0] + ": " + r[1]; }).join("\n");

  const templateParams = {
    from_name  : name,
    from_email : document.getElementById("enqEmail").value.trim() || "Not provided",
    phone      : document.getElementById("enqPhone").value.trim(),
    interest   : prop.title || "Property enquiry",
    budget     : purpose,
    message    : "ENQUIRY DETAILS\nPurpose: " + purpose + "\nTimeline: " + timeline + "\n\nMessage: " + userMsg + "\n\n---\nPROPERTY DETAILS\n" + propLines
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    enqForm.style.display    = "none";
    enqSuccess.style.display = "flex";
    submitBtn.disabled = false;
    submitBtn.querySelector(".enq-btn-text").style.display   = "inline-block";
    submitBtn.querySelector(".enq-btn-loader").style.display = "none";
    // Auto close after 4 seconds
    setTimeout(closeEnquiryModal, 4000);
  } catch (err) {
    console.error("EmailJS error:", err);
    alert("Something went wrong. Please call us or email sales@civiumestate.com directly.");
    submitBtn.disabled = false;
    submitBtn.querySelector(".enq-btn-text").style.display   = "inline-block";
    submitBtn.querySelector(".enq-btn-loader").style.display = "none";
  }
});


// ─────────────────────────────────────────
// 9. CONTACT FORM + EMAILJS
// ─────────────────────────────────────────

// ── EmailJS credentials ──────────────────
const EMAILJS_SERVICE_ID          = "service_tgcfhw2";
const EMAILJS_TEMPLATE_ID         = "template_7k362il";   // Property enquiry modal
const EMAILJS_CONTACT_TEMPLATE_ID = "template_ffznhgn";   // Contact Us form
const EMAILJS_PUBLIC_KEY          = "lyKpG1clXdqatOcBq";

// Initialise EmailJS
// Init EmailJS once window + all scripts are fully loaded
window.addEventListener("load", () => {
  if (typeof emailjs !== "undefined") {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    console.log("EmailJS initialised");
  } else {
    console.error("EmailJS SDK not found — check script tag in HTML");
  }
});

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

    // ── Build template params matching EmailJS template variables ──
    const templateParams = {
      from_name  : fd.get("fullName")?.trim(),
      from_email : fd.get("email")?.trim(),
      phone      : fd.get("phone")?.trim(),
      interest   : fd.get("propertyInterest") || "Not specified",
      budget     : fd.get("budget") || "Not specified",
      message    : fd.get("message")?.trim()
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONTACT_TEMPLATE_ID, templateParams);
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
    } catch (err) {
      console.error("EmailJS error:", err);
      alert("Something went wrong sending your message. Please try calling us directly or email sales@civiumestate.com");
      btn.disabled = false;
      btn.querySelector(".btn-text").style.display   = "inline-block";
      btn.querySelector(".btn-loader").style.display = "none";
    }
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
  // Only add if prev > 0 (avoid "Above ₹0L" when no thresholds matched)
  if (prev < max && prev > 0) {
    const count = properties.filter(p => p.price > prev).length;
    if (count > 0) {
      const label = `Above ₹${prev < 100 ? prev + "L" : (prev/100) + "Cr"}`;
      brackets.push({ value: `${prev}-99999`, label, min: prev, max: 99999 });
    }
  } else if (prev === 0 && properties.length > 0) {
    // All properties above all thresholds — show a single meaningful bracket
    const label = `₹${max < 100 ? max + "L" : (max/100) + "Cr"}+`;
    brackets.push({ value: `0-99999`, label, min: 0, max: 99999 });
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
// ║  DRAWER GALLERY — manual arrow navigator (no auto-play)      ║
// ╚══════════════════════════════════════════════════════════════╝

function attachDrawerGallery(drawerEl) {
  const stack  = drawerEl.querySelector(".ep-drawer-media .media-stack");
  if (!stack) return;
  const layers = Array.from(stack.querySelectorAll(".media-layer"));
  const dots   = Array.from(stack.querySelectorAll(".media-dot"));
  if (layers.length <= 1) return;   // single image — arrows not needed

  let idx = 0;

  function goTo(i) {
    // Pause any playing video at current index
    if (layers[idx].tagName === "VIDEO") layers[idx].pause();
    layers[idx].classList.remove("media-layer--active");
    dots[idx]?.classList.remove("media-dot--active");

    idx = (i + layers.length) % layers.length;

    layers[idx].classList.add("media-layer--active");
    dots[idx]?.classList.add("media-dot--active");

    // If new layer is a video, play it
    if (layers[idx].tagName === "VIDEO") {
      layers[idx].currentTime = 0;
      layers[idx].play().catch(() => {});
    }

    // Update counter label
    const counter = stack.querySelector(".drawer-gallery-counter");
    if (counter) counter.textContent = `${idx + 1} / ${layers.length}`;
  }

  // Inject arrow buttons + counter into the stack
  stack.insertAdjacentHTML("beforeend", `
    <button class="drawer-gallery-arrow drawer-gallery-prev" aria-label="Previous image">&#8249;</button>
    <button class="drawer-gallery-arrow drawer-gallery-next" aria-label="Next image">&#8250;</button>
    <span class="drawer-gallery-counter">${idx + 1} / ${layers.length}</span>
  `);

  stack.querySelector(".drawer-gallery-prev").addEventListener("click", e => { e.stopPropagation(); goTo(idx - 1); });
  stack.querySelector(".drawer-gallery-next").addEventListener("click", e => { e.stopPropagation(); goTo(idx + 1); });

  // Keyboard left/right while drawer is open
  function onKey(e) {
    if (e.key === "ArrowLeft")  goTo(idx - 1);
    if (e.key === "ArrowRight") goTo(idx + 1);
  }
  document.addEventListener("keydown", onKey);

  // Clean up key listener when drawer closes
  const observer = new MutationObserver(() => {
    if (!drawerEl.classList.contains("ep-drawer--open")) {
      document.removeEventListener("keydown", onKey);
      observer.disconnect();
    }
  });
  observer.observe(drawerEl, { attributes: true, attributeFilter: ["class"] });
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  PROPERTY DETAIL DRAWER                                      ║
// ╚══════════════════════════════════════════════════════════════╝

// Attribute config — icon, label, how to render value
const ATTR_CONFIG = {
  facing:          { icon: "🧭", label: "Facing" },
  vastu:           { icon: "🕉️",  label: "Vastu Compliant", render: v => v === null ? null : v ? "Yes ✓" : "No ✗" },
  floor:           { icon: "🏢", label: "Floor",          render: (v, a) => v ? `${v} of ${a.totalFloors || "?"}` : null },
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
      if (rendered === null || rendered === undefined || rendered === "—") return ""; // skip empty
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

      ${p.unitTypes && p.unitTypes.length ? `
      <div class="ep-unit-types">
        <h4 class="ep-unit-types-title">Unit Configurations</h4>
        <div class="ep-unit-types-grid">
          ${p.unitTypes.map(u => `
            <div class="ep-unit-type-card">
              <div class="ep-unit-config">${u.config}</div>
              <div class="ep-unit-size">${u.size}</div>
              <div class="ep-unit-parking">🚗 ${u.parking}</div>
              <div class="ep-unit-price">${u.price}</div>
            </div>
          `).join("")}
        </div>
      </div>` : ""}

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
// Currently open property — used by enquiry modal
let _activeProperty = null;

function openDrawer(property) {
  _activeProperty = property;
  const drawerEl    = document.getElementById("epDrawer");
  const drawerInner = document.getElementById("epDrawerInner");
  const drawerClose = document.getElementById("epDrawerClose");
  const topbarTitle = document.querySelector(".ep-drawer-topbar-title");
  if (!drawerEl || !drawerInner) { console.error("Drawer elements not found in DOM"); return; }

  if (topbarTitle) topbarTitle.textContent = property.title;
  drawerInner.innerHTML = buildDrawerHTML(property);
  attachDrawerGallery(drawerEl);   // manual arrows — no auto-play in drawer
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
  const featBadge   = ""; // featured shown on card only, not duplicated in drawer
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
        ${buildMediaStack(p.media, `${p.title} – ${(p.type||"").toUpperCase()} ${p.category === "residential" ? "apartment" : "property"} for sale in ${(p.location||"").charAt(0).toUpperCase() + (p.location||"").slice(1)}, Kolkata`)}
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
        <a href="${c.social.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp" class="social-icon social-icon--whatsapp">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.554 4.103 1.524 5.82L.057 23.882l6.222-1.437A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.692.853.882-3.596-.234-.371A9.818 9.818 0 1112 21.818z"/></svg>
        </a>
        <a href="${c.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram" class="social-icon social-icon--instagram">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
        <a href="${c.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook" class="social-icon social-icon--facebook">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a href="${c.social.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn" class="social-icon social-icon--linkedin">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <a href="${c.social.youtube}" target="_blank" rel="noopener" aria-label="YouTube" class="social-icon social-icon--youtube">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
        </a>
      </div>
    </div>`;
}

// ── Partners tab switching ────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".ptab").forEach(btn => {
    btn.addEventListener("click", function() {
      document.querySelectorAll(".ptab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".partners-track").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      const target = document.getElementById("ptab-" + this.dataset.ptab);
      if (target) target.classList.add("active");
    });
  });
});


// ╔══════════════════════════════════════════════════════════════╗
// ║  SELL YOUR PROPERTY — multi-step form                        ║
// ╚══════════════════════════════════════════════════════════════╝

document.addEventListener("DOMContentLoaded", () => {
  const form      = document.getElementById("sellForm");
  const successEl = document.getElementById("sellSuccess");
  const againBtn  = document.getElementById("sellAgain");
  if (!form) return;

  // ── Step navigation helpers ───────────────────────────────────
  function showStep(n) {
    document.querySelectorAll(".sell-panel").forEach(p => p.classList.remove("active"));
    document.getElementById(`sellStep${n}`)?.classList.add("active");

    // Update step indicator
    document.querySelectorAll(".sell-step").forEach(s => {
      const num = +s.dataset.step;
      s.classList.toggle("active",    num === n);
      s.classList.toggle("completed", num < n);
    });

    if (n === 3) buildSummary();
  }

  // ── Validate each step ────────────────────────────────────────
  function validateStep(n) {
    let ok = true;

    if (n === 1) {
      const chosen = form.querySelector("input[name='propType']:checked");
      setErr("errPropType", chosen ? "" : "Please select a property type");
      if (!chosen) ok = false;
    }

    if (n === 2) {
      const loc = form.querySelector("#sellLocation").value;
      const age = form.querySelector("#sellAge").value;
      setErr("errSellLocation", loc ? "" : "Please select a location");
      setErr("errSellAge",      age ? "" : "Please select property age");
      if (!loc || !age) ok = false;
    }

    if (n === 3) {
      const name  = form.querySelector("#sellName").value.trim();
      const phone = form.querySelector("#sellPhone").value.trim().replace(/[\s\-\(\)]/g, "");
      setErr("errSellName",  name.length >= 2 ? "" : "Please enter your name");
      setErr("errSellPhone", /^[\+]?[0-9]{10,15}$/.test(phone) ? "" : "Please enter a valid phone number");
      if (name.length < 2 || !/^[\+]?[0-9]{10,15}$/.test(phone)) ok = false;
    }

    return ok;
  }

  function setErr(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = msg ? "block" : "none"; }
  }

  // ── Summary card on step 3 ────────────────────────────────────
  const PROP_TYPE_LABELS = {
    apartment: "Apartment / Flat", villa: "Villa / Independent House",
    land: "Land / Plot", office: "Office Space",
    retail: "Shop / Retail", warehouse: "Warehouse / Godown"
  };

  function buildSummary() {
    const summaryEl = document.getElementById("sellSummary");
    if (!summaryEl) return;
    const type     = form.querySelector("input[name='propType']:checked")?.value;
    const loc      = form.querySelector("#sellLocation");
    const age      = form.querySelector("#sellAge");
    const sqft     = form.querySelector("#sellSqft").value;
    const price    = form.querySelector("#sellExpectedPrice");

    summaryEl.innerHTML = `
      <div class="sell-summary-title">📋 Your Property Summary</div>
      <div class="sell-summary-row"><span>Type</span><strong>${PROP_TYPE_LABELS[type] || type || "—"}</strong></div>
      <div class="sell-summary-row"><span>Location</span><strong>${loc.options[loc.selectedIndex]?.text || "—"}</strong></div>
      <div class="sell-summary-row"><span>Age</span><strong>${age.options[age.selectedIndex]?.text || "—"}</strong></div>
      ${sqft ? `<div class="sell-summary-row"><span>Area</span><strong>${sqft} sq ft</strong></div>` : ""}
      ${price.value ? `<div class="sell-summary-row"><span>Expected Price</span><strong>${price.options[price.selectedIndex].text}</strong></div>` : ""}
    `;
  }

  // ── Wire Next / Back buttons ──────────────────────────────────
  form.addEventListener("click", e => {
    const nextBtn = e.target.closest(".sell-btn-next");
    const backBtn = e.target.closest(".sell-btn-back");

    if (nextBtn) {
      const currentStep = +nextBtn.closest(".sell-panel").id.replace("sellStep", "");
      if (validateStep(currentStep)) showStep(+nextBtn.dataset.next);
    }

    if (backBtn) {
      showStep(+backBtn.dataset.back);
    }
  });

  // ── Show/hide BHK field based on property type ────────────────
  form.querySelectorAll("input[name='propType']").forEach(radio => {
    radio.addEventListener("change", () => {
      const bhkField = document.getElementById("sellBhkField");
      if (bhkField) {
        const hiddenFor = ["land", "office", "warehouse"];
        bhkField.style.opacity = hiddenFor.includes(radio.value) ? "0.35" : "1";
        bhkField.style.pointerEvents = hiddenFor.includes(radio.value) ? "none" : "auto";
      }
    });
  });

  // ── Submit ────────────────────────────────────────────────────
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validateStep(3)) return;

    const submitBtn  = form.querySelector(".sell-btn-submit");
    const btnText    = submitBtn.querySelector(".sell-btn-text");
    const btnLoader  = submitBtn.querySelector(".sell-btn-loader");
    submitBtn.disabled = true;
    btnText.style.display  = "none";
    btnLoader.style.display = "inline-block";

    // ── Collect all form values ──────────────────────────────────
    const propTypeMap = {
      apartment: "Apartment / Flat", villa: "Villa / Independent House",
      land: "Land / Plot", office: "Office Space",
      retail: "Shop / Retail", warehouse: "Warehouse / Godown"
    };
    const priceMap = {
      "under-30": "Under ₹30 Lakhs", "30-50": "₹30L – ₹50L",
      "50-75": "₹50L – ₹75L", "75-1cr": "₹75L – ₹1 Crore",
      "1-2cr": "₹1 – ₹2 Crores", "2-5cr": "₹2 – ₹5 Crores", "5cr+": "Above ₹5 Crores"
    };
    const timelineMap = {
      asap: "As soon as possible", "1-3months": "Within 1–3 months",
      "3-6months": "3–6 months", exploring: "Just exploring options"
    };
    const contactTimeMap = {
      morning: "Morning (9am – 12pm)", afternoon: "Afternoon (12pm – 4pm)",
      evening: "Evening (4pm – 8pm)"
    };

    const rawType     = form.querySelector("input[name='propType']:checked")?.value || "";
    const rawPrice    = form.querySelector("#sellExpectedPrice")?.value || "";
    const rawTimeline = form.querySelector("#sellTimeline")?.value || "";
    const rawContact  = form.querySelector("#sellContactTime")?.value || "";
    const sqft        = form.querySelector("#sellSqft")?.value.trim();
    const bhk         = form.querySelector("#sellBhk")?.value;

    const sellerName  = form.querySelector("#sellName").value.trim();
    const sellerPhone = form.querySelector("#sellPhone").value.trim();
    const sellerEmail = form.querySelector("#sellEmail").value.trim() || "Not provided";
    const propType    = propTypeMap[rawType]     || rawType     || "Not specified";
    const propLoc     = form.querySelector("#sellLocation")?.value || "Not specified";
    const propAge     = form.querySelector("#sellAge")?.value      || "Not specified";
    const propSqft    = sqft ? sqft + " sq ft"                     : "Not specified";
    const propBhk     = bhk && bhk !== "na" ? bhk.toUpperCase()    : "Not applicable";
    const propPrice   = priceMap[rawPrice]       || rawPrice       || "Not specified";
    const propTL      = timelineMap[rawTimeline] || rawTimeline    || "Not specified";
    const propNotes   = form.querySelector("#sellNotes")?.value.trim() || "None";
    const contTime    = contactTimeMap[rawContact] || "Any time";

    // Pack everything into the contact template variables
    const sellParams = {
      from_name  : "[SELL] " + sellerName,
      from_email : sellerEmail,
      phone      : sellerPhone,
      interest   : "Property Listing — " + propType + " in " + propLoc,
      budget     : propPrice,
      message    : "PROPERTY DETAILS\n" +
                   "Type:             " + propType    + "\n" +
                   "Location:         " + propLoc     + "\n" +
                   "Age:              " + propAge     + "\n" +
                   "Built-up Area:    " + propSqft    + "\n" +
                   "BHK/Config:       " + propBhk     + "\n" +
                   "Expected Price:   " + propPrice   + "\n" +
                   "Selling Timeline: " + propTL      + "\n\n" +
                   "OWNER NOTES\n" + propNotes + "\n\n" +
                   "Preferred Contact Time: " + contTime
    };

    try {
      if (typeof emailjs === "undefined") throw new Error("EmailJS not loaded");
      console.log("Sending sell form via EmailJS...", sellParams);
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONTACT_TEMPLATE_ID, sellParams);
      console.log("Sell form email sent successfully");
      form.style.display          = "none";
      successEl.style.display     = "flex";
      document.querySelector(".sell-steps").style.display = "none";
    } catch (err) {
      console.error("EmailJS sell error:", err);
      alert("Something went wrong sending your details. Please call us or email sales@civiumestate.com directly.");
      submitBtn.disabled = false;
      btnText.style.display   = "inline-block";
      btnLoader.style.display = "none";
    }
  });

  // ── Reset / Submit Another ────────────────────────────────────
  againBtn?.addEventListener("click", () => {
    form.reset();
    form.style.display = "flex";
    successEl.style.display = "none";
    document.querySelector(".sell-steps").style.display = "flex";

    // Re-enable submit btn
    const submitBtn = form.querySelector(".sell-btn-submit");
    submitBtn.disabled = false;
    submitBtn.querySelector(".sell-btn-text").style.display  = "inline-block";
    submitBtn.querySelector(".sell-btn-loader").style.display = "none";

    showStep(1);
  });
});

// ============================================================
// SERVICE CARDS — Tap to expand on mobile
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".service-card");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      // Only activate tap behaviour on mobile
      if (window.innerWidth > 768) return;

      const isOpen = card.classList.contains("open");

      // Close all cards first
      cards.forEach(c => c.classList.remove("open"));

      // Toggle clicked card
      if (!isOpen) card.classList.add("open");
    });
  });
});

// ============================================================
// WHY CHOOSE — Carousel
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const track     = document.querySelector(".why-carousel-track");
  const outer     = document.querySelector(".why-carousel-track-outer");
  const prevBtn   = document.querySelector(".why-carousel-prev");
  const nextBtn   = document.querySelector(".why-carousel-next");
  const dotsWrap  = document.querySelector(".why-carousel-dots");

  if (!track) return;

  const cards     = Array.from(track.querySelectorAll(".why-card"));
  let current     = 0;

  function getVisible() {
    return window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 4;
  }

  function buildDots() {
    dotsWrap.innerHTML = "";
    const visible   = getVisible();
    const totalDots = Math.ceil(cards.length / visible);
    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement("span");
      dot.className = "why-dot" + (i === 0 ? " active" : "");
      dot.addEventListener("click", () => goTo(i * visible));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    const visible = getVisible();
    const dots    = dotsWrap.querySelectorAll(".why-dot");
    const idx     = Math.round(current / visible);
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
  }

  function goTo(idx) {
    const visible = getVisible();
    const max     = Math.max(0, cards.length - visible);
    current       = Math.max(0, Math.min(idx, max));

    // Card width + gap
    const cardW   = cards[0].offsetWidth;
    const gap     = 24;
    track.style.transform = `translateX(-${current * (cardW + gap)}px)`;

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current >= max;
    updateDots();
  }

  prevBtn.addEventListener("click", () => goTo(current - getVisible()));
  nextBtn.addEventListener("click", () => goTo(current + getVisible()));

  // Touch / swipe support
  let startX = 0;
  outer.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  outer.addEventListener("touchend",   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });

  // Init
  buildDots();
  goTo(0);

  // Rebuild on resize
  window.addEventListener("resize", () => { buildDots(); goTo(0); });
});
