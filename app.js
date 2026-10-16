/* SPTB. storefront — layout, catalog, cart */
(function () {
  "use strict";

  var PRODUCTS = [
    { slug: "classic-hoodie", name: "Classic Hoodie", price: 48, cat: "apparel", letter: "H", tag: "Bestseller", grad: "linear-gradient(135deg,#26262c,#5b5b66)", blurb: "Heavyweight brushed fleece with a tonal embroidered mark. Nothing loud.", details: ["480 GSM brushed-back fleece", "Tonal chest embroidery", "Kangaroo pocket", "Unisex fit"] },
    { slug: "essential-tee", name: "Essential Tee", price: 28, cat: "apparel", letter: "T", grad: "linear-gradient(135deg,#dfe1e6,#a9adb8)", blurb: "Mid-weight combed cotton. Cut clean, built to last.", details: ["220 GSM combed cotton", "Ribbed collar", "Side-seamed", "Unisex fit"] },
    { slug: "snapback-cap", name: "Snapback Cap", price: 24, cat: "apparel", letter: "C", grad: "linear-gradient(135deg,#101014,#3c3c46)", blurb: "Six-panel twill cap with an embroidered mark.", details: ["Cotton twill", "Adjustable snapback", "Embroidered eyelets"] },
    { slug: "campus-backpack", name: "Campus Backpack", price: 68, cat: "essentials", letter: "B", tag: "New", grad: "linear-gradient(135deg,#33424f,#7e96ab)", blurb: "20L everyday carry with a padded 16\u2033 laptop sleeve.", details: ["20L capacity", "Padded 16\u2033 laptop sleeve", "Water-resistant shell", "Magnetic buckles"] },
    { slug: "notebook-set", name: "Notebook Set", price: 18, cat: "essentials", letter: "N", grad: "linear-gradient(135deg,#c9a97d,#8a6f4d)", blurb: "Two lay-flat notebooks. Dot grid and lined.", details: ["2 \u00d7 192 pages", "100 GSM paper", "Lay-flat binding", "Dot grid + lined"] },
    { slug: "steel-bottle", name: "Steel Bottle", price: 26, cat: "essentials", letter: "S", grad: "linear-gradient(135deg,#7fb2c7,#3d6b83)", blurb: "750ml vacuum-insulated. 24h cold, 12h hot.", details: ["750 ml capacity", "Double-wall vacuum", "24h cold / 12h hot", "BPA-free cap"] },
    { slug: "everyday-tote", name: "Everyday Tote", price: 22, cat: "essentials", letter: "E", grad: "linear-gradient(135deg,#dde1e5,#a6b0b8)", blurb: "Heavy canvas tote with an interior pocket.", details: ["16oz canvas", "Interior zip pocket", "Reinforced handles"] },
    { slug: "pen-set", name: "Pen Set", price: 14, cat: "essentials", letter: "P", grad: "linear-gradient(135deg,#232329,#4d4d59)", blurb: "Three gel pens. 0.5mm, matte black.", details: ["3 \u00d7 0.5mm gel", "Matte black finish", "Gift box included"] }
  ];
  var FREE_SHIP = 50, SHIP_COST = 4.95;

  function money(n) { return "$" + Number(n).toFixed(2); }
  function bySlug(s) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].slug === s) return PRODUCTS[i]; return null; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- cart ---------- */
  function getCart() { try { return JSON.parse(localStorage.getItem("sptb_cart") || "{}"); } catch (e) { return {}; } }
  function setCart(c) { localStorage.setItem("sptb_cart", JSON.stringify(c)); updateBadge(); }
  function cartCount() { var c = getCart(), n = 0; for (var k in c) n += c[k]; return n; }
  function cartLines() {
    var c = getCart(), out = [];
    for (var k in c) { var p = bySlug(k); if (p && c[k] > 0) out.push({ p: p, qty: c[k] }); }
    return out;
  }
  function cartSubtotal() { var t = 0, l = cartLines(); for (var i = 0; i < l.length; i++) t += l[i].p.price * l[i].qty; return t; }
  function shippingFor(sub) { return sub === 0 ? 0 : (sub >= FREE_SHIP ? 0 : SHIP_COST); }
  function addToBag(slug, qty) {
    var c = getCart(); c[slug] = (c[slug] || 0) + (qty || 1);
    setCart(c);
    var p = bySlug(slug);
    toast((p ? p.name : "Item") + " added to bag");
  }
  function updateBadge() {
    var el = document.getElementById("bag-count");
    if (!el) return;
    var n = cartCount();
    el.textContent = n;
    el.classList.toggle("hide", n === 0);
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- layout ---------- */
  var BAG_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h15l-1.2 12.2a1 1 0 0 1-1 .8H5.2a1 1 0 0 1-1-.8L3 8h3z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>';
  function mountLayout() {
    var h = document.getElementById("site-header");
    if (h) {
      h.innerHTML =
        '<div class="wrap nav">' +
        '<a class="logo" href="/">SPTB.</a>' +
        '<nav class="nav-links"><a href="/shop">Shop</a><a href="/about">About</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></nav>' +
        '<div class="nav-right">' +
        '<a href="/signin" id="nav-auth" class="nav-auth">Sign in</a>' +
        '<a href="/cart" class="bag" aria-label="Shopping bag">' + BAG_SVG + '<span class="bag-count hide" id="bag-count">0</span></a>' +
        '<button class="hamburger" id="hamburger" aria-label="Open menu"><span></span><span></span><span></span></button>' +
        "</div></div>" +
        '<div class="overlay" id="overlay"></div>' +
        '<aside class="drawer" id="drawer" aria-label="Menu">' +
        '<button class="drawer-close" id="drawer-close" aria-label="Close menu">&times;</button>' +
        '<a class="d-link" href="/shop">Shop</a>' +
        '<a class="d-link" href="/about">About</a>' +
        '<a class="d-link" href="/faq">FAQ</a>' +
        '<a class="d-link" href="/contact">Contact</a>' +
        '<a class="d-link" href="/signin" id="drawer-auth">Sign in</a>' +
        '<div class="d-foot">Made by MeowSamOP DZN</div>' +
        "</aside>";
      var dr = document.getElementById("drawer"), ov = document.getElementById("overlay");
      function open() { dr.classList.add("open"); ov.classList.add("open"); document.body.style.overflow = "hidden"; }
      function close() { dr.classList.remove("open"); ov.classList.remove("open"); document.body.style.overflow = ""; }
      document.getElementById("hamburger").addEventListener("click", open);
      document.getElementById("drawer-close").addEventListener("click", close);
      ov.addEventListener("click", close);
    }
    var f = document.getElementById("site-footer");
    if (f) {
      f.innerHTML =
        '<div class="wrap"><div class="f-grid">' +
        '<div><a class="logo" href="/">SPTB.</a><p class="f-tag">Essentials, designed quietly.</p></div>' +
        '<div class="f-col"><h4>Shop</h4><a href="/shop">All products</a><a href="/product/classic-hoodie">Classic Hoodie</a><a href="/product/campus-backpack">Campus Backpack</a><a href="/product/notebook-set">Notebook Set</a></div>' +
        '<div class="f-col"><h4>Company</h4><a href="/about">About</a><a href="/contact">Contact</a><a href="/faq">FAQ</a><a href="/account">Account</a></div>' +
        '<div class="f-col"><h4>Support</h4><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>' +
        '</div><div class="f-bottom"><span>\u00a9 2026 SPTB. All rights reserved.</span><span class="credit">Made by MeowSamOP DZN</span></div></div>';
    }
    var tw = document.createElement("div");
    tw.id = "toast"; tw.className = "toast"; tw.setAttribute("role", "status");
    document.body.appendChild(tw);
    updateBadge();
  }

  /* ---------- product card ---------- */
  function cardHTML(p) {
    return '<a class="p-card" href="/product/' + p.slug + '">' +
      '<div class="p-tile" style="--g:' + p.grad + '">' + (p.tag ? '<span class="p-badge">' + esc(p.tag) + '</span>' : '') + esc(p.letter) + '</div>' +
      '<div class="p-name">' + esc(p.name) + '</div>' +
      '<div class="p-cat">' + (p.cat === "apparel" ? "Apparel" : "Essentials") + '</div>' +
      '<div class="p-price">' + money(p.price) + '</div></a>';
  }

  /* ---------- page renderers ---------- */
  function renderHome() {
    var g = document.getElementById("featured-grid");
    if (!g) return;
    g.innerHTML = PRODUCTS.slice(0, 4).map(cardHTML).join("");
  }
  function renderShop() {
    var g = document.getElementById("shop-grid");
    if (!g) return;
    var pills = document.querySelectorAll(".pill");
    function draw(filter) {
      var list = PRODUCTS.filter(function (p) { return filter === "all" || p.cat === filter; });
      g.innerHTML = list.map(cardHTML).join("");
    }
    draw("all");
    for (var i = 0; i < pills.length; i++) {
      (function (b) {
        b.addEventListener("click", function () {
          for (var j = 0; j < pills.length; j++) pills[j].classList.remove("active");
          b.classList.add("active");
          draw(b.dataset.filter);
        });
      })(pills[i]);
    }
  }
  function renderProduct() {
    var slug = document.body.dataset.slug, p = bySlug(slug);
    var box = document.getElementById("product-detail");
    if (!box || !p) { if (box) box.innerHTML = '<div class="empty"><h2>Not found</h2><p>This product does not exist.</p><a class="btn" href="/shop">Back to shop</a></div>'; return; }
    document.title = p.name + " — SPTB.";
    var det = p.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("");
    box.innerHTML =
      '<div class="pd">' +
      '<div class="pd-tile" style="--g:' + p.grad + '">' + esc(p.letter) + '</div>' +
      '<div class="pd-info">' +
      (p.tag ? '<div class="p-tag">' + esc(p.tag) + '</div>' : '') +
      '<h1>' + esc(p.name) + '</h1>' +
      '<div class="pd-price">' + money(p.price) + '</div>' +
      '<p class="pd-blurb">' + esc(p.blurb) + '</p>' +
      '<ul class="pd-details">' + det + '</ul>' +
      '<div class="buy-row"><div class="qty"><button id="q-minus" aria-label="Decrease quantity">\u2212</button><span id="q-val">1</span><button id="q-plus" aria-label="Increase quantity">+</button></div>' +
      '<button class="btn" id="add-btn">Add to Bag</button></div>' +
      '<div class="pd-meta">Free shipping on orders over $50.<br>30-day free returns. Secure checkout.</div>' +
      '</div></div>';
    var q = 1;
    function setQ(v) { q = Math.max(1, Math.min(9, v)); document.getElementById("q-val").textContent = q; }
    document.getElementById("q-minus").addEventListener("click", function () { setQ(q - 1); });
    document.getElementById("q-plus").addEventListener("click", function () { setQ(q + 1); });
    document.getElementById("add-btn").addEventListener("click", function () { addToBag(p.slug, q); });
    var rel = document.getElementById("related-grid");
    if (rel) rel.innerHTML = PRODUCTS.filter(function (x) { return x.slug !== p.slug; }).slice(0, 4).map(cardHTML).join("");
  }
  function renderCart() {
    var itemsBox = document.getElementById("cart-items");
    if (!itemsBox) return;
    var lines = cartLines();
    if (!lines.length) {
      itemsBox.innerHTML = '<div class="empty"><h2>Your bag is empty.</h2><p>Beautiful essentials are waiting.</p><a class="btn" href="/shop">Start shopping</a></div>';
      var s = document.getElementById("cart-summary-wrap");
      if (s) s.style.display = "none";
      return;
    }
    itemsBox.innerHTML = lines.map(function (l) {
      return '<div class="cart-row">' +
        '<div class="cart-tile" style="--g:' + l.p.grad + '">' + esc(l.p.letter) + '</div>' +
        '<div class="cart-info"><div class="p-name">' + esc(l.p.name) + '</div><div class="p-price">' + money(l.p.price) + ' each</div>' +
        '<button class="cart-remove" data-remove="' + l.p.slug + '">Remove</button></div>' +
        '<div class="qty"><button data-dec="' + l.p.slug + '">\u2212</button><span>' + l.qty + '</span><button data-inc="' + l.p.slug + '">+</button></div>' +
        '<div style="font-weight:700;min-width:70px;text-align:right">' + money(l.p.price * l.qty) + '</div></div>';
    }).join("");
    function bind() {
      var btns = itemsBox.querySelectorAll("button[data-inc],button[data-dec],button[data-remove]");
      for (var i = 0; i < btns.length; i++) {
        (function (b) {
          b.addEventListener("click", function () {
            var c = getCart(), slug = b.dataset.inc || b.dataset.dec || b.dataset.remove;
            if (b.dataset.inc) c[slug]++;
            else if (b.dataset.dec) { c[slug]--; if (c[slug] <= 0) delete c[slug]; }
            else delete c[slug];
            setCart(c); renderCart();
          });
        })(btns[i]);
      }
    }
    bind();
    var sub = cartSubtotal(), ship = shippingFor(sub);
    var sw = document.getElementById("cart-summary-wrap");
    if (sw) {
      sw.style.display = "";
      document.getElementById("sum-sub").textContent = money(sub);
      document.getElementById("sum-ship").textContent = ship === 0 ? "Free" : money(ship);
      document.getElementById("sum-total").textContent = money(sub + ship);
      var note = document.getElementById("ship-note");
      if (note) note.textContent = ship === 0 ? "Your order ships free." : "Add " + money(FREE_SHIP - sub) + " more for free shipping.";
    }
  }
  function renderCheckoutSummary() {
    var box = document.getElementById("co-items");
    if (!box) return false;
    var lines = cartLines();
    if (!lines.length) {
      box.innerHTML = '<div class="empty"><h2>Your bag is empty.</h2><p>Add something before checking out.</p><a class="btn" href="/shop">Back to shop</a></div>';
      var fw = document.getElementById("co-form-wrap");
      if (fw) fw.style.display = "none";
      return false;
    }
    box.innerHTML = lines.map(function (l) {
      return '<div class="sum-row"><span>' + esc(l.p.name) + ' \u00d7 ' + l.qty + '</span><span>' + money(l.p.price * l.qty) + '</span></div>';
    }).join("");
    var sub = cartSubtotal(), ship = shippingFor(sub);
    document.getElementById("co-sub").textContent = money(sub);
    document.getElementById("co-ship").textContent = ship === 0 ? "Free" : money(ship);
    document.getElementById("co-total").textContent = money(sub + ship);
    return true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    mountLayout();
    var page = document.body.dataset.page;
    if (page === "home") renderHome();
    else if (page === "shop") renderShop();
    else if (page === "product") renderProduct();
    else if (page === "cart") renderCart();
    else if (page === "checkout") renderCheckoutSummary();
  });

  window.SPTB = {
    PRODUCTS: PRODUCTS, money: money, esc: esc, bySlug: bySlug,
    getCart: getCart, setCart: setCart, cartLines: cartLines,
    cartSubtotal: cartSubtotal, shippingFor: shippingFor, FREE_SHIP: FREE_SHIP,
    addToBag: addToBag, toast: toast, cardHTML: cardHTML
  };
})();
