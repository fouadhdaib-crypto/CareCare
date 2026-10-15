/* CarCare — dependency-free interactive front-end. All orders are local demos. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cash = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  const escape = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  // Sample accounts for this front-end demo only.
  const demoUsers = [
    { id: 1, name: "Demo User", email: "user@carcare.com", password: "123", role: "user" },
    { id: 2, name: "Demo Admin", email: "admin@carcare.com", password: "123", role: "admin" },
    { id: 3, name: "Demo Supplier", email: "supplier@carcare.com", password: "123", role: "supplier" },
  ];
  const rolePages = {
    user: "index.html",
    admin: "admin-overview.html",
    supplier: "supplier-overview.html",
  };
  const products = [
    {
      id: "BC1324",
      name: "Bosch QuietCast brake pads",
      detail: "Front axle · Ceramic pad set",
      cat: "Brakes",
      price: 48.99,
      rating: 4.8,
      supplier: "AutoParts Direct",
      stock: 42,
    },
    {
      id: "CF11819",
      name: "Cabin air filter",
      detail: "Activated carbon · Cabin filter",
      cat: "Filters",
      price: 19.99,
      rating: 4.7,
      supplier: "AutoParts Direct",
      stock: 86,
    },
    {
      id: "0W-20",
      name: "Mobil 1 full synthetic oil",
      detail: "0W-20 · 5 quart",
      cat: "Fluids",
      price: 29.99,
      rating: 4.9,
      supplier: "MotorHub",
      stock: 64,
    },
    {
      id: "DXE22",
      name: "NGK iridium spark plugs",
      detail: "Iridium · Set of 4",
      cat: "Ignition",
      price: 39.99,
      rating: 4.8,
      supplier: "Prime Auto",
      stock: 28,
    },
    {
      id: "W24-18",
      name: "All-season wiper blades",
      detail: "24 + 18 inch · Pair",
      cat: "Filters",
      price: 24.99,
      rating: 4.5,
      supplier: "AutoParts Direct",
      stock: 4,
    },
    {
      id: "DOT4",
      name: "Brake fluid DOT 4",
      detail: "DOT 4 · 1 liter",
      cat: "Fluids",
      price: 14.5,
      rating: 4.6,
      supplier: "MotorHub",
      stock: 51,
    },
  ];
  const offers = [
    { supplier: "MotorHub", price: 51.5, shipping: 0, days: 3, rating: 4.7 },
    {
      supplier: "AutoParts Direct",
      price: 48.99,
      shipping: 5.99,
      days: 2,
      rating: 4.8,
    },
    {
      supplier: "Prime Auto",
      price: 46.99,
      shipping: 8.99,
      days: 4,
      rating: 4.6,
    },
  ];
  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem("carcare." + key)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  let storageFailed = false;
  const write = (key, value) => {
    try {
      localStorage.setItem("carcare." + key, JSON.stringify(value));
    } catch {
      if (!storageFailed) {
        storageFailed = true;
        notify(
          "Browser storage is unavailable. Changes last only for this page.",
        );
      }
    }
  };
  let cart = read("cart", []);
  if (!Array.isArray(cart)) cart = [];
  cart = cart.filter(
    (x) =>
      products.some((p) => p.id === x.id) &&
      Number.isInteger(x.qty) &&
      x.qty > 0 &&
      x.qty <= 99 &&
      Number.isFinite(x.price) &&
      x.price >= 0 &&
      Number.isFinite(x.shipping) &&
      x.shipping >= 0 &&
      typeof x.supplier === "string",
  );
  let toast = $("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }
  let timer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("show"), 3300);
  }
  const art = (p) =>
    `<img src="assets/${p.cat.toLowerCase()}.svg" alt="${escape(p.cat)} illustration" loading="lazy" width="270" height="190">`;
  function badges() {
    const count = cart.reduce((n, p) => n + p.qty, 0);
    $$(".actions .badge").forEach((el) => (el.textContent = count));
  }
  function persist() {
    write("cart", cart);
    badges();
  }
  function add(id, qty = 1, offer) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const supplier = offer?.supplier || p.supplier,
      price = offer?.price ?? p.price,
      shipping = offer?.shipping ?? (supplier === "MotorHub" ? 0 : 5.99);
    const old = cart.find((x) => x.id === id && x.supplier === supplier);
    const current = cart
      .filter((x) => x.id === id)
      .reduce((s, x) => s + x.qty, 0);
    if (current + qty > p.stock)
      return notify(`Only ${p.stock} units available in this demo catalog.`);
    if (old) old.qty += qty;
    else cart.push({ id, qty, supplier, price, shipping });
    persist();
    notify(`${p.name} added to your cart.`);
  }
  function totals(items = cart) {
    let subtotal =
      Math.round(items.reduce((s, x) => s + x.price * x.qty, 0) * 100) / 100;
    const groups = {};
    items.forEach(
      (x) =>
        (groups[x.supplier] = Math.max(groups[x.supplier] || 0, x.shipping)),
    );
    const shipping = Object.values(groups).reduce((a, b) => a + b, 0),
      tax = Math.round(subtotal * 0.08 * 100) / 100;
    return { subtotal, shipping, tax, total: subtotal + shipping + tax };
  }
  function summary(items = cart) {
    const t = totals(items);
    return `<dl class="kv"><dt>Subtotal</dt><dd>${cash(t.subtotal)}</dd><dt>Delivery</dt><dd>${cash(t.shipping)}</dd><dt>Demo tax (8%)</dt><dd>${cash(t.tax)}</dd><dt>Total (USD)</dt><dd><b>${cash(t.total)}</b></dd></dl>`;
  }
  function card(p) {
    return `<article class="card product"><a class="thumb" href="product-details.html?id=${p.id}" aria-label="View ${escape(p.name)}">${art(p)}</a><div class="body"><p class="note">${p.cat.toUpperCase()} <span aria-label="Rating"> · ★ ${p.rating}</span></p><h3><a href="product-details.html?id=${p.id}">${p.name}</a></h3><p class="meta">${p.id} · ${p.detail}</p><p class="price">${cash(p.price)}</p><p class="meta">${p.supplier}</p><span class="tag ${p.stock < 10 ? "low" : ""}">${p.stock < 10 ? "Only " + p.stock + " left" : "In stock"}</span><button class="btn btn-blue" data-add="${p.id}">Add to cart <span aria-hidden="true">+</span></button></div></article>`;
  }
  const path = location.pathname.split("/").pop() || "index.html",
    params = new URLSearchParams(location.search),
    main = $("#main");
  function page(title, subtitle, content) {
    main.innerHTML = `<div class="page"><div class="wrap"><p class="crumb"><a href="index.html">Home</a> / ${title}</p><p class="label">CARCARE / EVERY MILE</p><h1 class="ph">${title}</h1><p class="lead dark">${subtitle}</p>${content}</div></div>`;
  }
  const menu = $("#menuBtn"),
    nav = $("#nav");
  function setMenu(open) {
    nav?.classList.toggle("open", open);
    menu?.setAttribute("aria-expanded", String(open));
    menu?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menu?.setAttribute("aria-controls", "nav");
  menu?.addEventListener("click", () =>
    setMenu(!nav.classList.contains("open")),
  );
  nav?.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });
  addEventListener("resize", () => {
    if (innerWidth > 860) setMenu(false);
  });
  $$(".nav a").forEach((a) => {
    if (a.getAttribute("href") === path) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });
  const progress = document.createElement("div");
  progress.className = "progress-line";
  document.body.append(progress);
  addEventListener(
    "scroll",
    () => {
      $(".site-header")?.classList.toggle("scrolled", scrollY > 8);
      progress.style.width =
        (scrollY /
          Math.max(1, document.documentElement.scrollHeight - innerHeight)) *
          100 +
        "%";
    },
    { passive: true },
  );
  $("#cartBtn")?.addEventListener("click", () => (location.href = "cart.html"));
  function renderOffers(target, sort = "total") {
    const list = [...offers].sort((a, b) =>
      sort === "date"
        ? a.days - b.days
        : sort === "price"
          ? a.price - b.price
          : a.price + a.shipping - (b.price + b.shipping),
    );
    target.innerHTML = list
      .map(
        (o) =>
          `<article class="card offer ${o.supplier === "MotorHub" ? "best" : ""}"><span class="tag">${o.supplier === "MotorHub" ? "Lowest total" : o.days === 2 ? "Fastest delivery" : "Lowest part price"}</span><h3 style="margin-top:18px">${o.supplier}</h3><p class="meta">★ ${o.rating} · Demo supplier</p><dl><dt>Part price</dt><dd>${cash(o.price)}</dd><dt>Delivery</dt><dd>${cash(o.shipping)}</dd><dt>Total before tax</dt><dd class="total">${cash(o.price + o.shipping)}</dd></dl><p class="note">Illustrative delivery: ${o.days}–${o.days + 1} business days</p><button class="btn btn-blue" data-offer="${o.supplier}">Add this offer ↗</button></article>`,
      )
      .join("");
  }
  if (path === "index.html") {
    let category = "all";
    const query = $("#partQuery"),
      vehicle = $("#vehicle");
    const saved = read("vehicle", vehicle.value);
    if ([...vehicle.options].some((o) => o.value === saved))
      vehicle.value = saved;
    function render() {
      const q = query.value.toLowerCase().trim(),
        list = products.filter(
          (p) =>
            (category === "all" || p.cat === category) &&
            (!q || `${p.name} ${p.id} ${p.cat}`.toLowerCase().includes(q)),
        );
      $("#productGrid").innerHTML =
        list.map(card).join("") ||
        '<div class="empty">No parts found. Try another part name or category.</div>';
      $("#resultCount").textContent =
        `${list.length} demo parts · Check manufacturer fitment for your ${vehicle.value}`;
    }
    query.addEventListener("input", render);
    vehicle.addEventListener("change", () => {
      write("vehicle", vehicle.value);
      render();
    });
    $("#finder").addEventListener("submit", (e) => {
      e.preventDefault();
      render();
      $("#parts").scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
    $("#chips").addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      category = b.dataset.cat;
      $$("#chips button").forEach((x) => {
        x.classList.toggle("active", x === b);
        x.setAttribute("aria-pressed", x === b);
      });
      render();
    });
    render();
    renderOffers($("#offers"));
    $("#sortBtns").addEventListener("click", (e) => {
      const b = e.target.closest("[data-sort]");
      if (b) {
        $$("#sortBtns button").forEach((x) => {
          x.classList.toggle("active", x === b);
          x.setAttribute("aria-pressed", x === b);
        });
        renderOffers($("#offers"), b.dataset.sort);
      }
    });
    let miles = Number(read("miles", 68240));
    if (!Number.isFinite(miles)) miles = 68240;
    $("#miles").textContent = miles.toLocaleString();
    $("#mileageBtn").addEventListener("click", () => {
      miles += 100;
      write("miles", miles);
      $("#miles").textContent = miles.toLocaleString();
      notify("Mileage saved on this device.");
    });
    $("#garage h3").textContent = "Your demo garage";
    $("#garage .list").innerHTML =
      "<li><strong>Oil change</strong><br>Demo reminder at 70,000 miles.</li><li><strong>Cabin filter</strong><br>Review your filter at the next service.</li><li><strong>Brake inspection</strong><br>Follow the service schedule for your vehicle.</li>";
    const form = $("#contactForm");
    ["name", "email", "message"].forEach((id) => ($("#" + id).required = true));
    $("#message").minLength = 10;
    form.removeAttribute("novalidate");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      $("#formStatus").textContent =
        "Your message passed validation. This demo does not send messages.";
      $("#formStatus").className = "status ok";
    });
    form.addEventListener("reset", () => {
      $("#formStatus").textContent = "";
    });
  }
  if (["marketplace.html", "search-results.html"].includes(path)) {
    page(
      "Find your next part.",
      "Everyday essentials. Clear prices. A little more confidence.",
      `<form id="catalogSearch" class="card form"><div class="fgrid"><div class="field"><label for="q">Part name or number</label><input id="q" type="search" placeholder="Try brake pads or BC1324" value="${escape(params.get("q") || "")}"></div><div class="field"><label for="v">Your vehicle</label><select id="v"><option>2018 Honda Civic EX</option><option>2020 Toyota Corolla LE</option><option>2017 Ford Focus SE</option></select></div></div><button class="btn btn-blue">Search parts ↗</button></form><p class="note">Illustrative catalog. Vehicle selection is saved; compatibility must be verified with the manufacturer.</p><div class="catalog-layout"><aside class="card filter-panel"><h3>Refine your search</h3><label for="category">Category</label><select id="category"><option value="all">All categories</option>${["Brakes", "Filters", "Fluids", "Ignition"].map((c) => `<option>${c}</option>`).join("")}</select><label for="maxPrice">Maximum price: <output id="priceLabel">$100</output></label><input id="maxPrice" type="range" min="10" max="100" value="100" step="5"><label class="inline"><input id="freeShipping" type="checkbox"> Free delivery only</label><button class="btn btn-ghost-dark" id="clearFilters">Reset filters</button></aside><section aria-label="Search results"><div class="catalog-toolbar"><p id="catalogCount" role="status"></p><label><span class="note">Sort by</span><select id="sort"><option value="recommended">Recommended</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Top rated</option></select></label></div><div class="grid catalog-grid" id="catalogGrid"></div></section></div>`,
    );
    const v = $("#v"),
      saved = read("vehicle", v.value);
    if ([...v.options].some((x) => x.value === saved)) v.value = saved;
    v.addEventListener("change", () => write("vehicle", v.value));
    function render() {
      const q = $("#q").value.trim().toLowerCase(),
        cat = $("#category").value;
      let list = products.filter(
        (p) =>
          (cat === "all" || p.cat === cat) &&
          p.price <= +$("#maxPrice").value &&
          (!$("#freeShipping").checked || p.supplier === "MotorHub") &&
          (!q || `${p.name} ${p.id} ${p.cat}`.toLowerCase().includes(q)),
      );
      const sort = $("#sort").value;
      if (sort === "low") list.sort((a, b) => a.price - b.price);
      if (sort === "high") list.sort((a, b) => b.price - a.price);
      if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
      $("#priceLabel").textContent = cash(+$("#maxPrice").value);
      $("#catalogCount").textContent = `${list.length} matching parts`;
      $("#catalogGrid").innerHTML =
        list.map(card).join("") ||
        '<div class="empty"><h2>No matches yet.</h2><p>Try a broader search or reset your filters.</p></div>';
    }
    ["q", "category", "maxPrice", "freeShipping", "sort"].forEach((id) =>
      $("#" + id).addEventListener("input", render),
    );
    $("#catalogSearch").addEventListener("submit", (e) => {
      e.preventDefault();
      render();
    });
    $("#clearFilters").addEventListener("click", () => {
      $("#q").value = "";
      $("#category").value = "all";
      $("#maxPrice").value = 100;
      $("#freeShipping").checked = false;
      $("#sort").value = "recommended";
      render();
    });
    render();
  }
  if (path === "product-details.html") {
    const p = products.find((x) => x.id === params.get("id")) || products[0];
    page(
      p.name,
      `${p.cat} / ${p.id}`,
      `<div class="two"><div class="detail-visual"><div class="thumb">${art(p)}</div><p class="note">Product illustration · Packaging may differ.</p></div><article class="card detail-card"><span class="tag">${p.stock} available in demo catalog</span><h2>${p.name}</h2><p>${p.detail}</p><p class="meta">★ ${p.rating} · ${p.supplier}</p><p class="price">${cash(p.price)}</p><p class="note">Verify the part number and exact vehicle compatibility before purchase.</p><label for="detailQty">Quantity</label><input id="detailQty" type="number" min="1" max="${p.stock}" value="1"><button style="margin-top:18px" class="btn btn-blue" id="detailAdd">Add to cart +</button><a class="btn btn-ghost-dark" href="cart.html">View cart</a></article></div><article class="card"><h3>Before installation</h3><p>Check the manufacturer's specifications and service manual for your exact vehicle, engine and trim. Prices and inventory shown here are demonstration data.</p></article>${p.id === "BC1324" ? '<h2>Same part. Your choice of supplier.</h2><div class="grid g3" id="detailOffers"></div>' : ""}<h2>Keep your next service simple.</h2><div class="grid g4">${products
        .filter((x) => x.id !== p.id)
        .slice(0, 4)
        .map(card)
        .join("")}</div>`,
    );
    $("#detailAdd").addEventListener("click", () => {
      if ($("#detailQty").reportValidity()) add(p.id, +$("#detailQty").value);
    });
    if ($("#detailOffers")) renderOffers($("#detailOffers"));
  }
  function cartPage() {
    page(
      "Your cart.",
      "A few good parts. A better next mile.",
      `<p class="step-label">01 CART → 02 DEMO CHECKOUT → 03 CONFIRMATION</p>${
        cart.length
          ? `<div class="two"><section aria-label="Cart items">${cart
              .map((x, i) => {
                const p = products.find((p) => p.id === x.id);
                return `<article class="card cart-line">${art(p)}<div><h3>${p.name}</h3><p class="meta">${escape(x.supplier)} · ${cash(x.price)} each</p><div class="quantity"><button data-change="${i}" data-delta="-1" aria-label="Decrease ${p.name} quantity" ${x.qty === 1 ? "disabled" : ""}>−</button><output aria-label="Quantity">${x.qty}</output><button data-change="${i}" data-delta="1" aria-label="Increase ${p.name} quantity">+</button><button class="remove" data-remove="${i}">Remove</button></div></div><strong>${cash(x.price * x.qty)}</strong></article>`;
              })
              .join(
                "",
              )}<a href="marketplace.html" class="btn btn-ghost-dark">← Continue shopping</a></section><aside class="card summary"><h3>Order summary</h3>${summary()}<p class="note">Delivery charged once per supplier. Tax is illustrative.</p><a class="btn btn-blue" href="checkout.html">Continue to demo checkout ↗</a><p class="note">No payment will be taken.</p></aside></div>`
          : '<div class="empty"><h2>A fresh start for your next service.</h2><p>Your cart is empty. Find something your car will love.</p><a class="btn btn-blue" href="marketplace.html">Explore the marketplace ↗</a></div>'
      }`,
    );
  }
  if (path === "cart.html") cartPage();
  if (path === "checkout.html") {
    page(
      "One last check.",
      "A preview of the checkout experience. No payment or personal details needed.",
      cart.length
        ? `<div class="two demo-checkout"><form class="card form" id="demoOrder"><span class="tag">DEMO CHECKOUT</span><h2>Ready for the next mile?</h2><p>This creates a sample order saved on this device. It does not purchase products or contact suppliers.</p><label class="inline"><input type="checkbox" required> I understand this is a demonstration.</label><button class="btn btn-blue">Create demo order · ${cash(totals().total)}</button><a href="cart.html">← Edit your cart</a></form><aside class="card"><h3>Your order</h3>${cart.map((x) => `<p>${products.find((p) => p.id === x.id).name} × ${x.qty}</p>`).join("")}${summary()}</aside></div>`
        : '<div class="empty"><h2>Your cart is empty.</h2><a class="btn btn-blue" href="marketplace.html">Find parts first</a></div>',
    );
    $("#demoOrder")?.addEventListener("submit", (e) => {
      e.preventDefault();
      write("order", {
        id: "CC-" + Date.now().toString().slice(-8),
        items: cart,
        date: new Date().toISOString(),
      });
      cart = [];
      persist();
      location.href = "order-confirmation.html";
    });
  }
  if (path === "order-confirmation.html") {
    const order = read("order", null);
    page(
      order ? "Your next mile, planned." : "No demo order yet.",
      order
        ? "Your sample order is saved on this device. No purchase was made."
        : "Start with the marketplace to try the shopping experience.",
      order
        ? `<div class="card narrow"><span class="tag">DEMO ORDER COMPLETE ✓</span><h2 style="margin-top:20px">${escape(order.id)}</h2>${order.items.map((x) => `<p>${escape(products.find((p) => p.id === x.id)?.name || x.id)} × ${Number(x.qty)}</p>`).join("")}${summary(order.items)}<a class="btn btn-blue" href="marketplace.html">Keep exploring ↗</a><a class="btn btn-ghost-dark" href="index.html#garage">Visit your garage</a></div>`
        : '<a class="btn btn-blue" href="marketplace.html">Explore parts ↗</a>',
    );
  }
  if (path === "price-comparison.html") {
    $$(".offer").forEach((x) => x.remove());
    const target = document.createElement("div");
    target.className = "grid g3";
    const heading = $("h1");
    heading.parentElement.insertAdjacentElement("afterend", target);
    renderOffers(target);
    const chips = $("[data-tab]");
    if (chips) {
      chips.removeAttribute("data-tab");
      chips.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        $$("button", chips).forEach((x) =>
          x.classList.toggle("active", x === b),
        );
        renderOffers(
          target,
          /fast/i.test(b.textContent)
            ? "date"
            : /part price/i.test(b.textContent)
              ? "price"
              : "total",
        );
      });
    }
  }
  // Shared actions, with real cart behavior and transparent preview actions.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.add) add(b.dataset.add);
    if (b.dataset.offer) {
      add(
        "BC1324",
        1,
        offers.find((o) => o.supplier === b.dataset.offer),
      );
    }
    if (b.dataset.remove !== undefined) {
      cart.splice(+b.dataset.remove, 1);
      persist();
      cartPage();
    }
    if (b.dataset.change !== undefined) {
      const x = cart[+b.dataset.change],
        p = products.find((p) => p.id === x.id),
        total = cart
          .filter((v) => v.id === x.id)
          .reduce((s, v) => s + v.qty, 0);
      if (+b.dataset.delta > 0 && total >= p.stock)
        return notify("Available demo stock reached.");
      x.qty = Math.max(1, x.qty + +b.dataset.delta);
      persist();
      cartPage();
    }
    if (b.closest(".qa")) {
      const open = b.getAttribute("aria-expanded") === "true";
      b.setAttribute("aria-expanded", String(!open));
      b.nextElementSibling.hidden = open;
    }
    if (b.dataset.toast) {
      if (/export/i.test(b.textContent)) {
        const tables = $$(".tbl");
        if (tables.length) {
          const csv = tables
            .map((t) =>
              $$("tr", t)
                .map((r) =>
                  $$("th,td", r)
                    .map(
                      (c) =>
                        '"' + c.textContent.trim().replaceAll('"', '""') + '"',
                    )
                    .join(","),
                )
                .join("\n"),
            )
            .join("\n\n");
          const url = URL.createObjectURL(
            new Blob([csv], { type: "text/csv;charset=utf-8" }),
          );
          const a = document.createElement("a");
          a.href = url;
          a.download = "carcare-demo-report.csv";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          notify("Demo report exported.");
          return;
        }
      }
      notify(
        `${b.textContent.trim()}: preview only. No live data was changed.`,
      );
    }
  });
  $("#faqSearch")?.addEventListener("input", (e) =>
    $$(".qa").forEach(
      (q) =>
        (q.hidden = !q.textContent
          .toLowerCase()
          .includes(e.target.value.toLowerCase())),
    ),
  );
  $$("form[data-validate]").forEach((form) => {
    const status = $(".status", form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      $$(".field input,.field select,.field textarea", form).forEach((el) => {
        el.setCustomValidity("");
        if (el.dataset.min) el.minLength = +el.dataset.min;
        if (
          el.dataset.match &&
          el.value !== $("#" + el.dataset.match, form)?.value
        )
          el.setCustomValidity("Passwords do not match.");
        if (el.dataset.zip !== undefined && !/^\d{5}$/.test(el.value))
          el.setCustomValidity("Enter a 5-digit ZIP code.");
        const ok = el.checkValidity();
        el.closest(".field").classList.toggle("invalid", !ok);
        el.setAttribute("aria-invalid", String(!ok));
        const err = $(".err", el.closest(".field"));
        if (err) err.textContent = ok ? "" : el.validationMessage;
        if (!ok) valid = false;
      });
      if (valid && form.id === "loginForm") {
        const email = $("#le", form).value.trim().toLowerCase();
        const account = demoUsers.find(
          (user) => user.email === email && user.password === $("#lp", form).value,
        );
        if (!account) {
          status.textContent = "Incorrect email or password.";
          status.className = "status bad";
          $("#lp", form).focus();
          return;
        }
        const { password, ...session } = account;
        try {
          localStorage.removeItem("carcare.session");
          sessionStorage.removeItem("carcare.session");
          const storage = $("#rm", form).checked ? localStorage : sessionStorage;
          storage.setItem("carcare.session", JSON.stringify(session));
        } catch {
          // Login still works when browser storage is unavailable.
        }
        status.textContent = "Signed in as " + account.role + ". Opening your page…";
        status.className = "status ok";
        location.href = rolePages[account.role];
        return;
      }
      if (status) {
        status.textContent = valid
          ? "Validated successfully. This is a preview; no account, message, or server change was created."
          : "Please check the highlighted fields.";
        status.className = "status " + (valid ? "ok" : "bad");
      }
      if (!valid)
        $(".invalid input,.invalid select,.invalid textarea", form)?.focus();
    });
    form.addEventListener("reset", () => {
      if (status) {
        status.textContent = "";
        status.className = "status";
      }
      $$(".field", form).forEach((x) => {
        x.classList.remove("invalid");
        const el = $("input,select,textarea", x);
        el?.setCustomValidity("");
        el?.removeAttribute("aria-invalid");
        const err = $(".err", x);
        if (err) err.textContent = "";
      });
    });
  });
  // Existing static product links are routed to their matching catalog item.
  $$(".product").forEach((el) => {
    const p = products.find((p) => $("h3", el)?.textContent === p.name);
    if (p) {
      const img = $(".thumb", el);
      if (img && !$("img", img)) img.innerHTML = art(p);
      $$('a[href="product-details.html"]', el).forEach(
        (a) => (a.href = "product-details.html?id=" + p.id),
      );
    }
  });
  $$(".thumb").forEach((el) => {
    if ($("img", el)) return;
    const text = el.textContent.toLowerCase();
    const cat = /filter/.test(text)
      ? "Filters"
      : /oil|fluid/.test(text)
        ? "Fluids"
        : /plug/.test(text)
          ? "Ignition"
          : "Brakes";
    el.innerHTML = art({ cat });
  });
  if ($(".ws")) {
    if (!path.startsWith("admin-")) {
      const banner = document.createElement("div");
      banner.className = "demo-banner";
      banner.textContent =
        "Workspace preview · Sample data · Actions do not affect live accounts or orders";
      main.prepend(banner);
    }
    $$('input[type="text"]')
      .filter((x) =>
        /search/i.test(
          $('label[for="' + x.id + '"]')?.textContent || x.placeholder,
        ),
      )
      .forEach((input) =>
        input.addEventListener("input", () =>
          $$(".tbl tbody tr").forEach(
            (row) =>
              (row.hidden = !row.textContent
                .toLowerCase()
                .includes(input.value.toLowerCase())),
          ),
        ),
      );
    $$("[data-tab] .chip").forEach((b) =>
      b.addEventListener("click", () => {
        $$(".chip", b.parentElement).forEach((c) => {
          c.classList.toggle("active", c === b);
          c.setAttribute("aria-pressed", c === b);
        });
        const label = b.textContent.trim().toLowerCase();
        $$(".tbl tbody tr").forEach(
          (row) =>
            (row.hidden =
              label !== "all" &&
              !row.textContent.toLowerCase().includes(label.replace(/s$/, ""))),
        );
      }),
    );
  }
  if (
    "IntersectionObserver" in window &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.06 },
    );
    $$(".section .card,.steps li,.stats .card").forEach((el, i) => {
      el.classList.add("reveal-pending");
      el.style.transitionDelay = (i % 4) * 55 + "ms";
      observer.observe(el);
    });
  }
  badges();
  addEventListener("storage", (e) => {
    if (e.key === "carcare.cart") location.reload();
  });
})();
