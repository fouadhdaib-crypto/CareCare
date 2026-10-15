"use strict";
/* Shared behaviour for every inner page. Each feature checks that its elements exist. */
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toast = document.createElement("div");
toast.className = "toast"; toast.setAttribute("role", "status"); document.body.append(toast);
let timer;
function say(msg) { toast.textContent = msg; toast.classList.add("show"); clearTimeout(timer); timer = setTimeout(() => toast.classList.remove("show"), 2400); }

const menuBtn = document.getElementById("menuBtn"), nav = document.getElementById("nav");
function setMenu(open) { nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open); }
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
const header = document.querySelector(".site-header");
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 8), { passive: true });

/* Buttons with data-toast confirm their action (concept design: nothing is submitted). */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-toast]"); if (b) say(b.dataset.toast + " (concept design)");
  const q = e.target.closest("[data-qty]");
  if (q) { const n = q.parentElement.querySelector("output"); n.textContent = Math.max(1, +n.textContent + +q.dataset.qty); }
  const f = e.target.closest(".qa button");
  if (f) { const o = f.getAttribute("aria-expanded") === "true"; f.setAttribute("aria-expanded", !o); f.nextElementSibling.hidden = o; }
  const c = e.target.closest("[data-tab] .chip");
  if (c) { c.parentElement.querySelectorAll(".chip").forEach(x => x.classList.toggle("active", x === c)); say("Filter: " + c.textContent); }
});

/* FAQ search */
const faqSearch = document.getElementById("faqSearch");
if (faqSearch) faqSearch.addEventListener("input", () => $$(".qa").forEach(q => q.hidden = !q.textContent.toLowerCase().includes(faqSearch.value.toLowerCase())));

/* Form validation: required fields, email format, matching passwords, 5-digit ZIP. */
$$("form[data-validate]").forEach(form => {
  const status = form.querySelector(".status");
  const check = el => {
    const v = el.value.trim(); let m = "";
    if (el.required && !v) m = "This field is required.";
    else if (el.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) m = "Enter a valid email address.";
    else if (el.dataset.zip !== undefined && !/^\d{5}$/.test(v)) m = "Enter a 5-digit ZIP code.";
    else if (el.dataset.min && v.length < +el.dataset.min) m = "Use at least " + el.dataset.min + " characters.";
    else if (el.dataset.match && v !== form.querySelector("#" + el.dataset.match).value) m = "Passwords do not match.";
    el.closest(".field").classList.toggle("invalid", !!m); el.setAttribute("aria-invalid", !!m);
    el.closest(".field").querySelector(".err").textContent = m; return !m;
  };
  form.querySelectorAll("input,select,textarea").forEach(el => el.addEventListener("blur", () => check(el)));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const ok = [...form.elements].filter(el => el.closest(".field")).map(check).every(Boolean);
    status.className = "status " + (ok ? "ok" : "bad");
    status.textContent = ok ? form.dataset.ok : "Check the highlighted fields and try again.";
    if (!ok) form.querySelector(".invalid input, .invalid textarea, .invalid select").focus();
    else if (form.dataset.go) setTimeout(() => location.href = form.dataset.go, 900);
  });
  form.addEventListener("reset", () => { form.querySelectorAll(".invalid").forEach(f => f.classList.remove("invalid")); form.querySelectorAll(".err").forEach(x => x.textContent = ""); status.textContent = ""; status.className = "status"; });
});
