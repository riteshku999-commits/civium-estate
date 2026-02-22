// ==============================
// CIVIUM ESTATE — MAIN SCRIPT
// Data-driven via data/properties.json
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

  toggleBtn.addEventListener("click",    () => document.body.classList.contains("nav-open") ? closeNav() : openNav());
  backdrop.addEventListener("click",     closeNav);
  navLinks.forEach(link => link.addEventListener("click", closeNav));
  document.addEventListener("keydown",   e => e.key === "Escape" && closeNav());
});


// ─────────────────────────────────────────
// 2. SMOOTH SCROLL
// ─────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});


// ─────────────────────────────────────────
// 3. NAVBAR SCROLL EFFECT
// ─────────────────────────────────────────
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  header.style.background = window.scrollY > 60 ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.7)";
});


// ─────────────────────────────────────────
// 4. AOS INIT
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (typeof AOS !== "undefined") {
    AOS.init({ duration: 1000, easing: "ease-in-out", once: true, offset: 100 });
  }
});


// ─────────────────────────────────────────
// 5. HERO PARALLAX
// ─────────────────────────────────────────
window.addEventListener("scroll", () => {
  const hero = document.querySelector(".hero-overlay");
  if (hero) hero.style.transform = `translateY(${window.scrollY * 0.2}px)`;
});


// ─────────────────────────────────────────
// 6. ANIMATED COUNTER
// ─────────────────────────────────────────
const counters = document.querySelectorAll(".counter");

const startCounters = () => {
  counters.forEach(counter => {
    const target = +counter.getAttribute("data-target");
    const step   = target / 200;
    const tick   = () => {
      const current = +counter.innerText;
      if (current < target) {
        counter.innerText = Math.ceil(current + step);
        setTimeout(tick, 10);
      } else {
        counter.innerText = target;
      }
    };
    tick();
  });
};

const credibilitySection = document.querySelector(".credibility");
if (credibilitySection) {
  new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { startCounters(); obs.disconnect(); }
    });
  }).observe(credibilitySection);
}


// ─────────────────────────────────────────
// 7. TESTIMONIAL SLIDER
// ─────────────────────────────────────────
let currentSlide = 0;
const testimonials = document.querySelectorAll(".testimonial");

const showSlide = index => {
  testimonials.forEach(s => s.classList.remove("active"));
  testimonials[index].classList.add("active");
};

if (testimonials.length) setInterval(() => {
  currentSlide = (currentSlide + 1) % testimonials.length;
  showSlide(currentSlide);
}, 4000);


// ─────────────────────────────────────────
// 8. POPUP LOGIC (shared by all buttons)
// ─────────────────────────────────────────
const popup      = document.getElementById("leadPopup");
const closePopup = document.getElementById("closePopup");

const openPopup  = () => { if (popup) popup.style.display = "flex"; };
const closePopupFn = () => { if (popup) popup.style.display = "none"; };

if (closePopup) closePopup.addEventListener("click", closePopupFn);

// Delegate popup opening to any .price-btn or .deal-btn (including dynamically created ones)
document.addEventListener("click", e => {
  if (e.target.matches(".price-btn") || (e.target.matches(".deal-btn") && !e.target.disabled)) {
    openPopup();
  }
});


// ─────────────────────────────────────────
// 9. CONTACT FORM
// ─────────────────────────────────────────
const contactForm    = document.getElementById("contactForm");
const successMessage = document.getElementById("successMessage");

const validateForm = formData => {
  let isValid = true;
  const errors = {};

  const name = formData.get("fullName")?.trim();
  if (!name || name.length < 2) { errors.fullName = "Please enter a valid name"; isValid = false; }

  const email = formData.get("email")?.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errors.email = "Please enter a valid email address"; isValid = false; }

  const phone = formData.get("phone")?.trim().replace(/[\s\-\(\)]/g, "");
  if (!/^[\+]?[0-9]{10,15}$/.test(phone)) { errors.phone = "Please enter a valid phone number"; isValid = false; }

  if (!formData.get("propertyInterest")) { errors.propertyInterest = "Please select your area of interest"; isValid = false; }

  const message = formData.get("message")?.trim();
  if (!message || message.length < 10) { errors.message = "Please enter a message (at least 10 characters)"; isValid = false; }

  return { isValid, errors };
};

const displayErrors = errors => {
  document.querySelectorAll(".form-group").forEach(group => {
    group.classList.remove("error");
    const err = group.querySelector(".error-message");
    if (err) err.textContent = "";
  });
  Object.keys(errors).forEach(field => {
    const input = document.getElementById(field);
    if (input) {
      const group = input.closest(".form-group");
      group.classList.add("error");
      const err = group.querySelector(".error-message");
      if (err) err.textContent = errors[field];
    }
  });
};

if (contactForm) {
  contactForm.addEventListener("submit", async e => {
    e.preventDefault();
    const formData   = new FormData(contactForm);
    const validation = validateForm(formData);
    if (!validation.isValid) { displayErrors(validation.errors); return; }
    displayErrors({});

    const submitBtn = contactForm.querySelector(".submit-btn");
    const btnText   = submitBtn.querySelector(".btn-text");
    const btnLoader = submitBtn.querySelector(".btn-loader");
    submitBtn.disabled = true;
    btnText.style.display   = "none";
    btnLoader.style.display = "inline-block";

    try {
      console.log("Form submitted:", Object.fromEntries(formData));
      await new Promise(r => setTimeout(r, 1500));
      contactForm.style.display    = "none";
      successMessage.style.display = "block";
      contactForm.reset();
      setTimeout(() => {
        successMessage.style.display = "none";
        contactForm.style.display    = "flex";
        submitBtn.disabled = false;
        btnText.style.display   = "inline-block";
        btnLoader.style.display = "none";
      }, 5000);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again or contact us directly.");
      submitBtn.disabled = false;
      btnText.style.display   = "inline-block";
      btnLoader.style.display = "none";
    }
  });

  contactForm.querySelectorAll("input, select, textarea").forEach(field => {
    field.addEventListener("blur", function () {
      const validation = validateForm(new FormData(contactForm));
      if (validation.errors[this.id]) {
        const group = this.closest(".form-group");
        group.classList.add("error");
        group.querySelector(".error-message").textContent = validation.errors[this.id];
      } else {
        const group = this.closest(".form-group");
        group.classList.remove("error");
        group.querySelector(".error-message").textContent = "";
      }
    });
  });
}


// ╔══════════════════════════════════════════════════════════════╗
// ║  DATA-DRIVEN PROPERTY RENDERING (reads data/properties.json) ║
// ╚══════════════════════════════════════════════════════════════╝

// ─────────────────────────────────────────
// 10. FETCH JSON & BOOT RENDERING
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  fetch("data/properties.json")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      renderPropertyListings(data.propertyListings);
      renderHotDeals(data.hotDeals);
    })
    .catch(err => {
      console.error("Could not load properties.json:", err);
      // Show a friendly fallback message in each grid
      const grids = ["propertyGrid", "residentialDeals", "commercialDeals"];
      grids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<p class="loading-text" style="color:#c5a47e;">Unable to load properties. Please try again later.</p>`;
      });
    });
});


// ─────────────────────────────────────────
// 11. RENDER — PROPERTY LISTINGS SECTION
// ─────────────────────────────────────────
function renderPropertyListings(listings) {
  const grid = document.getElementById("propertyGrid");
  if (!grid) return;

  grid.innerHTML = listings.map(p => `
    <div class="property-card"
         data-budget="${p.budget}"
         data-location="${p.location}"
         data-type="${p.type}">
      <img src="${p.image}" alt="${p.title}" loading="lazy">
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <button class="price-btn">Get Exact Price</button>
    </div>
  `).join("");

  // Wire up the existing filter selects
  const budgetFilter   = document.getElementById("budgetFilter");
  const locationFilter = document.getElementById("locationFilter");
  const typeFilter     = document.getElementById("typeFilter");

  const filterProperties = () => {
    document.querySelectorAll(".property-card").forEach(card => {
      const matchBudget   = budgetFilter.value   === "all" || card.dataset.budget   === budgetFilter.value;
      const matchLocation = locationFilter.value === "all" || card.dataset.location === locationFilter.value;
      const matchType     = typeFilter.value     === "all" || card.dataset.type     === typeFilter.value;
      card.style.display  = (matchBudget && matchLocation && matchType) ? "block" : "none";
    });
  };

  [budgetFilter, locationFilter, typeFilter].forEach(sel => {
    if (sel) sel.addEventListener("change", filterProperties);
  });
}


// ─────────────────────────────────────────
// 12. BUILD A SINGLE DEAL CARD (HTML string)
// ─────────────────────────────────────────
function buildDealCard(deal, index) {
  const soldClass    = deal.soldOut ? " sold-out" : "";
  const soldOverlay  = deal.soldOut
    ? `<div class="sold-overlay">
         <div class="sold-text">SOLD OUT</div>
         <p>This property has been successfully sold</p>
       </div>` : "";

  const featuredBadge = deal.featured
    ? `<div class="deal-badge featured">⭐ FEATURED</div>` : "";

  const btnDisabled = deal.soldOut ? " disabled" : "";

  return `
    <div class="deal-card${soldClass}"
         data-price="${deal.price}"
         data-featured="${deal.featured}"
         data-index="${index + 1}">
      ${soldOverlay}
      <div class="deal-badge ${deal.badgeClass}">${deal.badge}</div>
      ${featuredBadge}
      <img src="${deal.image}" alt="${deal.title}" loading="lazy">
      <div class="deal-content">
        <h3>${deal.title}</h3>
        <p>${deal.description}</p>
        <div class="deal-price">
          ${deal.priceLabel}
          <span class="old-price">${deal.oldPriceLabel}</span>
        </div>
        <button class="deal-btn"${btnDisabled}>${deal.buttonText}</button>
      </div>
    </div>`;
}


// ─────────────────────────────────────────
// 13. RENDER — HOT DEALS (both tabs)
// ─────────────────────────────────────────

// State shared between both tabs
let currentCategory    = "residential";
let currentPriceFilter = "all";
let currentSort        = "newest";
let visibleDeals       = 6;

function renderHotDeals(hotDeals) {
  // Insert raw cards into each slider container
  ["residential", "commercial"].forEach(cat => {
    const container = document.getElementById(cat === "residential" ? "residentialDeals" : "commercialDeals");
    if (!container) return;
    container.innerHTML = hotDeals[cat].map((deal, i) => buildDealCard(deal, i)).join("");
  });

  // Wire up tab buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".deal-slider").forEach(s => s.classList.remove("active"));

      this.classList.add("active");
      currentCategory = this.getAttribute("data-category");
      document.querySelector(`.${currentCategory}-deals`).classList.add("active");

      visibleDeals = 6;
      applyFiltersAndSort();
    });
  });

  // Wire up price filter buttons
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      this.classList.add("active");
      currentPriceFilter = this.getAttribute("data-price");
      applyFiltersAndSort();
    });
  });

  // Wire up sort select
  const sortSelect = document.getElementById("sortDeals");
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      currentSort = this.value;
      applyFiltersAndSort();
    });
  }

  // Wire up Load More
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      visibleDeals += 3;
      applyFiltersAndSort();
    });
  }

  // Run initial layout
  applyFiltersAndSort();
}


// ─────────────────────────────────────────
// 14. FILTER + SORT + SHOW/HIDE DEALS
// ─────────────────────────────────────────
function getActiveSlider() {
  return document.querySelector(`.${currentCategory}-deals`);
}

function applyFiltersAndSort() {
  const slider = getActiveSlider();
  if (!slider) return;

  let deals = Array.from(slider.querySelectorAll(".deal-card"));

  // 1. Filter by price
  const filtered = deals.filter(card => {
    const price = parseFloat(card.getAttribute("data-price"));
    if (currentPriceFilter === "all")     return true;
    if (currentPriceFilter === "0-50")    return price < 50;
    if (currentPriceFilter === "50-100")  return price >= 50 && price <= 100;
    if (currentPriceFilter === "100-999") return price > 100;
    return true;
  });

  // 2. Sort
  filtered.sort((a, b) => {
    const pA = parseFloat(a.getAttribute("data-price"));
    const pB = parseFloat(b.getAttribute("data-price"));
    const fA = a.getAttribute("data-featured") === "true";
    const fB = b.getAttribute("data-featured") === "true";
    const iA = parseInt(a.getAttribute("data-index"));
    const iB = parseInt(b.getAttribute("data-index"));

    switch (currentSort) {
      case "price-low":  return pA - pB;
      case "price-high": return pB - pA;
      case "featured":   return (fA === fB) ? 0 : fA ? -1 : 1;
      default:           return iA - iB;   // newest = original JSON order
    }
  });

  // 3. Re-append in new order and set visibility
  filtered.forEach((card, i) => {
    slider.appendChild(card);
    card.style.display = i < visibleDeals ? "block" : "none";
    card.classList.toggle("hidden-deal", i >= visibleDeals);
  });

  // 4. Hide cards that didn't match the filter
  deals.filter(c => !filtered.includes(c)).forEach(c => {
    c.style.display = "none";
    c.classList.add("hidden-deal");
  });

  updateLoadMoreButton();
  updateShowingCount(filtered.length);
}

function updateLoadMoreButton() {
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  if (!loadMoreBtn) return;
  const hidden = Array.from(getActiveSlider().querySelectorAll(".deal-card.hidden-deal")).length;
  if (hidden === 0) {
    loadMoreBtn.textContent = "All Deals Loaded";
    loadMoreBtn.disabled = true;
  } else {
    loadMoreBtn.textContent = `Load More Deals (${hidden} remaining)`;
    loadMoreBtn.disabled = false;
  }
}

function updateShowingCount(totalFiltered) {
  const countEl = document.querySelector(".showing-count");
  if (!countEl) return;
  const visible = Array.from(getActiveSlider().querySelectorAll(".deal-card"))
                       .filter(c => c.style.display === "block").length;
  countEl.textContent = `Showing ${visible} of ${totalFiltered} deals`;
}
