// Shared script of the home pages (English at / and German at /de/). The page language comes from <html lang>.
(function () {
  var de = /^de\b/i.test(document.documentElement.lang || "");
  var T = de ? {
    badMail: "Bitte gib eine E-Mail-Adresse wie name@beispiel.de ein.",
    sending: "Wird gesendet …",
    ok: function (email) { return "Fast geschafft: Falls " + email + " noch nicht auf der Liste steht, haben wir einen Link geschickt. Tippe darauf, um zu bestätigen, dann schreiben wir dir, sobald VocLock da ist. Schon bestätigt? Dann ist alles erledigt. Danke für deine Unterstützung!"; },
    badMailServer: "Diese E-Mail-Adresse sieht nicht richtig aus.",
    retry: "Das hat gerade nicht geklappt. Bitte versuche es in einer Minute noch einmal.",
    offline: "Keine Verbindung. Bitte versuche es in einer Minute noch einmal."
  } : {
    badMail: "Please enter an email address like name@example.com.",
    sending: "Sending …",
    ok: function (email) { return "Almost done: if " + email + " isn't on the list yet, we sent it a link. Tap it to confirm, and we'll write once VocLock is out. Already confirmed before? Then you're all set. Thank you for your support!"; },
    badMailServer: "That email address doesn't look right.",
    retry: "That didn't work just now. Please try again in a minute.",
    offline: "No connection. Please try again in a minute."
  };

  // Menu bar hairline after scrolling, and a soft fade-in for sections below the hero.
  (function () {
    var bar = document.querySelector(".top");
    function onScroll() { bar.classList.toggle("scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    if (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    var pending = Array.prototype.slice.call(document.querySelectorAll(".steps li, .spot-text, .spot-media, .stats li, .more li, .hellos li, .cta"));
    pending.forEach(function (el) {
      // Siblings in a row arrive one after another.
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--d", (i % 4) * 0.08 + "s");
      el.classList.add("reveal");
    });
    // Anything in view or already scrolled past shows, so a jump to #languages never leaves gaps.
    function sweep() {
      var edge = window.innerHeight * 0.92;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < edge) { el.classList.add("in"); return false; }
        return true;
      });
      if (!pending.length) { window.removeEventListener("scroll", sweep); window.removeEventListener("resize", sweep); }
    }
    document.documentElement.classList.add("js");
    sweep();
    // Only a few dozen elements, so checking on every scroll event is cheap.
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("resize", sweep, { passive: true });
  })();

  // "And there's more": on phones the quieter items sit behind a button, on wide screens they are always open.
  (function () {
    var rest = document.querySelector("details.more-rest");
    if (!rest || !window.matchMedia) return;
    var narrow = window.matchMedia("(max-width: 560px)");
    function sync() { rest.open = !narrow.matches; }
    sync();
    if (narrow.addEventListener) narrow.addEventListener("change", sync);
  })();

  // German visitors on the English page get a quiet pointer to the German one.
  (function () {
    var hint = document.querySelector(".langhint");
    if (!hint || de || !/^de\b/i.test(navigator.language || "")) return;
    hint.hidden = false;
  })();

  // The hero lock screen: answer like in the app, the hint gives one more letter each tap.
  (function () {
    var form = document.getElementById("try"), field = document.getElementById("try-answer");
    if (!form || !field) return;
    var done = form.querySelector(".try-done"), answer = "the man", shown = 0;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = field.value.trim().toLowerCase().replace(/\s+/g, " ");
      if (v === answer || v === "man" || v === "a man") {
        done.hidden = false; field.blur();
        done.querySelector(".try-again").focus({ preventScroll: true });
      } else {
        field.classList.remove("wrong"); void field.offsetWidth; field.classList.add("wrong");
        field.focus();
      }
    });
    field.addEventListener("animationend", function () { field.classList.remove("wrong"); });
    form.querySelector(".try-hint").addEventListener("click", function () {
      shown = Math.min(shown + 1, answer.length);
      field.value = answer.slice(0, shown); field.focus();
    });
    form.querySelector(".try-again").addEventListener("click", function () {
      done.hidden = true; field.value = ""; shown = 0; field.classList.remove("wrong");
    });
  })();

  // Launch sign-up: sent straight to our Worker, which mails a confirmation link. No third party.
  (function () {
    var endpoint = "https://voclock-chat.voclock.workers.dev/waitlist";
    var lang = de || /^de\b/i.test(navigator.language || "") ? "de" : "en";
    var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    document.querySelectorAll("form.notify").forEach(function (form) {
      var field = form.querySelector('input[type="email"]'), button = form.querySelector("button");
      var msg = form.querySelector(".msg"), trap = form.querySelector('input[name="website"]');
      function say(text, kind) { msg.textContent = text; msg.className = "msg" + (kind ? " " + kind : ""); }
      field.addEventListener("input", function () { field.removeAttribute("aria-invalid"); if (msg.classList.contains("error")) say(""); });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = field.value.trim();
        if (!valid.test(email)) {
          field.setAttribute("aria-invalid", "true"); say(T.badMail, "error"); field.focus(); return;
        }
        button.disabled = true; say(T.sending);
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ email: email, lang: lang, website: trap.value }) })
          .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, status: b.status }; }); })
          .then(function (r) {
            if (r.ok) { form.classList.add("done"); say(T.ok(email), "ok"); return; }
            button.disabled = false;
            if (r.status === "bad_email") { field.setAttribute("aria-invalid", "true"); say(T.badMailServer, "error"); field.focus(); }
            else say(T.retry, "error");
          })
          .catch(function () { button.disabled = false; say(T.offline, "error"); });
      });
    });
  })();
})();
