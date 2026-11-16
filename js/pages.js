// Tiny script for generated pages (properties/, areas/): mobile menu, gallery arrows, click-to-play video.
document.addEventListener("DOMContentLoaded", () => {
  // mobile nav (same behaviour as js/script.js)
  const toggleBtn = document.querySelector(".nav-toggle"), closeBtn = document.querySelector(".nav-close"), backdrop = document.querySelector(".nav-backdrop");
  if (toggleBtn && backdrop) {
    const open = () => { document.body.classList.add("nav-open"); toggleBtn.setAttribute("aria-expanded", "true"); toggleBtn.setAttribute("aria-hidden", "true"); closeBtn?.removeAttribute("aria-hidden"); };
    const close = () => { document.body.classList.remove("nav-open"); toggleBtn.setAttribute("aria-expanded", "false"); toggleBtn.removeAttribute("aria-hidden"); closeBtn?.setAttribute("aria-hidden", "true"); };
    toggleBtn.addEventListener("click", open); closeBtn?.addEventListener("click", close); backdrop.addEventListener("click", close);
    document.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", close));
    document.addEventListener("keydown", e => e.key === "Escape" && close());
  }

  // gallery
  document.querySelectorAll(".pg-gallery").forEach(g => {
    const track = g.querySelector(".pg-track"), count = g.querySelector(".pg-count"), n = +g.dataset.count || 1;
    const idx = () => Math.round(track.scrollLeft / track.clientWidth);
    const go = i => { stopVideos(g); track.scrollTo({ left: ((i + n) % n) * track.clientWidth, behavior: "smooth" }); };
    g.querySelector(".pg-prev")?.addEventListener("click", () => go(idx() - 1));
    g.querySelector(".pg-next")?.addEventListener("click", () => go(idx() + 1));
    track.addEventListener("scroll", () => { if (count) count.textContent = `${Math.min(n, idx() + 1)} / ${n}`; }, { passive: true });
  });

  function stopVideos(root) {
    root.querySelectorAll(".pg-video.is-playing").forEach(v => { v.classList.remove("is-playing"); v.querySelector("iframe")?.remove(); });
  }
  document.querySelectorAll(".pg-video").forEach(v => {
    v.addEventListener("click", e => {
      if (e.target.closest(".pg-vopen") || v.classList.contains("is-playing")) return;
      const f = document.createElement("iframe");
      f.src = v.dataset.embed; f.title = "Property video"; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true; f.referrerPolicy = "strict-origin-when-cross-origin";
      v.appendChild(f); v.classList.add("is-playing");
    });
  });
});
