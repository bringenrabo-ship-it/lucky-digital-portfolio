(function () {
  "use strict";
  var WHATSAPP = "2348031350375";

  document.getElementById("year").textContent = new Date().getFullYear();

  // Mobile menu
  var btn = document.querySelector(".menu-btn");
  var links = document.getElementById("links");
  function setMenu(open) {
    btn.setAttribute("aria-expanded", open);
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.classList.toggle("open", open);
  }
  btn.addEventListener("click", function () {
    setMenu(btn.getAttribute("aria-expanded") !== "true");
  });
  links.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scroll reveal
  var items = document.querySelectorAll(".section, .card, .project");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }

  // Hero glass parallax
  var stage = document.querySelector(".stage");
  var hero = document.querySelector(".hero");
  if (stage && !reduce) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      stage.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      stage.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
  }

  // Inquiry form -> WhatsApp
  var form = document.getElementById("inquiry-form");
  var error = document.getElementById("form-error");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    var missing = ["name", "email", "type", "budget", "details"].filter(function (n) {
      return !f[n].value.trim();
    });
    if (missing.length || !f.email.checkValidity()) {
      error.textContent = missing.length
        ? "Please fill in every field before sending."
        : "Please enter a valid email address.";
      (missing.length ? f[missing[0]] : f.email).focus();
      return;
    }
    error.textContent = "";
    var msg = "Hello Lucky Digital, I'd like to start a project.\n\n" +
      "Name: " + f.name.value.trim() + "\n" +
      "Email: " + f.email.value.trim() + "\n" +
      "Website needed: " + f.type.value + "\n" +
      "Budget: " + f.budget.value + "\n" +
      "Details: " + f.details.value.trim();
    window.open("https://wa.me/" + (window.LD_WA || WHATSAPP) + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });
})();
