(() => {
  const DE = document.documentElement.lang === "de";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ========================================================================
     1. Theme Persistence & Toggle
     ======================================================================== */
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const metaTheme = document.getElementById("meta-theme-color");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (metaTheme) {
      metaTheme.setAttribute("content", theme === "dark" ? "#0b1a2c" : "#efe6d2");
    }
    try {
      localStorage.setItem("voclock-theme", theme);
    } catch (e) {}
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  /* ========================================================================
     2. Mobile Navigation Drawer
     ======================================================================== */
  const menuToggle = document.getElementById("menu-toggle");
  const mobileDrawer = document.getElementById("mobile-drawer");

  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener("click", () => {
      const hidden = mobileDrawer.hasAttribute("hidden");
      if (hidden) {
        mobileDrawer.removeAttribute("hidden");
        menuToggle.setAttribute("aria-expanded", "true");
      } else {
        mobileDrawer.setAttribute("hidden", "");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ========================================================================
     3. Cursor Spotlight & Magnetic CTA Hover
     ======================================================================== */
  if (!prefersReducedMotion) {
    document.querySelectorAll("[data-spotlight]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        card.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });
    });

    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.12;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.16;
        btn.style.transform = `translate(${dx}px, ${dy - 2}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  const noOfflineVoice = DE
    ? "Auf diesem Gerät gibt es keine Offline-Stimme für diese Sprache"
    : "No offline voice for this language on this device";
  let initialVoicesReady;
  let latestSpeechRequest = 0;

  async function speakText(text, lang, buttonEl) {
    const request = ++latestSpeechRequest;
    const synth = window.speechSynthesis;
    if (!synth) {
      buttonEl.title = noOfflineVoice;
      return;
    }

    let voices = synth.getVoices();
    if (!voices.length) {
      // Some browsers populate voices asynchronously. Share a single initial wait.
      initialVoicesReady ??= new Promise((resolve) => {
        const finish = () => {
          window.clearTimeout(timeout);
          synth.removeEventListener("voiceschanged", finish);
          resolve();
        };
        const timeout = window.setTimeout(finish, 1200);
        synth.addEventListener("voiceschanged", finish, { once: true });
      });
      await initialVoicesReady;
      voices = synth.getVoices();
    }
    if (request !== latestSpeechRequest) return;

    const languageTag = lang.toLowerCase();
    const language = languageTag.split("-")[0];
    const localVoices = voices.filter((voice) =>
      voice.localService === true && voice.lang.toLowerCase().split("-")[0] === language
    );
    const voice = localVoices.find((candidate) => candidate.lang.toLowerCase() === languageTag) || localVoices[0];
    synth.cancel();
    if (!voice) {
      buttonEl.title = noOfflineVoice;
      return;
    }
    if (buttonEl.title === noOfflineVoice) buttonEl.removeAttribute("title");

    buttonEl.classList.remove("speaking");
    void buttonEl.offsetWidth;
    buttonEl.classList.add("speaking");
    setTimeout(() => buttonEl.classList.remove("speaking"), 750);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.92;
    synth.speak(utterance);
  }

  /* ========================================================================
     4. HOME PAGE: 3-Step Inline Switcher + 3D Lock-Screen Simulator
     ======================================================================== */
  const stepPills = document.querySelectorAll("#step-switcher .step-pill");
  const stepTitle = document.getElementById("step-panel-title");
  const stepDesc = document.getElementById("step-panel-desc");

  const stepData = DE ? [
    {
      title: "Handy entsperren",
      desc: "Ein Wort aus deinem Kurs erscheint, höchstens alle zehn Minuten und nie im Nicht-stören-Modus."
    },
    {
      title: "In ein paar Sekunden antworten",
      desc: "Tippe das Wort ein oder nimm einen Buchstabenhinweis. Mit deiner Notfall-PIN kommst du immer rein."
    },
    {
      title: "Es kommt zur richtigen Zeit wieder",
      desc: "Gewusste Wörter kommen später, verpasste früher, bis sie sitzen."
    }
  ] : [
    {
      title: "Unlock your phone",
      desc: "A word from your course shows up, at most one every ten minutes and never on Do Not Disturb."
    },
    {
      title: "Answer in a few seconds",
      desc: "Type the word, or take a letter hint. Your emergency PIN always gets you in."
    },
    {
      title: "It comes back at the right time",
      desc: "Words you know wait longer, words you missed come back sooner, until they stick."
    }
  ];

  stepPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const idx = Number(pill.dataset.step || 0);
      stepPills.forEach((p) => p.classList.toggle("active", p === pill));
      if (stepTitle && stepDesc && stepData[idx]) {
        stepTitle.textContent = stepData[idx].title;
        stepDesc.textContent = stepData[idx].desc;
      }
    });
  });

  const phoneWrap = document.getElementById("hero-phone-wrap");
  const heroPhone = document.getElementById("hero-phone");
  if (phoneWrap && heroPhone && !prefersReducedMotion) {
    phoneWrap.addEventListener("pointermove", (e) => {
      if (window.innerWidth < 960) return;
      const rect = phoneWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroPhone.style.transform = `rotateY(${(x * 10).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg)`;
    });
    phoneWrap.addEventListener("pointerleave", () => {
      heroPhone.style.transform = "";
    });
  }

  const lockForm = document.getElementById("lock-form");
  if (lockForm) {
    const demoWords = DE ? [
      { lang: "fr-FR", meta: "Ins Deutsche übersetzen · Personen", target: "le père", reading: "", answer: "Vater", accepted: ["vater"], summary: "le père = der Vater", hint: "„Vater“" },
      { lang: "es-ES", meta: "Ins Deutsche übersetzen · Natur", target: "la luna", reading: "", answer: "Mond", accepted: ["mond"], summary: "la luna = der Mond", hint: "„Mond“" },
      { lang: "ja-JP", meta: "Ins Deutsche übersetzen · Essen", target: "水", reading: "みず · mizu", answer: "Wasser", accepted: ["wasser"], summary: "水 (みず · mizu) = das Wasser", hint: "„Wasser“" },
      { lang: "en-US", meta: "Ins Deutsche übersetzen · Natur", target: "star", reading: "", answer: "Stern", accepted: ["stern"], summary: "star = der Stern", hint: "„Stern“" },
      { lang: "tr-TR", meta: "Ins Deutsche übersetzen · Natur", target: "güneş", reading: "", answer: "Sonne", accepted: ["sonne"], summary: "güneş = die Sonne", hint: "„Sonne“" }
    ] : [
      { code: "FR", lang: "fr-FR", meta: "Translate to English · People", target: "le père", reading: "", answer: "father", accepted: ["father", "the father"], summary: "le père = the father", hint: '"father"' },
      { code: "ES", lang: "es-ES", meta: "Translate to English · Nature", target: "la luna", reading: "", answer: "moon", accepted: ["moon", "the moon"], summary: "la luna = the moon", hint: '"moon"' },
      { code: "JA", lang: "ja-JP", meta: "Translate to English · Food", target: "水", reading: "みず · mizu", answer: "water", accepted: ["water"], summary: "水 (みず · mizu) = water", hint: '"water"' },
      { code: "DE", lang: "de-DE", meta: "Translate to English · Nature", target: "der Stern", reading: "", answer: "star", accepted: ["star", "the star"], summary: "der Stern = the star", hint: '"star"' },
      { code: "TR", lang: "tr-TR", meta: "Translate to English · Nature", target: "güneş", reading: "", answer: "sun", accepted: ["sun", "the sun"], summary: "güneş = sun", hint: '"sun"' }
    ];

    let wordIndex = 0;
    let hintLetters = 0;
    let solvedCount = 2;

    const lockClock = document.getElementById("lock-clock");
    const progressDots = document.getElementById("progress-dots");
    const progressLabel = document.getElementById("progress-label");
    const wordCard = document.getElementById("word-card");
    const wordMeta = document.getElementById("word-meta");
    const wordTarget = document.getElementById("word-target");
    const wordReading = document.getElementById("word-reading");
    const speakBtn = document.getElementById("speak-btn");
    const lockInput = document.getElementById("lock-input");
    const hintBtn = document.getElementById("hint-btn");
    const tryFeedback = document.getElementById("try-feedback");
    const tryNote = document.getElementById("try-note");
    const unlockedOverlay = document.getElementById("unlocked-overlay");
    const unlockedMeaning = document.getElementById("unlocked-meaning");
    const nextWordBtn = document.getElementById("next-word-btn");
    const confettiBurst = document.getElementById("confetti-burst");
    const langChips = document.querySelectorAll(".lang-chip");

    function updateClock() {
      if (!lockClock) return;
      const now = new Date();
      lockClock.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }
    updateClock();
    setInterval(updateClock, 30000);

    function renderDots() {
      if (!progressDots || !progressLabel) return;
      const activeIdx = solvedCount % 5;
      progressDots.querySelectorAll(".dot").forEach((dot, i) => {
        dot.classList.toggle("done", i < activeIdx);
        dot.classList.toggle("active", i === activeIdx);
      });
      progressLabel.textContent = DE ? `Heute: Wort ${activeIdx + 1} von 5` : `Word ${activeIdx + 1} of 5 today`;
    }

    function loadWord(index) {
      wordIndex = (index + demoWords.length) % demoWords.length;
      hintLetters = 0;
      const w = demoWords[wordIndex];
      if (wordMeta) wordMeta.textContent = w.meta;
      if (wordTarget) wordTarget.textContent = w.target;
      if (wordReading) {
        wordReading.textContent = w.reading;
        wordReading.hidden = !w.reading;
      }
      if (lockInput) lockInput.value = "";
      if (tryFeedback) {
        tryFeedback.textContent = "";
        tryFeedback.classList.remove("wrong");
      }
      if (tryNote) {
        tryNote.innerHTML = DE
          ? `Tippe <strong>${w.hint}</strong> oder die PIN <code>1234</code> ein oder tippe auf „Brauchst du einen Hinweis?“.`
          : `Type <strong>${w.hint}</strong> or PIN <code>1234</code>, or tap "Need a hint?".`;
      }
      if (unlockedOverlay) {
        unlockedOverlay.classList.remove("show");
        unlockedOverlay.setAttribute("aria-hidden", "true");
      }
      langChips.forEach((chip) => chip.classList.toggle("active", Number(chip.dataset.wordIndex) === wordIndex));
      renderDots();
    }

    function fireConfetti() {
      if (!confettiBurst || prefersReducedMotion) return;
      confettiBurst.innerHTML = "";
      const colors = ["#ffd166", "#7fa8d1", "#3fb984", "#efe6d2"];
      for (let i = 0; i < 16; i++) {
        const piece = document.createElement("span");
        piece.className = "confetti-piece";
        const angle = (Math.PI * 2 * i) / 16;
        const dist = 56 + Math.random() * 80;
        piece.style.background = colors[i % colors.length];
        piece.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
        piece.style.setProperty("--ty", `${Math.sin(angle) * dist - 18}px`);
        piece.style.setProperty("--rot", `${Math.round(Math.random() * 360)}deg`);
        confettiBurst.appendChild(piece);
      }
    }

    if (speakBtn) {
      speakBtn.addEventListener("click", () => speakText(demoWords[wordIndex].target, demoWords[wordIndex].lang, speakBtn));
    }

    if (hintBtn && lockInput) {
      hintBtn.addEventListener("click", () => {
        const w = demoWords[wordIndex];
        hintLetters = Math.min(w.answer.length, hintLetters + 1);
        lockInput.value = w.answer.slice(0, hintLetters);
        lockInput.focus();
        if (tryFeedback) {
          tryFeedback.classList.remove("wrong");
          tryFeedback.textContent = DE
            ? `Hinweis: ${hintLetters} von ${w.answer.length} Buchstaben`
            : `Hint: ${hintLetters} of ${w.answer.length} letters`;
        }
      });
    }

    function normalizeGermanAnswer(answer) {
      return answer.normalize("NFC").replace(/^(der|die|das|ein|eine)\s+/, "")
        .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss");
    }

    lockForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!lockInput) return;
      const raw = lockInput.value.trim().toLowerCase();
      const w = demoWords[wordIndex];
      const normalized = DE ? normalizeGermanAnswer(raw) : raw.replace(/^the\s+/, "");
      const isCorrect = DE
        ? w.accepted.some((answer) => normalizeGermanAnswer(answer) === normalized)
        : w.accepted.includes(raw) || w.accepted.includes(normalized);

      if (raw === "1234" || isCorrect) {
        solvedCount = (solvedCount + 1) % 5;
        renderDots();
        if (unlockedMeaning) {
          unlockedMeaning.textContent = raw === "1234" ? `${DE ? "Notfall-PIN" : "Emergency PIN"} · ${w.summary}` : w.summary;
        }
        if (unlockedOverlay) {
          unlockedOverlay.classList.add("show");
          unlockedOverlay.setAttribute("aria-hidden", "false");
        }
        fireConfetti();
      } else {
        if (wordCard) {
          wordCard.classList.remove("shake");
          void wordCard.offsetWidth;
          wordCard.classList.add("shake");
        }
        if (tryFeedback) {
          tryFeedback.classList.add("wrong");
          tryFeedback.textContent = DE ? `Versuch es mit ${w.hint} oder der PIN 1234.` : `Try ${w.hint} or PIN 1234.`;
        }
        lockInput.focus();
      }
    });

    if (nextWordBtn) nextWordBtn.addEventListener("click", () => loadWord(wordIndex + 1));
    langChips.forEach((c) => c.addEventListener("click", () => loadWord(Number(c.dataset.wordIndex || 0))));
    loadWord(0);
  }

  /* ========================================================================
     5. FEATURES PAGE: 4-Tab Interactive Studio
     ======================================================================== */
  const studioTabs = document.querySelectorAll(".studio-tab");
  const studioPanels = document.querySelectorAll(".studio-panel");

  studioTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.studio;
      studioTabs.forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      studioPanels.forEach((p) => {
        p.classList.toggle("active", p.dataset.panel === target);
      });
    });
  });

  const reelToggle = document.getElementById("reel-toggle-btn");
  const reelStatus = document.getElementById("reel-status-text");
  if (reelToggle && reelStatus) {
    const defaultStatus = reelStatus.textContent;
    reelToggle.addEventListener("click", () => {
      const isOn = reelToggle.classList.toggle("on");
      reelToggle.setAttribute("aria-pressed", String(isOn));
      reelToggle.textContent = isOn ? (DE ? "An" : "On") : (DE ? "Aus" : "Off");
      reelStatus.textContent = isOn
        ? (DE ? "1 Wort nach 10 Videos (3–30)" : "1 word after 10 videos (3–30)")
        : defaultStatus;
    });
  }

  const dndToggle = document.getElementById("dnd-toggle-btn");
  if (dndToggle) {
    dndToggle.addEventListener("click", () => {
      const isOn = dndToggle.classList.toggle("on");
      dndToggle.setAttribute("aria-pressed", String(isOn));
      dndToggle.textContent = isOn ? (DE ? "An" : "On") : (DE ? "Aus" : "Off");
    });
  }

  const learnTabToast = document.getElementById("learn-tab-toast");
  const dailyStartBtn = document.getElementById("daily-start-btn");
  const appTabButtons = document.querySelectorAll(".app-tabbar .tab-item");
  const appTabMessages = {
    Learn: DE ? "Tages-Challenge, Wörter des Tages und Minikurse" : "Daily challenge, today’s words and mini courses",
    Discover: DE
      ? "Spiele, Tea und KI-Chat. Wikipedia-News ab 50 bekannten Wörtern: ein Artikel am Tag gratis, einer mit Video, mit Pro unbegrenzt."
      : "Games, Tea and AI chat. Wikipedia news from 50 known words: one article a day free, one more with a video, unlimited with Pro.",
    Home: DE ? "Serie, Rang und Fortschritt bei neuen Wörtern" : "Streak, rank and today’s new-word progress",
    Me: DE ? "Fortschritt, Erfolge, Outfits und Freunde" : "Progress, achievements, outfits and friends",
    Settings: DE ? "Nicht-stören-Modus, Notfall-PIN und Reel-Bremse" : "Do Not Disturb, emergency PIN and reel brake"
  };

  appTabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab || "Learn";
      appTabButtons.forEach((b) => b.classList.toggle("active", b === btn));
      if (learnTabToast) learnTabToast.textContent = appTabMessages[tab] || "";
    });
  });

  if (dailyStartBtn && learnTabToast) {
    dailyStartBtn.addEventListener("click", () => {
      learnTabToast.textContent = DE ? "Heute stehen 5 neue Wörter und 5 Wörter zum Wiederholen bereit!" : "5 new + 5 review words queued for today!";
    });
  }

  const fsrsPills = document.querySelectorAll(".fsrs-pill");
  const fsrsResult = document.getElementById("fsrs-result");
  fsrsPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      fsrsPills.forEach((button) => {
        const selected = button === pill;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      if (fsrsResult) {
        const hard = pill.dataset.rating === "hard";
        fsrsResult.textContent = DE
          ? (hard ? "Mit „Schwer“ kann der nächste Termin früher liegen" : "Mit „Leicht“ kann der nächste Termin später liegen")
          : (hard ? "Hard can bring the next review sooner" : "Easy can move the next review later");
      }
    });
  });

  const importTabs = document.querySelectorAll(".import-tab-btn");
  const importPreview = document.getElementById("import-preview-code");
  const importSamples = DE ? {
    csv: "adaptateur USB-C,USB-C-Adapter,Objects",
    apkg: "Aus Anki (.apkg) importiert: Wörter und Übersetzungen · Doppelte Einträge übersprungen · Neue Wörter folgen dem Wiederholungsplan von VocLock",
    paste: "gourde isotherme\tThermotrinkflasche\ncâble de recharge\tLadekabel"
  } : {
    csv: "adaptateur USB-C,USB-C adapter,Objects",
    apkg: "Imported from Anki (.apkg): words and translations · duplicates skipped · new words use VocLock’s review schedule",
    paste: "gourde isotherme\tinsulated water bottle\ncâble de recharge\tcharging cable"
  };

  importTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      importTabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (importPreview) importPreview.textContent = importSamples[btn.dataset.import] || "";
    });
  });

  const toolsAudioBtn = document.getElementById("tools-audio-btn");
  if (toolsAudioBtn) {
    toolsAudioBtn.addEventListener("click", () => speakText("La bibliothèque", "fr-FR", toolsAudioBtn));
  }

  /* ========================================================================
     6. LANGUAGES PAGE: Filterable Split-Pane 11-Language Explorer
     ======================================================================== */
  const explorerGrid = document.getElementById("lang-explorer-grid");
  if (explorerGrid) {
    const languagesData = {
      fr: {
        name: DE ? "Französisch" : "French",
        greeting: "Bonjour",
        speechLang: "fr-FR",
        group: "european",
        words: DE ? "2.500+ Wörter" : "2,500+ words",
        script: DE ? "Lateinisches Alphabet" : "Latin alphabet",
        note: DE ? "Ein A1- und ein A2-Minikurs mit Grammatik. Zu jedem Wort gibt es einen Beispielsatz." : "An A1 and an A2 mini course with grammar. Example sentences for every word.",
        cards: [
          { w: "le père", t: "father", tDe: "Vater", ex: "Mon père est gentil." },
          { w: "la fenêtre", t: "window", tDe: "Fenster", ex: "Regarde par la fenêtre." },
          { w: "toujours", t: "always", tDe: "immer", ex: "Je t'aime toujours." }
        ]
      },
      es: {
        name: DE ? "Spanisch" : "Spanish",
        greeting: "Hola",
        speechLang: "es-ES",
        group: "european",
        words: DE ? "2.700+ Wörter" : "2,700+ words",
        script: DE ? "Lateinisches Alphabet" : "Latin alphabet",
        note: DE ? "Für Gespräche im Alltag, mit häufigen Verben und Grammatik auf A1- und A2-Niveau." : "Covers everyday conversation, high-frequency verbs, and A1–A2 grammar.",
        cards: [
          { w: "la luna", t: "moon", tDe: "Mond", ex: "Esta noche hay luna llena." },
          { w: "el camino", t: "way", tDe: "Weg", ex: "Este es el camino." },
          { w: "ahora", t: "now", tDe: "jetzt", ex: "Ahora no." }
        ]
      },
      it: {
        name: DE ? "Italienisch" : "Italian",
        greeting: "Ciao",
        speechLang: "it-IT",
        group: "european",
        words: DE ? "2.100+ Wörter" : "2,100+ words",
        script: DE ? "Lateinisches Alphabet" : "Latin alphabet",
        note: DE ? "Alltagswortschatz nach Häufigkeit sortiert, mit natürlichen Beispielsätzen." : "Frequency-ordered everyday vocabulary with natural example sentences.",
        cards: [
          { w: "il caffè", t: "coffee", tDe: "Kaffee", ex: "Il caffè è troppo caldo." },
          { w: "la piazza", t: "square", tDe: "Platz", ex: "Ci vediamo in piazza." },
          { w: "subito", t: "immediately", tDe: "sofort", ex: "Vieni subito!" }
        ]
      },
      pt: {
        name: DE ? "Portugiesisch (Brasilien)" : "Portuguese (Brazil)",
        greeting: "Olá",
        speechLang: "pt-BR",
        group: "european",
        words: DE ? "2.100+ Wörter" : "2,100+ words",
        script: DE ? "Lateinisches Alphabet" : "Latin alphabet",
        note: DE ? "Brasilianischer Wortschatz mit Aussprache zum täglichen Wiederholen." : "Brazilian Portuguese vocabulary and audio tailored for daily recall.",
        cards: [
          { w: "a água", t: "water", tDe: "Wasser", ex: "Um copo de água, por favor." },
          { w: "o livro", t: "book", tDe: "Buch", ex: "Estou lendo um livro ótimo." },
          { w: "hoje", t: "today", tDe: "heute", ex: "Hoje é segunda-feira." }
        ]
      },
      tr: {
        name: DE ? "Türkisch" : "Turkish",
        greeting: "Merhaba",
        speechLang: "tr-TR",
        group: "european",
        words: DE ? "2.000 Wörter" : "2,000 words",
        script: DE ? "Türkisches lateinisches Alphabet" : "Turkish Latin script",
        note: DE ? "Mit Minikursen zur Vokalharmonie und häufigen Wortstämmen aus dem Alltag." : "Includes vowel-harmony friendly mini courses and common everyday roots.",
        cards: [
          { w: "güneş", t: "sun", tDe: "Sonne", ex: "Güneş çok parlak." },
          { w: "çay", t: "tea", tDe: "Tee", ex: "Çay çok sıcak." },
          { w: "yarın", t: "tomorrow", tDe: "morgen", ex: "Yarın görüşürüz." }
        ]
      },
      ru: {
        name: DE ? "Russisch" : "Russian",
        greeting: "Привет",
        speechLang: "ru-RU",
        group: "scripts",
        words: DE ? "2.300+ Wörter" : "2,300+ words",
        script: DE ? "Beginnt mit Kyrillisch" : "Starts with Cyrillic",
        note: DE ? "Lerne zuerst Schritt für Schritt das kyrillische Alphabet und dann den Grundwortschatz." : "Begins with step-by-step Cyrillic alphabet mastery before core vocabulary.",
        cards: [
          { w: "книга", t: "book", tDe: "Buch", ex: "Эта книга очень интересная." },
          { w: "утро", t: "morning", tDe: "Morgen", ex: "Доброе утро!" },
          { w: "вода", t: "water", tDe: "Wasser", ex: "Стакан воды, пожалуйста." }
        ]
      },
      ja: {
        name: DE ? "Japanisch" : "Japanese",
        greeting: "こんにちは",
        speechLang: "ja-JP",
        group: "scripts",
        words: DE ? "2.200+ Wörter" : "2,200+ words",
        script: DE ? "Hiragana, Katakana und Kanji" : "Hiragana, Katakana & Kanji",
        note: DE ? "Du beginnst mit Hiragana und Katakana. Für Kanji gibt es eigene Übungen." : "Starts with hiragana & katakana and includes dedicated kanji practice.",
        cards: [
          { w: "水", reading: "みず · mizu", t: "water", tDe: "Wasser", ex: "水をください。" },
          { w: "猫", reading: "ねこ · neko", t: "cat", tDe: "Katze", ex: "猫が好きです。" },
          { w: "明日", reading: "あした · ashita", t: "tomorrow", tDe: "morgen", ex: "明日は休みです。" }
        ]
      },
      ko: {
        name: DE ? "Koreanisch" : "Korean",
        greeting: "안녕하세요",
        speechLang: "ko-KR",
        group: "scripts",
        words: DE ? "2.000 Wörter" : "2,000 words",
        script: DE ? "Beginnt mit Hangul" : "Starts with Hangul",
        note: DE ? "Du lernst zuerst Hangul und seine Silbenblöcke, danach die Wörter nach Häufigkeit." : "Begins with Hangul reading & syllable blocks, then frequency-ranked words.",
        cards: [
          { w: "별", reading: "byeol", t: "star", tDe: "Stern", ex: "밤하늘에 별이 많아요." },
          { w: "물", reading: "mul", t: "water", tDe: "Wasser", ex: "물 한 잔 주세요." },
          { w: "오늘", reading: "oneul", t: "today", tDe: "heute", ex: "오늘은 월요일이에요." }
        ]
      },
      zh: {
        name: DE ? "Chinesisch (Mandarin)" : "Chinese (Mandarin)",
        greeting: "你好",
        speechLang: "zh-CN",
        group: "scripts",
        words: DE ? "2.000 Wörter" : "2,000 words",
        script: DE ? "Schriftzeichen und Pinyin" : "Hanzi + Pinyin",
        note: DE ? "Zu den Schriftzeichen siehst du Pinyin. Hör dir an, wie die Töne ausgesprochen werden." : "Shows pinyin alongside characters with tonal pronunciation audio.",
        cards: [
          { w: "茶", reading: "chá", t: "tea", tDe: "Tee", ex: "你想喝茶还是咖啡？" },
          { w: "书", reading: "shū", t: "book", tDe: "Buch", ex: "我想买一本中文书。" },
          { w: "明天", reading: "míngtiān", t: "tomorrow", tDe: "morgen", ex: "你明天有空吗？" }
        ]
      },
      en: {
        name: DE ? "Englisch" : "English",
        greeting: "Hello",
        speechLang: "en-US",
        group: "european",
        words: DE ? "2.000+ Wörter" : "2,000+ words",
        script: DE ? "Für Deutschsprachige" : "For German speakers",
        note: DE ? "Grundkurs mit über 2.000 Wörtern, auf Deutsch erklärt und mit Beispielsätzen." : "Core course of 2,000+ words explained in German with example sentences.",
        cards: [
          { w: "daylight", tDe: "Tageslicht", ex: "I like working in daylight." },
          { w: "friendly", tDe: "freundlich", ex: "The people here are friendly." },
          { w: "meanwhile", tDe: "inzwischen", ex: "Dad cooks the rice. Meanwhile, I cut the vegetables." }
        ]
      },
      de: {
        name: DE ? "Deutsch" : "German",
        greeting: "Hallo",
        speechLang: "de-DE",
        group: "european",
        words: DE ? "2.000+ Wörter" : "2,000+ words",
        script: DE ? "Mit Artikeln" : "Articles included",
        note: DE ? "Zu jedem Substantiv gibt es den Artikel (der, die, das) und alltagstaugliche Beispielsätze." : "Every noun comes with der/die/das and practical everyday sentences.",
        cards: [
          { w: "der Stern", t: "star", ex: "Heute sieht man viele Sterne." },
          { w: "die Zeit", t: "time", ex: "Ich habe keine Zeit." },
          { w: "ruhig", t: "quiet", ex: "Das Dorf ist sehr ruhig." }
        ]
      }
    };

    const inspGreeting = document.getElementById("insp-greeting");
    const inspName = document.getElementById("insp-name");
    const inspWords = document.getElementById("insp-course-size");
    const inspScript = document.getElementById("insp-script-badge");
    const inspNote = document.getElementById("insp-note");
    const inspSpeakBtn = document.getElementById("insp-speak-btn");
    const inspDeck = document.getElementById("insp-deck");
    const speakerToggleBtns = document.querySelectorAll(".speaker-toggle-btn");
    const explorerTiles = Array.from(explorerGrid.querySelectorAll(".explorer-tile"));
    const langFilters = document.querySelectorAll(".lang-filter");
    let currentFilter = "all";
    let currentLangKey = "fr";
    let baseSpeaker = DE ? "de" : "en";

    function renderInspector(key) {
      const data = languagesData[key];
      if (!data) return;
      currentLangKey = key;

      explorerTiles.forEach((t) => {
        t.classList.toggle("active", t.dataset.langId === key);
      });

      if (inspGreeting) inspGreeting.textContent = data.greeting;
      if (inspName) {
        const suffix = baseSpeaker === "de"
          ? (DE ? "Für Deutschsprachige erklärt" : "Explained in German")
          : (DE ? "Für Englischsprachige erklärt" : "Explained in English");
        inspName.textContent = `${data.name} · ${suffix}`;
      }
      if (inspWords) inspWords.textContent = data.words;
      if (inspScript) inspScript.textContent = data.script;
      if (inspNote) inspNote.textContent = data.note;

      if (inspDeck) {
        inspDeck.innerHTML = "";
        data.cards.forEach((c) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "mini-flashcard";
          btn.innerHTML = `
            <div class="fc-front">
              <span>${c.w}${c.reading ? " (" + c.reading + ")" : ""}</span>
              <span class="fc-hint">${DE ? "Aufdecken und anhören" : "Reveal &amp; hear"}</span>
            </div>
            <div class="fc-back" hidden>
              <strong>${baseSpeaker === "de" ? c.tDe : c.t}</strong> — ${c.ex}
            </div>
          `;
          btn.addEventListener("click", () => {
            const back = btn.querySelector(".fc-back");
            const hint = btn.querySelector(".fc-hint");
            const isHidden = back.hasAttribute("hidden");
            if (isHidden) {
              back.removeAttribute("hidden");
              hint.textContent = DE ? "Zum Einklappen antippen" : "Tap to hide";
              speakText(c.w, data.speechLang, btn);
            } else {
              back.setAttribute("hidden", "");
              hint.textContent = DE ? "Aufdecken und anhören" : "Reveal & hear";
            }
          });
          inspDeck.appendChild(btn);
        });
      }
    }

    explorerTiles.forEach((tile) => {
      tile.addEventListener("click", () => {
        if (!tile.hidden) renderInspector(tile.dataset.langId);
      });
    });

    if (inspSpeakBtn) {
      inspSpeakBtn.addEventListener("click", () => {
        const data = languagesData[currentLangKey];
        if (data) speakText(data.greeting, data.speechLang, inspSpeakBtn);
      });
    }

    function refreshExplorer() {
      explorerTiles.forEach((tile) => {
        const canLearn = !tile.dataset.baseSpeaker || tile.dataset.baseSpeaker === baseSpeaker;
        const matchesFilter = currentFilter === "all" || currentFilter === tile.dataset.group;
        tile.hidden = !canLearn || !matchesFilter;
      });
      const available = explorerTiles.filter((tile) => !tile.hidden);
      const selected = available.find((tile) => tile.dataset.langId === currentLangKey) || available[0];
      if (selected) renderInspector(selected.dataset.langId);
    }

    langFilters.forEach((pill) => {
      pill.addEventListener("click", () => {
        langFilters.forEach((p) => p.classList.toggle("active", p === pill));
        currentFilter = pill.dataset.filter;
        refreshExplorer();
      });
    });

    speakerToggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        speakerToggleBtns.forEach((b) => {
          const selected = b === btn;
          b.classList.toggle("active", selected);
          b.setAttribute("aria-pressed", String(selected));
        });
        baseSpeaker = btn.dataset.speaker;
        refreshExplorer();
      });
    });

    refreshExplorer();
  }

  /* ========================================================================
     7. COMPARE PAGE: Category Filter, Column Highlight & 4-Tab Breakdown
     ======================================================================== */
  const compareRows = document.querySelectorAll("#compare-tbody tr");
  document.querySelectorAll(".cmp-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cmp-filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.dataset.cat;
      compareRows.forEach((row) => {
        row.hidden = !(cat === "all" || row.dataset.cat === cat);
      });
    });
  });

  const focusBtns = document.querySelectorAll(".cmp-focus");
  const cmpTable = document.getElementById("compare-table");
  focusBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      focusBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (!cmpTable) return;
      const focus = btn.dataset.focus;
      cmpTable.querySelectorAll("th, td").forEach((cell) => {
        cell.classList.remove("focused");
        if (focus !== "none" && cell.classList.contains(`col-${focus}`)) {
          cell.classList.add("focused");
        }
      });
    });
  });

  const breakdownTabs = document.querySelectorAll(".breakdown-tab");
  const breakdownPanels = document.querySelectorAll(".breakdown-panel");
  breakdownTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.b;
      breakdownTabs.forEach((t) => t.classList.toggle("active", t === tab));
      breakdownPanels.forEach((p) => p.classList.toggle("active", p.dataset.bp === target));
    });
  });
})();
