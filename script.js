// Henry's Sopron — interaction & motion layer
// GSAP + ScrollTrigger + Lenis power the "wow" scroll animations.
// Everything degrades gracefully: if the animation libraries fail to
// load (offline, blocked CDN, etc.) the site still works — content is
// visible and every basic interaction (nav, language, menu tabs)
// keeps functioning through plain JS/CSS.

(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* =================================================
     LANGUAGE TOGGLE (independent of animation layer)
  ================================================= */
  var langButtons = document.querySelectorAll(".lang-btn");
  var translatable = document.querySelectorAll("[data-hu][data-en]");
  var htmlEl = document.documentElement;
  var LANG_KEY = "henrys-sopron-lang";

  function applyLang(lang) {
    translatable.forEach(function (el) {
      var value = lang === "en" ? el.getAttribute("data-en") : el.getAttribute("data-hu");
      if (value != null) el.textContent = value;
    });
    langButtons.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
    htmlEl.setAttribute("lang", lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () { applyLang(btn.getAttribute("data-lang")); });
  });

  var savedLang = null;
  try { savedLang = localStorage.getItem(LANG_KEY); } catch (e) {}
  if (savedLang === "en") applyLang("en");

  /* =================================================
     MOBILE NAV
  ================================================= */
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

  /* =================================================
     MENU TABS (works with or without GSAP)
  ================================================= */
  var tabs = document.querySelectorAll(".menu-tab");
  var panels = document.querySelectorAll(".menu-panel");
  var pill = document.getElementById("menuTabPill");

  function positionPill(btn, animate) {
    var tabsEl = document.querySelector(".menu-tabs");
    if (!pill || !tabsEl || !btn) return;
    var tabsRect = tabsEl.getBoundingClientRect();
    var btnRect = btn.getBoundingClientRect();
    var left = btnRect.left - tabsRect.left;
    if (hasGSAP && animate !== false) {
      gsap.to(pill, { x: left, width: btnRect.width, opacity: 1, duration: 0.45, ease: "power3.out" });
    } else {
      pill.style.transform = "translateX(" + left + "px)";
      pill.style.width = btnRect.width + "px";
      pill.style.opacity = 1;
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-target");
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");

      var newPanel = document.getElementById("panel-" + target);
      panels.forEach(function (panel) { panel.classList.toggle("active", panel === newPanel); });

      positionPill(tab, true);

      if (hasGSAP && newPanel) {
        var items = newPanel.querySelectorAll(".menu-item");
        gsap.fromTo(items, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" });
      }
    });
  });

  function initPill() {
    var active = document.querySelector(".menu-tab.active");
    if (active) positionPill(active, false);
  }
  window.addEventListener("resize", debounce(initPill, 200));

  /* =================================================
     small debounce helper
  ================================================= */
  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

  /* =================================================
     PRELOADER
  ================================================= */
  function initPreloader(onDone) {
    var pre = document.getElementById("preloader");
    var ring = document.querySelector(".preloader-ring");
    var finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      htmlEl.classList.remove("preloading");
      if (pre) pre.style.display = "none";
      if (onDone) onDone();
    }

    if (!hasGSAP || prefersReduced) { finish(); return; }

    gsap.to(ring, { strokeDashoffset: 0, duration: 0.85, ease: "power2.inOut" });
    gsap.to(pre, { opacity: 0, duration: 0.5, delay: 0.85, ease: "power2.out", onComplete: finish });
    setTimeout(finish, 2200); // safety net
  }

  /* =================================================
     HERO ENTRANCE
  ================================================= */
  function playHeroEntrance() {
    if (!hasGSAP) return;
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".reveal-word", { yPercent: 115, duration: 0.9, stagger: 0.12 })
      .from(".reveal-line", { opacity: 0, y: 18, duration: 0.7, stagger: 0.12 }, "-=0.5");
  }

  /* =================================================
     SCROLL PROGRESS BAR
  ================================================= */
  function initProgressBar() {
    var bar = document.getElementById("scrollProgress");
    if (!bar || !hasGSAP) return;
    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: function (self) { bar.style.width = (self.progress * 100) + "%"; }
    });
  }

  /* =================================================
     HEADER SCROLLED STATE + NAV SCROLLSPY
  ================================================= */
  function initHeaderState() {
    var hdr = document.querySelector(".site-header");
    if (!hdr) return;
    function onScroll() {
      hdr.classList.toggle("scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initScrollSpy() {
    var links = document.querySelectorAll(".main-nav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) { map[l.getAttribute("href").slice(1)] = l; });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          link.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    Object.keys(map).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* =================================================
     BACK TO TOP
  ================================================= */
  var lenisInstance = null;

  function initBackToTop() {
    var btn = document.getElementById("backToTop");
    if (!btn) return;
    function onScroll() { btn.classList.toggle("visible", window.scrollY > 700); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    btn.addEventListener("click", function () {
      if (lenisInstance) lenisInstance.scrollTo(0, { duration: 1.2 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* =================================================
     LENIS SMOOTH SCROLL
  ================================================= */
  function initLenis() {
    if (prefersReduced || typeof window.Lenis === "undefined" || !hasGSAP) return;
    var lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenisInstance = lenis;

    document.querySelectorAll("a[href^='#']").forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.3, offset: -70 });
      });
    });
  }

  /* =================================================
     GENERIC SCROLL REVEALS
  ================================================= */
  function initReveals() {
    if (!hasGSAP) return;

    document.querySelectorAll(".reveal").forEach(function (el) {
      var dir = el.getAttribute("data-reveal") || "up";
      var from = { opacity: 0 };
      if (dir === "up") from.y = 40;
      if (dir === "left") from.x = -50;
      if (dir === "right") from.x = 50;
      gsap.set(el, from);

      gsap.to(el, {
        opacity: 1, x: 0, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onStart: function () { el.classList.add("is-revealed"); }
      });
    });

    document.querySelectorAll(".reveal-stagger").forEach(function (container) {
      var items = container.querySelectorAll(".reveal-item");
      if (!items.length) return;
      gsap.set(items, { opacity: 0, y: 24 });
      gsap.to(items, {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: container, start: "top 85%", once: true }
      });
    });

    // first menu panel items reveal on scroll-in (other panels animate on tab click instead)
    var burgerItems = document.querySelectorAll("#panel-burgers .reveal-item");
    if (burgerItems.length) {
      gsap.set(burgerItems, { opacity: 0, y: 24 });
      gsap.to(burgerItems, {
        opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: "#menu", start: "top 70%", once: true }
      });
    }
  }

  /* =================================================
     COUNT-UP NUMBERS
  ================================================= */
  function initCountUp() {
    if (!hasGSAP) {
      document.querySelectorAll(".count-up").forEach(function (el) {
        el.textContent = el.getAttribute("data-target");
      });
      return;
    }
    document.querySelectorAll(".count-up").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-target"), 10) || 0;
      var obj = { val: 0 };
      function run() {
        gsap.to(obj, {
          val: target, duration: 1.4, ease: "power2.out",
          onUpdate: function () { el.textContent = Math.round(obj.val); }
        });
      }
      // elements already visible on load (e.g. in the hero) are "already past"
      // ScrollTrigger's onEnter edge, so trigger them immediately instead.
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        run();
      } else {
        ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: run });
      }
    });
  }

  /* =================================================
     BEER MUG FILL
  ================================================= */
  function initBeerMug() {
    var liquid = document.getElementById("mugLiquid");
    var foam = document.getElementById("mugFoam");
    var art = document.querySelector(".beers-art");
    if (!liquid || !foam || !art) return;

    var BOTTOM = 204, FULL = 138;

    if (!hasGSAP) {
      liquid.setAttribute("height", FULL);
      liquid.setAttribute("y", BOTTOM - FULL);
      return;
    }

    gsap.set(foam, { opacity: 0 });
    var proxy = { fill: 0 };
    ScrollTrigger.create({
      trigger: art,
      start: "top 75%",
      once: true,
      onEnter: function () {
        gsap.to(proxy, {
          fill: FULL, duration: 1.5, ease: "power2.out",
          onUpdate: function () {
            liquid.setAttribute("height", proxy.fill);
            liquid.setAttribute("y", BOTTOM - proxy.fill);
            foam.setAttribute("y", BOTTOM - proxy.fill - 10);
          }
        });
        gsap.to(foam, { opacity: 0.9, duration: 0.4, delay: 1.1 });
      }
    });
  }

  /* =================================================
     BURGER BUILD — pinned scroll spectacle
  ================================================= */
  function initBurgerBuild() {
    if (!hasGSAP) return;
    var section = document.getElementById("burgerBuild");
    if (!section) return;

    var captions = document.querySelectorAll(".build-caption");

    // mobile browsers resize the viewport when the address bar hides/shows —
    // ignore that so the pinned scene doesn't jump.
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Same pinned, scroll-driven scene on every screen size; phones just get
    // a slightly shorter scroll distance.
    var mm = gsap.matchMedia();

    mm.add({ isMobile: "(max-width: 760px)", isDesktop: "(min-width: 761px)" }, function (ctx) {
      var isMobile = ctx.conditions.isMobile;
      var ids = ["#ing-bottom-bun", "#ing-patty", "#ing-cheese", "#ing-lettuce", "#ing-tomato", "#ing-top-bun"];
      gsap.set("#ing-bottom-bun", { y: 160, opacity: 0 });
      gsap.set("#ing-patty", { x: -260, opacity: 0 });
      gsap.set("#ing-cheese", { y: -120, opacity: 0 });
      gsap.set("#ing-lettuce", { x: 260, opacity: 0 });
      gsap.set("#ing-tomato", { y: -120, opacity: 0 });
      gsap.set("#ing-top-bun", { y: -220, opacity: 0, rotate: -8 });
      gsap.set("#ing-sesame > *", { scale: 0, opacity: 0, transformOrigin: "center" });
      gsap.set(".stage-glow", { opacity: 0, scale: 0.85 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: isMobile ? "+=170%" : "+=220%",
          scrub: 0.6,
          pin: ".burger-build-stage",
          anticipatePin: 1,
          onUpdate: function (self) {
            var idx = Math.min(captions.length - 1, Math.floor(self.progress * captions.length));
            captions.forEach(function (c, i) { c.classList.toggle("active", i === idx); });
          }
        }
      });

      tl.to("#ing-bottom-bun", { y: 0, opacity: 1, duration: 0.15, ease: "power2.out" }, 0)
        .to("#ing-patty", { x: 0, opacity: 1, duration: 0.15, ease: "power2.out" }, 0.12)
        .to("#ing-cheese", { y: 0, opacity: 1, duration: 0.15, ease: "power2.out" }, 0.24)
        .to("#ing-lettuce", { x: 0, opacity: 1, duration: 0.15, ease: "power2.out" }, 0.36)
        .to("#ing-tomato", { y: 0, opacity: 1, duration: 0.15, ease: "power2.out" }, 0.48)
        .to("#ing-top-bun", { y: 0, opacity: 1, rotate: 0, duration: 0.2, ease: "back.out(1.6)" }, 0.60)
        .to("#ing-sesame > *", { scale: 1, opacity: 1, duration: 0.12, stagger: 0.02, ease: "back.out(2)" }, 0.76)
        .to(".stage-glow", { opacity: 1, scale: 1.15, duration: 0.24, ease: "power2.out" }, 0.86);

      return function () {
        gsap.set(ids, { clearProps: "all" });
        gsap.set("#ing-sesame > *", { clearProps: "all" });
        gsap.set(".stage-glow", { clearProps: "all" });
      };
    });
  }

  /* =================================================
     HERO SPOTLIGHT + PARALLAX HOP LEAVES (desktop only)
  ================================================= */
  function initHeroInteractions() {
    if (!hasFinePointer || prefersReduced) return;
    var hero = document.getElementById("heroIntro");
    var spotlight = document.getElementById("heroSpotlight");
    var hops = document.querySelectorAll(".hop");
    if (!hero || !spotlight) return;

    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var px = ((e.clientX - r.left) / r.width) * 100;
      var py = ((e.clientY - r.top) / r.height) * 100;
      spotlight.style.setProperty("--mx", px + "%");
      spotlight.style.setProperty("--my", py + "%");
      hops.forEach(function (h, i) {
        var depth = ((i % 3) + 1) * 5;
        var dx = ((px - 50) / 50) * depth;
        var dy = ((py - 50) / 50) * depth;
        h.style.transform = "translate(" + dx + "px, " + dy + "px)";
      });
    });
  }

  /* =================================================
     MAGNETIC BUTTONS (desktop only)
  ================================================= */
  function initMagnetic() {
    if (!hasGSAP || !hasFinePointer || prefersReduced) return;
    document.querySelectorAll(".btn-magnetic").forEach(function (btn) {
      var xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
      var yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var relX = e.clientX - r.left - r.width / 2;
        var relY = e.clientY - r.top - r.height / 2;
        xTo(relX * 0.3);
        yTo(relY * 0.3);
      });
      btn.addEventListener("mouseleave", function () { xTo(0); yTo(0); });
    });
  }

  /* =================================================
     BOOT
  ================================================= */
  function boot() {
    initPreloader(function () {
      playHeroEntrance();
      if (hasGSAP) ScrollTrigger.refresh();
    });

    initLenis();
    initProgressBar();
    initHeaderState();
    initScrollSpy();
    initBackToTop();
    initReveals();
    initCountUp();
    initBeerMug();
    initBurgerBuild();
    initHeroInteractions();
    initMagnetic();
    initPill();

    if (document.fonts && document.fonts.ready && hasGSAP) {
      document.fonts.ready.then(function () {
        ScrollTrigger.refresh();
        initPill();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
