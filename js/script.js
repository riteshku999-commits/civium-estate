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
