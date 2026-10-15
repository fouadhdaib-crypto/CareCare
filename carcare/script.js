"use strict";

/* ---------- Demo data ---------- */
const PRODUCTS = [
  { name: "Bosch QuietCast brake pads", sku: "BC1324", detail: "Front axle", cat: "Brakes", price: 48.99, rating: 4.8, supplier: "AutoParts Direct", stock: 42 },
  { name: "Cabin air filter", sku: "CF11819", detail: "Activated carbon", cat: "Filters", price: 19.99, rating: 4.7, supplier: "AutoParts Direct", stock: 86 },
  { name: "Mobil 1 full synthetic oil", sku: "0W-20", detail: "5 quart", cat: "Fluids", price: 29.99, rating: 4.9, supplier: "MotorHub", stock: 64 },
  { name: "NGK iridium spark plugs", sku: "DXE22HCR11S", detail: "Set of 4", cat: "Ignition", price: 39.99, rating: 4.8, supplier: "Prime Auto", stock: 28 },
  { name: "Wiper blade pair", sku: "W24-18", detail: "All-season", cat: "Filters", price: 24.99, rating: 4.5, supplier: "AutoParts Direct", stock: 4 },
  { name: "Brake fluid DOT 4", sku: "BF-DOT4", detail: "1 liter", cat: "Fluids", price: 14.5, rating: 4.6, supplier: "MotorHub", stock: 51 }
];

const OFFERS = [
  { supplier: "MotorHub", rating: 4.7, price: 51.5, delivery: 0, arrives: "Oct 16, 2026", day: 16 },
  { supplier: "AutoParts Direct", rating: 4.8, price: 48.99, delivery: 5.99, arrives: "Oct 15, 2026", day: 15 },
  { supplier: "Prime Auto", rating: 4.6, price: 46.99, delivery: 8.99, arrives: "Oct 17, 2026", day: 17 }
];

/* ---------- Helpers ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = (value) => "$" + value.toFixed(2);

const toastEl = $("#toast");
let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

/* ---------- Header, mobile menu, active link ---------- */
const header = $("#header");
const nav = $("#nav");
const menuBtn = $("#menuBtn");

function setMenu(open) {
  nav.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.addEventListener("click", (event) => { if (event.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });
window.addEventListener("resize", () => { if (window.innerWidth > 860) setMenu(false); });
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 8), { passive: true });

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    $$(".nav a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach((section) => sectionObserver.observe(section));

/* ---------- Cart ---------- */
const cartCount = $("#cartCount");
let cartItems = 2;
function addToCart(name) {
  cartItems += 1;
  cartCount.textContent = cartItems;
  cartCount.classList.remove("bump");
  void cartCount.offsetWidth; // restart the animation
  cartCount.classList.add("bump");
  showToast(name + " added to cart");
}
$("#cartBtn").addEventListener("click", () => showToast("Your cart has " + cartItems + " items. Concept design: checkout is not connected."));

/* ---------- Products: search, filter, render ---------- */
const grid = $("#productGrid");
const resultCount = $("#resultCount");
const queryInput = $("#partQuery");
const vehicleSelect = $("#vehicle");
let activeCategory = "all";

function renderProducts() {
  const query = queryInput.value.trim().toLowerCase();
  const list = PRODUCTS.filter((item) =>
    (activeCategory === "all" || item.cat === activeCategory) &&
    (!query || (item.name + " " + item.sku + " " + item.cat).toLowerCase().includes(query))
  );
  resultCount.textContent = list.length + (list.length === 1 ? " matching part" : " matching parts") + " for your " + vehicleSelect.value;

  if (!list.length) {
    grid.innerHTML = '<p class="empty">No parts match that search. Try a part number without spaces, or clear the filters.</p>';
    return;
  }
  grid.innerHTML = list.map((item, index) => `
    <article class="card product">
      <div class="thumb" aria-hidden="true">${item.cat}</div>
      <div class="body">
        <h3>${item.name}</h3>
        <p class="meta">${item.sku} &middot; ${item.detail} &middot; Fits your vehicle</p>
        <p class="price">${money(item.price)}</p>
        <p class="meta">${item.rating} rating &middot; ${item.supplier}</p>
        <span class="tag ${item.stock < 10 ? "low" : ""}">${item.stock < 10 ? "Low stock, " + item.stock + " left" : "In stock, " + item.stock}</span>
        <button class="btn btn-blue" type="button" data-index="${PRODUCTS.indexOf(item)}">Add to cart</button>
      </div>
    </article>`).join("");
}

grid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-index]");
  if (button) addToCart(PRODUCTS[button.dataset.index].name);
});
$("#chips").addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  activeCategory = chip.dataset.cat;
  $$("#chips .chip").forEach((c) => c.classList.toggle("active", c === chip));
  renderProducts();
});
queryInput.addEventListener("input", renderProducts);
vehicleSelect.addEventListener("change", () => {
  $("#fitNote").textContent = "Showing parts that fit your " + vehicleSelect.value + ".";
  renderProducts();
});
$("#finder").addEventListener("submit", (event) => {
  event.preventDefault();
  renderProducts();
  $("#parts").scrollIntoView({ behavior: "smooth" });
});

/* ---------- Price comparison ---------- */
const offersEl = $("#offers");
function renderOffers(sortKey) {
  const key = { total: (o) => o.price + o.delivery, date: (o) => o.day, price: (o) => o.price }[sortKey];
  const sorted = [...OFFERS].sort((a, b) => key(a) - key(b));
  const bestTotal = Math.min(...OFFERS.map((o) => o.price + o.delivery));
  offersEl.innerHTML = sorted.map((offer) => {
    const total = offer.price + offer.delivery;
    return `
    <article class="card offer ${total === bestTotal ? "best" : ""}">
      <h3>${offer.supplier}</h3>
      <p class="meta">${offer.rating} supplier rating &middot; In stock</p>
      ${total === bestTotal ? '<span class="tag">Best total price</span>' : ""}
      <dl>
        <dt>Part price</dt><dd>${money(offer.price)}</dd>
        <dt>Delivery</dt><dd>${offer.delivery ? money(offer.delivery) : "Free"}</dd>
        <dt>Total before tax</dt><dd class="total">${money(total)}</dd>
      </dl>
      <p class="meta">Arrives ${offer.arrives}</p>
      <button class="btn btn-blue" type="button" data-supplier="${offer.supplier}">Choose supplier</button>
    </article>`;
  }).join("");
}
$("#sortBtns").addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;
  $$("#sortBtns .chip").forEach((c) => c.classList.toggle("active", c === chip));
  renderOffers(chip.dataset.sort);
});
offersEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-supplier]");
  if (button) showToast(button.dataset.supplier + " selected for the brake pads");
});

/* ---------- Garage ---------- */
let miles = 68240;
$("#mileageBtn").addEventListener("click", () => {
  miles += 100;
  $("#miles").textContent = miles.toLocaleString("en-US");
  showToast("Mileage updated to " + miles.toLocaleString("en-US") + " miles");
});

/* ---------- FAQ accordion ---------- */
$("#faqList").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const answer = button.nextElementSibling;
  const open = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!open));
  answer.hidden = open;
});

/* ---------- Contact form validation ---------- */
const form = $("#contactForm");
const status = $("#formStatus");
const rules = {
  name: (v) => (v.trim().length < 2 ? "Enter your full name." : ""),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address."),
  message: (v) => (v.trim().length < 10 ? "Write at least 10 characters so we can help." : "")
};
function validateField(id) {
  const input = $("#" + id);
  const error = rules[id](input.value);
  $("#" + id + "Err").textContent = error;
  input.closest(".field").classList.toggle("invalid", Boolean(error));
  input.setAttribute("aria-invalid", String(Boolean(error)));
  return !error;
}
Object.keys(rules).forEach((id) => $("#" + id).addEventListener("blur", () => validateField(id)));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const results = Object.keys(rules).map(validateField);
  if (results.includes(false)) {
    status.className = "status bad";
    status.textContent = "Check the highlighted fields and try again.";
    $(".invalid input, .invalid textarea", form).focus();
    return;
  }
  status.className = "status ok";
  status.textContent = "Thanks, " + $("#name").value.trim().split(" ")[0] + ". Your message is ready to send. This concept form does not submit data.";
  form.reset();
});
$("#resetBtn").addEventListener("click", () => {
  Object.keys(rules).forEach((id) => { $("#" + id + "Err").textContent = ""; $("#" + id).closest(".field").classList.remove("invalid"); });
  status.className = "status";
  status.textContent = "";
});

/* ---------- Scroll reveal for cards ---------- */
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  $$(".section .card, .steps li").forEach((el) => { el.classList.add("reveal"); revealObserver.observe(el); });
}

/* ---------- Start ---------- */
renderProducts();
renderOffers("total");
