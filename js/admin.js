/* Varna Saffron - admin panel. Saves changes into the GitHub repo through the GitHub API.
   Real security = the GitHub access key (fine-grained token). Phone + password identify the admin. */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FA = "۰۱۲۳۴۵۶۷۸۹";
  const faNum = s => String(s).replace(/\d/g, d => FA[d]);
  const enNum = s => String(s).replace(/[۰-۹]/g, d => FA.indexOf(d)).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const te = new TextEncoder(), td = new TextDecoder();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const bytesToB64 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const b64ToBytes = b => Uint8Array.from(atob(b), c => c.charCodeAt(0));
  const textToB64 = t => bytesToB64(te.encode(t));
  const b64ToText = b => td.decode(b64ToBytes(b));
  const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("is-on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("is-on"), 3500); };

  /* ---------- repo location (auto-detected from the github.io address) ---------- */
  const REPO = (() => {
    const m = location.hostname.match(/^(.+)\.github\.io$/), seg = location.pathname.split("/")[1];
    if (m && seg && !seg.endsWith(".html")) return { owner: m[1], name: seg };
    return { owner: "kmzrhhsahi-gif", name: "varna_saffron" };
  })();
  const KEY = "varna_gh_key";
  const lsGet = k => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } };
  const lsSet = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} };

  /* ---------- GitHub API ---------- */
  const GH = {
    token: "", branch: "main",
    async req(method, path, body) {
      let r;
      try {
        r = await fetch("https://api.github.com" + path, {
          method, cache: "no-store",
          headers: { Authorization: "Bearer " + this.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(body ? { "Content-Type": "application/json" } : {}) },
          body: body ? JSON.stringify(body) : undefined
        });
      } catch (e) { const er = new Error("net"); er.net = true; throw er; }
      if (!r.ok) { const er = new Error("GitHub " + r.status); er.status = r.status; throw er; }
      return r.status === 204 ? null : r.json();
    },
    base() { return `/repos/${REPO.owner}/${REPO.name}`; },
    async check() { const j = await this.req("GET", this.base()); this.branch = j.default_branch || "main"; },
    async read(path) { const j = await this.req("GET", `${this.base()}/contents/${path}?ref=${this.branch}`); return { text: b64ToText(j.content), sha: j.sha }; },
    async sha(path) { try { return (await this.req("GET", `${this.base()}/contents/${path}?ref=${this.branch}`)).sha; } catch (e) { if (e.status === 404) return undefined; throw e; } },
    put(path, b64, message, sha) { return this.req("PUT", `${this.base()}/contents/${path}`, { message, content: b64, branch: this.branch, ...(sha ? { sha } : {}) }); },
    list(path) { return this.req("GET", `${this.base()}/contents/${path}?ref=${this.branch}`); }
  };
  const explain = e => e.net ? "اتصال به GitHub برقرار نشد. اینترنت یا فیلترینگ را بررسی کن."
    : e.status === 401 ? "کلید دسترسی نامعتبر یا منقضی است."
    : e.status === 403 || e.status === 404 ? "کلید به این مخزن دسترسی ندارد یا اجازهٔ نوشتن (Contents: Read and write) ندارد."
    : e.status === 409 || e.status === 422 ? "همزمان کس دیگری فایل را تغییر داده است. «بارگذاری دوباره» را بزن و تغییرت را دوباره انجام بده."
    : "خطا: " + (e.message || e);

  /* ---------- crypto ---------- */
  async function pbkdf2(secret, salt, iters) {
    const key = await crypto.subtle.importKey("raw", te.encode(secret), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: typeof salt === "string" ? te.encode(salt) : salt, iterations: iters }, key, 256);
    return bytesToB64(new Uint8Array(bits));
  }
  function normPhone(s) {
    s = enNum(s).replace(/[\s\-()]/g, "");
    if (s.startsWith("+98")) s = "0" + s.slice(3);
    else if (s.startsWith("0098")) s = "0" + s.slice(4);
    else if (/^98\d{10}$/.test(s)) s = "0" + s.slice(2);
    else if (/^9\d{9}$/.test(s)) s = "0" + s;
    return s;
  }

  /* ---------- help text (how to create the key) ---------- */
  const helpHTML = `<ol class="steps">
    <li>صاحب مخزن وارد <code>github.com</code> شود و روی عکس پروفایل بزند، بعد <b>Settings</b>.</li>
    <li>پایین منوی کناری: <b>Developer settings</b> ← <b>Personal access tokens</b> ← <b>Fine-grained tokens</b> ← <b>Generate new token</b>.</li>
    <li>اسم: <code>varna-panel</code>. مدت اعتبار: حداکثر مدت ممکن.</li>
    <li><b>Repository access</b> را روی <b>Only select repositories</b> بگذار و فقط <code>varna_saffron</code> را انتخاب کن.</li>
    <li>در <b>Repository permissions</b> گزینهٔ <b>Contents</b> را روی <b>Read and write</b> بگذار.</li>
    <li><b>Generate token</b> را بزن و متنی که با <code>github_pat_</code> شروع می‌شود را کپی کن. فقط یک بار نشان داده می‌شود.</li>
    <li>کلید را فقط به ادمین‌ها بده و در جای عمومی نفرست. اگر لو رفت، همان‌جا در GitHub حذفش کن و کلید تازه بساز.</li>
  </ol>`;
  $("#tokenHelp").innerHTML = helpHTML; $("#tokenHelp2").innerHTML = helpHTML;

  /* ---------- state ---------- */
  let A = null, ME = null;           // admins file, current admin
  const P = { products: [], cats: [], date: "", sha: "", dirty: false, imgs: {}, avail: [] };

  const show = (id, on) => { $(id).hidden = !on; };
  const setMsg = (sel, text, ok) => { const el = $(sel); el.textContent = text || ""; el.classList.toggle("ok", !!ok); };

  /* ---------- login ---------- */
  const storedKey = lsGet(KEY);
  $("#tokenRow").hidden = !!storedKey;
  let fails = +(sessionStorage.getItem("vf") || 0);

  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = $("#loginBtn"); btn.disabled = true; setMsg("#loginMsg", "");
    try {
      const phone = normPhone($("#fPhone").value), pass = $("#fPass").value;
      GH.token = (storedKey || $("#fToken").value).trim();
      if (!/^09\d{9}$/.test(phone)) throw { soft: "شمارهٔ موبایل را درست وارد کن (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)." };
      if (!GH.token) throw { soft: "کلید دسترسی GitHub را وارد کن." };
      if (fails >= 3) { const w = Math.min(30, 2 ** (fails - 2)); for (let i = w; i > 0; i--) { setMsg("#loginMsg", `چند بار اشتباه زده‌ای. ${faNum(i)} ثانیه صبر کن...`); await sleep(1000); } setMsg("#loginMsg", ""); }
      await GH.check();
      const f = await GH.read("data/admins.json"); A = JSON.parse(f.text);
      const id = await pbkdf2(phone, A.idSalt, A.idIters);
      const me = A.admins.find(a => a.id === id);
      const ok = me && (await pbkdf2(pass, b64ToBytes(me.salt), A.iters)) === me.hash;
      if (!ok) { fails++; sessionStorage.setItem("vf", fails); throw { soft: "شماره یا رمز اشتباه است." }; }
      fails = 0; sessionStorage.removeItem("vf");
      lsSet(KEY, GH.token); ME = me;
      sessionStorage.setItem("vs", ME.id);
      await enter(me.must);
    } catch (er) { setMsg("#loginMsg", er.soft || explain(er)); }
    btn.disabled = false;
  });

  async function enter(forced) {
    $("#fPass").value = ""; $("#fToken").value = "";
    show("#loginView", false); show("#appView", true);
    $("#who").textContent = `${ME.label} (...${faNum(ME.tail)})`;
    if (forced) await askPassword({ target: ME, forced: true });
    await loadAll();
  }

  /* ---------- tabs ---------- */
  document.querySelectorAll(".tabs2 button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".tabs2 button").forEach(x => x.classList.toggle("on", x === b));
    document.querySelectorAll(".pane").forEach(p => p.classList.toggle("on", p.id === b.dataset.tab));
    if (b.dataset.tab === "tPass") renderAdmins();
  }));
  $("#logout").addEventListener("click", () => { if (P.dirty && !confirm("تغییرات ذخیره‌نشده از بین می‌رود. خارج شوم؟")) return; sessionStorage.removeItem("vs"); location.reload(); });
  $("#forgetKey").addEventListener("click", () => { if (confirm("کلید GitHub از این دستگاه پاک شود؟ دفعهٔ بعد باید دوباره واردش کنی.")) { lsSet(KEY, ""); toast("کلید پاک شد."); } });
  addEventListener("beforeunload", e => { if (P.dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- products ---------- */
  const unpack = text => {
    const g = (re) => { const m = text.match(re); if (!m) throw new Error("قالب فایل محصولات ناشناخته است."); return JSON.parse(m[1]); };
    return { date: g(/window\.PRICES_DATE\s*=\s*("[^"]*");/), products: g(/window\.PRODUCTS\s*=\s*(\[[\s\S]*?\]);\s*window\.CATS/), cats: g(/window\.CATS\s*=\s*(\[[\s\S]*\]);/) };
  };
  const pack = () => `/* AUTO-GENERATED by admin.html - edit prices from the admin panel (or by hand, keep the same format).
   price is in THOUSAND TOMAN (2300 = 2,300,000 toman); null = استعلام قیمت */
window.PRICES_DATE = ${JSON.stringify(P.date)};
window.PRODUCTS = ${JSON.stringify(P.products, null, 1)};
window.CATS = ${JSON.stringify(P.cats)};
`;
  const imgURL = (p, sm) => (P.imgs[p.img] ? P.imgs[p.img][sm ? "smUrl" : "bigUrl"] : `assets/img/${p.img}${sm ? "-sm" : ""}.${p.ext || "webp"}`);
  const money = p => p.price == null || p.price === "" ? "استعلام قیمت" : faNum(Number(p.price * 1000).toLocaleString("en-US")).replace(/,/g, "٬") + " تومان";

  async function loadAll() {
    try {
      const f = await GH.read("data/products.js"); const u = unpack(f.text);
      Object.assign(P, { products: u.products, cats: u.cats, date: u.date, sha: f.sha, dirty: false, imgs: {} });
      const files = await GH.list("assets/img");
      const sm = new Set(files.map(x => x.name)); const seen = {};
      files.forEach(x => { const m = x.name.match(/^(.+)\.(webp|jpg)$/); if (m && !m[1].endsWith("-sm") && sm.has(`${m[1]}-sm.${m[2]}`)) seen[m[1]] = m[2]; });
      P.avail = Object.entries(seen).map(([base, ext]) => ({ base, ext }));
      render(); markDirty(false);
    } catch (e) { toast(explain(e)); }
  }
  $("#reloadBtn").addEventListener("click", async () => { if (P.dirty && !confirm("تغییرات ذخیره‌نشده از بین می‌رود. ادامه بدهم؟")) return; await loadAll(); toast("بارگذاری شد."); });

  function markDirty(d = true) { P.dirty = d; $("#dirtyBar").hidden = !d; }
  function render() {
    $("#pcount").textContent = `(${faNum(P.products.length)} کالا)`;
    const catName = k => (P.cats.find(c => c[0] === k) || [0, k])[1];
    $("#plist2").innerHTML = P.products.map((p, i) => `
      <div class="arow" data-i="${i}">
        <img src="${esc(imgURL(p, true))}" alt="">
        <div><b>${esc(p.name)}</b><span>${esc(p.size)} · ${esc(catName(p.cat))}</span></div>
        <div class="pr">${money(p)}</div>
        <div class="acts"><button data-a="up" ${i === 0 ? "disabled" : ""}>↑</button><button data-a="down" ${i === P.products.length - 1 ? "disabled" : ""}>↓</button><button data-a="edit">ویرایش</button><button class="danger" data-a="del">حذف</button></div>
      </div>`).join("") || `<p class="text-soft">هنوز کالایی نیست.</p>`;
  }
  $("#plist2").addEventListener("click", e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const i = +b.closest(".arow").dataset.i, a = b.dataset.a, L = P.products;
    if (a === "edit") return openEditor(i);
    if (a === "del") { if (!confirm(`«${L[i].name}» حذف شود؟`)) return; L.splice(i, 1); }
    if (a === "up" && i > 0) [L[i - 1], L[i]] = [L[i], L[i - 1]];
    if (a === "down" && i < L.length - 1) [L[i + 1], L[i]] = [L[i], L[i + 1]];
    markDirty(); render();
  });
  $("#addBtn").addEventListener("click", () => openEditor(-1));

  /* editor dialog */
  let editing = -1, draft = null;
  function fillImgSelect(cur) {
    const opts = P.avail.map(x => `<option value="${esc(x.base)}|${x.ext}">${esc(x.base)}</option>`);
    Object.keys(P.imgs).forEach(b => opts.push(`<option value="${esc(b)}|${P.imgs[b].ext}">${esc(b)} (جدید)</option>`));
    $("#eImgSel").innerHTML = opts.join("");
    $("#eImgSel").value = `${cur.img}|${cur.ext || "webp"}`;
  }
  function openEditor(i) {
    editing = i;
    draft = i >= 0 ? { ...P.products[i] } : { id: "n" + Date.now().toString(36), cat: (P.cats[1] || ["saffron"])[0], name: "", size: "", price: null, img: (P.avail[0] || {}).base || "", ext: (P.avail[0] || {}).ext || "webp", desc: "" };
    $("#edTitle").textContent = i >= 0 ? "ویرایش کالا" : "افزودن کالا";
    $("#eName").value = draft.name; $("#eSize").value = draft.size; $("#ePrice").value = draft.price == null ? "" : draft.price;
    $("#eBadge").value = draft.badge || ""; $("#eDesc").value = draft.desc || "";
    $("#eCat").innerHTML = P.cats.filter(c => c[0] !== "all").map(c => `<option value="${esc(c[0])}">${esc(c[1])}</option>`).join("");
    $("#eCat").value = draft.cat; fillImgSelect(draft); $("#ePrev").src = imgURL(draft); $("#eFile").value = ""; $("#eImgNote").textContent = "";
    setMsg("#edMsg", ""); $("#edlg").showModal();
  }
  $("#eImgSel").addEventListener("change", () => { const [b, x] = $("#eImgSel").value.split("|"); draft.img = b; draft.ext = x; $("#ePrev").src = imgURL(draft); });
  $("#eFile").addEventListener("change", async () => {
    const f = $("#eFile").files[0]; if (!f) return;
    try {
      $("#eImgNote").textContent = "در حال بهینه‌سازی عکس...";
      const r = await processImage(f); const base = "p-" + Date.now().toString(36);
      P.imgs[base] = r; draft.img = base; draft.ext = r.ext; fillImgSelect(draft); $("#ePrev").src = r.bigUrl;
      $("#eImgNote").textContent = `عکس آماده شد (${faNum(Math.round(r.bigSize / 1024))} کیلوبایت). با «ذخیره و انتشار» آپلود می‌شود.`;
    } catch (e) { $("#eImgNote").textContent = "این فایل عکس معتبر نیست."; }
  });
  $("#edCancel").addEventListener("click", () => $("#edlg").close());
  $("#edForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#eName").value.trim(); if (!name) return setMsg("#edMsg", "نام کالا را بنویس.");
    const pr = enNum($("#ePrice").value).replace(/[,٬\s]/g, "");
    if (pr && !/^\d+(\.\d+)?$/.test(pr)) return setMsg("#edMsg", "قیمت باید عدد باشد (به هزار تومان).");
    if (!draft.img) return setMsg("#edMsg", "یک عکس انتخاب کن.");
    const out = { id: draft.id, cat: $("#eCat").value, name, size: $("#eSize").value.trim(), price: pr ? Number(pr) : null, img: draft.img, desc: $("#eDesc").value.trim() };
    if (draft.ext && draft.ext !== "webp") out.ext = draft.ext;
    const badge = $("#eBadge").value.trim(); if (badge) out.badge = badge;
    if (editing >= 0) P.products[editing] = out; else P.products.push(out);
    markDirty(); render(); $("#edlg").close();
  });

  /* image processing: resize + webp (jpeg fallback for Safari) */
  async function processImage(file) {
    const bmp = await createImageBitmap(file);
    const enc = async w => {
      const s = Math.min(1, w / bmp.width), c = document.createElement("canvas");
      c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      let b = await new Promise(r => c.toBlob(r, "image/webp", .82)), ext = "webp";
      if (!b || b.type !== "image/webp") { b = await new Promise(r => c.toBlob(r, "image/jpeg", .85)); ext = "jpg"; }
      return { b, ext };
    };
    const big = await enc(1200), sm = await enc(480);
    const b64 = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(",")[1]); fr.readAsDataURL(b); });
    return { ext: big.ext, big: await b64(big.b), sm: await b64(sm.b), bigUrl: URL.createObjectURL(big.b), smUrl: URL.createObjectURL(sm.b), bigSize: big.b.size };
  }

  /* publish */
  function jalaliToday() {
    const p = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
    const g = t => p.find(x => x.type === t).value;
    return faNum(`${g("year")}/${String(g("month")).padStart(2, "0")}/${String(g("day")).padStart(2, "0")}`);
  }
  $("#publishBtn").addEventListener("click", async () => {
    const btn = $("#publishBtn"); btn.disabled = true; const old = btn.textContent; btn.textContent = "در حال ذخیره...";
    try {
      const curSha = await GH.sha("data/products.js");
      if (curSha !== P.sha) throw { status: 409 };
      const used = new Set(P.products.map(p => p.img));
      for (const [base, r] of Object.entries(P.imgs)) {
        if (!used.has(base)) continue;
        for (const [suffix, data] of [["", r.big], ["-sm", r.sm]]) {
          const path = `assets/img/${base}${suffix}.${r.ext}`;
          await GH.put(path, data, `panel: image by ${ME.label}`, await GH.sha(path));
        }
      }
      if ($("#bumpDate").checked) P.date = jalaliToday();
      const res = await GH.put("data/products.js", textToB64(pack()), `panel: products updated by ${ME.label}`, curSha);
      P.sha = res.content.sha; markDirty(false);
      toast("ذخیره شد. تا یکی دو دقیقه دیگر روی سایت می‌آید.");
      loadAll();
    } catch (e) { toast(explain(e)); }
    btn.disabled = false; btn.textContent = old;
  });

  /* ---------- admins / passwords ---------- */
  async function renderAdmins() {
    try { const f = await GH.read("data/admins.json"); A = JSON.parse(f.text); } catch (e) { toast(explain(e)); }
    $("#alist").innerHTML = A.admins.map(a => `
      <div class="arow" style="grid-template-columns:1fr auto" data-id="${esc(a.id)}">
        <div><b>${esc(a.label)} ${a.id === ME.id ? "(شما)" : ""}</b><span>شمارهٔ ...${faNum(esc(a.tail))}${a.must ? " · باید رمز تازه بگذارد" : ""}</span></div>
        <div class="acts"><button data-a="pw">تغییر رمز</button></div>
      </div>`).join("");
  }
  $("#alist").addEventListener("click", e => {
    const b = e.target.closest('[data-a="pw"]'); if (!b) return;
    const a = A.admins.find(x => x.id === b.closest(".arow").dataset.id); if (a) askPassword({ target: a, forced: false });
  });

  let pwTarget = null, pwForced = false, pwResolve = null;
  function askPassword({ target, forced }) {
    pwTarget = target; pwForced = forced;
    const self = target.id === ME.id;
    $("#pwTitle").textContent = self ? "تغییر رمز خودت" : `تغییر رمز ${target.label}`;
    $("#pwNote").textContent = forced ? "رمز پیش‌فرض باید عوض شود. یک رمز تازه (حداقل ۸ حرف) انتخاب کن."
      : self ? "رمز تازه برای ورودهای بعدی خودت." : "این ادمین در ورود بعدی مجبور می‌شود رمز تازه‌ای برای خودش بگذارد.";
    $("#pw1").value = $("#pw2").value = ""; setMsg("#pwMsg", "");
    $("#pwCancel").hidden = forced; $("#pwdlg").showModal();
    return new Promise(r => { pwResolve = r; });
  }
  $("#pwdlg").addEventListener("cancel", e => { if (pwForced) e.preventDefault(); });
  $("#pwCancel").addEventListener("click", () => { $("#pwdlg").close(); pwResolve && pwResolve(false); });
  $("#pwForm").addEventListener("submit", async e => {
    e.preventDefault();
    const a = $("#pw1").value, b = $("#pw2").value;
    if (a.length < 8) return setMsg("#pwMsg", "رمز باید حداقل ۸ حرف باشد.");
    if (a === "1234" || /^(\d)\1+$/.test(a)) return setMsg("#pwMsg", "این رمز خیلی ساده است.");
    if (a !== b) return setMsg("#pwMsg", "دو رمز یکی نیستند.");
    const btn = e.submitter; btn && (btn.disabled = true);
    try {
      const cur = await GH.read("data/admins.json"), J = JSON.parse(cur.text);
      const t = J.admins.find(x => x.id === pwTarget.id); if (!t) throw new Error("ادمین پیدا نشد.");
      const salt = crypto.getRandomValues(new Uint8Array(16));
      t.salt = bytesToB64(salt); t.hash = await pbkdf2(a, salt, J.iters); t.must = pwTarget.id !== ME.id;
      await GH.put("data/admins.json", textToB64(JSON.stringify(J, null, 1) + "\n"), `panel: password changed by ${ME.label}`, cur.sha);
      A = J; if (t.id === ME.id) ME = t;
      $("#pwdlg").close(); toast("رمز تغییر کرد."); pwResolve && pwResolve(true); renderAdmins();
    } catch (er) { setMsg("#pwMsg", er.message && !er.status && !er.net ? er.message : explain(er)); }
    btn && (btn.disabled = false);
  });

  /* ---------- resume session after reload (key is stored, password is not) ---------- */
  // For safety the password is always asked again after reload.
})();
