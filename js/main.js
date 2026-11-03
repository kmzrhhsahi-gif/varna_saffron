/* Varna Saffron - main.js (step 1: foundation helpers) */
document.documentElement.classList.add("js");

(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // scroll reveal
  const els = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach(e => e.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: .15, rootMargin: "0px 0px -6% 0px" });
    els.forEach(e => io.observe(e));
  }

  // ---- step 2: header, hero ----
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  // channel links from data/site.js (hide button if not set)
  document.querySelectorAll("[data-channel]").forEach(a => {
    const url = (window.VARNA && VARNA.channels[a.dataset.channel]) || "";
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; } else a.hidden = true;
  });

  // solid / hide-on-scroll header
  let lastY = 0, ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      header.classList.toggle("is-solid", y > 40);
      header.classList.toggle("is-hidden", y > lastY && y > 400 && !document.body.classList.contains("menu-open"));
      lastY = y; ticking = false;
    });
  }, { passive: true });

  // mobile menu
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
  };
  burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  // hero video: skip on reduced motion / data saver, pause when off-screen
  const video = document.getElementById("heroVideo");
  const saveData = navigator.connection && navigator.connection.saveData;
  if (video) {
    if (reduce || saveData) { video.remove(); }
    else {
      video.play().catch(() => {});
      new IntersectionObserver(([en]) => en.isIntersecting ? video.play().catch(() => {}) : video.pause()).observe(video);
    }
  }

  // falling petals + saffron threads
  const petals = document.getElementById("petals");
  if (petals && !reduce) {
    const n = innerWidth < 700 ? 9 : 16, r = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "petal" + (i % 3 === 0 ? " thread" : "");
      p.style.cssText = `--x:${r(0, 100)}%;--s:${r(10, 22)}px;--dur:${r(9, 18)}s;--delay:${-r(0, 18)}s;--dx:${r(-120, 120)}px;--rot:${r(-300, 300)}deg;--b:${i % 4 === 0 ? 2 : 0}px`;
      petals.appendChild(p);
    }
  }

  // 3D tilt on the arch photo (pointer devices only)
  const arch = document.getElementById("arch");
  if (arch && !reduce && matchMedia("(hover:hover)").matches) {
    const art = arch.parentElement;
    art.addEventListener("pointermove", e => {
      const b = art.getBoundingClientRect();
      arch.style.setProperty("--ry", ((e.clientX - b.left) / b.width - .5) * 14 + "deg");
      arch.style.setProperty("--rx", (.5 - (e.clientY - b.top) / b.height) * 10 + "deg");
    });
    art.addEventListener("pointerleave", () => { arch.style.setProperty("--ry", "0deg"); arch.style.setProperty("--rx", "0deg"); });
  }

  // marquee
  const mq = document.getElementById("marquee");
  if (mq) {
    const words = ["زعفران سوپر نگین", "ریشهٔ زعفران", "هل سبز وارداتی", "پودر زعفران", "پک هدیه", "مزرعهٔ ورامین"];
    const row = words.map(w => `<span>${w}</span>`).join("");
    mq.innerHTML = row + row + row + row;
  }

  // ---- step 3: counter + timeline ----
  document.querySelectorAll("[data-count]").forEach(el => {
    const end = +el.dataset.count, fmt = n => Math.round(n).toLocaleString("en-US").replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]).replace(/,/g, "٬");
    if (reduce) { el.textContent = fmt(end); return; }
    el.textContent = fmt(0);
    new IntersectionObserver(([en], o) => {
      if (!en.isIntersecting) return; o.disconnect();
      const t0 = performance.now(), dur = 1800;
      (function tick(t) {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = fmt(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: .6 }).observe(el);
  });

  const tl = document.getElementById("timeline");
  if (tl) {
    const steps = [...tl.querySelectorAll("[data-step]")];
    const update = () => {
      const r = tl.getBoundingClientRect(), mid = innerHeight * .6;
      tl.style.setProperty("--p", Math.max(0, Math.min(1, (mid - r.top) / r.height)).toFixed(3));
      steps.forEach(s => s.classList.toggle("is-in", s.getBoundingClientRect().top < mid));
    };
    addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    addEventListener("resize", update); update();
  }

  // helpers shared by later steps
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  window.toFa = (n) => String(n).replace(/\d/g, d => fa[d]);
  window.fmtPrice = (n) => window.toFa(Number(n).toLocaleString("en-US"));
})();
