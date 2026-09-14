// Henry's Sopron — small progressive-enhancement script
// Handles: language toggle (HU/EN), mobile nav, menu tabs

(function () {
  "use strict";

  /* ---------- language toggle ---------- */
  var langButtons = document.querySelectorAll(".lang-btn");
  var translatable = document.querySelectorAll("[data-hu][data-en]");
  var htmlEl = document.documentElement;
  var STORAGE_KEY = "henrys-sopron-lang";

  function applyLang(lang) {
    translatable.forEach(function (el) {
      var value = lang === "en" ? el.getAttribute("data-en") : el.getAttribute("data-hu");
      if (value != null) el.textContent = value;
    });
    langButtons.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
    htmlEl.setAttribute("lang", lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.getAttribute("data-lang"));
    });
  });

  var savedLang = null;
  try { savedLang = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  if (savedLang === "en") applyLang("en");

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var header = document.querySelector(".site-header");

  if (navToggle && header) {
    navToggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.querySelectorAll(".main-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- menu tabs ---------- */
  var tabs = document.querySelectorAll(".menu-tab");
  var panels = document.querySelectorAll(".menu-panel");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-target");

      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");

      panels.forEach(function (panel) {
        panel.classList.toggle("active", panel.id === "panel-" + target);
      });
    });
  });
})();
