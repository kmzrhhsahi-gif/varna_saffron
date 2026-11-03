/* Varna Saffron - guide.js (step 6): tabs + water-test demo */
(function () {
  const tabs = [...document.querySelectorAll(".tab")];
  const panels = [...document.querySelectorAll(".panel")];
  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => x.setAttribute("aria-selected", x === t));
    panels.forEach(p => p.classList.toggle("is-on", p.id === t.getAttribute("aria-controls")));
  }));

  const demo = document.getElementById("demo"), btn = document.getElementById("demoBtn");
  if (demo && btn) btn.addEventListener("click", () => {
    const run = demo.classList.toggle("run");
    btn.textContent = run ? "شروع دوباره" : "شروع آزمایش";
    if (run) { /* restart transition on next click */ btn.dataset.on = "1"; }
    else { btn.dataset.on = ""; }
  });
})();
