// Shared script of the home pages (English at / and German at /de/). The page language comes from <html lang>.
(function () {
  var de = /^de\b/i.test(document.documentElement.lang || "");
  var T = de ? {
    tryWrong: "Nicht ganz – tippe das englische Wort ein oder tippe auf „Need a hint?“."
  } : {
    tryWrong: "Not quite — type the English word, or tap \"Need a hint?\"."
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
    var userToggled = false;
    function sync() { rest.open = !narrow.matches; }
    sync();
    if (narrow.addEventListener) narrow.addEventListener("change", sync);
    var summary = rest.querySelector("summary");
    if (summary) summary.addEventListener("click", function () { userToggled = true; });
    rest.addEventListener("toggle", function () {
      if (!userToggled) return;
      userToggled = false;
      if (rest.open && narrow.matches) {
        var first = rest.querySelector("h4");
        if (first) { first.setAttribute("tabindex", "-1"); first.focus({ preventScroll: true }); }
      }
    });
  })();

  // German visitors on the English page get a quiet pointer to the German one.
  // The inline head script reveals it before first paint (via .de-hint) to avoid CLS;
  // removing [hidden] here ensures assistive tech also sees it as visible.
  (function () {
    var hint = document.querySelector(".langhint");
    if (!hint || de || !/^de\b/i.test(navigator.language || "")) return;
    hint.hidden = false;
  })();

  // The hero lock screen: answer like in the app, the hint gives one more letter each tap.
  (function () {
    var form = document.getElementById("try"), field = document.getElementById("try-answer");
    if (!form || !field) return;
    var done = form.querySelector(".try-done"), note = document.getElementById("try-note");
    var defaultNote = note ? note.textContent : "", answer = "the father", shown = 0;
    function resetNote() {
      if (note && note.classList.contains("wrong")) {
        note.textContent = defaultNote; note.classList.remove("wrong");
      }
    }
    field.addEventListener("input", resetNote);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = field.value.trim().toLowerCase().replace(/\s+/g, " ");
      if (v === answer || v === "father" || v === "a father" || v === "dad" || v === "the dad") {
        resetNote();
        done.hidden = false; field.blur();
        done.querySelector(".try-again").focus({ preventScroll: true });
      } else {
        field.classList.remove("wrong"); void field.offsetWidth; field.classList.add("wrong");
        if (note) { note.textContent = T.tryWrong; note.classList.add("wrong"); }
        field.focus();
      }
    });
    field.addEventListener("animationend", function () { field.classList.remove("wrong"); });
    form.querySelector(".try-hint").addEventListener("click", function () {
      resetNote();
      shown = Math.min(shown + 1, answer.length);
      field.value = answer.slice(0, shown); field.focus();
    });
    form.querySelector(".try-again").addEventListener("click", function () {
      done.hidden = true; field.value = ""; shown = 0; field.classList.remove("wrong");
      resetNote();
      field.focus();
    });
  })();
})();
