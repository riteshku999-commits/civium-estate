// ==============================
// CIVIUM ESTATE - MAIN SCRIPT
// ==============================


// 1️⃣ Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
});


// 2️⃣ Navbar Background Change on Scroll
window.addEventListener("scroll", function () {
  const header = document.querySelector(".header");

  if (window.scrollY > 60) {
    header.style.background = "rgba(0, 0, 0, 0.9)";
  } else {
    header.style.background = "rgba(0, 0, 0, 0.7)";
  }
});


// 3️⃣ Initialize AOS (Animate On Scroll)
document.addEventListener("DOMContentLoaded", function () {
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 1000,      // Animation speed
      easing: "ease-in-out",
      once: true,          // Only animate once
      offset: 100          // Trigger slightly before element enters view
    });
  }
});

// 4️⃣ Subtle Parallax Effect for Hero
window.addEventListener("scroll", function () {
  const hero = document.querySelector(".hero-overlay");
  let scrollPosition = window.scrollY;

  if (hero) {
    hero.style.transform = "translateY(" + scrollPosition * 0.2 + "px)";
  }
});

// 5️⃣ Animated Number Counter
const counters = document.querySelectorAll('.counter');
const speed = 200;

const startCounter = () => {
  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const count = +counter.innerText;

      const increment = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(updateCount, 10);
      } else {
        counter.innerText = target;
      }
    };

    updateCount();
  });
};

// Trigger when section is visible
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      startCounter();
      observer.disconnect();
    }
  });
});

observer.observe(document.querySelector('.credibility'));

// 6️⃣ Simple Testimonial Slider
let currentSlide = 0;
const testimonials = document.querySelectorAll('.testimonial');

function showSlide(index) {
  testimonials.forEach(slide => slide.classList.remove('active'));
  testimonials[index].classList.add('active');
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % testimonials.length;
  showSlide(currentSlide);
}

setInterval(nextSlide, 4000);

// PROPERTY FILTERING
const budgetFilter = document.getElementById('budgetFilter');
const locationFilter = document.getElementById('locationFilter');
const typeFilter = document.getElementById('typeFilter');
const properties = document.querySelectorAll('.property-card');

function filterProperties() {
  properties.forEach(property => {
    const budget = property.getAttribute('data-budget');
    const location = property.getAttribute('data-location');
    const type = property.getAttribute('data-type');

    const matchBudget = budgetFilter.value === "all" || budget === budgetFilter.value;
    const matchLocation = locationFilter.value === "all" || location === locationFilter.value;
    const matchType = typeFilter.value === "all" || type === typeFilter.value;

    if (matchBudget && matchLocation && matchType) {
      property.style.display = "block";
    } else {
      property.style.display = "none";
    }
  });
}

budgetFilter.addEventListener('change', filterProperties);
locationFilter.addEventListener('change', filterProperties);
typeFilter.addEventListener('change', filterProperties);

// POPUP LOGIC
const popup = document.getElementById("leadPopup");
const closePopup = document.getElementById("closePopup");
const priceButtons = document.querySelectorAll(".price-btn");

priceButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    popup.style.display = "flex";
  });
});

closePopup.addEventListener("click", () => {
  popup.style.display = "none";
});
