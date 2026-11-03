/* Varna Saffron - products.js (step 4): catalog, filter, modal */
(function () {
  const grid = document.getElementById("grid"), filters = document.getElementById("filters");
  const dlg = document.getElementById("pdlg");
  if (!grid || !window.PRODUCTS) return;

  const fa = s => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const money = p => p.price == null ? "استعلام قیمت" : fa((p.price * 1000).toLocaleString("en-US")).replace(/,/g, "٬") + " تومان";
  const img = (p, sm) => `assets/img/${p.img}${sm ? "-sm" : ""}.webp`;
  const V = window.VARNA || { admins: [], channels: {} };

  // order link: prefilled Telegram message to the first admin
  window.orderLink = p => {
    const msg = `سلام، می‌خواهم سفارش بدهم:\n${p.name} - ${p.size}`;
    const to = (V.admins && V.admins[0]) ? V.admins[0] : "varnasaffron";
    return `https://t.me/${to}?text=${encodeURIComponent(msg)}`;
  };

  let cat = "all";
  const render = () => {
    const list = PRODUCTS.filter(p => cat === "all" || p.cat === cat);
    grid.innerHTML = list.map((p, i) => `
      <article class="pcard" style="--i:${i}" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.name} ${p.size}">
        <div class="pcard__img">
          <img src="${img(p, true)}" alt="${p.name}" loading="lazy" width="480" height="480">
          ${p.badge ? `<span class="pcard__badge">${p.badge}</span>` : ""}
        </div>
        <div class="pcard__body">
          <h3>${p.name}</h3>
          <span class="pcard__size">${p.size}</span>
          <div class="pcard__foot"><b class="${p.price == null ? "ask" : ""}">${money(p)}</b><span class="pcard__go">جزئیات ←</span></div>
        </div>
      </article>`).join("");
  };

  filters.innerHTML = CATS.map(([k, t]) => `<button class="fchip${k === "all" ? " is-on" : ""}" data-cat="${k}">${t}</button>`).join("");
  filters.addEventListener("click", e => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    cat = b.dataset.cat;
    filters.querySelectorAll(".fchip").forEach(x => x.classList.toggle("is-on", x === b));
    render();
  });

  // modal
  const open = id => {
    const p = PRODUCTS.find(x => x.id === id); if (!p) return;
    dlg.dataset.id = id;
    dlg.querySelector("img").src = img(p); dlg.querySelector("img").alt = p.name;
    dlg.querySelector("h3").textContent = p.name;
    dlg.querySelector(".pdlg__size").textContent = p.size;
    dlg.querySelector(".pdlg__desc").textContent = p.desc;
    dlg.querySelector(".pdlg__price").textContent = money(p);
    dlg.querySelector(".pdlg__order").href = orderLink(p);
    dlg.showModal();
  };
  grid.addEventListener("click", e => { const c = e.target.closest(".pcard"); if (c) open(c.dataset.id); });
  grid.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("pcard")) { e.preventDefault(); open(e.target.dataset.id); } });
  dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest(".pdlg__x")) dlg.close(); });

  // card tilt (pointer devices)
  if (matchMedia("(hover:hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    grid.addEventListener("pointermove", e => {
      const c = e.target.closest(".pcard"); if (!c) return;
      const b = c.getBoundingClientRect();
      c.style.setProperty("--ry", ((e.clientX - b.left) / b.width - .5) * 10 + "deg");
      c.style.setProperty("--rx", (.5 - (e.clientY - b.top) / b.height) * 8 + "deg");
    });
    grid.addEventListener("pointerout", e => { const c = e.target.closest(".pcard"); if (c) { c.style.setProperty("--ry", "0deg"); c.style.setProperty("--rx", "0deg"); } });
  }
  render();
})();
