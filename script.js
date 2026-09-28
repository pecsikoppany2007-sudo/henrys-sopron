// Henry's Sopron — interaction & motion layer
// GSAP + ScrollTrigger + Lenis. Everything degrades gracefully: without the
// libraries the page is fully readable and all basic interactions still work.

(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  var htmlEl = document.documentElement;

  /* ---------------- language ---------------- */
  var langButtons = document.querySelectorAll(".lang-btn");
  var LANG_KEY = "henrys-sopron-lang";
  var currentLang = "hu";

  function applyLang(lang) {
    currentLang = lang;
    document.querySelectorAll("[data-hu][data-en]").forEach(function (el) {
      var v = el.getAttribute(lang === "en" ? "data-en" : "data-hu");
      if (v != null) el.textContent = v;
    });
    langButtons.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-lang") === lang); });
    htmlEl.setAttribute("lang", lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    positionPillSoon();
  }
  langButtons.forEach(function (b) { b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang")); }); });

  /* ---------------- open now (Europe/Budapest) ---------------- */
  var HOURS = { 0: [690, 1290], 1: [690, 1350], 2: [690, 1350], 3: [690, 1350], 4: [690, 1350], 5: [690, 1410], 6: [690, 1410] };
  function fmt(m) { var h = Math.floor(m / 60), mm = m % 60; return h + ":" + (mm < 10 ? "0" : "") + mm; }
  function budapestNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Budapest", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var map = {}; parts.forEach(function (p) { map[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[map.weekday], min: parseInt(map.hour, 10) % 24 * 60 + parseInt(map.minute, 10) };
    } catch (e) { var d = new Date(); return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() }; }
  }
  function initOpenStatus() {
    var el = document.getElementById("openStatus"), dot = document.getElementById("openDot");
    if (!el) return;
    var now = budapestNow(), h = HOURS[now.day], hu, en, open = now.min >= h[0] && now.min < h[1];
    if (open) { hu = "Most nyitva · " + fmt(h[1]) + "-ig"; en = "Open now · until " + fmt(h[1]); }
    else if (now.min < h[0]) { hu = "Ma " + fmt(h[0]) + "-kor nyitunk"; en = "Opens today at " + fmt(h[0]); }
    else { hu = "Most zárva · holnap " + fmt(HOURS[(now.day + 1) % 7][0]) + "-kor nyitunk"; en = "Closed · opens tomorrow at " + fmt(HOURS[(now.day + 1) % 7][0]); }
    el.setAttribute("data-hu", "Várkerület 83 · " + hu);
    el.setAttribute("data-en", "Várkerület 83 · " + en);
    el.textContent = el.getAttribute(currentLang === "en" ? "data-en" : "data-hu");
    if (dot) dot.classList.add(open ? "open" : "closed");
    document.querySelectorAll("#hoursTable tr").forEach(function (tr) {
      if ((tr.getAttribute("data-days") || "").split(",").indexOf(String(now.day)) > -1) tr.classList.add("today");
    });
  }

  /* ---------------- mobile nav ---------------- */
  var navToggle = document.getElementById("navToggle");
  var header = document.querySelector(".site-header");
  if (navToggle && header) {
    navToggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".main-nav a").forEach(function (a) {
      a.addEventListener("click", function () { header.classList.remove("nav-open"); navToggle.setAttribute("aria-expanded", "false"); });
    });
  }

  /* ---------------- menu tabs ---------------- */
  var tabs = document.querySelectorAll(".menu-tab");
  var panels = document.querySelectorAll(".menu-panel");
  var pill = document.getElementById("menuTabPill");

  function positionPill(btn, animate) {
    var wrap = document.querySelector(".menu-tabs");
    if (!pill || !wrap || !btn) return;
    var w = wrap.getBoundingClientRect(), r = btn.getBoundingClientRect();
    var x = r.left - w.left, y = r.top - w.top;
    if (hasGSAP && animate) gsap.to(pill, { x: x, y: y, width: r.width, height: r.height, opacity: 1, duration: .45, ease: "power3.out" });
    else { pill.style.transform = "translate(" + x + "px," + y + "px)"; pill.style.width = r.width + "px"; pill.style.height = r.height + "px"; pill.style.opacity = 1; }
  }
  function positionPillSoon() { requestAnimationFrame(function () { positionPill(document.querySelector(".menu-tab.active"), false); }); }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      var panel = document.getElementById("panel-" + tab.getAttribute("data-target"));
      panels.forEach(function (p) { p.classList.toggle("active", p === panel); });
      positionPill(tab, true);
      if (hasGSAP && panel) gsap.fromTo(panel.children, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .5, stagger: .05, ease: "power3.out" });
      if (hasGSAP) ScrollTrigger.refresh();
    });
  });
  window.addEventListener("resize", debounce(positionPillSoon, 150));

  /* ---------------- beer filters ---------------- */
  var chips = document.querySelectorAll(".chip");
  var beers = document.querySelectorAll(".beer");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.classList.toggle("active", c === chip); });
      var shown = [];
      beers.forEach(function (b) {
        var show = f === "all" || b.getAttribute("data-cat") === f;
        b.classList.toggle("is-hidden", !show);
        if (show) shown.push(b);
      });
      if (hasGSAP) {
        gsap.fromTo(shown, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, stagger: .04, ease: "power3.out" });
        ScrollTrigger.refresh();
      }
    });
  });

  function debounce(fn, w) { var t; return function () { clearTimeout(t); t = setTimeout(fn, w); }; }

  /* ---------------- preloader ---------------- */
  function initPreloader(done) {
    var pre = document.getElementById("preloader"), fill = document.getElementById("preloaderFill"), finished = false;
    function finish() {
      if (finished) return; finished = true;
      htmlEl.classList.remove("preloading");
      if (pre) pre.style.display = "none";
      done && done();
    }
    if (!hasGSAP || prefersReduced) { finish(); return; }
    gsap.to(fill, { width: "100%", duration: .8, ease: "power2.inOut" });
    gsap.to(pre, { opacity: 0, duration: .45, delay: .85, ease: "power2.out", onComplete: finish });
    setTimeout(finish, 2200);
  }

  /* ---------------- hero ---------------- */
  function playHeroEntrance() {
    if (!hasGSAP || prefersReduced) return;
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo("#heroImg", { scale: 1.14 }, { scale: 1, duration: 2.2, ease: "power2.out" }, 0)
      .from(".reveal-word", { yPercent: 110, duration: .9, stagger: .09 }, .15)
      .from(".hero .reveal-line", { opacity: 0, y: 20, duration: .7, stagger: .1 }, .55);
  }
  function initHeroParallax() {
    if (!hasGSAP || prefersReduced) return;
    gsap.to(".hero-media", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero-copy", { opacity: 0, y: -60, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });
    gsap.fromTo(".beers-hero-img", { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".beers-hero", start: "top bottom", end: "bottom top", scrub: true } });
  }

  /* ---------------- progress, header, spy, back to top ---------------- */
  function initProgressBar() {
    var bar = document.getElementById("scrollProgress");
    if (!bar || !hasGSAP) return;
    ScrollTrigger.create({ trigger: document.body, start: "top top", end: "bottom bottom", onUpdate: function (s) { bar.style.width = s.progress * 100 + "%"; } });
  }
  function initHeaderState() {
    function on() { header && header.classList.toggle("scrolled", window.scrollY > 40); }
    window.addEventListener("scroll", on, { passive: true }); on();
  }
  function initScrollSpy() {
    var links = document.querySelectorAll(".main-nav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {}; links.forEach(function (l) { map[l.getAttribute("href").slice(1)] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) { links.forEach(function (l) { l.classList.remove("active"); }); map[en.target.id].classList.add("active"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); s && io.observe(s); });
  }
  var lenisInstance = null;
  function initBackToTop() {
    var btn = document.getElementById("backToTop"); if (!btn) return;
    function on() { btn.classList.toggle("visible", window.scrollY > 800); }
    window.addEventListener("scroll", on, { passive: true }); on();
    btn.addEventListener("click", function () { lenisInstance ? lenisInstance.scrollTo(0, { duration: 1.2 }) : window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------------- smooth scroll ---------------- */
  function initLenis() {
    if (prefersReduced || typeof window.Lenis === "undefined" || !hasGSAP) return;
    var lenis = new Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenisInstance = lenis;
    document.querySelectorAll("a[href^='#']").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href"); if (id.length < 2) return;
        var target = document.querySelector(id); if (!target) return;
        e.preventDefault(); lenis.scrollTo(target, { duration: 1.3, offset: -60 });
      });
    });
  }

  /* ---------------- reveals ---------------- */
  function initReveals() {
    if (!hasGSAP || prefersReduced) return;
    document.querySelectorAll(".reveal").forEach(function (el) {
      var dir = el.getAttribute("data-reveal") || "up", from = { opacity: 0 };
      if (dir === "up") from.y = 40; if (dir === "left") from.x = -50; if (dir === "right") from.x = 50;
      gsap.set(el, from);
      gsap.to(el, { opacity: 1, x: 0, y: 0, duration: .9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    document.querySelectorAll(".reveal-clip").forEach(function (fig) {
      var img = fig.querySelector("img");
      gsap.set(fig, { clipPath: "inset(0 0 100% 0)" });
      gsap.set(img, { scale: 1.25 });
      var tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 80%", once: true } });
      tl.to(fig, { clipPath: "inset(0 0 0% 0)", duration: 1.2, ease: "power4.inOut" })
        .to(img, { scale: 1, duration: 1.6, ease: "power3.out" }, 0);
    });
    document.querySelectorAll(".reveal-stagger").forEach(function (c) {
      var items = c.querySelectorAll(".reveal-item");
      gsap.set(items, { opacity: 0, y: 24 });
      gsap.to(items, { opacity: 1, y: 0, duration: .7, stagger: .12, ease: "power3.out", scrollTrigger: { trigger: c, start: "top 88%", once: true } });
    });
    var cards = document.querySelectorAll("#panel-burgers .card");
    gsap.set(cards, { opacity: 0, y: 40 });
    ScrollTrigger.batch(cards, { start: "top 90%", once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: .8, stagger: .08, ease: "power3.out" }); } });
    var beerRows = document.querySelectorAll(".beer");
    gsap.set(beerRows, { opacity: 0, y: 24 });
    ScrollTrigger.batch(beerRows, { start: "top 92%", once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: .6, stagger: .05, ease: "power3.out" }); } });
    gsap.from(".tasting-inner > *", { opacity: 0, x: -40, duration: .8, stagger: .15, ease: "power3.out", scrollTrigger: { trigger: ".tasting", start: "top 85%", once: true } });
  }

  /* ---------------- count-up ---------------- */
  function initCountUp() {
    if (!hasGSAP || prefersReduced) return;
    document.querySelectorAll(".count-up").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-target"), 10) || 0, obj = { v: 0 };
      function run() { gsap.to(obj, { v: target, duration: 1.4, ease: "power2.out", onUpdate: function () { el.textContent = Math.round(obj.v); } }); }
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) { run(); return; }
      el.textContent = "0";
      ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: run });
    });
  }

  /* ---------------- burger build ---------------- */
  function initBurgerBuild() {
    if (!hasGSAP) return;
    var section = document.getElementById("burgerBuild"); if (!section) return;
    var captions = document.querySelectorAll(".build-caption");
    if (prefersReduced) {
      captions.forEach(function (c, i) { c.classList.toggle("active", i === captions.length - 1); });
      return;
    }
    ScrollTrigger.config({ ignoreMobileResize: true });
    var mm = gsap.matchMedia();
    mm.add({ isMobile: "(max-width: 760px)", isDesktop: "(min-width: 761px)" }, function (ctx) {
      var ids = ["#ing-bottom-bun", "#ing-patty", "#ing-cheese", "#ing-lettuce", "#ing-tomato", "#ing-top-bun"];
      gsap.set("#ing-bottom-bun", { y: 160, opacity: 0 });
      gsap.set("#ing-patty", { x: -260, opacity: 0 });
      gsap.set("#ing-cheese", { y: -120, opacity: 0 });
      gsap.set("#ing-lettuce", { x: 260, opacity: 0 });
      gsap.set("#ing-tomato", { y: -120, opacity: 0 });
      gsap.set("#ing-top-bun", { y: -220, opacity: 0, rotate: -8 });
      gsap.set("#ing-sesame > *", { scale: 0, opacity: 0, transformOrigin: "center" });
      gsap.set(".stage-glow", { opacity: 0, scale: .85 });
      gsap.set("#buildPhoto", { opacity: 0, scale: .92 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section, start: "top top", end: ctx.conditions.isMobile ? "+=190%" : "+=240%",
          scrub: .6, pin: ".burger-build-stage", anticipatePin: 1,
          onUpdate: function (self) {
            var idx = Math.min(captions.length - 1, Math.floor(self.progress * captions.length));
            captions.forEach(function (c, i) { c.classList.toggle("active", i === idx); });
          }
        }
      });
      tl.to("#ing-bottom-bun", { y: 0, opacity: 1, duration: .13, ease: "power2.out" }, 0)
        .to("#ing-patty", { x: 0, opacity: 1, duration: .13, ease: "power2.out" }, .1)
        .to("#ing-cheese", { y: 0, opacity: 1, duration: .13, ease: "power2.out" }, .2)
        .to("#ing-lettuce", { x: 0, opacity: 1, duration: .13, ease: "power2.out" }, .3)
        .to("#ing-tomato", { y: 0, opacity: 1, duration: .13, ease: "power2.out" }, .4)
        .to("#ing-top-bun", { y: 0, opacity: 1, rotate: 0, duration: .16, ease: "back.out(1.6)" }, .5)
        .to("#ing-sesame > *", { scale: 1, opacity: 1, duration: .1, stagger: .015, ease: "back.out(2)" }, .63)
        .to(".stage-glow", { opacity: 1, scale: 1.15, duration: .2 }, .7)
        .to(".burger-build-svg", { opacity: 0, scale: .96, duration: .12 }, .78)
        .to("#buildPhoto", { opacity: 1, scale: 1, duration: .14, ease: "power2.out" }, .78)
        .to({}, { duration: .1 });

      return function () {
        gsap.set(ids.concat(["#ing-sesame > *", ".stage-glow", "#buildPhoto", ".burger-build-svg"]), { clearProps: "all" });
      };
    });
  }

  /* ---------------- magnetic buttons ---------------- */
  function initMagnetic() {
    if (!hasGSAP || !hasFinePointer || prefersReduced) return;
    document.querySelectorAll(".btn-magnetic").forEach(function (btn) {
      var xTo = gsap.quickTo(btn, "x", { duration: .5, ease: "power3" }), yTo = gsap.quickTo(btn, "y", { duration: .5, ease: "power3" });
      btn.addEventListener("mousemove", function (e) { var r = btn.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .3); yTo((e.clientY - r.top - r.height / 2) * .3); });
      btn.addEventListener("mouseleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    var saved = null; try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    if (saved === "en") applyLang("en");
    initOpenStatus();
    initPreloader(function () { playHeroEntrance(); if (hasGSAP) ScrollTrigger.refresh(); positionPillSoon(); });
    initLenis();
    initProgressBar();
    initHeaderState();
    initScrollSpy();
    initBackToTop();
    initReveals();
    initCountUp();
    initBurgerBuild();
    initHeroParallax();
    initMagnetic();
    positionPillSoon();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (hasGSAP) ScrollTrigger.refresh(); positionPillSoon(); });
    window.addEventListener("load", function () { if (hasGSAP) ScrollTrigger.refresh(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
