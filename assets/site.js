(() => {
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

  function speakText(text, lang, buttonEl) {
    if (buttonEl) {
      buttonEl.classList.remove("speaking");
      void buttonEl.offsetWidth;
      buttonEl.classList.add("speaking");
      setTimeout(() => buttonEl.classList.remove("speaking"), 750);
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 0.92;
      window.speechSynthesis.speak(utter);
    }
  }

  /* ========================================================================
     4. HOME PAGE: 3-Step Inline Switcher + 3D Lock-Screen Simulator
     ======================================================================== */
  const stepPills = document.querySelectorAll("#step-switcher .step-pill");
  const stepTitle = document.getElementById("step-panel-title");
  const stepDesc = document.getElementById("step-panel-desc");

  const stepData = [
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
    const demoWords = [
      { code: "FR", lang: "fr-FR", meta: "Translate to English · People", target: "le père", reading: "", answer: "father", accepted: ["father", "the father", "dad"], summary: "le père = the father", hint: '"father"' },
      { code: "ES", lang: "es-ES", meta: "Translate to English · Nature", target: "la luna", reading: "", answer: "moon", accepted: ["moon", "the moon"], summary: "la luna = the moon", hint: '"moon"' },
      { code: "JA", lang: "ja-JP", meta: "Translate to English · Basics", target: "みず", reading: "mizu", answer: "water", accepted: ["water"], summary: "みず (mizu) = water", hint: '"water"' },
      { code: "DE", lang: "de-DE", meta: "Translate to English · Sky", target: "der Stern", reading: "", answer: "star", accepted: ["star", "the star"], summary: "der Stern = the star", hint: '"star"' },
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
      progressLabel.textContent = `Word ${activeIdx + 1} of 5 today`;
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
        tryNote.innerHTML = `Type <strong>${w.hint}</strong> or PIN <code>1234</code>, or tap "Need a hint?".`;
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
          tryFeedback.textContent = `Hint: ${hintLetters} of ${w.answer.length} letters`;
        }
      });
    }

    lockForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!lockInput) return;
      const raw = lockInput.value.trim().toLowerCase();
      const w = demoWords[wordIndex];
      const normalized = raw.replace(/^the\s+/, "");

      if (raw === "1234" || w.accepted.includes(raw) || w.accepted.includes(normalized)) {
        solvedCount = (solvedCount + 1) % 5;
        renderDots();
        if (unlockedMeaning) {
          unlockedMeaning.textContent = raw === "1234" ? `Emergency PIN · ${w.summary}` : w.summary;
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
          tryFeedback.textContent = `Try ${w.hint} or PIN 1234.`;
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
    reelToggle.addEventListener("click", () => {
      const isOn = reelToggle.classList.toggle("on");
      reelToggle.textContent = isOn ? "Enabled" : "Off";
      reelStatus.textContent = isOn ? "Asks 1 word every 5 Reels" : "Reel brake paused";
    });
  }

  const dndToggle = document.getElementById("dnd-toggle-btn");
  if (dndToggle) {
    dndToggle.addEventListener("click", () => {
      const isOn = dndToggle.classList.toggle("on");
      dndToggle.textContent = isOn ? "Respected" : "Ignored";
    });
  }

  const cooldownSlider = document.getElementById("cooldown-slider");
  const cooldownVal = document.getElementById("cooldown-val");
  if (cooldownSlider && cooldownVal) {
    cooldownSlider.addEventListener("input", () => {
      cooldownVal.textContent = `At most 1 word every ${cooldownSlider.value} min`;
    });
  }

  const learnTabToast = document.getElementById("learn-tab-toast");
  const dailyStartBtn = document.getElementById("daily-start-btn");
  const appTabButtons = document.querySelectorAll(".app-tabbar .tab-item");
  const appTabMessages = {
    Learn: "Daily challenge, 6 word games & 40 mini courses",
    Discover: "Read 'Tea' episodes & Wikipedia news with swapped words",
    Home: "Daily streak, rank badge & quick review status",
    Me: "60+ achievements, otter outfits & shared partner streak",
    Settings: "Cooldown timer, Do Not Disturb & emergency PIN"
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
      learnTabToast.textContent = "5 new + 5 review words queued for today!";
    });
  }

  const fsrsPills = document.querySelectorAll(".fsrs-pill");
  const fsrsResult = document.getElementById("fsrs-result");
  fsrsPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      fsrsPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      if (fsrsResult) fsrsResult.textContent = `Next review: ${pill.dataset.interval}`;
    });
  });

  const importTabs = document.querySelectorAll(".import-tab-btn");
  const importPreview = document.getElementById("import-preview-code");
  const importSamples = {
    csv: "front,back,example\nla fenêtre,the window,Ouvre la fenêtre s'il te plaît.\nle matin,the morning,Le matin est calme.",
    apkg: "Imported deck: French Core 2000 (.apkg)\nMatched 412 words · Preserved review ease · Ready on lock screen",
    paste: "Quizlet / Spreadsheet paste:\nbonjour\thello\nmerci\tthank you\nau revoir\tgoodbye"
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
        name: "French",
        greeting: "Bonjour",
        speechLang: "fr-FR",
        group: "european",
        words: "2,400+ words",
        script: "Latin alphabet",
        note: "40 A1 & A2 grammar mini-courses included. Example sentences for every word.",
        cards: [
          { w: "le père", t: "the father", ex: "Mon père prépare le thé." },
          { w: "la fenêtre", t: "the window", ex: "Ouvre la fenêtre ce matin." },
          { w: "toujours", t: "always", ex: "Elle arrive toujours à l'heure." }
        ]
      },
      es: {
        name: "Spanish",
        greeting: "Hola",
        speechLang: "es-ES",
        group: "european",
        words: "2,500+ words",
        script: "Latin alphabet",
        note: "Covers everyday conversation, high-frequency verbs, and A1–A2 grammar.",
        cards: [
          { w: "la luna", t: "the moon", ex: "La luna brilla esta noche." },
          { w: "el camino", t: "the path", ex: "Este camino va al mar." },
          { w: "ahora", t: "now", ex: "Empezamos ahora mismo." }
        ]
      },
      it: {
        name: "Italian",
        greeting: "Ciao",
        speechLang: "it-IT",
        group: "european",
        words: "2,200+ words",
        script: "Latin alphabet",
        note: "Frequency-ordered everyday vocabulary with natural example sentences.",
        cards: [
          { w: "il caffè", t: "the coffee", ex: "Prendo un caffè al bar." },
          { w: "la piazza", t: "the square", ex: "Ci vediamo in piazza." },
          { w: "subito", t: "right away", ex: "Arrivo subito." }
        ]
      },
      pt: {
        name: "Portuguese (Brazil)",
        greeting: "Olá",
        speechLang: "pt-BR",
        group: "european",
        words: "2,200+ words",
        script: "Latin alphabet",
        note: "Brazilian Portuguese vocabulary and audio tailored for daily recall.",
        cards: [
          { w: "a água", t: "the water", ex: "A água está bem gelada." },
          { w: "o livro", t: "the book", ex: "Estou lendo um livro novo." },
          { w: "hoje", t: "today", ex: "Hoje o dia está lindo." }
        ]
      },
      tr: {
        name: "Turkish",
        greeting: "Merhaba",
        speechLang: "tr-TR",
        group: "european",
        words: "2,100+ words",
        script: "Turkish Latin script",
        note: "Includes vowel-harmony friendly mini courses and common everyday roots.",
        cards: [
          { w: "güneş", t: "sun", ex: "Güneş erken doğuyor." },
          { w: "çay", t: "tea", ex: "Bir bardak çay ister misin?" },
          { w: "yarın", t: "tomorrow", ex: "Yarın görüşürüz." }
        ]
      },
      ru: {
        name: "Russian",
        greeting: "Привет",
        speechLang: "ru-RU",
        group: "scripts",
        words: "2,300+ words",
        script: "Starts with Cyrillic",
        note: "Begins with step-by-step Cyrillic alphabet mastery before core vocabulary.",
        cards: [
          { w: "книга", t: "book", ex: "Эта книга очень интересная." },
          { w: "утро", t: "morning", ex: "Доброе утро!" },
          { w: "вода", t: "water", ex: "Можно стакан воды?" }
        ]
      },
      ja: {
        name: "Japanese",
        greeting: "こんにちは",
        speechLang: "ja-JP",
        group: "scripts",
        words: "2,600+ words",
        script: "Hiragana, Katakana & Kanji",
        note: "Starts with hiragana & katakana and includes dedicated kanji practice.",
        cards: [
          { w: "みず (mizu)", t: "water", ex: "つめたい みず を ください。" },
          { w: "ねこ (neko)", t: "cat", ex: "その ねこ は ちいさい です。" },
          { w: "あした (ashita)", t: "tomorrow", ex: "あした また あいましょう。" }
        ]
      },
      ko: {
        name: "Korean",
        greeting: "안녕하세요",
        speechLang: "ko-KR",
        group: "scripts",
        words: "2,200+ words",
        script: "Starts with Hangul",
        note: "Begins with Hangul reading & syllable blocks, then frequency-ranked words.",
        cards: [
          { w: "별 (byeol)", t: "star", ex: "밤하늘에 별이 많아요." },
          { w: "물 (mul)", t: "water", ex: "물 한 잔 주세요." },
          { w: "오늘 (oneul)", t: "today", ex: "오늘 날씨가 좋아요." }
        ]
      },
      zh: {
        name: "Chinese (Mandarin)",
        greeting: "你好",
        speechLang: "zh-CN",
        group: "scripts",
        words: "2,400+ words",
        script: "Hanzi + Pinyin",
        note: "Shows pinyin alongside characters with tonal pronunciation audio.",
        cards: [
          { w: "茶 (chá)", t: "tea", ex: "我喜欢喝热茶。" },
          { w: "书 (shū)", t: "book", ex: "桌子上有一本书。" },
          { w: "明天 (míngtiān)", t: "tomorrow", ex: "我们明天见。" }
        ]
      },
      en: {
        name: "English",
        greeting: "Hello",
        speechLang: "en-US",
        group: "european",
        words: "2,800 words",
        script: "For German speakers",
        note: "Complete 2,800-word core course explained in German with example sentences.",
        cards: [
          { w: "daylight", t: "Tageslicht", ex: "We walked home in daylight." },
          { w: "reliable", t: "zuverlässig", ex: "She is a reliable friend." },
          { w: "meanwhile", t: "inzwischen", ex: "Meanwhile, the tea cooled down." }
        ]
      },
      de: {
        name: "German",
        greeting: "Hallo",
        speechLang: "de-DE",
        group: "european",
        words: "2,600+ words",
        script: "Articles included",
        note: "Every noun comes with der/die/das and practical everyday sentences.",
        cards: [
          { w: "der Stern", t: "the star", ex: "Ein heller Stern steht am Himmel." },
          { w: "die Zeit", t: "the time", ex: "Wir haben heute genug Zeit." },
          { w: "ruhig", t: "calm / quiet", ex: "Der Morgen ist ruhig." }
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
    let currentLangKey = "fr";
    let baseSpeaker = "en";

    function renderInspector(key) {
      const data = languagesData[key];
      if (!data) return;
      currentLangKey = key;

      explorerGrid.querySelectorAll(".explorer-tile").forEach((t) => {
        t.classList.toggle("active", t.dataset.langId === key);
      });

      if (inspGreeting) inspGreeting.textContent = data.greeting;
      if (inspName) {
        const suffix = baseSpeaker === "de" ? "Für Deutschsprachige erklärt" : "Explained in English";
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
              <span>${c.w}</span>
              <span class="fc-hint">Reveal &amp; hear</span>
            </div>
            <div class="fc-back" hidden>
              <strong>${c.t}</strong> — ${c.ex}
            </div>
          `;
          btn.addEventListener("click", () => {
            const back = btn.querySelector(".fc-back");
            const hint = btn.querySelector(".fc-hint");
            const isHidden = back.hasAttribute("hidden");
            if (isHidden) {
              back.removeAttribute("hidden");
              hint.textContent = "Playing audio";
            } else {
              back.setAttribute("hidden", "");
              hint.textContent = "Reveal & hear";
            }
            speakText(c.w.replace(/\s*\([^)]*\)/g, ""), data.speechLang);
          });
          inspDeck.appendChild(btn);
        });
      }
    }

    explorerGrid.querySelectorAll(".explorer-tile").forEach((tile) => {
      tile.addEventListener("click", () => renderInspector(tile.dataset.langId));
    });

    if (inspSpeakBtn) {
      inspSpeakBtn.addEventListener("click", () => {
        const data = languagesData[currentLangKey];
        if (data) speakText(data.greeting, data.speechLang, inspSpeakBtn);
      });
    }

    document.querySelectorAll(".lang-filter").forEach((pill) => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".lang-filter").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        const filter = pill.dataset.filter;
        explorerGrid.querySelectorAll(".explorer-tile").forEach((tile) => {
          const group = tile.dataset.group;
          const visible = filter === "all" || filter === group;
          tile.hidden = !visible;
        });
      });
    });

    speakerToggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        speakerToggleBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        baseSpeaker = btn.dataset.speaker || "en";
        renderInspector(currentLangKey);
      });
    });

    renderInspector("fr");
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
