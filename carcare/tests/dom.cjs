const { JSDOM } = require("jsdom");
const fs = require("fs"),
  assert = require("assert");
const root = require("path").resolve(__dirname, "..") + "/",
  script = fs.readFileSync(root + "app.js", "utf8");
let store = {};
function open(file = "index.html", query = "") {
  const dom = new JSDOM(fs.readFileSync(root + file, "utf8"), {
    url: "https://carcare.test/" + file + query,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.matchMedia = () => ({ matches: true });
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  for (const [k, v] of Object.entries(store)) w.localStorage.setItem(k, v);
  w.eval(script);
  const save = () => {
    store = {};
    for (let i = 0; i < w.localStorage.length; i++) {
      let k = w.localStorage.key(i);
      store[k] = w.localStorage.getItem(k);
    }
  };
  return { w, d: w.document, save, close: () => w.close() };
}
const files = fs.readdirSync(root).filter((f) => f.endsWith(".html"));
for (const f of files) {
  const p = open(f);
  assert(p.d.querySelector("h1"), f);
  p.close();
}
let p = open("marketplace.html");
const q = p.d.querySelector("#q");
q.value = "CF11819";
q.dispatchEvent(new p.w.Event("input"));
assert.equal(p.d.querySelectorAll(".product").length, 1);
p.d.querySelector("[data-add]").click();
p.save();
p.close();
p = open("cart.html");
assert.equal(p.d.querySelector(".quantity output").textContent, "1");
p.d.querySelector('[data-delta="1"]').click();
assert.equal(p.d.querySelector(".quantity output").textContent, "2");
assert(p.d.querySelector(".summary").textContent.includes("$49.17"));
p.save();
p.close();
p = open("cart.html");
assert.equal(p.d.querySelector(".quantity output").textContent, "2");
p.close();
p = open("product-details.html", "?id=DOT4");
assert(p.d.querySelector("h1").textContent.includes("DOT 4"));
p.close();
p = open("price-comparison.html");
p.d.querySelector('[data-offer="MotorHub"]').click();
p.save();
p.close();
p = open("cart.html");
assert.equal(p.d.querySelectorAll(".cart-line").length, 2);
assert(p.d.querySelector(".summary").textContent.includes("$104.79"));
p.d.querySelector('[data-remove="1"]').click();
p.save();
p.close();
p = open("checkout.html");
p.d
  .querySelector("#demoOrder")
  .dispatchEvent(new p.w.Event("submit", { cancelable: true }));
p.save();
assert.equal(JSON.parse(store["carcare.cart"]).length, 0);
assert.equal(JSON.parse(store["carcare.order"]).items[0].qty, 2);
p.close();
p = open("order-confirmation.html");
assert(p.d.querySelector("h2").textContent.startsWith("CC-"));
assert(p.d.querySelector("main").textContent.includes("$49.17"));
p.close();
p = open("cart.html");
assert(p.d.querySelector(".empty"));
p.close();
p = open();
p.d.querySelector("#menuBtn").click();
assert.equal(
  p.d.querySelector("#menuBtn").getAttribute("aria-expanded"),
  "true",
);
const faq = p.d.querySelector(".qa button");
faq.click();
assert.equal(faq.nextElementSibling.hidden, false);
p.d.querySelector("#mileageBtn").click();
p.save();
p.close();
p = open();
assert.equal(p.d.querySelector("#miles").textContent, "68,340");
p.close();
console.log(
  "PASS: all 27 pages initialize; SKU search; product routing; cart add, quantity and persistence; totals; supplier offers; removal; demo checkout; confirmation; empty cart; menu; FAQ; mileage.",
);
