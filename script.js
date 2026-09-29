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
      var bl = document.getElementById("beerList"); if (bl && f !== "all") bl.classList.remove("collapsed");
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

  /* ---------------- intro: fly through HENRY'S ---------------- */
  function initIntro() {
    var hero = document.getElementById("heroIntro");
    var svg = document.getElementById("introSvg");
    var text = document.getElementById("introText");
    var measure = document.getElementById("introMeasure");
    var word = document.getElementById("introWord");
    var cover = document.getElementById("introCover");
    var sub = document.getElementById("introSub");
    if (!hasGSAP || prefersReduced || !svg || !text || !measure) return;
    htmlEl.classList.add("has-intro");

    var origin = { x: 0, y: 0 }, bigScale = 90;
    var outline = document.getElementById("introOutline"), outlineText = document.getElementById("introOutlineText");
    var media = hero.querySelector(".hero-media");

    // Find a point well inside a letter stroke, as close to the screen centre as
    // possible, so the zoom "flies through" the letter instead of into black.
    function findOrigin(W, H, fs, y) {
      try {
        var c = document.createElement("canvas"); c.width = W; c.height = H;
        var g = c.getContext("2d");
        g.font = fs + "px Anton, Impact, 'Arial Narrow', sans-serif";
        g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillStyle = "#000";
        g.fillText("HENRY'S", W / 2, y);
        var d = g.getImageData(0, 0, W, H).data;
        function on(x, yy) { if (x < 0 || yy < 0 || x >= W || yy >= H) return false; return d[(yy * W + x) * 4 + 3] > 200; }
        var cx = W / 2, cy = H / 2;
        // prefer a point deep inside a thick stroke; relax if nothing qualifies
        var tries = [0.075, 0.05, 0.03];
        for (var k = 0; k < tries.length; k++) {
          var r = Math.max(3, Math.round(fs * tries[k])), rd = Math.round(r * 0.7), best = null, bestD = Infinity;
          for (var yy = Math.round(y - fs * 0.7); yy < y - r; yy += 2) {
            for (var xx = r; xx < W - r; xx += 2) {
              if (!on(xx, yy)) continue;
              if (!(on(xx - r, yy) && on(xx + r, yy) && on(xx, yy - r) && on(xx, yy + r) &&
                    on(xx - rd, yy - rd) && on(xx + rd, yy - rd) && on(xx - rd, yy + rd) && on(xx + rd, yy + rd))) continue;
              var dd = (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy);
              if (dd < bestD) { bestD = dd; best = { x: xx, y: yy, r: r }; }
            }
          }
          if (best) return best;
        }
        return null;
      } catch (e) { return null; }
    }

    function layout() {
      var W = hero.clientWidth, H = hero.clientHeight;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var fs = Math.min(W * 0.26, H * 0.45);
      measure.setAttribute("font-size", fs);
      measure.setAttribute("x", W / 2);
      var len = 0; try { len = measure.getComputedTextLength(); } catch (e) {}
      if (len > 0) fs = Math.min(fs * (W * 0.86) / len, H * 0.5);
      var y = H / 2 + fs * 0.36;
      [text, measure, outlineText].forEach(function (t) { if (!t) return; t.setAttribute("font-size", fs); t.setAttribute("x", W / 2); t.setAttribute("y", y); });
      var o = findOrigin(W, H, fs, y);
      var rr = o ? o.r : fs * 0.03;
      if (o) { origin.x = o.x; origin.y = o.y; } else { origin.x = W / 2; origin.y = H / 2; }
      // big enough that the hole around the origin covers the farthest screen corner
      bigScale = Math.ceil(1.15 * Math.sqrt(W * W + H * H) / rr);
      applyScale();
    }

    // scale the letters around the chosen point (set by hand: GSAP's svgOrigin
    // is unreliable for elements inside <mask>, which are never rendered)
    var st = { s: 1 };
    function applyScale() {
      var t = "translate(" + origin.x + " " + origin.y + ") scale(" + st.s + ") translate(" + (-origin.x) + " " + (-origin.y) + ")";
      word.setAttribute("transform", t);
      if (outline) outline.setAttribute("transform", t);
    }

    function start() {
      layout();
      var isMobile = window.matchMedia("(max-width: 760px)").matches;
      // desktop: slide the burger in under the letters, then settle back while we fly in
      if (!isMobile) gsap.set(media, { scale: 1.3, xPercent: -13, transformOrigin: "50% 50%" });
      gsap.fromTo([word, outline], { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power2.out" });
      gsap.fromTo(st, { s: .9 }, { s: 1, duration: 1.6, ease: "power3.out", onUpdate: applyScale });
      gsap.fromTo(sub, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, delay: .7, ease: "power3.out" });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero, start: "top top", end: isMobile ? "+=90%" : "+=120%",
          scrub: .8, pin: true, anticipatePin: 1, invalidateOnRefresh: true
        }
      });
      var intro = document.getElementById("intro");
      tl.to(sub, { opacity: 0, y: -16, duration: .12 }, 0)
        .to(outline, { opacity: 0, duration: .15 }, 0)
        .fromTo(st, { s: 1 }, { s: function () { return bigScale; }, duration: .6, ease: "power2.in", immediateRender: false, onUpdate: applyScale }, 0)
        .to(cover, { opacity: 0, duration: .1 }, .5)
        .set(intro, { autoAlpha: 0 }, .61)
        .to("#heroShade", { opacity: 1, duration: .22 }, .58)
        .fromTo(".hero-copy", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: .3, ease: "power2.out" }, .66)
        .to({}, { duration: .04 });
      if (!isMobile) tl.to(media, { scale: 1, xPercent: 0, duration: .8, ease: "power2.inOut" }, 0);
      ScrollTrigger.addEventListener("refreshInit", layout);
      ScrollTrigger.refresh();
    }

    var started = false;
    function go() { if (!started) { started = true; start(); } }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); setTimeout(go, 1500); } else go();

    var video = document.getElementById("heroVideo");
    if (video) {
      // iOS (esp. Low Power Mode) may refuse autoplay: then keep the poster
      // (never the native play button) and retry on the visitor's first touch.
      video.muted = true; video.defaultMuted = true; video.playsInline = true;
      var blocked = false;
      function tryPlay() {
        var p = video.play();
        if (p && p.then) p.then(function () { blocked = false; }).catch(function () { blocked = true; armRetry(); });
      }
      var armed = false;
      function armRetry() {
        if (armed) return; armed = true;
        var retry = function () {
          ["touchend", "click", "keydown"].forEach(function (ev) { document.removeEventListener(ev, retry, true); });
          armed = false; tryPlay();
        };
        ["touchend", "click", "keydown"].forEach(function (ev) { document.addEventListener(ev, retry, { capture: true, passive: true }); });
      }
      tryPlay();
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          en.forEach(function (x) { if (x.isIntersecting) tryPlay(); else if (!blocked) video.pause(); });
        }).observe(hero);
      }
      document.addEventListener("visibilitychange", function () { if (!document.hidden) tryPlay(); });
    }
  }

  function initParallax() {
    if (!hasGSAP || prefersReduced) return;
    gsap.fromTo(".beers-hero-img", { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".beers-hero", start: "top bottom", end: "bottom top", scrub: true } });
  }

  /* ---------------- mobile bar + beer "show all" ---------------- */
  function initMobileBar() {
    var bar = document.getElementById("mobileBar"); if (!bar) return;
    function on() { bar.classList.toggle("visible", window.scrollY > window.innerHeight * 1.1); }
    window.addEventListener("scroll", on, { passive: true }); on();
  }
  function initBeerMore() {
    var btn = document.getElementById("beerMore"), list = document.getElementById("beerList");
    if (!btn || !list) return;
    btn.addEventListener("click", function () {
      list.classList.remove("collapsed");
      if (hasGSAP) { gsap.fromTo(list.querySelectorAll(".beer:nth-child(n+7)"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, stagger: .04 }); ScrollTrigger.refresh(); }
    });
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
      if (window.innerWidth <= 900) dir = "up"; // no sideways motion on narrow screens
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
    initLenis();
    initIntro();
    initProgressBar();
    initHeaderState();
    initScrollSpy();
    initBackToTop();
    initMobileBar();
    initBeerMore();
    initReveals();
    initCountUp();
    initParallax();
    initMagnetic();
    positionPillSoon();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (hasGSAP) ScrollTrigger.refresh(); positionPillSoon(); });
    window.addEventListener("load", function () { if (hasGSAP) ScrollTrigger.refresh(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
