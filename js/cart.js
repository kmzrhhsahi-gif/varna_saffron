/* Varna Saffron - cart.js (step 5): price list, cart, order via messengers */
(function () {
  const list = document.getElementById("plist");
  if (!list || !window.PRODUCTS) return;

  const V = window.VARNA || { admins: [], channels: {} };
  const fa = s => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const toman = n => fa(Math.round(n * 1000).toLocaleString("en-US")).replace(/,/g, "٬");
  const byId = id => PRODUCTS.find(p => p.id === id);
  const KEY = "varna_cart_v1";

  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  Object.keys(cart).forEach(k => { if (!byId(k) || !(cart[k] > 0)) delete cart[k]; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} };

  const el = id => document.getElementById(id);
  const toast = (msg) => {
    const t = el("toast"); t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("is-on"), 3200);
  };

  // ---- price list ----
  const ctl = p => cart[p.id]
    ? `<div class="qty"><button data-act="minus" aria-label="کم کردن">−</button><span>${fa(cart[p.id])}</span><button data-act="plus" aria-label="زیاد کردن">+</button></div>`
    : `<button class="addbtn" data-act="plus">افزودن</button>`;

  list.innerHTML = PRODUCTS.map(p => `
    <div class="prow" data-id="${p.id}">
      <img src="assets/img/${p.img}-sm.${p.ext || "webp"}" alt="" loading="lazy" width="64" height="64">
      <div class="prow__name"><b>${p.name}</b><span>${p.size}</span></div>
      <div class="prow__price ${p.price == null ? "ask" : ""}">${p.price == null ? "استعلام قیمت" : toman(p.price) + " <small>تومان</small>"}</div>
      <div class="prow__ctl">${ctl(p)}</div>
    </div>`).join("");

  // ---- cart ----
  const items = () => Object.keys(cart).map(id => ({ p: byId(id), q: cart[id] }));
  const total = () => items().reduce((s, { p, q }) => s + (p.price || 0) * q, 0);
  const count = () => items().reduce((s, { q }) => s + q, 0);

  const orderText = () => {
    const rows = items().map(({ p, q }, i) =>
      `${fa(i + 1)}) ${p.name} - ${p.size} × ${fa(q)}` + (p.price == null ? " (استعلام قیمت)" : ` = ${toman(p.price * q)} تومان`));
    const ask = items().some(({ p }) => p.price == null);
    return `سلام، سفارش من از سایت وارنا:\n\n${rows.join("\n")}\n\n` +
      `جمع (محاسبه‌شده): ${toman(total())} تومان${ask ? " + موارد استعلامی" : ""}\n` +
      `قیمت نهایی و هزینهٔ ارسال را لطفاً تأیید کنید.`;
  };

  const renderCart = () => {
    const box = el("cartItems"), n = count();
    box.innerHTML = n ? items().map(({ p, q }) =>
      `<li><span>${p.name} <small>${p.size}</small></span><b>${fa(q)}×</b></li>`).join("")
      : `<li class="empty">هنوز محصولی انتخاب نکرده‌اید.</li>`;
    el("cartTotal").textContent = toman(total()) + " تومان";
    el("cartPanel").classList.toggle("has-items", n > 0);
    el("pillCount").textContent = fa(n);
    el("pill").hidden = n === 0;
  };

  const setQty = (id, q) => {
    if (q <= 0) delete cart[id]; else cart[id] = Math.min(q, 99);
    save();
    const row = list.querySelector(`[data-id="${id}"] .prow__ctl`);
    if (row) row.innerHTML = ctl(byId(id));
    renderCart();
  };
  window.addToCart = id => { setQty(id, (cart[id] || 0) + 1); };

  list.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = b.closest(".prow").dataset.id;
    setQty(id, (cart[id] || 0) + (b.dataset.act === "plus" ? 1 : -1));
  });

  // add from product modal (step 4)
  const dlg = el("pdlg");
  if (dlg) dlg.addEventListener("click", e => {
    if (e.target.closest(".pdlg__add")) {
      const id = dlg.dataset.id; if (!id) return;
      window.addToCart(id); dlg.close(); toast("به سبد سفارش اضافه شد.");
    }
  });

  el("cartClear").addEventListener("click", () => { cart = {}; save(); list.querySelectorAll(".prow").forEach(r => r.querySelector(".prow__ctl").innerHTML = ctl(byId(r.dataset.id))); renderCart(); });

  // ---- sending the order ----
  const copy = txt => {
    try { navigator.clipboard.writeText(txt); return true; } catch (e) {}
    const ta = document.createElement("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {} ta.remove(); return ok;
  };
  const admin = (V.admins && V.admins[0]) || "varnasaffron";
  const targets = {
    telegram: txt => `https://t.me/${admin}?text=${encodeURIComponent(txt)}`,
    eitaa: () => `https://eitaa.com/${admin}`,
    bale: () => `https://ble.ir/${admin}`,
    rubika: () => `https://rubika.ir/${admin}`,
    whatsapp: txt => V.channels.whatsapp ? `${V.channels.whatsapp}${V.channels.whatsapp.includes("?") ? "&" : "?"}text=${encodeURIComponent(txt)}` : ""
  };
  document.querySelectorAll("[data-send]").forEach(b => {
    if (b.dataset.send === "whatsapp" && !V.channels.whatsapp) b.hidden = true;
    b.addEventListener("click", () => {
      if (!count()) { toast("اول محصول را انتخاب کنید."); return; }
      const m = b.dataset.send, txt = orderText(), url = targets[m](txt);
      if (m !== "telegram" && m !== "whatsapp") { copy(txt); toast("متن سفارش کپی شد. در گفتگو Paste کنید."); }
      if (url) window.open(url, "_blank", "noopener");
    });
  });
  el("cartCopy").addEventListener("click", () => {
    if (!count()) { toast("اول محصول را انتخاب کنید."); return; }
    toast(copy(orderText()) ? "متن سفارش کپی شد." : "کپی انجام نشد.");
  });

  // floating pill: visible only while the cart panel is off-screen
  el("pill").addEventListener("click", () => el("cartPanel").scrollIntoView({ behavior: "smooth", block: "center" }));
  new IntersectionObserver(([en]) => el("pill").classList.toggle("is-away", en.isIntersecting)).observe(el("cartPanel"));

  renderCart();
})();
