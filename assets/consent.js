// Cookie consent + Google Analytics 4 for littlelockstudio.app.
// Nothing is loaded from Google and no cookie is set until the visitor clicks "Accept".
// Not used on /auth/ and /notify/ (their addresses carry one-time codes).
(function () {
  "use strict";
  // GA4 measurement ID ("G-XXXXXXXXXX"). Empty = analytics and banner are off.
  var GA_ID = "G-SG02YY5H2V";
  if (!GA_ID) return;

  var KEY = "vl_consent";
  var de = /^de\b/i.test(document.documentElement.lang || "");
  var T = de ? {
    title: "Cookies und Statistik",
    text: "Mit deiner Zustimmung messen wir mit Google Analytics anonym, welche Seiten und Abschnitte gelesen werden. Ohne Zustimmung wird nichts geladen und nichts gesetzt.",
    accept: "Akzeptieren", decline: "Ablehnen", more: "Datenschutz", settings: "Cookie-Einstellungen",
    privacy: "/privacy/#website-analytics-de"
  } : {
    title: "Cookies and statistics",
    text: "With your consent we use Google Analytics to count, anonymously, which pages and sections get read. Without it, nothing is loaded and nothing is set.",
    accept: "Accept", decline: "Decline", more: "Privacy", settings: "Cookie settings",
    privacy: "/privacy/#website-analytics"
  };

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: asked again next time */ } }

  // ---- Analytics, only after consent ----
  var loaded = false;
  function load() {
    if (loaded) return; loaded = true;
    // Only the real site is measured, so local tests and previews don't count as visitors.
    if (!/(^|\.)littlelockstudio\.app$/.test(location.hostname)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
    gtag("js", new Date());
    gtag("config", GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    trackSections();
    window.addEventListener("vl:signup", function () { gtag("event", "sign_up", { method: "launch_email" }); });
  }

  // Time per section: counts how long each section is at least half in view while the tab is visible,
  // and reports it once when the visitor leaves or switches tabs.
  function trackSections() {
    if (!("IntersectionObserver" in window)) return;
    var els = document.querySelectorAll(".hero, section[id], .cta, footer");
    var seconds = {}, since = {}, sent = {};
    function name(el) { return el.id || (el.classList.contains("hero") ? "hero" : el.classList.contains("cta") ? "signup" : el.tagName.toLowerCase()); }
    function stop(n) { if (since[n]) { seconds[n] = (seconds[n] || 0) + (Date.now() - since[n]) / 1000; since[n] = 0; } }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var n = name(e.target);
        if (e.isIntersecting && document.visibilityState === "visible") { if (!since[n]) since[n] = Date.now(); }
        else stop(n);
      });
    }, { threshold: [0.35] });
    els.forEach(function (el) { io.observe(el); });
    function flush() {
      Object.keys(since).forEach(stop);
      Object.keys(seconds).forEach(function (n) {
        var s = Math.round(seconds[n]);
        if (s >= 1) { gtag("event", "section_time", { section_id: n, seconds: s, transport_type: "beacon" }); }
        seconds[n] = 0;
      });
    }
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flush();
      else els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight * 0.65 && r.bottom > innerHeight * 0.35) since[name(el)] = Date.now(); });
    });
    window.addEventListener("pagehide", flush);
  }

  // ---- Banner ----
  var banner;
  function css() {
    var st = document.createElement("style");
    st.textContent =
      ".vl-consent{position:fixed;left:12px;right:12px;bottom:12px;z-index:200;max-width:34rem;margin-inline:auto;padding:18px 18px 16px;border-radius:20px;" +
      "background:#f7f1e3;color:#0e2a47;border:1px solid #d8c9a8;box-shadow:0 18px 40px -14px rgba(14,42,71,.45);font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
      ".vl-consent strong{display:block;font-size:16px;margin-bottom:4px}.vl-consent p{margin:0 0 12px}" +
      ".vl-consent .vl-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}" +
      ".vl-consent button{flex:1 1 7rem;min-height:44px;padding:0 18px;border-radius:999px;border:2px solid #0e2a47;background:#0e2a47;color:#f7f1e3;font:inherit;font-weight:600;cursor:pointer}" +
      ".vl-consent button.vl-no{background:transparent;color:#0e2a47}" +
      ".vl-consent a{color:inherit;font-weight:600;display:inline-flex;align-items:center;min-height:44px;padding-inline:6px}" +
      ".vl-consent button:focus-visible,.vl-consent a:focus-visible{outline:3px solid #2f6a9e;outline-offset:2px}" +
      "@media (prefers-color-scheme:dark){.vl-consent{background:#13283f;color:#efe6d2;border-color:#1c3552;box-shadow:0 18px 40px -14px rgba(0,0,0,.8)}" +
      ".vl-consent button{background:#efe6d2;color:#0b1a2c;border-color:#efe6d2}.vl-consent button.vl-no{background:transparent;color:#efe6d2}}";
    document.head.appendChild(st);
  }
  function show() {
    if (banner) return;
    css();
    banner = document.createElement("div");
    banner.className = "vl-consent"; banner.setAttribute("role", "dialog"); banner.setAttribute("aria-label", T.title);
    banner.innerHTML = "<strong></strong><p></p><div class=\"vl-row\"><button type=\"button\" class=\"vl-no\"></button><button type=\"button\" class=\"vl-yes\"></button><a></a></div>";
    banner.querySelector("strong").textContent = T.title;
    banner.querySelector("p").textContent = T.text;
    banner.querySelector(".vl-no").textContent = T.decline;
    banner.querySelector(".vl-yes").textContent = T.accept;
    var a = banner.querySelector("a"); a.textContent = T.more; a.href = T.privacy;
    banner.querySelector(".vl-yes").addEventListener("click", function () { choose("granted"); });
    banner.querySelector(".vl-no").addEventListener("click", function () { choose("denied"); });
    document.body.appendChild(banner);
    banner.querySelector(".vl-no").focus({ preventScroll: true });
  }
  function hide() { if (banner) { banner.remove(); banner = null; } }
  function choose(v) {
    write(v); hide();
    if (v === "granted") load();
    else if (loaded) { gtag("consent", "update", { analytics_storage: "denied" }); clearCookies(); }
  }
  // Declining after having accepted: remove the _ga cookies this site set.
  function clearCookies() {
    document.cookie.split(";").forEach(function (c) {
      var n = c.split("=")[0].trim();
      if (n === "_ga" || n.indexOf("_ga_") === 0) {
        var host = location.hostname.split(".");
        [location.hostname, "." + location.hostname, "." + host.slice(-2).join(".")].forEach(function (d) {
          document.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + d;
        });
        document.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      }
    });
  }

  // Footer link to change the choice later.
  function footerLink() {
    var foot = document.querySelector("footer .links") || document.querySelector("footer");
    if (!foot) return;
    var a = document.createElement("a");
    a.href = "#"; a.textContent = T.settings;
    if (foot.className.indexOf("links") < 0) foot.appendChild(document.createTextNode(" · "));
    foot.appendChild(a);
    a.addEventListener("click", function (e) { e.preventDefault(); show(); });
  }

  function start() {
    footerLink();
    var v = read();
    if (v === "granted") load(); else if (v !== "denied") show();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
