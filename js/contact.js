/* Varna Saffron - contact.js (step 7): contact cards, footer year, back-to-top */
(function () {
  const V = window.VARNA || { admins: [], channels: {} };
  const grid = document.getElementById("cgrid");
  if (grid) {
    const cards = [];
    const add = (ic, title, sub, href) => href && cards.push(
      `<a class="ccard" href="${href}" target="_blank" rel="noopener"><i class="ccard__ic">${ic}</i><div><b>${title}</b><span>${sub}</span></div></a>`);
    const ch = V.channels || {};
    add("ت", "کانال تلگرام", "@varnasaffron", ch.telegram);
    add("ا", "کانال ایتا", "@varnasaffron", ch.eitaa);
    add("ب", "کانال بله", "@varnasaffron", ch.bale);
    add("ر", "کانال روبیکا", "@varnasaffron", ch.rubika);
    add("و", "واتساپ", "پیام مستقیم", ch.whatsapp);
    (V.admins || []).forEach((a, i) => add("☎", `ادمین ${["اول", "دوم", "سوم", "چهارم"][i] || i + 1} (تلگرام)`, "@" + a, `https://t.me/${a}`));
    if (V.phone) cards.push(`<a class="ccard" href="tel:${V.phone}"><i class="ccard__ic">☎</i><div><b>تماس تلفنی</b><span>${V.phone}</span></div></a>`);
    grid.innerHTML = cards.join("");
  }

  const y = document.getElementById("year");
  if (y) y.textContent = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());

  const top = document.getElementById("totop");
  if (top) {
    addEventListener("scroll", () => top.classList.toggle("is-on", scrollY > 900), { passive: true });
    top.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  }
})();
