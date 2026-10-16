/* SPTB. admin panel */
import {
  auth, db, onAuthStateChanged, signOut,
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, limit, serverTimestamp
} from "/firebase-init.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = (n) => "$" + Number(n || 0).toFixed(2);
const fdate = (ts) => { try { return ts && ts.toDate ? ts.toDate().toLocaleDateString() + " " + ts.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; } catch (e) { return ""; } };

const SEED_PRODUCTS = [
  { slug: "classic-hoodie", name: "Classic Hoodie", price: 48, compareAt: 60, cat: "apparel", letter: "H", tag: "Bestseller", img: "/img/hoodie.jpg", grad: "linear-gradient(135deg,#26262c,#5b5b66)", blurb: "Heavyweight brushed fleece with a tonal embroidered mark. Nothing loud.", details: ["480 GSM brushed-back fleece", "Tonal chest embroidery", "Kangaroo pocket", "Unisex fit"], sizes: ["XS", "S", "M", "L", "XL"], rating: 4.9, reviews: 214, sort: 1, active: true },
  { slug: "essential-tee", name: "Essential Tee", price: 28, compareAt: null, cat: "apparel", letter: "T", img: "/img/tee.jpg", grad: "linear-gradient(135deg,#dfe1e6,#a9adb8)", blurb: "Mid-weight combed cotton. Cut clean, built to last.", details: ["220 GSM combed cotton", "Ribbed collar", "Side-seamed", "Unisex fit"], sizes: ["XS", "S", "M", "L", "XL"], rating: 4.8, reviews: 186, sort: 2, active: true },
  { slug: "snapback-cap", name: "Snapback Cap", price: 24, compareAt: null, cat: "apparel", letter: "C", img: "/img/cap.jpg", grad: "linear-gradient(135deg,#101014,#3c3c46)", blurb: "Six-panel twill cap with an embroidered mark.", details: ["Cotton twill", "Adjustable snapback", "Embroidered eyelets"], sizes: ["One size"], rating: 4.7, reviews: 98, sort: 3, active: true },
  { slug: "campus-backpack", name: "Campus Backpack", price: 68, compareAt: 85, cat: "essentials", letter: "B", tag: "New", img: "/img/backpack.jpg", grad: "linear-gradient(135deg,#33424f,#7e96ab)", blurb: "20L everyday carry with a padded 16\u2033 laptop sleeve.", details: ["20L capacity", "Padded 16\u2033 laptop sleeve", "Water-resistant shell", "Magnetic buckles"], sizes: ["One size"], rating: 4.9, reviews: 167, sort: 4, active: true },
  { slug: "notebook-set", name: "Notebook Set", price: 18, compareAt: null, cat: "essentials", letter: "N", img: "", grad: "linear-gradient(135deg,#c9a97d,#8a6f4d)", blurb: "Two lay-flat notebooks. Dot grid and lined.", details: ["2 \u00d7 192 pages", "100 GSM paper", "Lay-flat binding", "Dot grid + lined"], sizes: ["One size"], rating: 4.8, reviews: 74, sort: 5, active: true },
  { slug: "steel-bottle", name: "Steel Bottle", price: 26, compareAt: 32, cat: "essentials", letter: "S", img: "", grad: "linear-gradient(135deg,#7fb2c7,#3d6b83)", blurb: "750ml vacuum-insulated. 24h cold, 12h hot.", details: ["750 ml capacity", "Double-wall vacuum", "24h cold / 12h hot", "BPA-free cap"], sizes: ["One size"], rating: 4.7, reviews: 112, sort: 6, active: true },
  { slug: "everyday-tote", name: "Everyday Tote", price: 22, compareAt: null, cat: "essentials", letter: "E", img: "", grad: "linear-gradient(135deg,#dde1e5,#a6b0b8)", blurb: "Heavy canvas tote with an interior pocket.", details: ["16oz canvas", "Interior zip pocket", "Reinforced handles"], sizes: ["One size"], rating: 4.6, reviews: 58, sort: 7, active: true },
  { slug: "pen-set", name: "Pen Set", price: 14, compareAt: null, cat: "essentials", letter: "P", img: "", grad: "linear-gradient(135deg,#232329,#4d4d59)", blurb: "Three gel pens. 0.5mm, matte black.", details: ["3 \u00d7 0.5mm gel", "Matte black finish", "Gift box included"], sizes: ["One size"], rating: 4.8, reviews: 91, sort: 8, active: true }
];

/* ---------- modal ---------- */
function openModal(html) { $("modal-box").innerHTML = html; $("modal-ov").classList.add("open"); }
function closeModal() { $("modal-ov").classList.remove("open"); }
$("modal-ov").addEventListener("click", (e) => { if (e.target === $("modal-ov")) closeModal(); });
const field = (label, inner, hint) =>
  `<div class="field"><label>${label}</label>${inner}${hint ? `<div class="hint">${hint}</div>` : ""}</div>`;
const inp = (id, val, type = "text", extra = "") =>
  `<input id="${id}" type="${type}" value="${esc(val == null ? "" : val)}" ${extra}>`;

/* ---------- auth gate ---------- */
onAuthStateChanged(auth, async (user) => {
  if (!user) { $("admin-wall").style.display = ""; return; }
  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    if (!snap.exists()) {
      $("deny-uid").textContent = user.uid;
      $("admin-denied").style.display = "";
      return;
    }
    $("admin-app").style.display = "";
    boot();
  } catch (e) {
    console.error(e);
    $("deny-uid").textContent = user.uid;
    $("admin-denied").style.display = "";
  }
});
$("admin-signout").addEventListener("click", async (e) => { e.preventDefault(); await signOut(auth); location.href = "/"; });

/* ---------- tabs ---------- */
document.querySelectorAll(".atab").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".atab").forEach((x) => x.classList.remove("on"));
    document.querySelectorAll(".apanel").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    $("p-" + b.dataset.tab).classList.add("on");
  });
});

function boot() {
  loadOverview(); loadProducts(); loadCoupons(); loadOrders(); loadMessages(); loadSettings();
}

/* ---------- overview ---------- */
async function loadOverview() {
  try {
    const osnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(100)));
    const orders = []; osnap.forEach((d) => orders.push({ id: d.id, ...d.data() }));
    const rev = orders.filter((o) => o.status !== "cancelled").reduce((t, o) => t + (o.total || 0), 0);
    const psnap = await getDocs(collection(db, "products"));
    const msnap = await getDocs(collection(db, "messages"));
    $("st-rev").textContent = money(rev);
    $("st-ord").textContent = orders.length;
    $("st-prod").textContent = psnap.size;
    $("st-msg").textContent = msnap.size;
    const placed = orders.filter((o) => o.status === "placed").length;
    const bo = $("bdg-orders"); bo.hidden = placed === 0; bo.textContent = placed;
    const bm = $("bdg-msgs"); bm.hidden = msnap.size === 0; bm.textContent = msnap.size;
    $("recent-orders").innerHTML =
      `<div class="trow head orders"><span>Order</span><span>Customer</span><span class="hide-m">Date</span><span>Total</span><span></span></div>` +
      (orders.slice(0, 5).map((o) =>
        `<div class="trow orders"><span class="tname">${esc(o.orderId || "")}</span><span class="tsub">${esc(o.email || "")}</span><span class="tsub hide-m">${fdate(o.createdAt)}</span><span class="tname">${money(o.total)}</span><span class="ostatus ${esc(o.status || "placed")}" style="margin:0">${esc(o.status || "placed")}</span></div>`
      ).join("") || `<div class="trow"><span style="color:var(--muted)">No orders yet.</span></div>`);
  } catch (e) { console.error(e); }
}

/* ---------- products ---------- */
async function loadProducts() {
  const tbl = $("prod-tbl");
  try {
    const snap = await getDocs(query(collection(db, "products"), orderBy("sort")));
    const list = []; snap.forEach((d) => list.push({ slug: d.id, ...d.data() }));
    tbl.innerHTML =
      `<div class="trow head products"><span></span><span>Product</span><span class="hide-m">Category</span><span>Price</span><span class="hide-m">Active</span><span></span></div>` +
      (list.map((p) => {
        const img = p.img ? `<img class="timg" src="${esc(p.img)}">` : `<div class="timg tile" style="--g:${esc(p.grad || "#999")}">${esc(p.letter || "?")}</div>`;
        return `<div class="trow products">${img}<div><div class="tname">${esc(p.name)}</div><div class="tsub">/${esc(p.slug)}${p.tag ? " · " + esc(p.tag) : ""}</div></div>` +
          `<span class="tsub hide-m">${esc(p.cat || "")}</span><span class="tname">${money(p.price)}${p.compareAt > p.price ? ` <s class="tsub">${money(p.compareAt)}</s>` : ""}</span>` +
          `<span class="hide-m"><label class="switch"><input type="checkbox" data-pactive="${esc(p.slug)}" ${p.active !== false ? "checked" : ""}><span class="slid"></span></label></span>` +
          `<span><button class="mini" data-pedit="${esc(p.slug)}">Edit</button><button class="mini danger" data-pdel="${esc(p.slug)}">Delete</button></span></div>`;
      }).join("") || `<div class="trow"><span style="color:var(--muted)">No products in Firestore yet. Hit "Seed demo products".</span></div>`);
    tbl.querySelectorAll("[data-pactive]").forEach((t) =>
      t.addEventListener("change", () => updateDoc(doc(db, "products", t.dataset.pactive), { active: t.checked }).catch((e) => alert("Couldn't save: " + e.message))));
    tbl.querySelectorAll("[data-pedit]").forEach((b) =>
      b.addEventListener("click", () => {
        const p = list.find((x) => x.slug === b.dataset.pedit);
        openProductModal(p);
      }));
    tbl.querySelectorAll("[data-pdel]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm(`Delete "${b.dataset.pdel}"?`)) return;
        await deleteDoc(doc(db, "products", b.dataset.pdel));
        loadProducts();
      }));
  } catch (e) { tbl.innerHTML = `<div class="trow"><span style="color:var(--red)">Couldn't load products: ${esc(e.message)}</span></div>`; }
}

function slugify(s) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

function openProductModal(p) {
  const isEdit = !!p;
  p = p || { slug: "", name: "", price: 0, compareAt: "", cat: "apparel", tag: "", blurb: "", details: [], img: "", grad: "linear-gradient(135deg,#888,#bbb)", letter: "", sizes: ["One size"], rating: 4.8, reviews: 0, sort: 99, active: true };
  openModal(`<h3>${isEdit ? "Edit product" : "Add product"}</h3>
    <div class="mrow">
      ${field("Name", inp("pm-name", p.name))}
      ${field("Slug", inp("pm-slug", p.slug, "text", isEdit ? "disabled" : ""), isEdit ? "Slug can't change after creation." : "Auto from name; lowercase, dashes.")}
    </div>
    <div class="mrow">
      ${field("Price ($)", inp("pm-price", p.price, "number", 'min="0" step="0.01"'))}
      ${field("Compare-at price ($)", inp("pm-compare", p.compareAt || "", "number", 'min="0" step="0.01"'), "Empty = no sale badge.")}
    </div>
    <div class="mrow">
      ${field("Category", `<select id="pm-cat"><option value="apparel"${p.cat === "apparel" ? " selected" : ""}>Apparel</option><option value="essentials"${p.cat === "essentials" ? " selected" : ""}>Essentials</option></select>`)}
      ${field("Badge tag", inp("pm-tag", p.tag || ""), "e.g. Bestseller, New. Empty = none.")}
    </div>
    ${field("Short description", `<textarea id="pm-blurb" style="min-height:70px">${esc(p.blurb)}</textarea>`)}
    ${field("Details (one per line)", `<textarea id="pm-details">${esc((p.details || []).join("\n"))}</textarea>`)}
    ${field("Image URL", inp("pm-img", p.img || ""), "Use /img/hoodie.jpg, /img/tee.jpg, /img/cap.jpg, /img/backpack.jpg — or any https URL. Empty = gradient tile.")}
    <div class="mrow">
      ${field("Tile gradient (if no image)", inp("pm-grad", p.grad || ""))}
      ${field("Tile letter (if no image)", inp("pm-letter", p.letter || "", "text", 'maxlength="1"'))}
    </div>
    <div class="mrow">
      ${field("Sizes (comma separated)", inp("pm-sizes", (p.sizes || []).join(", ")))}
      ${field("Sort order", inp("pm-sort", p.sort, "number", 'step="1"'))}
    </div>
    <div class="mrow">
      ${field("Rating", inp("pm-rating", p.rating, "number", 'min="0" max="5" step="0.1"'))}
      ${field("Review count", inp("pm-reviews", p.reviews, "number", 'min="0" step="1"'))}
    </div>
    <div class="field"><label style="display:flex;align-items:center;gap:10px;cursor:pointer"><input type="checkbox" id="pm-active" ${p.active !== false ? "checked" : ""} style="width:20px;height:20px"> Active (visible in store)</label></div>
    <div class="form-err" id="pm-err"></div>
    <div class="mfoot"><button class="btn btn-light" id="pm-cancel" type="button">Cancel</button><button class="btn" id="pm-save" type="button">${isEdit ? "Save" : "Add product"}</button></div>`);
  $("pm-cancel").addEventListener("click", closeModal);
  const nameEl = $("pm-name"), slugEl = $("pm-slug");
  if (!isEdit) nameEl.addEventListener("input", () => { slugEl.value = slugify(nameEl.value); });
  $("pm-save").addEventListener("click", async () => {
    const err = $("pm-err");
    const slug = slugify(slugEl.value);
    const price = parseFloat($("pm-price").value);
    if (!slug || !nameEl.value.trim() || !(price >= 0)) { err.textContent = "Name, slug and a valid price are required."; err.classList.add("show"); return; }
    const data = {
      name: nameEl.value.trim(), price,
      compareAt: $("pm-compare").value === "" ? null : parseFloat($("pm-compare").value),
      cat: $("pm-cat").value, tag: $("pm-tag").value.trim() || null,
      blurb: $("pm-blurb").value.trim(),
      details: $("pm-details").value.split("\n").map((s) => s.trim()).filter(Boolean),
      img: $("pm-img").value.trim(), grad: $("pm-grad").value.trim() || "linear-gradient(135deg,#888,#bbb)",
      letter: ($("pm-letter").value.trim() || nameEl.value.trim()[0] || "?").toUpperCase(),
      sizes: $("pm-sizes").value.split(",").map((s) => s.trim()).filter(Boolean),
      rating: parseFloat($("pm-rating").value) || 4.8, reviews: parseInt($("pm-reviews").value) || 0,
      sort: parseInt($("pm-sort").value) || 99, active: $("pm-active").checked,
      updatedAt: serverTimestamp()
    };
    try {
      if (!isEdit) data.createdAt = serverTimestamp();
      await setDoc(doc(db, "products", slug), data, { merge: isEdit });
      closeModal(); loadProducts(); loadOverview();
    } catch (e) { err.textContent = "Couldn't save: " + e.message; err.classList.add("show"); }
  });
}
$("prod-add").addEventListener("click", () => openProductModal(null));

$("seed-btn").addEventListener("click", async () => {
  if (!confirm("Write the 8 demo products, a WELCOME10 coupon and default settings to Firestore?")) return;
  try {
    for (const p of SEED_PRODUCTS) {
      const { slug, ...data } = p;
      await setDoc(doc(db, "products", slug), { ...data, createdAt: serverTimestamp() });
    }
    await setDoc(doc(db, "coupons", "WELCOME10"), { code: "WELCOME10", type: "percent", value: 10, minSubtotal: 0, usageLimit: null, usedCount: 0, expiresAt: null, active: true, createdAt: serverTimestamp() });
    await setDoc(doc(db, "settings", "store"), { freeShip: 50, shipCost: 4.95, announcement: "Free shipping on orders over $50" }, { merge: true });
    alert("Seeded! Products, WELCOME10 coupon and settings are live.");
    loadProducts(); loadCoupons(); loadSettings();
  } catch (e) { alert("Seed failed: " + e.message); }
});

/* ---------- coupons ---------- */
async function loadCoupons() {
  const tbl = $("coupon-tbl");
  try {
    const snap = await getDocs(collection(db, "coupons"));
    const list = []; snap.forEach((d) => list.push({ code: d.id, ...d.data() }));
    list.sort((a, b) => a.code.localeCompare(b.code));
    tbl.innerHTML =
      `<div class="trow head coupons"><span>Code</span><span class="hide-m">Discount</span><span class="hide-m">Min. subtotal</span><span>Used</span><span class="hide-m">Expires</span><span></span></div>` +
      (list.map((c) => {
        const disc = c.type === "percent" ? c.value + "% off" : money(c.value) + " off";
        const used = `${c.usedCount || 0}${c.usageLimit ? " / " + c.usageLimit : ""}`;
        const exp = c.expiresAt && c.expiresAt.toDate ? c.expiresAt.toDate().toLocaleDateString() : "Never";
        return `<div class="trow coupons"><span><span class="ocode">${esc(c.code)}</span></span><span class="hide-m">${esc(disc)}</span><span class="tsub hide-m">${c.minSubtotal ? money(c.minSubtotal) : "—"}</span><span>${esc(used)}</span><span class="tsub hide-m">${esc(exp)}</span>` +
          `<span><label class="switch"><input type="checkbox" data-cactive="${esc(c.code)}" ${c.active !== false ? "checked" : ""}><span class="slid"></span></label><button class="mini danger" data-cdel="${esc(c.code)}">Delete</button></span></div>`;
      }).join("") || `<div class="trow"><span style="color:var(--muted)">No coupons yet.</span></div>`);
    tbl.querySelectorAll("[data-cactive]").forEach((t) =>
      t.addEventListener("change", () => updateDoc(doc(db, "coupons", t.dataset.cactive), { active: t.checked }).catch((e) => alert("Couldn't save: " + e.message))));
    tbl.querySelectorAll("[data-cdel]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm(`Delete coupon "${b.dataset.cdel}"?`)) return;
        await deleteDoc(doc(db, "coupons", b.dataset.cdel));
        loadCoupons();
      }));
  } catch (e) { tbl.innerHTML = `<div class="trow"><span style="color:var(--red)">Couldn't load coupons: ${esc(e.message)}</span></div>`; }
}
$("coupon-add").addEventListener("click", () => {
  openModal(`<h3>Add coupon</h3>
    ${field("Code", inp("cm-code", "", "text", 'style="text-transform:uppercase"'), "Uppercase, no spaces. This is the document ID.")}
    <div class="mrow">
      ${field("Type", `<select id="cm-type"><option value="percent">Percent %</option><option value="flat">Flat $</option></select>`)}
      ${field("Value", inp("cm-value", "10", "number", 'min="0" step="0.01"'))}
    </div>
    <div class="mrow">
      ${field("Min. subtotal ($)", inp("cm-min", "0", "number", 'min="0" step="1"'), "Empty/0 = no minimum.")}
      ${field("Usage limit", inp("cm-limit", "", "number", 'min="1" step="1"'), "Empty = unlimited.")}
    </div>
    ${field("Expires", inp("cm-exp", "", "date"), "Empty = never expires.")}
    <div class="field"><label style="display:flex;align-items:center;gap:10px;cursor:pointer"><input type="checkbox" id="cm-active" checked style="width:20px;height:20px"> Active</label></div>
    <div class="form-err" id="cm-err"></div>
    <div class="mfoot"><button class="btn btn-light" id="cm-cancel" type="button">Cancel</button><button class="btn" id="cm-save" type="button">Add coupon</button></div>`);
  $("cm-cancel").addEventListener("click", closeModal);
  $("cm-save").addEventListener("click", async () => {
    const err = $("cm-err");
    const code = $("cm-code").value.trim().toUpperCase().replace(/\s+/g, "");
    const value = parseFloat($("cm-value").value);
    if (!code || !(value > 0)) { err.textContent = "Code and a positive value are required."; err.classList.add("show"); return; }
    if ($("cm-type").value === "percent" && value > 90) { err.textContent = "Percent can't exceed 90."; err.classList.add("show"); return; }
    const expV = $("cm-exp").value;
    try {
      await setDoc(doc(db, "coupons", code), {
        code, type: $("cm-type").value, value,
        minSubtotal: parseFloat($("cm-min").value) || 0,
        usageLimit: $("cm-limit").value === "" ? null : parseInt($("cm-limit").value),
        usedCount: 0, expiresAt: expV ? new Date(expV + "T23:59:59") : null,
        active: $("cm-active").checked, createdAt: serverTimestamp()
      });
      closeModal(); loadCoupons();
    } catch (e) { err.textContent = "Couldn't save: " + e.message; err.classList.add("show"); }
  });
});

/* ---------- orders ---------- */
const STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];
async function loadOrders() {
  const box = $("orders-list");
  try {
    const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(60)));
    const list = []; snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    box.innerHTML = list.map((o) => {
      const items = (o.items || []).map((i) => `${esc(i.name)} (${esc(i.size || "")}) × ${i.qty} — ${money(i.price * i.qty)}`).join("<br>");
      return `<div class="order" data-oid="${esc(o.id)}">
        <div class="order-top"><span class="order-id">${esc(o.orderId || o.id.slice(0, 8))}</span><span class="order-date">${fdate(o.createdAt)} · ${esc(o.email || "")}</span></div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <select class="statussel" data-ostatus="${esc(o.id)}">${STATUSES.map((s) => `<option value="${s}"${(o.status || "placed") === s ? " selected" : ""}>${s}</option>`).join("")}</select>
          <span class="order-items">${(o.items || []).length} items</span>
          <span class="order-total" style="margin:0 0 0 auto">${money(o.total)}</span>
        </div>
        <div class="odet" id="od-${esc(o.id)}">
          <div class="sum-row"><span>Items</span></div><div style="margin-bottom:10px">${items}</div>
          ${o.couponCode ? `<div class="sum-row"><span>Coupon</span><span class="disc">${esc(o.couponCode)} (−${money(o.discount || 0)})</span></div>` : ""}
          <div class="sum-row"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
          <div class="sum-row"><span>Shipping</span><span>${money(o.shipping)}</span></div>
          <div class="sum-row total"><span>Total</span><span>${money(o.total)}</span></div>
          <div class="sum-row" style="margin-top:10px"><span>Ship to</span><span style="text-align:right">${esc(o.name || "")}<br>${esc(o.address || "")}, ${esc(o.city || "")} ${esc(o.zip || "")}<br>${esc(o.country || "")}</span></div>
        </div></div>`;
    }).join("") || `<div class="tbl"><div class="trow"><span style="color:var(--muted)">No orders yet.</span></div></div>`;
    box.querySelectorAll(".order").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("select")) return;
        $("od-" + el.dataset.oid).classList.toggle("open");
      });
    });
    box.querySelectorAll("[data-ostatus]").forEach((s) =>
      s.addEventListener("change", () =>
        updateDoc(doc(db, "orders", s.dataset.ostatus), { status: s.value })
          .then(loadOverview)
          .catch((e) => alert("Couldn't update: " + e.message))));
  } catch (e) { box.innerHTML = `<div class="tbl"><div class="trow"><span style="color:var(--red)">Couldn't load orders: ${esc(e.message)}</span></div></div>`; }
}

/* ---------- messages ---------- */
async function loadMessages() {
  const tbl = $("msg-tbl");
  try {
    const snap = await getDocs(query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(60)));
    const list = []; snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    tbl.innerHTML =
      `<div class="trow head msgs"><span class="hide-m">Date</span><span>From</span><span class="hide-m">Message</span><span></span></div>` +
      (list.map((m) =>
        `<div class="trow msgs"><span class="tsub hide-m">${fdate(m.createdAt)}</span><div><div class="tname">${esc(m.name)}</div><div class="tsub">${esc(m.email)}</div></div>` +
        `<span class="tsub hide-m">${esc((m.message || "").slice(0, 90))}${(m.message || "").length > 90 ? "…" : ""}</span>` +
        `<span><button class="mini" data-mview="${esc(m.id)}">View</button><button class="mini danger" data-mdel="${esc(m.id)}">Delete</button></span></div>`
      ).join("") || `<div class="trow"><span style="color:var(--muted)">No messages.</span></div>`);
    tbl.querySelectorAll("[data-mview]").forEach((b) =>
      b.addEventListener("click", () => {
        const m = list.find((x) => x.id === b.dataset.mview);
        openModal(`<h3>Message</h3><p style="color:var(--muted);font-size:14px;margin-bottom:12px"><b>${esc(m.name)}</b> · ${esc(m.email)}<br>${fdate(m.createdAt)}</p><p style="font-size:15px;line-height:1.6">${esc(m.message)}</p><div class="mfoot"><button class="btn" id="m-ok" type="button">Close</button></div>`);
        $("m-ok").addEventListener("click", closeModal);
      }));
    tbl.querySelectorAll("[data-mdel]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Delete this message?")) return;
        await deleteDoc(doc(db, "messages", b.dataset.mdel));
        loadMessages(); loadOverview();
      }));
  } catch (e) { tbl.innerHTML = `<div class="trow"><span style="color:var(--red)">Couldn't load messages: ${esc(e.message)}</span></div>`; }
}

/* ---------- settings ---------- */
async function loadSettings() {
  try {
    const s = await getDoc(doc(db, "settings", "store"));
    const d = s.exists() ? s.data() : {};
    $("set-freeship").value = d.freeShip != null ? d.freeShip : 50;
    $("set-shipcost").value = d.shipCost != null ? d.shipCost : 4.95;
    $("set-announce").value = d.announcement || "";
  } catch (e) { console.error(e); }
}
$("set-save").addEventListener("click", async () => {
  const err = $("set-err"), ok = $("set-ok");
  err.classList.remove("show"); ok.classList.remove("show");
  try {
    await setDoc(doc(db, "settings", "store"), {
      freeShip: parseFloat($("set-freeship").value) || 0,
      shipCost: parseFloat($("set-shipcost").value) || 0,
      announcement: $("set-announce").value.trim()
    }, { merge: true });
    ok.textContent = "Settings saved. They apply to the store immediately."; ok.classList.add("show");
  } catch (e) { err.textContent = "Couldn't save: " + e.message; err.classList.add("show"); }
});
