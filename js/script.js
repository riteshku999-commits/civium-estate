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
