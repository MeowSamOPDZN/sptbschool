/* ============ SPTB. storefront ============ */
(function () {
  "use strict";

  /* ---------- fallback catalog (used until Firestore has products) ---------- */
  var FALLBACK = [
    { slug:"classic-hoodie", name:"Classic Hoodie", price:48, compareAt:60, cat:"apparel", letter:"H", tag:"Bestseller", img:"/img/hoodie.jpg", grad:"linear-gradient(135deg,#26262c,#5b5b66)", blurb:"Heavyweight brushed fleece with a tonal embroidered mark. Nothing loud.", details:["480 GSM brushed-back fleece","Tonal chest embroidery","Kangaroo pocket","Unisex fit"], sizes:["XS","S","M","L","XL"], rating:4.9, reviews:214, sort:1 },
    { slug:"essential-tee", name:"Essential Tee", price:28, cat:"apparel", letter:"T", img:"/img/tee.jpg", grad:"linear-gradient(135deg,#dfe1e6,#a9adb8)", blurb:"Mid-weight combed cotton. Cut clean, built to last.", details:["220 GSM combed cotton","Ribbed collar","Side-seamed","Unisex fit"], sizes:["XS","S","M","L","XL"], rating:4.8, reviews:186, sort:2 },
    { slug:"snapback-cap", name:"Snapback Cap", price:24, cat:"apparel", letter:"C", img:"/img/cap.jpg", grad:"linear-gradient(135deg,#101014,#3c3c46)", blurb:"Six-panel twill cap with an embroidered mark.", details:["Cotton twill","Adjustable snapback","Embroidered eyelets"], sizes:["One size"], rating:4.7, reviews:98, sort:3 },
    { slug:"campus-backpack", name:"Campus Backpack", price:68, compareAt:85, cat:"essentials", letter:"B", tag:"New", img:"/img/backpack.jpg", grad:"linear-gradient(135deg,#33424f,#7e96ab)", blurb:"20L everyday carry with a padded 16\u2033 laptop sleeve.", details:["20L capacity","Padded 16\u2033 laptop sleeve","Water-resistant shell","Magnetic buckles"], sizes:["One size"], rating:4.9, reviews:167, sort:4 },
    { slug:"notebook-set", name:"Notebook Set", price:18, cat:"essentials", letter:"N", grad:"linear-gradient(135deg,#c9a97d,#8a6f4d)", blurb:"Two lay-flat notebooks. Dot grid and lined.", details:["2 \u00d7 192 pages","100 GSM paper","Lay-flat binding","Dot grid + lined"], sizes:["One size"], rating:4.8, reviews:74, sort:5 },
    { slug:"steel-bottle", name:"Steel Bottle", price:26, compareAt:32, cat:"essentials", letter:"S", grad:"linear-gradient(135deg,#7fb2c7,#3d6b83)", blurb:"750ml vacuum-insulated. 24h cold, 12h hot.", details:["750 ml capacity","Double-wall vacuum","24h cold / 12h hot","BPA-free cap"], sizes:["One size"], rating:4.7, reviews:112, sort:6 },
    { slug:"everyday-tote", name:"Everyday Tote", price:22, cat:"essentials", letter:"E", grad:"linear-gradient(135deg,#dde1e5,#a6b0b8)", blurb:"Heavy canvas tote with an interior pocket.", details:["16oz canvas","Interior zip pocket","Reinforced handles"], sizes:["One size"], rating:4.6, reviews:58, sort:7 },
    { slug:"pen-set", name:"Pen Set", price:14, cat:"essentials", letter:"P", grad:"linear-gradient(135deg,#232329,#4d4d59)", blurb:"Three gel pens. 0.5mm, matte black.", details:["3 \u00d7 0.5mm gel","Matte black finish","Gift box included"], sizes:["One size"], rating:4.8, reviews:91, sort:8 }
  ];

  var SAMPLE_REVIEWS = [
    { n:"Amara O.", d:"2 weeks ago", t:"Quality is honestly better than brands charging twice this. The fabric feels premium and the fit is perfect." },
    { n:"Dev P.", d:"1 month ago", t:"Ordered Tuesday, arrived Friday. Packaging was minimal and plastic-free. Will buy again." },
    { n:"Lena K.", d:"2 months ago", t:"Exactly as pictured. Minimal, clean, and it goes with everything I own." }
  ];

  /* ---------- firebase bridge (set by firebase-init module) ---------- */
  var _fbP = null;
  function fbReady() {
    if (!_fbP) _fbP = new Promise(function (res) {
      if (window.SPTB_FB) return res(window.SPTB_FB);
      var t = setInterval(function () { if (window.SPTB_FB) { clearInterval(t); res(window.SPTB_FB); } }, 80);
      setTimeout(function () { clearInterval(t); res(window.SPTB_FB || null); }, 9000);
    });
    return _fbP;
  }

  /* ---------- catalog ---------- */
  function norm(p) {
    p.sizes = p.sizes && p.sizes.length ? p.sizes : ["One size"];
    p.details = p.details || [];
    p.rating = p.rating || 4.8; p.reviews = p.reviews || 0;
    p.sort = p.sort == null ? 99 : p.sort;
    return p;
  }
  var _cat = null;
  function catalog() {
    if (_cat) return Promise.resolve(_cat);
    return fbReady().then(function (fb) {
      if (fb) {
        return fb.getDocs(fb.query(fb.collection(fb.db, "products"), fb.orderBy("sort")))
          .then(function (snap) {
            var list = [];
            snap.forEach(function (d) {
              var p = norm(Object.assign({ slug: d.id }, d.data()));
              if (p.active !== false) list.push(p);
            });
            if (list.length) { _cat = list; return list; }
            throw new Error("empty");
          })
          .catch(function () { _cat = FALLBACK.map(function (p) { return norm(Object.assign({}, p)); }); return _cat; });
      }
      _cat = FALLBACK.map(function (p) { return norm(Object.assign({}, p)); }); return _cat;
    });
  }
  function bySlug(slug) {
    return catalog().then(function (list) {
      for (var i = 0; i < list.length; i++) if (list[i].slug === slug) return list[i];
      return null;
    });
  }
  var _set = null;
  function settings() {
    if (_set) return Promise.resolve(_set);
    _set = { freeShip: 50, shipCost: 4.95, announcement: "" };
    return fbReady().then(function (fb) {
      if (!fb) return _set;
      return fb.getDoc(fb.doc(fb.db, "settings", "store")).then(function (s) {
        if (s.exists()) _set = Object.assign(_set, s.data());
        return _set;
      }).catch(function () { return _set; });
    });
  }

  /* ---------- helpers ---------- */
  function money(n) { return "$" + Number(n).toFixed(2); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function stars(r) {
    var full = Math.round(r), s = "";
    for (var i = 0; i < 5; i++) s += i < full ? "\u2605" : "\u2606";
    return '<span class="stars">' + s + "</span>";
  }

  /* ---------- cart (array of {slug,size,qty}) ---------- */
  function getCart() {
    try {
      var c = JSON.parse(localStorage.getItem("sptb_cart") || "[]");
      if (!Array.isArray(c)) return [];
      return c.filter(function (l) { return l && l.slug && l.qty > 0; });
    } catch (e) { return []; }
  }
  function setCart(c) { localStorage.setItem("sptb_cart", JSON.stringify(c)); updateBadges(); }
  function cartCount() { var n = 0, c = getCart(); for (var i = 0; i < c.length; i++) n += c[i].qty; return n; }
  function addToBag(slug, size, qty) {
    var c = getCart(), key = slug + "|" + size, found = false;
    for (var i = 0; i < c.length; i++) if (c[i].slug === slug && c[i].size === size) { c[i].qty = Math.min(9, c[i].qty + (qty || 1)); found = true; }
    if (!found) c.push({ slug: slug, size: size, qty: qty || 1 });
    setCart(c);
  }
  function setQty(slug, size, qty) {
    var c = getCart().filter(function (l) { return !(l.slug === slug && l.size === size) || qty > 0; });
    for (var i = 0; i < c.length; i++) if (c[i].slug === slug && c[i].size === size) c[i].qty = qty;
    setCart(c);
  }
  function removeLine(slug, size) { setCart(getCart().filter(function (l) { return !(l.slug === slug && l.size === size); })); }
  function cartSubtotalSync(lines) { var t = 0; for (var i = 0; i < lines.length; i++) t += lines[i].p.price * lines[i].qty; return t; }
  function linesWithProducts() {
    return catalog().then(function (list) {
      var map = {}; list.forEach(function (p) { map[p.slug] = p; });
      return getCart().map(function (l) { return { slug: l.slug, size: l.size, qty: l.qty, p: map[l.slug] }; })
        .filter(function (l) { return l.p; });
    });
  }

  /* ---------- wishlist ---------- */
  function getWish() { try { return JSON.parse(localStorage.getItem("sptb_wish") || "[]"); } catch (e) { return []; } }
  function isWished(slug) { return getWish().indexOf(slug) !== -1; }
  function toggleWish(slug) {
    var w = getWish(), i = w.indexOf(slug);
    if (i === -1) { w.push(slug); toast("Saved to wishlist"); } else { w.splice(i, 1); toast("Removed from wishlist"); }
    localStorage.setItem("sptb_wish", JSON.stringify(w));
    updateBadges();
    document.querySelectorAll('[data-wish="' + slug + '"]').forEach(function (b) { b.classList.toggle("loved", isWished(slug)); });
  }

  /* ---------- coupons ---------- */
  function getCoupon() { try { return JSON.parse(sessionStorage.getItem("sptb_coupon") || "null"); } catch (e) { return null; } }
  function setCoupon(c) { if (c) sessionStorage.setItem("sptb_coupon", JSON.stringify(c)); else sessionStorage.removeItem("sptb_coupon"); }
  function couponDiscount(sub, cp) {
    if (!cp) return 0;
    var d = cp.type === "percent" ? sub * cp.value / 100 : cp.value;
    return Math.min(d, sub);
  }
  function validateCoupon(code, subtotal) {
    code = String(code || "").trim().toUpperCase();
    if (!code) return Promise.resolve({ ok: false, msg: "Enter a code." });
    return fbReady().then(function (fb) {
      if (!fb) return { ok: false, msg: "Coupons need a connection. Try again." };
      return fb.getDoc(fb.doc(fb.db, "coupons", code)).then(function (snap) {
        if (!snap.exists()) return { ok: false, msg: "Code not found." };
        var c = snap.data();
        if (c.active === false) return { ok: false, msg: "This code is no longer active." };
        if (c.expiresAt && c.expiresAt.toDate && c.expiresAt.toDate() < new Date()) return { ok: false, msg: "This code has expired." };
        if (c.minSubtotal && subtotal < c.minSubtotal) return { ok: false, msg: "Needs a " + money(c.minSubtotal) + " subtotal." };
        if (c.usageLimit && (c.usedCount || 0) >= c.usageLimit) return { ok: false, msg: "This code has run out." };
        return { ok: true, coupon: { code: code, type: c.type, value: c.value } };
      });
    });
  }

  /* ---------- toast / badges ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }
  function updateBadges() {
    var b = document.getElementById("bag-count"), n = cartCount();
    if (b) { b.textContent = n; b.classList.toggle("hide", n === 0); }
    var w = document.getElementById("wish-count"), wn = getWish().length;
    if (w) { w.textContent = wn; w.classList.toggle("hide", wn === 0); }
  }

  /* ---------- layout ---------- */
  var SVG = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h15l-1.2 12.2a1 1 0 0 1-1 .8H5.2a1 1 0 0 1-1-.8L3 8h3z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.7C6.4 17 3 13.6 3 9.9 3 7.2 5.1 5 7.8 5c1.7 0 3.2.9 4.2 2.3C13 5.9 14.5 5 16.2 5 18.9 5 21 7.2 21 9.9c0 3.7-3.4 7.1-9 10.8z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
    ret: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>'
  };
  function tileHTML(p, cls) {
    if (p.img) return '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">';
    return '<div class="' + (cls || "pimg") + ' tile" style="--g:' + esc(p.grad || "#999") + '"><span class="tletter">' + esc(p.letter || "?") + "</span></div>";
  }
  function cardHTML(p) {
    var wished = isWished(p.slug) ? " loved" : "";
    var imgPart = p.img
      ? '<span class="pimg"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">' + pricePill(p) + "</span>"
      : '<span class="pimg tile" style="--g:' + esc(p.grad || "#999") + '"><span class="tletter">' + esc(p.letter || "?") + "</span>" + pricePill(p) + "</span>";
    return '<div class="pcard">' +
      '<a class="pimgwrap" href="/product/' + esc(p.slug) + '" style="display:block;position:relative">' + imgPart +
      (p.tag ? '<span class="ptag">' + esc(p.tag) + "</span>" : "") +
      '<button class="icon-act heart' + wished + '" data-wish="' + esc(p.slug) + '" aria-label="Save to wishlist">' + SVG.heart + "</button></a>" +
      '<div class="pbody"><div><a class="pname" href="/product/' + esc(p.slug) + '">' + esc(p.name) + "</a>" +
      '<div class="pmeta">' + stars(p.rating) + " " + p.rating.toFixed(1) + " (" + p.reviews + ")</div></div>" +
      '<button class="bagbtn" data-add="' + esc(p.slug) + '" aria-label="Add to bag">' + SVG.bag + "</button></div></div>";
  }
  function pricePill(p) {
    var s = '<span class="price-pill">';
    if (p.compareAt && p.compareAt > p.price) s += "<s>" + money(p.compareAt) + "</s>";
    return s + money(p.price) + "</span>";
  }
  function mountLayout() {
    var path = location.pathname;
    var h = document.getElementById("site-header");
    if (h) {
      h.innerHTML =
        '<div class="announce" id="announce" hidden></div>' +
        '<div class="topbar-zone"><div class="topbar">' +
        '<a class="logo" href="/">SPTB.</a>' +
        '<label class="search-pill">' + SVG.search + '<input id="g-search" placeholder="Search products\u2026" autocomplete="off"></label>' +
        '<nav class="topnav">' +
        '<a href="/shop"' + (path.indexOf("/shop") === 0 || path.indexOf("/product") === 0 ? ' class="on"' : "") + '>Shop</a>' +
        '<a href="/about"' + (path === "/about" ? ' class="on"' : "") + ">About</a>" +
        '<a href="/faq"' + (path === "/faq" ? ' class="on"' : "") + ">FAQ</a>" +
        '<a href="/contact"' + (path === "/contact" ? ' class="on"' : "") + ">Contact</a></nav>" +
        '<div class="topicons">' +
        '<button class="iconbtn" id="nav-search-btn" aria-label="Search">' + SVG.search + "</button>" +
        '<a class="iconbtn" href="/wishlist" aria-label="Wishlist">' + SVG.heart + '<span class="cnt hide" id="wish-count">0</span></a>' +
        '<a class="iconbtn" href="/cart" aria-label="Bag">' + SVG.bag + '<span class="cnt hide" id="bag-count">0</span></a>' +
        '<a class="iconbtn" id="nav-auth" href="/signin" aria-label="Account">' + SVG.user + "</a>" +
        '<button class="iconbtn" id="hamburger" aria-label="Menu">' + SVG.menu + "</button>" +
        "</div></div>" +
        '<div class="search-row" id="search-row"><input id="m-search" placeholder="Search products\u2026" autocomplete="off"></div></div>' +
        '<div class="overlay" id="overlay"></div>' +
        '<aside class="drawer" id="drawer" aria-label="Menu">' +
        '<button class="drawer-close" id="drawer-close" aria-label="Close">&times;</button>' +
        '<a class="d-link" href="/shop">Shop</a><a class="d-link" href="/wishlist">Wishlist</a>' +
        '<a class="d-link" href="/about">About</a><a class="d-link" href="/faq">FAQ</a>' +
        '<a class="d-link" href="/contact">Contact</a><a class="d-link" href="/account" id="drawer-auth">Account</a>' +
        '<div class="d-foot">Made by MeowSamOP DZN</div></aside>';
      var dr = document.getElementById("drawer"), ov = document.getElementById("overlay");
      var open = function () { dr.classList.add("open"); ov.classList.add("open"); document.body.style.overflow = "hidden"; };
      var close = function () { dr.classList.remove("open"); ov.classList.remove("open"); document.body.style.overflow = ""; };
      document.getElementById("hamburger").addEventListener("click", open);
      document.getElementById("drawer-close").addEventListener("click", close);
      ov.addEventListener("click", close);
      var sr = document.getElementById("search-row");
      document.getElementById("nav-search-btn").addEventListener("click", function () {
        sr.classList.toggle("open");
        if (sr.classList.contains("open")) document.getElementById("m-search").focus();
      });
      function goSearch(v) { v = v.trim(); if (v) location.href = "/shop?q=" + encodeURIComponent(v); }
      document.getElementById("g-search").addEventListener("keydown", function (e) { if (e.key === "Enter") goSearch(e.target.value); });
      document.getElementById("m-search").addEventListener("keydown", function (e) { if (e.key === "Enter") goSearch(e.target.value); });
      document.body.addEventListener("click", function (e) {
        var w = e.target.closest("[data-wish]");
        if (w) { e.preventDefault(); toggleWish(w.dataset.wish); return; }
        var a = e.target.closest("[data-add]");
        if (a) { e.preventDefault(); quickAdd(a.dataset.add); }
      });
      settings().then(function (s) {
        var an = document.getElementById("announce");
        if (an && s.announcement) { an.textContent = s.announcement; an.hidden = false; }
      });
    }
    var f = document.getElementById("site-footer");
    if (f) {
      f.innerHTML =
        '<div class="foot"><div class="f-grid">' +
        '<div><a class="logo" href="/">SPTB.</a><p class="f-tag">Essentials, designed quietly.</p></div>' +
        '<div class="f-col"><h4>Shop</h4><a href="/shop">All products</a><a href="/shop?cat=apparel">Apparel</a><a href="/shop?cat=essentials">Essentials</a><a href="/wishlist">Wishlist</a></div>' +
        '<div class="f-col"><h4>Company</h4><a href="/about">About</a><a href="/contact">Contact</a><a href="/faq">FAQ</a><a href="/account">Account</a></div>' +
        '<div class="f-col"><h4>Support</h4><a href="/shipping">Shipping</a><a href="/returns">Returns</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>' +
        '</div><div class="f-bottom"><span>\u00a9 2026 SPTB. All rights reserved.</span><span class="credit">Made by MeowSamOP DZN</span></div></div>';
    }
    var tw = document.createElement("div");
    tw.id = "toast"; tw.className = "toast"; tw.setAttribute("role", "status");
    document.body.appendChild(tw);
    updateBadges();
  }
  function quickAdd(slug) {
    bySlug(slug).then(function (p) {
      if (!p) return;
      var size = p.sizes.length > 1 ? p.sizes[Math.floor(p.sizes.length / 2)] : p.sizes[0];
      addToBag(p.slug, size, 1);
      toast(p.name + " (" + size + ") added to bag");
    });
  }

  /* ---------- page: home ---------- */
  function renderHome() {
    catalog().then(function (list) {
      var feat = document.getElementById("featured-grid");
      if (feat) feat.innerHTML = list.slice(0, 4).map(cardHTML).join("");
      var deals = document.getElementById("deals-grid");
      var sale = list.filter(function (p) { return p.compareAt && p.compareAt > p.price; });
      var dw = document.getElementById("deals-wrap");
      if (deals) {
        if (sale.length) deals.innerHTML = sale.slice(0, 4).map(cardHTML).join("");
        else if (dw) dw.style.display = "none";
      }
      var hc = document.getElementById("hero-card");
      if (hc) {
        var p = list.filter(function (x) { return x.tag; })[0] || list[0];
        hc.innerHTML =
          '<a href="/product/' + esc(p.slug) + '"><div class="hc-img">' +
          (p.img ? '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '">' : "") +
          pricePill(p) + "</div></a>" +
          '<div class="hc-row"><div><div class="hc-name">' + esc(p.name) + '</div><div class="hc-price">' + esc(p.tag || "Bestseller") + "</div></div>" +
          '<button class="bagbtn" data-add="' + esc(p.slug) + '" aria-label="Add to bag">' + SVG.bag + "</button></div>";
      }
    });
  }

  /* ---------- page: shop ---------- */
  function renderShop() {
    var g = document.getElementById("shop-grid");
    if (!g) return;
    var params = new URLSearchParams(location.search);
    var q = (params.get("q") || "").toLowerCase();
    var initCat = params.get("cat") || "all";
    var pills = document.querySelectorAll(".pill[data-filter]");
    var state = { cat: initCat, q: q };
    pills.forEach(function (b) { b.classList.toggle("active", b.dataset.filter === state.cat); });
    var qi = document.getElementById("shop-q");
    if (qi && q) qi.value = params.get("q");
    function draw() {
      catalog().then(function (list) {
        var out = list.filter(function (p) {
          if (state.cat !== "all" && p.cat !== state.cat) return false;
          if (state.q && (p.name + " " + p.blurb + " " + p.cat).toLowerCase().indexOf(state.q) === -1) return false;
          return true;
        });
        g.innerHTML = out.length ? out.map(cardHTML).join("")
          : '<div class="empty" style="grid-column:1/-1"><div class="eimg">\uD83D\uDD0D</div><h2>Nothing found</h2><p>Try a different search.</p></div>';
        var c = document.getElementById("shop-count");
        if (c) c.textContent = out.length + (out.length === 1 ? " product" : " products");
      });
    }
    pills.forEach(function (b) {
      b.addEventListener("click", function () {
        pills.forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); state.cat = b.dataset.filter; draw();
      });
    });
    if (qi) qi.addEventListener("input", function () { state.q = qi.value.trim().toLowerCase(); draw(); });
    draw();
  }

  /* ---------- page: product ---------- */
  function renderProduct() {
    var slug = document.body.dataset.slug;
    var box = document.getElementById("product-detail");
    if (!box) return;
    bySlug(slug).then(function (p) {
      if (!p) { box.innerHTML = '<div class="empty"><div class="eimg">?</div><h2>Not found</h2><p>This product does not exist.</p><a class="btn" href="/shop">Back to shop</a></div>'; return; }
      document.title = p.name + " \u2014 SPTB.";
      var det = p.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("");
      var multiSize = p.sizes.length > 1 && !(p.sizes.length === 1 && p.sizes[0] === "One size");
      var singleSize = p.sizes.length === 1;
      var gal = p.img
        ? '<div class="gmain"><img id="g-main" src="' + esc(p.img) + '" alt="' + esc(p.name) + '">' + pricePill(p) + "</div>" +
          '<div class="gthumbs"><button class="on" data-v="0"><img src="' + esc(p.img) + '" alt=""></button>' +
          '<button class="z1" data-v="1"><img src="' + esc(p.img) + '" alt=""></button>' +
          '<button class="z2" data-v="2"><img src="' + esc(p.img) + '" alt=""></button></div>'
        : '<div class="gmain tile" style="--g:' + esc(p.grad || "#999") + '"><span class="tletter">' + esc(p.letter || "?") + "</span>" + pricePill(p) + "</div>";
      var revs = SAMPLE_REVIEWS.map(function (r) {
        return '<div class="rev"><div class="rhead"><div class="ravatar">' + esc(r.n[0]) + '</div><div><div class="rname">' + esc(r.n) + '</div><div class="rdate">' + esc(r.d) + '</div></div></div>' +
          '<div>' + stars(5) + '</div><p>' + esc(r.t) + "</p></div>";
      }).join("");
      box.innerHTML =
        '<div class="pgrid"><div class="gallery">' + gal + "</div>" +
        '<div class="pinfo">' +
        (p.tag ? '<div class="ptagline">' + esc(p.tag) + "</div>" : "") +
        "<h1>" + esc(p.name) + "</h1>" +
        '<div class="prate">' + stars(p.rating) + "<span><b>" + p.rating.toFixed(1) + "</b> \u00b7 " + p.reviews + " reviews</span></div>" +
        '<div class="pbuy"><span class="now">' + money(p.price) + "</span>" +
        (p.compareAt > p.price ? "<s>" + money(p.compareAt) + "</s>" + '<span class="save">Save ' + Math.round((1 - p.price / p.compareAt) * 100) + "%</span>" : "") + "</div>" +
        "<p style='color:var(--muted);font-size:15.5px;margin-bottom:22px'>" + esc(p.blurb) + "</p>" +
        (multiSize ? '<div class="optlabel">Size <span id="size-name"></span></div><div class="sizepills" id="size-pills">' +
          p.sizes.map(function (s, i) { return '<button data-s="' + esc(s) + '"' + (i === 0 ? ' class="on"' : "") + ">" + esc(s) + "</button>"; }).join("") + "</div>" : "") +
        '<div class="qtyrow"><div class="qty"><button id="q-minus" aria-label="Less">\u2212</button><span id="q-val">1</span><button id="q-plus" aria-label="More">+</button></div>' +
        '<button class="btn" id="add-btn">Add to Bag</button>' +
        '<button class="icon-act' + (isWished(p.slug) ? " loved" : "") + '" data-wish="' + esc(p.slug) + '" aria-label="Save" style="width:52px;height:52px">' + SVG.heart + "</button></div>" +
        '<button class="btn btn-light btn-full" id="buy-btn">Buy Now</button>' +
        '<div class="shiprows">' +
        '<div class="shiprow"><div class="ic">' + SVG.truck + '</div><div><b>Free shipping over $50</b><span>2\u20137 business days, tracked</span></div></div>' +
        '<div class="shiprow"><div class="ic">' + SVG.ret + '</div><div><b>30-day returns</b><span>No questions asked</span></div></div>' +
        '<div class="shiprow"><div class="ic">' + SVG.shield + '</div><div><b>Secure checkout</b><span>Encrypted & protected</span></div></div>' +
        "</div></div></div>" +
        '<div class="pgrid2"><div class="card"><h3>Details</h3><p style="color:var(--muted);font-size:15px">' + esc(p.blurb) + '</p><ul class="dlist">' + det + '</ul></div>' +
        '<div class="card"><h3>Reviews <span style="color:var(--muted);font-weight:600;font-size:15px">(' + p.reviews + ")</span></h3>" + revs + "</div></div>" +
        '<div class="stickybuy" id="stickybuy"><span class="sp">' + (p.compareAt > p.price ? "<s>" + money(p.compareAt) + "</s>" : "") + money(p.price) + '</span><button id="sticky-add">Add to Bag</button></div>';
      var qty = 1, size = multiSize ? p.sizes[0] : p.sizes[0];
      var qv = document.getElementById("q-val");
      function setQ(v) { qty = Math.max(1, Math.min(9, v)); qv.textContent = qty; }
      document.getElementById("q-minus").addEventListener("click", function () { setQ(qty - 1); });
      document.getElementById("q-plus").addEventListener("click", function () { setQ(qty + 1); });
      var pills = box.querySelectorAll("#size-pills button");
      pills.forEach(function (b) {
        b.addEventListener("click", function () {
          pills.forEach(function (x) { x.classList.remove("on"); });
          b.classList.add("on"); size = b.dataset.s;
          var sn = document.getElementById("size-name"); if (sn) sn.textContent = size;
        });
      });
      function doAdd(go) {
        addToBag(p.slug, size, qty);
        toast(p.name + " (" + size + ") added to bag");
        if (go) location.href = "/checkout";
      }
      document.getElementById("add-btn").addEventListener("click", function () { doAdd(false); });
      document.getElementById("buy-btn").addEventListener("click", function () { doAdd(true); });
      document.getElementById("sticky-add").addEventListener("click", function () { doAdd(false); });
      var sb = document.getElementById("stickybuy");
      window.addEventListener("scroll", function () {
        sb.classList.toggle("on", window.scrollY > 520);
      }, { passive: true });
      var thumbs = box.querySelectorAll(".gthumbs button");
      var main = document.getElementById("g-main");
      thumbs.forEach(function (t) {
        t.addEventListener("click", function () {
          thumbs.forEach(function (x) { x.classList.remove("on"); });
          t.classList.add("on");
          if (main) { main.style.transform = "scale(1)"; }
          var gm = box.querySelector(".gmain");
          gm.classList.remove("zv1", "zv2");
          if (t.dataset.v === "1" || t.dataset.v === "2") {
            main.style.transition = "transform .3s";
            main.style.transformOrigin = t.dataset.v === "1" ? "30% 25%" : "70% 70%";
            main.style.transform = "scale(1.9)";
          } else { main.style.transform = "scale(1)"; }
        });
      });
      var rel = document.getElementById("related-grid");
      if (rel) catalog().then(function (list) {
        rel.innerHTML = list.filter(function (x) { return x.slug !== p.slug; }).slice(0, 4).map(cardHTML).join("");
      });
    });
  }

  /* ---------- coupon widget (cart + checkout) ---------- */
  function couponWidgetHTML() {
    var cp = getCoupon();
    if (cp) {
      var lbl = cp.type === "percent" ? cp.value + "% off" : money(cp.value) + " off";
      return '<div class="applied"><span>\u2713 ' + esc(cp.code) + " \u00b7 " + esc(lbl) + '</span><button id="cp-remove" aria-label="Remove coupon">&times;</button></div><div class="coupon-msg" id="cp-msg"></div>';
    }
    return '<div class="coupon"><input id="cp-input" placeholder="Coupon code" autocomplete="off"><button id="cp-apply" type="button">Apply</button></div><div class="coupon-msg" id="cp-msg"></div>';
  }
  function bindCouponWidget(onChange) {
    var apply = document.getElementById("cp-apply"), input = document.getElementById("cp-input"), rm = document.getElementById("cp-remove");
    function msg(t, ok) { var m = document.getElementById("cp-msg"); if (m) { m.textContent = t; m.className = "coupon-msg " + (ok ? "ok" : "bad"); } }
    if (apply) apply.addEventListener("click", function () {
      var code = input.value;
      msg("Checking\u2026", true);
      linesWithProducts().then(function (lines) {
        var sub = cartSubtotalSync(lines);
        return validateCoupon(code, sub);
      }).then(function (r) {
        if (r.ok) { setCoupon(r.coupon); msg("Applied!", true); onChange(); }
        else msg(r.msg, false);
      });
    });
    if (rm) rm.addEventListener("click", function () { setCoupon(null); onChange(); });
  }

  /* ---------- page: cart ---------- */
  function renderCart() {
    var itemsBox = document.getElementById("cart-items");
    if (!itemsBox) return;
    function draw() {
      linesWithProducts().then(function (lines) {
        return settings().then(function (st) {
          if (!lines.length) {
            itemsBox.innerHTML = '<div class="empty"><div class="eimg">\uD83D\uDECD\uFE0F</div><h2>Your bag is empty.</h2><p>Beautiful essentials are waiting.</p><a class="btn" href="/shop">Start shopping</a></div>';
            var sw = document.getElementById("cart-summary-wrap");
            if (sw) sw.style.display = "none";
            return;
          }
          itemsBox.innerHTML = lines.map(function (l) {
            var img = l.p.img
              ? '<img class="cimg" src="' + esc(l.p.img) + '" alt="' + esc(l.p.name) + '">'
              : '<div class="cimg tile" style="--g:' + esc(l.p.grad || "#999") + '">' + esc(l.p.letter || "?") + "</div>";
            return '<div class="cline">' + img +
              '<div class="cinfo"><div class="pname">' + esc(l.p.name) + '</div><div class="psize">Size: ' + esc(l.size) + " \u00b7 " + money(l.p.price) + ' each</div><button class="prm" data-rm="' + esc(l.slug) + "|" + esc(l.size) + '">Remove</button></div>' +
              '<div class="cqty"><button data-dec="' + esc(l.slug) + "|" + esc(l.size) + '">\u2212</button><span>' + l.qty + '</span><button data-inc="' + esc(l.slug) + "|" + esc(l.size) + '">+</button></div>' +
              '<div class="ltotal">' + money(l.p.price * l.qty) + "</div></div>";
          }).join("");
          itemsBox.querySelectorAll("[data-inc],[data-dec],[data-rm]").forEach(function (b) {
            b.addEventListener("click", function () {
              var parts = (b.dataset.inc || b.dataset.dec || b.dataset.rm).split("|");
              var slug = parts[0], size = parts.slice(1).join("|");
              var cur = getCart().filter(function (l) { return l.slug === slug && l.size === size; })[0];
              var q = cur ? cur.qty : 0;
              if (b.dataset.inc) setQty(slug, size, Math.min(9, q + 1));
              else if (b.dataset.dec) setQty(slug, size, q - 1);
              else removeLine(slug, size);
              draw();
            });
          });
          var sub = cartSubtotalSync(lines);
          var cp = getCoupon();
          var disc = couponDiscount(sub, cp);
          var ship = sub - disc >= st.freeShip || sub === 0 ? 0 : st.shipCost;
          if (sub - disc <= 0) ship = 0;
          var sw = document.getElementById("cart-summary-wrap");
          sw.style.display = "";
          sw.innerHTML =
            '<div class="summary"><div id="cp-zone">' + couponWidgetHTML() + "</div>" +
            '<div class="sum-row"><span>Subtotal</span><span>' + money(sub) + "</span></div>" +
            (disc > 0 ? '<div class="sum-row"><span>Coupon (' + esc(cp.code) + ')</span><span class="disc">\u2212' + money(disc) + "</span></div>" : "") +
            '<div class="sum-row"><span>Shipping</span><span>' + (ship === 0 ? "Free" : money(ship)) + "</span></div>" +
            '<div class="sum-row total"><span>Total</span><span>' + money(sub - disc + ship) + "</span></div>" +
            '<a class="btn btn-full" href="/checkout" style="margin-top:16px">Check out</a>' +
            '<p class="sum-note">' + (ship === 0 ? "Your order ships free." : "Add " + money(st.freeShip - (sub - disc)) + " more for free shipping.") + "</p></div>";
          bindCouponWidget(draw);
        });
      });
    }
    draw();
  }

  /* ---------- page: checkout ---------- */
  function renderCheckout() {
    var box = document.getElementById("co-items");
    if (!box) return;
    function draw() {
      linesWithProducts().then(function (lines) {
        return settings().then(function (st) {
          if (!lines.length) {
            box.innerHTML = '<div class="empty"><div class="eimg">\uD83D\uDECD\uFE0F</div><h2>Your bag is empty.</h2><p>Add something before checking out.</p><a class="btn" href="/shop">Back to shop</a></div>';
            document.getElementById("co-form-wrap").style.display = "none";
            return;
          }
          box.innerHTML = lines.map(function (l) {
            return '<div class="sum-row"><span>' + esc(l.p.name) + ' <span style="color:var(--faint)">' + esc(l.size) + "</span> \u00d7 " + l.qty + "</span><span>" + money(l.p.price * l.qty) + "</span></div>";
          }).join("");
          var cz = document.getElementById("cp-zone-checkout");
          if (cz) cz.innerHTML = couponWidgetHTML();
          bindCouponWidget(draw);
          var sub = cartSubtotalSync(lines);
          var cp = getCoupon(), disc = couponDiscount(sub, cp);
          var ship = sub - disc >= st.freeShip ? 0 : st.shipCost;
          document.getElementById("co-sub").textContent = money(sub);
          var dr = document.getElementById("co-disc-row");
          if (disc > 0) { dr.style.display = ""; document.getElementById("co-disc").textContent = "\u2212" + money(disc) + " (" + cp.code + ")"; }
          else dr.style.display = "none";
          document.getElementById("co-ship").textContent = ship === 0 ? "Free" : money(ship);
          document.getElementById("co-total").textContent = money(sub - disc + ship);
        });
      });
    }
    draw();

    var form = document.getElementById("checkout-form");
    function showErr(m) { var e = document.getElementById("co-err"); e.textContent = m; e.classList.add("show"); }
    function need(id) { var el = document.getElementById(id); return el && el.value.trim() ? el.value.trim() : null; }
    function ready(user) {
      var wall = document.getElementById("auth-wall");
      if (!user) { wall.style.display = ""; form.style.display = "none"; return; }
      wall.style.display = "none"; form.style.display = "";
      var em = document.getElementById("co-email");
      if (user.email && !em.value) em.value = user.email;
      if (form.dataset.bound) return;
      form.dataset.bound = "1";
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var email = need("co-email"), name = need("co-name"), country = need("co-country"),
          address = need("co-address"), city = need("co-city"), zip = need("co-zip"),
          card = need("co-card"), exp = need("co-exp"), cvc = need("co-cvc");
        if (!email || !name || !country || !address || !city || !zip || !card || !exp || !cvc) { showErr("Please fill in every field."); return; }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showErr("That email doesn't look right."); return; }
        var btn = document.getElementById("place-order");
        btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Placing order\u2026';
        Promise.all([linesWithProducts(), settings(), fbReady()]).then(function (r) {
          var lines = r[0], st = r[1], fb = r[2];
          if (!fb) throw new Error("offline");
          var items = lines.map(function (l) { return { slug: l.p.slug, name: l.p.name, price: l.p.price, qty: l.qty, size: l.size }; });
          var sub = cartSubtotalSync(lines);
          var cp = getCoupon(), disc = couponDiscount(sub, cp);
          var ship = sub - disc >= st.freeShip ? 0 : st.shipCost;
          var orderId = "SPTB-" + Math.random().toString(36).slice(2, 8).toUpperCase();
          var order = {
            orderId: orderId, uid: user.uid, email: email, items: items,
            subtotal: sub, discount: disc, couponCode: cp ? cp.code : null,
            shipping: ship, total: sub - disc + ship,
            name: name, address: address, city: city, zip: zip, country: country,
            status: "placed", createdAt: fb.serverTimestamp()
          };
          return fb.addDoc(fb.collection(fb.db, "orders"), order).then(function () {
            if (cp) {
              fb.updateDoc(fb.doc(fb.db, "coupons", cp.code), { usedCount: fb.increment(1) }).catch(function () {});
            }
            try {
              var snap = Object.assign({}, order, { createdAt: new Date().toISOString() });
              localStorage.setItem("sptb_last_order", JSON.stringify(snap));
            } catch (e) {}
            setCart([]); setCoupon(null);
            location.href = "/success?oid=" + orderId;
          });
        }).catch(function (err) {
          console.error(err);
          showErr("Couldn't place your order. Check your connection and try again.");
          btn.disabled = false; btn.textContent = "Place order";
        });
      });
    }
    if (window.SPTB_FB && window.SPTB_FB.auth.currentUser !== undefined) {
      ready(window.SPTB_FB.auth.currentUser);
      window.SPTB_FB.onAuthStateChanged(window.SPTB_FB.auth, ready);
    } else {
      document.addEventListener("sptb-auth", function (e) { ready(e.detail); });
    }
  }

  /* ---------- page: wishlist ---------- */
  function renderWishlist() {
    var g = document.getElementById("wish-grid");
    if (!g) return;
    catalog().then(function (list) {
      var w = getWish();
      var items = list.filter(function (p) { return w.indexOf(p.slug) !== -1; });
      g.innerHTML = items.length ? items.map(cardHTML).join("")
        : '<div class="empty" style="grid-column:1/-1"><div class="eimg">\u2661</div><h2>Nothing saved yet.</h2><p>Tap the heart on any product to save it here.</p><a class="btn" href="/shop">Discover products</a></div>';
    });
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    mountLayout();
    var page = document.body.dataset.page;
    if (page === "home") renderHome();
    else if (page === "shop") renderShop();
    else if (page === "product") renderProduct();
    else if (page === "cart") renderCart();
    else if (page === "checkout") renderCheckout();
    else if (page === "wishlist") renderWishlist();
  });

  window.SPTB = {
    money: money, esc: esc, stars: stars, cardHTML: cardHTML, tileHTML: tileHTML,
    catalog: catalog, bySlug: bySlug, settings: settings, fbReady: fbReady,
    getCart: getCart, setCart: setCart, addToBag: addToBag,
    getCoupon: getCoupon, setCoupon: setCoupon, validateCoupon: validateCoupon, couponDiscount: couponDiscount,
    getWish: getWish, isWished: isWished, toggleWish: toggleWish,
    toast: toast, SVG: SVG, SAMPLE_REVIEWS: SAMPLE_REVIEWS
  };
})();
