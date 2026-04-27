(() => {
  "use strict";

  const STORAGE_KEY = "theoremProgressV2";

  const SUBJECTS = ["math", "science", "english", "history", "coding", "language", "general"];

  const MISTAKE_TYPES = [
    "skipped_inverse_operation",
    "wrong_operation",
    "sign_error",
    "arithmetic_error",
    "combined_unlike_terms",
    "distribution_error",
    "variable_confusion",
    "incomplete_solution",
    "random_or_unclear"
  ];

  const subjectLabels = {
    math: "Math",
    science: "Science",
    english: "English / Reading",
    history: "Social Studies",
    coding: "Coding",
    language: "Foreign Language",
    general: "General Study"
  };

  const strategyLabels = {
    exact_math_tutor: "Exact Checking + Step Tutoring",
    memorization_plus_analysis: "Memory + Analysis",
    process_and_check: "Process + Recall",
    reading_analysis: "Reading + Evidence",
    code_understanding: "Code + Testing",
    language_recall: "Language Recall",
    general_active_recall: "Active Recall"
  };

  const skillLabels = {
    two_step_equations: "Two-step equations",
    combining_like_terms: "Combining like terms",
    distributive_property: "Distributive property"
  };

  const mistakeLabels = {
    skipped_inverse_operation: "Stopped at the middle step",
    wrong_operation: "Wrong inverse operation",
    sign_error: "Sign error",
    arithmetic_error: "Arithmetic slip",
    combined_unlike_terms: "Combined unlike terms",
    distribution_error: "Distribution error",
    variable_confusion: "Variable confusion",
    incomplete_solution: "Incomplete answer",
    random_or_unclear: "Unclear input"
  };

  const state = {
    progress: loadProgress(),
    session: null,
    currentIndex: 0,
    practiceSkill: "two_step_equations",
    practiceProblem: null,
    practiceAttemptSaved: false,
    activeHeroCard: 0
  };

  const els = {};

  const heroShowcase = [
    {
      subject: "History",
      title: "Cause, effect, and memory",
      detail: "Flashcards, timelines, creative tests, and short answers."
    },
    {
      subject: "Science",
      title: "Processes become practice",
      detail: "Key terms, process maps, quizzes, and teach-back checks."
    },
    {
      subject: "Math",
      title: "Exact checks when possible",
      detail: "Hints, answer checking, mistake diagnosis, and repair drills."
    },
    {
      subject: "Coding",
      title: "Understand the code path",
      detail: "Line explanations, edge cases, tests, and modification challenges."
    },
    {
      subject: "English",
      title: "Read with evidence",
      detail: "Main idea, claim, evidence, vocabulary, and teach-back prompts."
    }
  ];

  const problemBank = {
    two_step_equations: [
      makeTwoStep("2x + 5 = 17", 2, "+", 5, 17),
      makeTwoStep("3x + 4 = 19", 3, "+", 4, 19),
      makeTwoStep("5x + 2 = 27", 5, "+", 2, 27),
      makeTwoStep("4x - 3 = 21", 4, "-", 3, 21),
      makeTwoStep("6x - 5 = 31", 6, "-", 5, 31),
      makeTwoStep("7x + 1 = 36", 7, "+", 1, 36),
      makeTwoStep("8x - 4 = 44", 8, "-", 4, 44),
      makeTwoStep("9x + 6 = 51", 9, "+", 6, 51),
      makeTwoStep("3x - 7 = 14", 3, "-", 7, 14),
      makeTwoStep("10x + 5 = 65", 10, "+", 5, 65),
      makeTwoStep("2x - 9 = 15", 2, "-", 9, 15),
      makeTwoStep("4x + 8 = 32", 4, "+", 8, 32)
    ],
    combining_like_terms: [
      makeCombine("3x + 2x + 5", 3, 2, "+", 5),
      makeCombine("4x + x + 7", 4, 1, "+", 7),
      makeCombine("6x - 2x + 9", 6, -2, "+", 9),
      makeCombine("8x + 3x - 4", 8, 3, "-", 4),
      makeCombine("9x - 5x + 2", 9, -5, "+", 2),
      makeCombine("7x + 6x + 1", 7, 6, "+", 1),
      makeCombine("10x - 4x - 8", 10, -4, "-", 8),
      makeCombine("2x + 9x + 3", 2, 9, "+", 3),
      makeCombine("12x - 7x + 6", 12, -7, "+", 6),
      makeCombine("5x + 5x - 10", 5, 5, "-", 10)
    ],
    distributive_property: [
      makeDistribute("3(x + 4)", 3, "+", 4),
      makeDistribute("2(x + 5)", 2, "+", 5),
      makeDistribute("5(x - 2)", 5, "-", 2),
      makeDistribute("4(x + 3)", 4, "+", 3),
      makeDistribute("6(x - 1)", 6, "-", 1),
      makeDistribute("7(x + 2)", 7, "+", 2),
      makeDistribute("8(x - 3)", 8, "-", 3),
      makeDistribute("9(x + 1)", 9, "+", 1),
      makeDistribute("10(x - 4)", 10, "-", 4),
      makeDistribute("3(x - 6)", 3, "-", 6)
    ]
  };

  document.addEventListener("DOMContentLoaded", () => {
    startLoadingScreen();
    init();
  });

  function startLoadingScreen() {
    const loadingScreen = document.querySelector("#loadingScreen");
    const phrase = document.querySelector("#loadingPhrase");

    if (!loadingScreen || !phrase) return;

    loadingScreen.classList.remove("hide");

    const phrases = [
      "Reading the material…",
      "Detecting the subject…",
      "Choosing the best study mode…",
      "Preparing your workspace…"
    ];

    let index = 0;

    const phraseTimer = window.setInterval(() => {
      index = (index + 1) % phrases.length;
      phrase.textContent = phrases[index];
    }, 430);

    window.setTimeout(() => {
      window.clearInterval(phraseTimer);
      loadingScreen.classList.add("hide");
      document.body.classList.add("loaded");
    }, 2000);
  }

  function init() {
    cacheElements();
    bindNavigation();
    bindLearnWorkspace();
    bindPractice();
    bindProgress();
    bindCinematicUi();
    renderHeroShowcase();
    renderProgressDashboard();
    renderReview();
  }

  function cacheElements() {
    els.navToggle = document.querySelector("#navToggle") || document.querySelector(".nav-toggle");
    els.navLinks = document.querySelector("#navLinks") || document.querySelector("#mainNav") || document.querySelector(".nav-links");
    els.sections = Array.from(document.querySelectorAll(".app-section"));

    els.navButtons = Array.from(
      document.querySelectorAll("[data-section-target], [data-target]")
    );

    els.materialInput = document.querySelector("#materialInput");
    els.materialFile = document.querySelector("#materialFile");
    els.buildSessionBtn = document.querySelector("#buildSessionBtn");
    els.uploadMessage = document.querySelector("#uploadMessage");

    els.learnWorkspace = document.querySelector("#learnWorkspace");
    els.detectedSummary = document.querySelector("#detectedSummary");
    els.outlineList = document.querySelector("#outlineList");
    els.unsupportedList = document.querySelector("#unsupportedList");
    els.currentTutorCard = document.querySelector("#currentTutorCard");
    els.studyTools = document.querySelector("#studyTools");

    els.practiceShell = document.querySelector("#practiceShell");
    els.practiceSkillName = document.querySelector("#practiceSkillName");
    els.practiceTutorCard = document.querySelector("#practiceTutorCard");
    els.newPracticeProblemBtn = document.querySelector("#newPracticeProblemBtn");

    els.progressDashboard = document.querySelector("#progressDashboard");
    els.refreshProgressBtn = document.querySelector("#refreshProgressBtn");
    els.resetProgressBtn = document.querySelector("#resetProgressBtn");

    els.reviewGrid = document.querySelector("#reviewGrid") || document.querySelector("#reviewDashboard");

    els.heroShowcase = document.querySelector("#heroShowcase");
    els.heroShowcaseSubject = document.querySelector("#heroShowcaseSubject");
    els.heroShowcaseTitle = document.querySelector("#heroShowcaseTitle");
    els.heroShowcaseDetail = document.querySelector("#heroShowcaseDetail");
    els.heroShowcaseDots = document.querySelector("#heroShowcaseDots");
  }

  function bindCinematicUi() {
    document.body.classList.add("cinematic-ready");

    window.addEventListener("pointermove", (event) => {
      document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    });

    const animatedItems = Array.from(
      document.querySelectorAll(
        ".glass-card, .module-card, .workspace-panel, .stat-card, .review-card, .principle-card, .hero-copy, .hero-card"
      )
    );

    animatedItems.forEach((item) => item.classList.add("reveal-item"));

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );

      animatedItems.forEach((item) => observer.observe(item));
    } else {
      animatedItems.forEach((item) => item.classList.add("is-visible"));
    }

    document.querySelectorAll(".btn, .nav-link, .brand-button").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        button.style.setProperty("--button-x", `${x}px`);
        button.style.setProperty("--button-y", `${y}px`);
      });

      button.addEventListener("pointerleave", () => {
        button.style.removeProperty("--button-x");
        button.style.removeProperty("--button-y");
      });
    });
  }

  function renderHeroShowcase() {
    const hasDedicatedHero =
      els.heroShowcaseSubject &&
      els.heroShowcaseTitle &&
      els.heroShowcaseDetail;

    if (!hasDedicatedHero) return;

    updateHeroShowcase();

    if (els.heroShowcaseDots && !els.heroShowcaseDots.children.length) {
      heroShowcase.forEach((item, index) => {
        const dot = buttonEl(item.subject, "showcase-dot", () => {
          state.activeHeroCard = index;
          updateHeroShowcase();
        });

        els.heroShowcaseDots.append(dot);
      });
    }

    window.setInterval(() => {
      state.activeHeroCard = (state.activeHeroCard + 1) % heroShowcase.length;
      updateHeroShowcase();
    }, 2800);
  }

  function updateHeroShowcase() {
    const item = heroShowcase[state.activeHeroCard];

    if (!item || !els.heroShowcaseSubject || !els.heroShowcaseTitle || !els.heroShowcaseDetail) return;

    const parent = els.heroShowcase || els.heroShowcaseTitle.closest(".glass-card");

    if (parent) {
      parent.classList.remove("showcase-pop");
      window.requestAnimationFrame(() => {
        parent.classList.add("showcase-pop");
      });
    }

    els.heroShowcaseSubject.textContent = item.subject;
    els.heroShowcaseTitle.textContent = item.title;
    els.heroShowcaseDetail.textContent = item.detail;

    if (els.heroShowcaseDots) {
      Array.from(els.heroShowcaseDots.children).forEach((dot, index) => {
        dot.classList.toggle("active", index === state.activeHeroCard);
      });
    }
  }

  function bindNavigation() {
    if (els.navToggle && els.navLinks) {
      els.navToggle.addEventListener("click", () => {
        const open = els.navLinks.classList.toggle("open");
        els.navToggle.setAttribute("aria-expanded", String(open));
      });
    }

    els.navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.sectionTarget || button.dataset.target;
        showSection(normalizeSectionName(target));
      });
    });
  }

  function normalizeSectionName(name) {
    const map = {
      landing: "home",
      tutor: "learn"
    };

    return map[name] || name;
  }

  function showSection(name) {
    if (!name) return;

    els.sections.forEach((section) => {
      const matchesNew = section.id === `section-${name}`;
      const matchesOld = section.id === name;

      section.classList.toggle("active-section", matchesNew || matchesOld);
      section.classList.toggle("visible", matchesNew || matchesOld);
    });

    document.querySelectorAll(".nav-link").forEach((button) => {
      const target = normalizeSectionName(button.dataset.sectionTarget || button.dataset.target);
      button.classList.toggle("active", target === name);
    });

    if (els.navLinks) els.navLinks.classList.remove("open");
    if (els.navToggle) els.navToggle.setAttribute("aria-expanded", "false");

    document.body.dataset.activeSection = name;

    if (name === "progress") renderProgressDashboard();
    if (name === "review") renderReview();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function bindLearnWorkspace() {
    if (els.buildSessionBtn) {
      els.buildSessionBtn.addEventListener("click", buildLearningSession);
    }

    if (els.materialFile) {
      els.materialFile.addEventListener("change", handleFileUpload);
    }
  }

  function handleFileUpload() {
    const file = els.materialFile.files && els.materialFile.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const supported =
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      file.type === "text/plain" ||
      file.type === "text/markdown";

    if (!supported) {
      setStatus("Image and PDF upload is coming later. For now, paste the text or upload .txt/.md.");
      els.materialFile.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (els.materialInput) els.materialInput.value = String(reader.result || "");
      setStatus(`Loaded ${file.name}.`);
    };

    reader.onerror = () => {
      setStatus("Theorem could not read that file. Try pasting the text instead.");
    };

    reader.readAsText(file);
  }

  function buildLearningSession() {
    const text = (els.materialInput && els.materialInput.value ? els.materialInput.value : "").trim();

    if (!text) {
      setStatus("Paste notes, homework, study material, or code first.");
      return;
    }

    const detectedSubject = detectSubject(text);
    const strategy = chooseTeachingStrategy(text, detectedSubject);

    let session;

    if (strategy.strategy === "exact_math_tutor") {
      session = buildMathSession(text, strategy);
    } else if (strategy.strategy === "code_understanding") {
      session = buildCodeSession(text, strategy);
    } else {
      session = buildConceptSession(text, strategy);
    }

    state.session = session;
    state.currentIndex = 0;

    state.progress.sessions += 1;
    state.progress.materialsImported += 1;
    state.progress.subjectSessions[strategy.subject] =
      (state.progress.subjectSessions[strategy.subject] || 0) + 1;
    state.progress.lastSubject = strategy.subject;
    state.progress.lastStrategy = strategy.strategy;

    if (session.type === "math") {
      state.progress.problemsImported += session.items.filter((item) => item.supported).length;
      state.progress.unsupportedProblems += session.unsupported.length;
    }

    saveProgress();

    if (els.learnWorkspace) els.learnWorkspace.classList.remove("hidden");

    renderLearningSession();
    showSection("learn");
  }

  function detectSubject(text) {
    const t = text.toLowerCase();

    const scores = {
      coding: countMatches(t, [
        "function",
        "const ",
        "let ",
        "var ",
        "class ",
        "def ",
        "return",
        "if ",
        "for ",
        "while ",
        "{}",
        "{",
        "}",
        "console.log",
        "print("
      ]),
      math: countRegex(t, [
        /\bx\s*=/,
        /\bsimplify\b/,
        /\bsolve\b/,
        /\d\s*[+\-*/=()]\s*\d/,
        /\d*x\s*[+\-]/,
        /\d+\s*\(\s*x\s*[+\-]/
      ]),
      science: countMatches(t, [
        "cell",
        "energy",
        "force",
        "atom",
        "molecule",
        "photosynthesis",
        "ecosystem",
        "experiment",
        "hypothesis",
        "variable",
        "oxygen",
        "glucose",
        "carbon dioxide"
      ]),
      history: countMatches(t, [
        "war",
        "revolution",
        "government",
        "empire",
        "president",
        "colony",
        "colonial",
        "treaty",
        "rights",
        "economy",
        "civilization",
        "taxation",
        "representation",
        "resistance"
      ]),
      english: countMatches(t, [
        "theme",
        "character",
        "paragraph",
        "essay",
        "claim",
        "evidence",
        "author",
        "poem",
        "story",
        "argument",
        "quote"
      ]),
      language: countMatches(t, [
        "translate",
        "conjugate",
        "vocabulary",
        "spanish",
        "french",
        "german",
        "latin",
        "sentence"
      ])
    };

    let best = "general";
    let bestScore = 0;

    Object.entries(scores).forEach(([subject, score]) => {
      if (score > bestScore) {
        best = subject;
        bestScore = score;
      }
    });

    return best;
  }

  function chooseTeachingStrategy(text, detectedSubject) {
    const lower = text.toLowerCase();

    if (
      detectedSubject === "math" ||
      detectMathProblem(text) ||
      countRegex(lower, [/\d*x\s*[+\-]\s*\d+\s*=/, /\d+\s*\(\s*x\s*[+\-]\s*\d+\s*\)/]) > 0
    ) {
      return {
        subject: "math",
        strategy: "exact_math_tutor",
        tools: ["exact checking", "step-by-step tutoring", "hints", "mistake diagnosis", "repair drills", "mastery problems"]
      };
    }

    if (detectedSubject === "history") {
      return {
        subject: "history",
        strategy: "memorization_plus_analysis",
        tools: ["flashcards", "timeline/events", "cause & effect", "creative test", "short answer"]
      };
    }

    if (detectedSubject === "science") {
      return {
        subject: "science",
        strategy: "process_and_check",
        tools: ["key terms", "process breakdown", "cause/effect", "diagram-style explanation", "quiz", "teach-back"]
      };
    }

    if (detectedSubject === "english") {
      return {
        subject: "english",
        strategy: "reading_analysis",
        tools: ["main idea", "theme/claim detection", "vocabulary", "evidence practice", "short answer", "outline help"]
      };
    }

    if (detectedSubject === "coding") {
      return {
        subject: "coding",
        strategy: "code_understanding",
        tools: ["what the code does", "line-by-line explanation", "bug/edge-case questions", "test cases", "modification challenge"]
      };
    }

    if (detectedSubject === "language") {
      return {
        subject: "language",
        strategy: "language_recall",
        tools: ["vocabulary cards", "translation practice", "conjugation drill", "sentence building", "recall test"]
      };
    }

    return {
      subject: "general",
      strategy: "general_active_recall",
      tools: ["summary", "key ideas", "flashcards", "quiz", "teach-back", "review plan"]
    };
  }

  function buildMathSession(text, strategy) {
    const rawItems = splitMaterial(text);

    const items = rawItems.map((raw, index) => {
      const problem = detectMathProblem(raw);

      if (!problem) {
        return {
          id: `unsupported-${index}`,
          type: "unsupported",
          supported: false,
          raw
        };
      }

      return {
        id: `math-${index}`,
        type: "math",
        supported: true,
        raw,
        problem,
        hintIndex: 0,
        attempted: false,
        saved: false
      };
    });

    return {
      type: "math",
      subject: strategy.subject,
      strategy,
      items,
      unsupported: items.filter((item) => !item.supported),
      title: "Math exact-check session"
    };
  }

  function buildConceptSession(text, strategy) {
    const sentences = splitSentences(text);
    const terms = extractTerms(text, strategy.subject);

    return {
      type: "concept",
      subject: strategy.subject,
      strategy,
      title: labelSubject(strategy.subject),
      text,
      sentences,
      terms,
      summary: summarizeText(sentences),
      flashcards: makeFlashcards(text, terms, strategy.subject),
      quiz: makeConceptQuiz(sentences, terms, strategy.subject),
      causeEffect: makeCauseEffect(text, strategy.subject),
      timeline: makeTimeline(text),
      creative: makeCreativePrompts(strategy.subject, terms),
      shortAnswer: makeShortAnswerPrompts(strategy.subject),
      teachBack: terms.slice(0, 6)
    };
  }

  function buildCodeSession(text, strategy) {
    const lines = text
      .split(/\r?\n/)
      .map((line, index) => ({ number: index + 1, text: line }))
      .filter((line) => line.text.trim());

    return {
      type: "code",
      subject: strategy.subject,
      strategy,
      title: "Coding tutor session",
      text,
      lines,
      terms: extractCodeTerms(text),
      summary: summarizeCode(text),
      challenge: makeCodeChallenge(text)
    };
  }

  function renderLearningSession() {
    const session = state.session;
    if (!session) return;

    renderDetectedSummary(session);
    renderOutline(session);
    renderUnsupported(session);
    renderCurrentTutorCard(session);
    renderStudyTools(session);
    renderProgressDashboard();
    renderReview();
  }

  function renderDetectedSummary(session) {
    clear(els.detectedSummary);
    if (!els.detectedSummary) return;

    els.detectedSummary.append(
      statPill("Subject", labelSubject(session.subject)),
      statPill("Strategy", strategyLabels[session.strategy.strategy] || session.strategy.strategy)
    );

    if (session.type === "math") {
      els.detectedSummary.append(
        statPill("Supported", String(session.items.filter((item) => item.supported).length)),
        statPill("Unsupported", String(session.unsupported.length))
      );
    } else {
      els.detectedSummary.append(statPill("Key ideas", String(session.terms.length)));
    }
  }

  function renderOutline(session) {
    clear(els.outlineList);
    if (!els.outlineList) return;

    if (session.type === "math") {
      session.items.forEach((item, index) => {
        const label = item.supported ? item.problem.display : item.raw;
        const button = buttonEl(label, "outline-button", () => {
          if (!item.supported) return;
          state.currentIndex = index;
          renderLearningSession();
        });

        button.classList.toggle("active", state.currentIndex === index);
        button.disabled = !item.supported;
        els.outlineList.append(button);
      });

      return;
    }

    const outline =
      session.type === "code"
        ? ["What this code does", "Important lines", "Edge cases", "Explain a line", "Modification challenge"]
        : outlineForStrategy(session.strategy);

    outline.forEach((label, index) => {
      const button = buttonEl(label, "outline-button", () => {
        state.currentIndex = index;
        renderLearningSession();
      });

      button.classList.toggle("active", state.currentIndex === index);
      els.outlineList.append(button);
    });
  }

  function outlineForStrategy(strategy) {
    if (strategy.subject === "history") {
      return ["Summary", "Flashcards", "Timeline/Events", "Cause & Effect", "Creative Test", "Short Answer", "Teach-back"];
    }

    if (strategy.subject === "science") {
      return ["Summary", "Key Terms", "Process Breakdown", "Cause & Effect", "Quiz", "Teach-back"];
    }

    if (strategy.subject === "english") {
      return ["Summary", "Main Idea", "Vocabulary", "Evidence Practice", "Short Answer", "Teach-back"];
    }

    if (strategy.subject === "language") {
      return ["Vocabulary Cards", "Translation Practice", "Sentence Building", "Recall Test", "Teach-back"];
    }

    return ["Summary", "Key Terms", "Flashcards", "Quiz", "Teach-back"];
  }

  function renderUnsupported(session) {
    clear(els.unsupportedList);
    if (!els.unsupportedList) return;

    if (session.type !== "math" || !session.unsupported.length) return;

    els.unsupportedList.append(labelText("Unsupported", "micro-label"));

    session.unsupported.forEach((item) => {
      const card = div("unsupported-card");
      card.append(
        textP(item.raw),
        textP("Not supported yet — try typing this one manually or use a supported Algebra 1 format.", "muted")
      );
      els.unsupportedList.append(card);
    });
  }

  function renderCurrentTutorCard(session) {
    clear(els.currentTutorCard);
    if (!els.currentTutorCard) return;

    if (session.type === "math") {
      renderMathTutor(session);
    } else if (session.type === "code") {
      renderCodeTutor(session);
    } else {
      renderConceptTutor(session);
    }
  }

  function renderMathTutor(session) {
    const supportedItems = session.items.filter((item) => item.supported);

    if (!supportedItems.length) {
      els.currentTutorCard.append(
        heading("No supported math found", 3),
        textP("Try Algebra 1 formats like 2x + 5 = 17, 3x + 2x + 5, or 3(x + 4).")
      );
      return;
    }

    let item = session.items[state.currentIndex];

    if (!item || !item.supported) {
      const firstIndex = session.items.findIndex((candidate) => candidate.supported);
      state.currentIndex = firstIndex;
      item = session.items[firstIndex];
    }

    els.currentTutorCard.append(
      renderProblemCard(item.problem, {
        context: "learn",
        item,
        onNext: () => {
          state.currentIndex = nextSupportedIndex(session.items, state.currentIndex);
          renderLearningSession();
        }
      })
    );
  }

  function renderConceptTutor(session) {
    const labels = outlineForStrategy(session.strategy);
    const current = labels[state.currentIndex] || labels[0];

    if (current === "Summary") {
      const card = div("concept-summary");
      card.append(
        heading("Based on the material you pasted...", 3),
        textP(`Theorem thinks the best study mode is ${strategyLabels[session.strategy.strategy]}. Check this against your class notes.`, "muted")
      );

      session.summary.forEach((line) => card.append(textP(line)));
      els.currentTutorCard.append(card);
      return;
    }

    if (current === "Key Terms" || current === "Main Idea") {
      els.currentTutorCard.append(
        heading(current, 3),
        textP("Theorem found these likely key ideas. Check them against your class notes.", "muted"),
        list(session.terms, "term-list")
      );
      return;
    }

    if (current === "Flashcards" || current === "Vocabulary Cards") {
      renderFlashcards(session);
      return;
    }

    if (current === "Timeline/Events") {
      els.currentTutorCard.append(
        heading("Timeline / Events", 3),
        textP("Based on the material you pasted, these look like possible events, people, or time markers.", "muted"),
        list(session.timeline, "timeline-list")
      );
      return;
    }

    if (current === "Cause & Effect") {
      els.currentTutorCard.append(
        heading("Cause & Effect", 3),
        textP("Use these to explain why events or ideas connect.", "muted"),
        list(session.causeEffect, "cause-effect-list")
      );
      return;
    }

    if (current === "Process Breakdown") {
      els.currentTutorCard.append(
        heading("Process Breakdown", 3),
        textP("Turn the notes into a step-by-step explanation.", "muted"),
        list(makeProcessBreakdown(session.sentences), "checklist")
      );
      return;
    }

    if (current === "Creative Test") {
      els.currentTutorCard.append(
        heading("Creative-thinking test", 3),
        textP("These questions test whether you understand the idea, not just the words.", "muted"),
        list(session.creative, "checklist")
      );
      return;
    }

    if (
      current === "Short Answer" ||
      current === "Evidence Practice" ||
      current === "Translation Practice" ||
      current === "Sentence Building" ||
      current === "Recall Test" ||
      current === "Quiz"
    ) {
      renderQuizLike(session, current);
      return;
    }

    renderTeachBack(session);
  }

  function renderFlashcards(session) {
    const box = div("flashcard-list");

    session.flashcards.forEach((card, index) => {
      const item = div("flashcard");
      const reviewed = buttonEl("Mark reviewed", "btn btn-secondary", () => {
        state.progress.flashcardsReviewed += 1;
        saveProgress();
        buttonSetDone(reviewed, "Reviewed");
      });

      item.append(strong(`Card ${index + 1}: ${card.front}`), textP(card.back), reviewed);
      box.append(item);
    });

    els.currentTutorCard.append(
      heading("Flashcards", 3),
      textP("Try to answer before reading the back.", "muted"),
      box
    );
  }

  function renderQuizLike(session, title) {
    const box = div("quiz-list");
    const questions = title === "Short Answer" ? session.shortAnswer : session.quiz;

    questions.forEach((question, index) => {
      const card = div("quiz-card");
      const prompt = typeof question === "string" ? question : question.question;

      card.append(strong(`Question ${index + 1}`), textP(prompt));

      if (typeof question !== "string" && question.options) {
        const options = div("quiz-options");

        question.options.forEach((option) => {
          options.append(
            buttonEl(option, "quiz-option", (event) => {
              Array.from(options.children).forEach((child) => child.classList.remove("selected"));
              event.currentTarget.classList.add("selected");
              state.progress.conceptQuizzesCompleted += 1;
              saveProgress();
            })
          );
        });

        card.append(options);
      } else {
        const input = document.createElement("textarea");
        input.setAttribute("aria-label", prompt);
        input.placeholder = "Answer in your own words.";

        const check = buttonEl("Check key words", "btn btn-secondary", () => {
          const result = checkTerms(input.value, session.terms.slice(0, 5));
          card.append(feedbackBox("Self-check", result.message));
          state.progress.conceptQuizzesCompleted += 1;
          addWeakTerms(result.missing);
          saveProgress();
        });

        card.append(input, check);
      }

      box.append(card);
    });

    els.currentTutorCard.append(
      heading(title, 3),
      textP("Theorem can check key words, but not perfectly grade open-ended answers.", "muted"),
      box
    );
  }

  function renderTeachBack(session) {
    const input = document.createElement("textarea");
    input.placeholder = "Explain the idea in your own words.";
    input.setAttribute("aria-label", "Teach-back answer");

    const output = div("tool-card");

    const check = buttonEl("Check my explanation", "btn btn-primary", () => {
      clear(output);
      const result = checkTerms(input.value, session.teachBack);

      output.append(
        strong("Teach-back checklist"),
        textP(result.message),
        list(session.teachBack, "checklist")
      );

      state.progress.teachBackAttempts += 1;
      addWeakTerms(result.missing);
      saveProgress();
    });

    els.currentTutorCard.append(
      heading("Teach-back mode", 3),
      textP("Explain first. Then use the checklist to revise.", "muted"),
      input,
      div("actions", [check]),
      output
    );
  }

  function renderCodeTutor(session) {
    const index = state.currentIndex;

    if (index === 0) {
      els.currentTutorCard.append(
        heading("What this code appears to do", 3),
        textP("Based on the code you pasted, check this against your assignment instructions.", "muted"),
        textP(session.summary)
      );
      return;
    }

    if (index === 1) {
      const items = session.lines.slice(0, 12).map((line) => `Line ${line.number}: ${line.text.trim()}`);
      els.currentTutorCard.append(heading("Important lines", 3), list(items, "line-list"));
      return;
    }

    if (index === 2) {
      els.currentTutorCard.append(
        heading("Possible bugs or edge cases", 3),
        textP("These are safe questions to test locally.", "muted"),
        list([
          "What happens with empty input?",
          "What happens with very large input?",
          "What happens if the type is different than expected?",
          "Does the function return a value every time?"
        ], "checklist")
      );
      return;
    }

    if (index === 3) {
      const line = session.lines[0] ? session.lines[0].text.trim() : "the first line";
      const input = document.createElement("textarea");
      input.placeholder = `Explain this line: ${line}`;

      const check = buttonEl("Save teach-back", "btn btn-primary", () => {
        state.progress.teachBackAttempts += 1;
        saveProgress();
        buttonSetDone(check, "Saved");
      });

      els.currentTutorCard.append(heading("Explain this line", 3), textP(line), input, div("actions", [check]));
      return;
    }

    els.currentTutorCard.append(
      heading("Modification challenge", 3),
      textP(session.challenge),
      textP("Next action: make the smallest change, then write one test case before running it.", "muted")
    );
  }

  function renderStudyTools(session) {
    clear(els.studyTools);
    if (!els.studyTools) return;

    const tools = div("tool-list");

    tools.append(
      toolCard("Detected subject", labelSubject(session.subject)),
      toolCard("Chosen strategy", strategyLabels[session.strategy.strategy] || session.strategy.strategy),
      toolCard("Learning tools generated", session.strategy.tools.join(", "))
    );

    if (session.type === "math") {
      tools.append(
        toolCard("Rule", "No answer before attempt. Hints are allowed."),
        toolCard("Next action", "Solve the current problem, then use the repair drill if needed."),
        toolCard("Accuracy", `${percent(state.progress.correctAnswers, state.progress.mathProblemsAttempted)}% math accuracy`)
      );
    } else if (session.type === "code") {
      tools.append(
        toolCard("Best move", "Explain one line, then write one small test case."),
        toolCard("No fake grading", "Theorem guides your reasoning without pretending to run your code."),
        toolCard("Terms found", session.terms.join(", ") || "No strong coding terms found")
      );
    } else {
      tools.append(
        toolCard("Study rule", "Retrieve before reading. Explain before checking."),
        toolCard("Key terms", session.terms.slice(0, 6).join(", ") || "No strong terms found"),
        toolCard("Reminder", "Based on the material you pasted. Check this against your class notes.")
      );
    }

    els.studyTools.append(tools);
  }

  function bindPractice() {
    document.querySelectorAll("[data-practice-skill]").forEach((button) => {
      button.addEventListener("click", () => {
        state.practiceSkill = button.dataset.practiceSkill;
        state.practiceProblem = randomProblem(state.practiceSkill);
        state.practiceAttemptSaved = false;

        if (els.practiceShell) els.practiceShell.classList.remove("hidden");
        if (els.practiceSkillName) els.practiceSkillName.textContent = titleSkill(state.practiceSkill);

        renderPracticeProblem();
      });
    });

    if (els.newPracticeProblemBtn) {
      els.newPracticeProblemBtn.addEventListener("click", () => {
        state.practiceProblem = randomProblem(state.practiceSkill);
        state.practiceAttemptSaved = false;
        renderPracticeProblem();
      });
    }
  }

  function renderPracticeProblem() {
    if (!els.practiceTutorCard) return;

    clear(els.practiceTutorCard);

    if (!state.practiceProblem) {
      state.practiceProblem = randomProblem(state.practiceSkill);
    }

    els.practiceTutorCard.append(
      renderProblemCard(state.practiceProblem, {
        context: "practice",
        onNext: () => {
          state.practiceProblem = randomProblem(state.practiceSkill);
          state.practiceAttemptSaved = false;
          renderPracticeProblem();
        }
      })
    );
  }

  function renderProblemCard(problem, options) {
    const wrapper = document.createElement("article");

    const title = div("problem-header");
    title.append(heading(problem.skillLabel, 3), span(problem.topic, "problem-pill"));

    const stage = div("problem-stage");
    stage.append(
      labelText("Problem", "micro-label"),
      div("problem-display", null, problem.display),
      textP(problem.instruction, "problem-instruction")
    );

    const form = document.createElement("form");
    form.className = "answer-form";

    const inputId = `answer-${Math.random().toString(36).slice(2)}`;

    const label = document.createElement("label");
    label.setAttribute("for", inputId);
    label.textContent = "Your answer";

    const row = div("answer-row");

    const input = document.createElement("input");
    input.id = inputId;
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = problem.answerPlaceholder;

    const submit = buttonEl("Check answer", "btn btn-primary");

    row.append(input, submit);
    form.append(label, row);

    const hintZone = div("hint-zone");
    const hintButton = buttonEl("Show hint", "btn btn-ghost");
    const hintText = textP("", "hint-text");

    let hintIndex = options.item ? options.item.hintIndex || 0 : 0;

    hintButton.addEventListener("click", () => {
      hintText.textContent = problem.hints[Math.min(hintIndex, problem.hints.length - 1)];
      hintIndex += 1;

      if (options.item) options.item.hintIndex = hintIndex;

      if (hintIndex >= problem.hints.length) {
        hintButton.disabled = true;
        hintButton.textContent = "No more hints";
      } else {
        hintButton.textContent = `Show hint ${hintIndex + 1}`;
      }
    });

    hintZone.append(hintButton, hintText);

    const feedback = div("feedback-root");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const result = checkAnswer(problem, input.value);

      if (options.item) options.item.attempted = true;

      if (options.context === "learn" && options.item && !options.item.saved) {
        saveMathAttempt(problem, result);
        options.item.saved = true;
      } else if (options.context === "practice" && !state.practiceAttemptSaved) {
        saveMathAttempt(problem, result);
        state.practiceAttemptSaved = true;
      }

      clear(feedback);
      feedback.append(renderMathFeedback(problem, result, options.onNext));

      renderProgressDashboard();
      renderReview();
    });

    wrapper.append(title, stage, form, hintZone, feedback);
    return wrapper;
  }

  function renderMathFeedback(problem, result, onNext) {
    const panel = div(`feedback-panel ${result.correct ? "correct" : "repair-needed"}`);
    panel.append(div("feedback-title", null, result.correct ? "Correct." : "Not quite — here’s the likely break."));

    if (result.correct) {
      panel.append(textP(problem.correctMessage));
      panel.append(div("actions", [buttonEl("Next challenge", "btn btn-primary", onNext)]));
      return panel;
    }

    const repair = result.repairDrill || problem;

    const grid = div("feedback-grid");
    grid.append(
      feedbackBox("Likely mistake", result.message),
      feedbackBox("Why it happened", result.why),
      feedbackBox("Tiny fix", result.fix),
      feedbackBox("Repair drill", repair.display)
    );

    panel.append(grid, strong("Correct steps"), list(problem.steps, "steps-list"));

    panel.append(
      div("actions", [
        buttonEl("Try repair drill", "btn btn-secondary", () => {
          const session = buildMathSession(repair.display, chooseTeachingStrategy(repair.display, "math"));
          state.session = session;
          state.currentIndex = 0;

          if (els.learnWorkspace) els.learnWorkspace.classList.remove("hidden");

          renderLearningSession();
          showSection("learn");
        }),
        buttonEl("Next problem", "btn btn-primary", onNext)
      ])
    );

    return panel;
  }

  function saveMathAttempt(problem, result) {
    state.progress.mathProblemsAttempted += 1;

    if (result.correct) {
      state.progress.correctAnswers += 1;
    } else {
      state.progress.mistakes[result.mistakeType] = (state.progress.mistakes[result.mistakeType] || 0) + 1;
      addWeakSubject("math");
    }

    const skill = state.progress.skills[problem.skill] || { attempts: 0, correct: 0 };
    skill.attempts += 1;
    if (result.correct) skill.correct += 1;
    state.progress.skills[problem.skill] = skill;

    state.progress.recentAttempts.unshift({
      subject: "math",
      skill: problem.skill,
      correct: result.correct,
      mistake: result.mistakeType || null,
      at: new Date().toISOString()
    });

    state.progress.recentAttempts = state.progress.recentAttempts.slice(0, 20);

    saveProgress();
  }

  function checkAnswer(problem, input) {
    if (!input || !input.trim()) {
      return diagnoseMistake(problem, input, "incomplete_solution");
    }

    if (problem.kind === "equation") {
      const value = parseNumericAnswer(input);

      if (value !== null && nearly(value, problem.correctAnswer)) {
        return { correct: true };
      }

      return diagnoseMistake(problem, input);
    }

    const parsed = parseLinearExpression(input);

    if (parsed && parsed.x === problem.correctAnswer.x && parsed.c === problem.correctAnswer.c) {
      return { correct: true };
    }

    return diagnoseMistake(problem, input);
  }

  function diagnoseMistake(problem, input, forced) {
    const normalized = String(input || "").trim().toLowerCase();
    const number = parseNumericAnswer(normalized);
    const expression = parseLinearExpression(normalized);

    let mistakeType = forced || "random_or_unclear";
    let message = "Theorem is not sure which mistake happened, but here is the safest next step.";
    let why = "The answer does not match the structure Theorem expected.";
    let fix = "Go one step at a time and check whether each operation was undone or distributed correctly.";

    if (problem.kind === "equation") {
      if (forced === "incomplete_solution" || normalized === "") {
        mistakeType = "incomplete_solution";
        message = "Enter a number for x, like 6 or x = 6.";
        why = "Theorem needs an attempted value before showing the worked steps.";
        fix = "Type the value you think x equals.";
      } else if (number !== null) {
        if (nearly(number, problem.middleValue)) {
          mistakeType = "skipped_inverse_operation";
          message = `You reached ${problem.coefficient}x = ${formatNumber(problem.middleValue)}, but stopped before solving for x.`;
          why = `x is still multiplied by ${problem.coefficient}.`;
          fix = `Divide both sides by ${problem.coefficient}.`;
        } else if (nearly(number, -problem.correctAnswer)) {
          mistakeType = "sign_error";
          message = "The size is right, but the sign changed.";
          why = "A negative may have appeared during an inverse operation.";
          fix = "Track the sign on each side after every operation.";
        } else if (nearly(number, problem.wrongInverseValue)) {
          mistakeType = "wrong_operation";
          message = "You used the wrong inverse operation.";
          why = `The constant is ${problem.sign}${problem.constant}, so you undo it with the opposite operation.`;
          fix = problem.sign === "+" ? `Subtract ${problem.constant} first.` : `Add ${problem.constant} first.`;
        } else {
          mistakeType = "arithmetic_error";
          message = "Your setup may be right, but one calculation is off.";
          why = "The final value does not satisfy the original equation.";
          fix = "Substitute your answer back into the original equation to check it.";
        }
      }
    } else if (problem.kind === "combine") {
      if (expression) {
        if (expression.c === 0 && problem.correctAnswer.c !== 0) {
          mistakeType = "incomplete_solution";
          message = "You combined the x terms but dropped the constant.";
          why = "Constants without x do not disappear.";
          fix = "Bring the constant along unchanged.";
        } else if (expression.x !== problem.correctAnswer.x && expression.c === problem.correctAnswer.c) {
          mistakeType = "arithmetic_error";
          message = "The constant is right, but the x coefficient is off.";
          why = "The like terms were combined with a calculation error.";
          fix = "Add or subtract only the coefficients in front of x.";
        } else {
          mistakeType = "combined_unlike_terms";
          message = "It looks like x terms and constants were combined together.";
          why = "Terms with x and terms without x are unlike terms.";
          fix = "Combine x terms with x terms. Keep constants separate.";
        }
      }
    } else if (problem.kind === "distribute") {
      if (expression) {
        if (expression.x === problem.coefficient && expression.c === problem.insideConstant) {
          mistakeType = "distribution_error";
          message = "You distributed to x but not to the second term.";
          why = "The outside number multiplies every term inside parentheses.";
          fix = `Multiply ${problem.coefficient} by ${problem.insideConstant} too.`;
        } else {
          mistakeType = "distribution_error";
          message = "The distribution pattern is off.";
          why = "Each term inside the parentheses must be multiplied by the outside number.";
          fix = "Use a(b + c) = ab + ac.";
        }
      }
    }

    return {
      correct: false,
      mistakeType,
      message,
      why,
      fix,
      repairDrill: problem.repairDrill || problem
    };
  }

  function detectMathProblem(raw) {
    const text = String(raw || "").replace(/^\s*(solve|simplify)\s*:?\s*/i, "").trim();

    const equation = text.match(/^([+-]?\d*)x\s*([+-])\s*(\d+)\s*=\s*([+-]?\d+)$/i);
    if (equation) {
      const coefficient = parseCoefficient(equation[1]);
      return makeTwoStep(text, coefficient, equation[2], Number(equation[3]), Number(equation[4]));
    }

    const distribute = text.match(/^([+-]?\d+)\s*\(\s*x\s*([+-])\s*(\d+)\s*\)$/i);
    if (distribute) {
      return makeDistribute(text, Number(distribute[1]), distribute[2], Number(distribute[3]));
    }

    const combined = text.match(/^([+-]?\d*)x\s*([+-])\s*([+-]?\d*)x\s*([+-])\s*(\d+)$/i);
    if (combined) {
      const a = parseCoefficient(combined[1]);
      const b = parseCoefficient(combined[3]);
      const signedB = combined[2] === "-" ? -Math.abs(b) : b;
      return makeCombine(text, a, signedB, combined[4], Number(combined[5]));
    }

    return null;
  }

  function makeTwoStep(display, coefficient, sign, constant, right, withRepair = true) {
    const middleValue = sign === "+" ? right - constant : right + constant;
    const correct = middleValue / coefficient;
    const wrongInverseValue = sign === "+" ? (right + constant) / coefficient : (right - constant) / coefficient;
    const repairRight = (coefficient + 1) * (correct + 1) + constant;
    const repairDisplay = `${coefficient + 1}x + ${constant} = ${formatNumber(repairRight)}`;

    return {
      id: `eq-${display}`,
      kind: "equation",
      topic: "Algebra 1",
      skill: "two_step_equations",
      skillLabel: "Two-step equations",
      display,
      instruction: "Solve for x.",
      answerPlaceholder: "Example: x = 6",
      coefficient,
      sign,
      constant,
      right,
      middleValue,
      wrongInverseValue,
      correctAnswer: correct,
      correctMessage: `x = ${formatNumber(correct)} works because substituting it back makes both sides equal.`,
      steps: [display, `${coefficient}x = ${formatNumber(middleValue)}`, `x = ${formatNumber(correct)}`],
      hints: [
        "Undo the operation farthest from x first.",
        sign === "+" ? `Start by subtracting ${constant} from both sides.` : `Start by adding ${constant} to both sides.`,
        `You should get ${coefficient}x = ${formatNumber(middleValue)} before dividing.`
      ],
      repairDrill: withRepair
        ? makeTwoStep(repairDisplay, coefficient + 1, "+", constant, repairRight, false)
        : null
    };
  }

  function makeCombine(display, a, b, constSign, constant, withRepair = true) {
    const c = constSign === "-" ? -Math.abs(constant) : Math.abs(constant);
    const x = a + b;

    return {
      id: `combine-${display}`,
      kind: "combine",
      topic: "Algebra 1",
      skill: "combining_like_terms",
      skillLabel: "Combining like terms",
      display,
      instruction: "Simplify the expression.",
      answerPlaceholder: "Example: 5x + 5",
      correctAnswer: { x, c },
      correctMessage: `The x terms combine to ${formatTerm(x, "x")}, and the constant stays ${formatSigned(c)}.`,
      steps: [display, `${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}x ${formatSigned(c)}`, formatExpression(x, c)],
      hints: [
        "Like terms have the same variable part.",
        "Combine only the x coefficients first.",
        `The constant ${formatSigned(c)} stays separate.`
      ],
      repairDrill: withRepair
        ? makeCombine(`2x + 3x + ${Math.abs(c || 5)}`, 2, 3, "+", Math.abs(c || 5), false)
        : null
    };
  }

  function makeDistribute(display, coefficient, sign, insideConstant, withRepair = true) {
    const c = sign === "-" ? -coefficient * insideConstant : coefficient * insideConstant;

    return {
      id: `dist-${display}`,
      kind: "distribute",
      topic: "Algebra 1",
      skill: "distributive_property",
      skillLabel: "Distributive property",
      display,
      instruction: "Simplify using distribution.",
      answerPlaceholder: "Example: 3x + 12",
      coefficient,
      sign,
      insideConstant,
      correctAnswer: { x: coefficient, c },
      correctMessage: `${coefficient} multiplies both x and ${insideConstant}.`,
      steps: [display, `${coefficient} · x ${sign} ${coefficient} · ${insideConstant}`, formatExpression(coefficient, c)],
      hints: [
        "The outside number multiplies every term inside parentheses.",
        `First multiply ${coefficient} by x.`,
        `Then multiply ${coefficient} by ${insideConstant}.`
      ],
      repairDrill: withRepair
        ? makeDistribute(`${coefficient + 1}(x + ${insideConstant})`, coefficient + 1, "+", insideConstant, false)
        : null
    };
  }

  function splitMaterial(text) {
    return String(text)
      .replace(/\r/g, "")
      .split(/\n|;|(?=\s*\d+\.\s+)|(?=\s*[-•*]\s+)/)
      .map((line) => line.replace(/^\s*(\d+\.|[-•*])\s*/, "").trim())
      .filter(Boolean);
  }

  function splitSentences(text) {
    return String(text)
      .replace(/\s+/g, " ")
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 8)
      .slice(0, 16);
  }

  function summarizeText(sentences) {
    if (!sentences.length) {
      return ["Theorem found short material. Try adding more notes for a better summary."];
    }

    return sentences.slice(0, 4).map((sentence) => `• ${sentence}`);
  }

  function extractTerms(text, subject) {
    const lower = String(text).toLowerCase();

    const stop = new Set([
      "the", "and", "that", "with", "from", "this", "into", "were", "was", "are",
      "for", "you", "your", "use", "uses", "have", "has", "not", "but", "can",
      "will", "they", "their", "about", "because", "process"
    ]);

    const words = lower.match(/\b[a-z][a-z]{3,}\b/g) || [];
    const counts = {};

    words.forEach((word) => {
      if (!stop.has(word)) counts[word] = (counts[word] || 0) + 1;
    });

    const repeated = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    const capitalized = Array.from(
      new Set((String(text).match(/\b[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{3,})?\b/g) || []).slice(0, 8))
    );

    const subjectTerms = {
      science: ["energy", "cell", "photosynthesis", "molecule", "ecosystem", "hypothesis", "variable", "oxygen", "glucose"],
      history: ["revolution", "government", "colony", "rights", "treaty", "economy", "civilization", "taxation", "representation", "resistance"],
      english: ["theme", "claim", "evidence", "character", "author", "argument"],
      language: ["translate", "conjugate", "vocabulary", "sentence"],
      general: []
    }[subject] || [];

    return Array.from(new Set([...subjectTerms.filter((term) => lower.includes(term)), ...capitalized, ...repeated])).slice(0, 12);
  }

  function makeFlashcards(text, terms, subject) {
    const sentences = splitSentences(text);
    const cards = [];

    sentences.forEach((sentence) => {
      const definition = sentence.match(/^(.+?)\s+(is|are|means|refers to)\s+(.+)$/i);
      if (definition && cards.length < 5) {
        cards.push({
          front: `What is ${definition[1].trim()}?`,
          back: definition[3].trim()
        });
      }
    });

    if (subject === "history" && String(text).toLowerCase().includes("american revolution")) {
      cards.push(
        {
          front: "What was one cause of the American Revolution?",
          back: "Taxation, lack of representation, or colonial resistance."
        },
        {
          front: "What does “taxation without representation” mean?",
          back: "Colonists were taxed by a government where they had no elected representatives."
        }
      );
    }

    terms.slice(0, 6).forEach((term) => {
      if (cards.length < 8) {
        cards.push({
          front: `What should you remember about ${term}?`,
          back: `Check your notes for how ${term} connects to the main idea.`
        });
      }
    });

    return cards.length
      ? cards.slice(0, 8)
      : [{ front: "What is the main idea?", back: "Use your notes to explain the most important point in one sentence." }];
  }

  function makeConceptQuiz(sentences, terms, subject) {
    const key = terms[0] || "the main idea";

    if (subject === "history") {
      return [
        { question: "Why did this event or idea matter?" },
        { question: `Explain ${key} in your own words.` },
        { question: "What is one cause and one effect from the material?" }
      ];
    }

    if (subject === "science") {
      return [
        { question: `Explain ${key} in your own words.` },
        { question: "What causes the process or effect described in the material?" },
        { question: "What variables, inputs, or outputs are mentioned?" }
      ];
    }

    if (subject === "english") {
      return [
        { question: "What is the main idea or theme?" },
        { question: "What evidence from the text supports that idea?" },
        { question: "Explain the claim-evidence-reasoning pattern." }
      ];
    }

    return [
      { question: `Explain ${key} in your own words.` },
      {
        question: "Which term appears most important based on the text?",
        options: terms.slice(0, 4).length ? terms.slice(0, 4) : ["main idea", "detail", "example", "definition"]
      },
      { question: "What is one connection between two ideas in the material?" }
    ];
  }

  function makeCauseEffect(text, subject) {
    const lower = String(text).toLowerCase();
    const results = [];

    if (subject === "history" && lower.includes("taxation")) {
      results.push("Cause: taxation without representation → Effect: colonial resistance increased");
    }

    if (subject === "history" && lower.includes("lack of representation")) {
      results.push("Cause: lack of representation → Effect: colonists believed British rule was unfair");
    }

    if (subject === "science" && lower.includes("photosynthesis")) {
      results.push("Cause: sunlight, carbon dioxide, and water are available → Effect: plants produce glucose and oxygen");
    }

    if (!results.length) {
      results.push(
        "Cause: one important event or condition from your notes → Effect: what changed because of it",
        "Cause: a choice, process, or pressure → Effect: the result you should be able to explain"
      );
    }

    return results;
  }

  function makeTimeline(text) {
    const sentences = splitSentences(text);
    const dated = sentences.filter((sentence) => /\b\d{3,4}\b|war|revolution|treaty|president|empire|colony|colonial/i.test(sentence));

    if (dated.length) return dated.slice(0, 8);

    return [
      "Find the first event or idea in the material.",
      "Find what happened next.",
      "Explain what changed by the end."
    ];
  }

  function makeCreativePrompts(subject, terms) {
    if (subject === "history") {
      return [
        "Explain why people at the time may have believed this was unfair or necessary.",
        "Compare this event or idea to another protest, conflict, or government decision.",
        "What might have happened if one major decision had gone differently?"
      ];
    }

    if (subject === "science") {
      return [
        "Explain the process as if you were drawing a diagram with arrows.",
        "Predict what would happen if one input or variable changed.",
        "Create a simple real-world example of this concept."
      ];
    }

    if (subject === "english") {
      return [
        "Find one claim or main idea.",
        "Choose one piece of evidence and explain why it matters.",
        "Rewrite the idea in clearer words."
      ];
    }

    return [
      `Explain why ${terms[0] || "the main idea"} matters.`,
      "Create your own example.",
      "Compare this idea to something you already know."
    ];
  }

  function makeShortAnswerPrompts(subject) {
    if (subject === "history") {
      return [
        "Name two causes from the material and explain one.",
        "Describe one effect and why it mattered.",
        "Use one key term in a complete explanation."
      ];
    }

    if (subject === "science") {
      return [
        "Name the inputs and outputs of the process.",
        "Explain one cause-and-effect relationship.",
        "Define one key term and use it in an example."
      ];
    }

    if (subject === "english") {
      return [
        "State the main idea in one sentence.",
        "Give one piece of evidence and explain it.",
        "Write a claim using one key term."
      ];
    }

    return [
      "State the main idea in one sentence.",
      "Explain one key term.",
      "Connect two ideas from the material."
    ];
  }

  function makeProcessBreakdown(sentences) {
    if (!sentences.length) {
      return ["Step 1: Identify inputs.", "Step 2: Explain the process.", "Step 3: Name the output or result."];
    }

    return sentences.slice(0, 5).map((sentence, index) => `Step ${index + 1}: ${sentence}`);
  }

  function checkTerms(answer, required) {
    const lower = String(answer || "").toLowerCase();
    const missing = required.filter((term) => !lower.includes(String(term).toLowerCase()));

    if (!String(answer || "").trim()) {
      return {
        missing: required,
        message: "Write an explanation first. Then compare it to the checklist."
      };
    }

    if (!missing.length) {
      return {
        missing: [],
        message: "Good coverage. Your explanation includes the key terms Theorem checked."
      };
    }

    return {
      missing,
      message: `You may be missing: ${missing.join(", ")}. Revise and try again.`
    };
  }

  function extractCodeTerms(text) {
    const terms = [];

    if (/function|def\s+/.test(text)) terms.push("function");
    if (/return/.test(text)) terms.push("return value");
    if (/for\s*\(|while\s*\(|for\s+/.test(text)) terms.push("loop");
    if (/if\s*\(/.test(text)) terms.push("conditional");
    if (/class\s+/.test(text)) terms.push("class");
    if (/const|let|var/.test(text)) terms.push("variable");

    return terms;
  }

  function summarizeCode(text) {
    const functionMatch = String(text).match(/function\s+([a-zA-Z_$][\w$]*)/);
    if (functionMatch) {
      return `This appears to define a function named ${functionMatch[1]}. Look at its parameters, return value, and edge cases.`;
    }

    const pythonMatch = String(text).match(/def\s+([a-zA-Z_]\w*)/);
    if (pythonMatch) {
      return `This appears to define a Python function named ${pythonMatch[1]}. Check inputs, branches, and return values.`;
    }

    const classMatch = String(text).match(/class\s+([a-zA-Z_$][\w$]*)/);
    if (classMatch) {
      return `This appears to define a class named ${classMatch[1]}. Check its fields and methods.`;
    }

    return "This appears to be code or pseudocode. Start by identifying inputs, outputs, and the smallest test case.";
  }

  function makeCodeChallenge(text) {
    if (/add|sum|total/i.test(text)) {
      return "Modify the code so it handles zero, negative numbers, and one larger test case.";
    }

    if (/return/i.test(text)) {
      return "Add one condition before the return and write a test for that condition.";
    }

    return "Change one small behavior, then write the expected input and output before running it.";
  }

  function renderProgressDashboard() {
    if (!els.progressDashboard) return;

    clear(els.progressDashboard);

    const progress = state.progress;
    const subjects = Object.entries(progress.subjectSessions).sort((a, b) => b[1] - a[1]);
    const mostStudied = subjects[0] && subjects[0][1] > 0 ? subjects[0][0] : "None yet";

    const weakestSkill =
      Object.entries(progress.skills)
        .filter(([, stats]) => stats.attempts > 0)
        .sort((a, b) => skillAccuracy(a[1]) - skillAccuracy(b[1]))[0]?.[0] || "None yet";

    const commonMistake =
      Object.entries(progress.mistakes)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "None yet";

    els.progressDashboard.append(
      statCard("Sessions", progress.sessions),
      statCard("Most studied", labelSubject(mostStudied)),
      statCard("Math accuracy", `${percent(progress.correctAnswers, progress.mathProblemsAttempted)}%`),
      statCard("Flashcards", progress.flashcardsReviewed),
      wideCard("Recommendation", recommendNext(progress, weakestSkill, commonMistake)),
      wideCard("Most common mistake", readableMistake(commonMistake))
    );
  }

  function bindProgress() {
    if (els.refreshProgressBtn) {
      els.refreshProgressBtn.addEventListener("click", renderProgressDashboard);
    }

    if (els.resetProgressBtn) {
      els.resetProgressBtn.addEventListener("click", () => {
        if (!window.confirm("Reset local Theorem progress?")) return;

        state.progress = defaultProgress();
        saveProgress();
        renderProgressDashboard();
        renderReview();
      });
    }
  }

  function renderReview() {
    if (!els.reviewGrid) return;

    clear(els.reviewGrid);

    const progress = state.progress;
    const hasProgress =
      progress.sessions ||
      progress.mathProblemsAttempted ||
      progress.flashcardsReviewed ||
      progress.teachBackAttempts;

    if (!hasProgress) {
      els.reviewGrid.append(reviewCard("Complete a learning session first.", "Paste notes, code, worksheets, or exact Algebra 1 problems in the Learn Workspace."));
      return;
    }

    const mistakes = Object.entries(progress.mistakes)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    mistakes.forEach(([type, count]) => {
      els.reviewGrid.append(reviewCard(readableMistake(type), `${count} time(s). Try a repair drill in Practice.`));
    });

    progress.weakTerms.slice(0, 6).forEach((term) => {
      els.reviewGrid.append(reviewCard(`Review term: ${term}`, "Explain it out loud, then compare against your notes."));
    });

    Object.entries(progress.weakSubjects)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([subject]) => {
        els.reviewGrid.append(reviewCard(`Weak subject: ${labelSubject(subject)}`, "Build a new session and use teach-back mode."));
      });

    if (!els.reviewGrid.children.length) {
      els.reviewGrid.append(reviewCard("Review is ready.", "Keep using Learn Workspace and Theorem will build more specific review."));
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch {
      /* Keep progress in memory if localStorage fails. */
    }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProgress();

      return mergeProgress(defaultProgress(), JSON.parse(raw));
    } catch {
      return defaultProgress();
    }
  }

  function defaultProgress() {
    return {
      sessions: 0,
      subjectSessions: Object.fromEntries(SUBJECTS.map((subject) => [subject, 0])),
      materialsImported: 0,
      problemsImported: 0,
      unsupportedProblems: 0,
      mathProblemsAttempted: 0,
      correctAnswers: 0,
      conceptQuizzesCompleted: 0,
      flashcardsReviewed: 0,
      teachBackAttempts: 0,
      weakSubjects: {},
      weakTerms: [],
      mistakes: Object.fromEntries(MISTAKE_TYPES.map((mistake) => [mistake, 0])),
      skills: {
        two_step_equations: { attempts: 0, correct: 0 },
        combining_like_terms: { attempts: 0, correct: 0 },
        distributive_property: { attempts: 0, correct: 0 }
      },
      recentAttempts: []
    };
  }

  function mergeProgress(base, saved) {
    return {
      ...base,
      ...saved,
      subjectSessions: {
        ...base.subjectSessions,
        ...(saved.subjectSessions || {})
      },
      mistakes: {
        ...base.mistakes,
        ...(saved.mistakes || {})
      },
      skills: {
        ...base.skills,
        ...(saved.skills || {})
      },
      weakSubjects: {
        ...(saved.weakSubjects || {})
      },
      weakTerms: saved.weakTerms || [],
      recentAttempts: saved.recentAttempts || []
    };
  }

  function parseNumericAnswer(input) {
    const cleaned = String(input).trim().toLowerCase().replace(/\s+/g, "");
    const match = cleaned.match(/^(?:x=)?([+-]?\d+(?:\.\d+)?)$/);
    return match ? Number(match[1]) : null;
  }

  function parseLinearExpression(input) {
    const text = String(input || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/−/g, "-")
      .replace(/-/g, "+-");

    if (!text) return null;

    const parts = text.split("+").filter(Boolean);
    let x = 0;
    let c = 0;

    for (const part of parts) {
      if (part.includes("x")) {
        const value = part.replace("x", "");
        const coeff = value === "" ? 1 : value === "-" ? -1 : Number(value);
        if (!Number.isFinite(coeff)) return null;
        x += coeff;
      } else {
        const number = Number(part);
        if (!Number.isFinite(number)) return null;
        c += number;
      }
    }

    return { x, c };
  }

  function randomProblem(skill) {
    const bank = problemBank[skill] || problemBank.two_step_equations;
    return bank[Math.floor(Math.random() * bank.length)];
  }

  function nextSupportedIndex(items, current) {
    for (let index = current + 1; index < items.length; index += 1) {
      if (items[index].supported) return index;
    }

    const first = items.findIndex((item) => item.supported);
    return first === -1 ? 0 : first;
  }

  function addWeakTerms(terms) {
    terms.forEach((term) => {
      if (term && !state.progress.weakTerms.includes(term)) {
        state.progress.weakTerms.push(term);
      }
    });

    state.progress.weakTerms = state.progress.weakTerms.slice(0, 30);
  }

  function addWeakSubject(subject) {
    state.progress.weakSubjects[subject] = (state.progress.weakSubjects[subject] || 0) + 1;
  }

  function recommendNext(progress, weakestSkill, commonMistake) {
    if (!progress.sessions) return "Start with the Learn Workspace.";

    if (progress.mathProblemsAttempted && percent(progress.correctAnswers, progress.mathProblemsAttempted) < 80) {
      return `Practice ${titleSkill(weakestSkill)} and watch for ${readableMistake(commonMistake)}.`;
    }

    if (progress.weakTerms.length) {
      return `Review these terms: ${progress.weakTerms.slice(0, 3).join(", ")}.`;
    }

    return "Build a new session and use teach-back mode.";
  }

  function skillAccuracy(skill) {
    return skill.attempts ? skill.correct / skill.attempts : 1;
  }

  function percent(part, total) {
    return total ? Math.round((part / total) * 100) : 0;
  }

  function nearly(a, b) {
    return Math.abs(a - b) < 0.000001;
  }

  function parseCoefficient(value) {
    if (value === "" || value === "+") return 1;
    if (value === "-") return -1;
    return Number(value);
  }

  function countMatches(text, words) {
    return words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
  }

  function countRegex(text, regexes) {
    return regexes.reduce((count, regex) => count + (regex.test(text) ? 1 : 0), 0);
  }

  function labelSubject(subject) {
    return subjectLabels[subject] || subject;
  }

  function titleSkill(skill) {
    return skillLabels[skill] || skill;
  }

  function readableMistake(type) {
    if (!type || type === "None yet") return "None yet";
    return mistakeLabels[type] || String(type).replace(/_/g, " ");
  }

  function formatNumber(number) {
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(3)));
  }

  function formatSigned(number) {
    return number < 0 ? `- ${Math.abs(number)}` : `+ ${number}`;
  }

  function formatTerm(number, variable) {
    if (number === 1) return variable;
    if (number === -1) return `-${variable}`;
    return `${number}${variable}`;
  }

  function formatExpression(x, c) {
    if (c === 0) return formatTerm(x, "x");
    return `${formatTerm(x, "x")} ${formatSigned(c)}`;
  }

  function setStatus(message) {
    if (els.uploadMessage) els.uploadMessage.textContent = message;
  }

  function clear(node) {
    if (!node) return;

    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function div(className, children, text) {
    const node = document.createElement("div");

    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    if (children) children.forEach((child) => node.append(child));

    return node;
  }

  function span(text, className) {
    const node = document.createElement("span");

    if (className) node.className = className;
    node.textContent = text;

    return node;
  }

  function strong(text) {
    const node = document.createElement("strong");
    node.textContent = text;
    return node;
  }

  function heading(text, level) {
    const node = document.createElement(`h${level}`);
    node.textContent = text;
    return node;
  }

  function textP(text, className) {
    const node = document.createElement("p");

    if (className) node.className = className;
    node.textContent = text;

    return node;
  }

  function labelText(text, className) {
    const node = document.createElement("p");
    node.className = className || "micro-label";
    node.textContent = text;
    return node;
  }

  function buttonEl(text, className, handler) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = className;
    node.textContent = text;

    if (handler) node.addEventListener("click", handler);

    return node;
  }

  function buttonSetDone(button, text) {
    button.textContent = text;
    button.disabled = true;
  }

  function list(items, className) {
    const node = document.createElement("ul");

    if (className) node.className = className;

    const safeItems = items && items.length ? items : ["No items found yet."];

    safeItems.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      node.append(li);
    });

    return node;
  }

  function statPill(label, value) {
    const node = div("subject-pill");
    node.append(strong(label), document.createTextNode(` ${value}`));
    return node;
  }

  function toolCard(title, body) {
    const node = div("tool-card");
    node.append(strong(title), textP(body));
    return node;
  }

  function feedbackBox(title, body) {
    const node = div("feedback-box");
    node.append(strong(title), textP(body));
    return node;
  }

  function statCard(label, value) {
    const node = div("stat-card");
    node.append(div("stat-value", null, String(value)), textP(label, "stat-label"));
    return node;
  }

  function wideCard(title, body) {
    const node = div("stat-card wide-card");
    node.append(heading(title, 3), textP(body));
    return node;
  }

  function reviewCard(title, body) {
    const node = div("review-card");
    node.append(heading(title, 3), textP(body));
    return node;
  }
})();
