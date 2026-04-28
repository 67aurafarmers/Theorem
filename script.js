(() => {
  "use strict";

  const STORAGE_KEY = "theoremProgressV2";

  const SUBJECTS = ["math", "science", "english", "history", "coding", "language", "general"];

  const FOLDER_CONFIG = [
    ["questions", "Questions"],
    ["keyTerms", "Key Terms"],
    ["facts", "Facts"],
    ["people", "People"],
    ["dates", "Dates"],
    ["events", "Events"],
    ["causeEffect", "Cause/Effect"],
    ["writingPrompts", "Writing Prompts"],
    ["mathProblems", "Math Problems"],
    ["codeBlocks", "Code Blocks"],
    ["sources", "Sources"],
    ["unknown", "Unknown / Needs Review"]
  ];

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
    currentView: { type: "overview" },
    practiceSkill: "two_step_equations",
    practiceProblem: null,
    practiceAttemptSaved: false,
    currentMathIndex: 0
  };

  const els = {};

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
    renderProgressDashboard();
    renderReview();
  }

  function cacheElements() {
    els.navToggle = document.querySelector("#navToggle");
    els.navLinks = document.querySelector("#navLinks");
    els.sections = Array.from(document.querySelectorAll(".app-section"));
    els.navButtons = Array.from(document.querySelectorAll("[data-section-target], [data-target]"));

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

    els.reviewGrid = document.querySelector("#reviewGrid");
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
        const target = normalizeSectionName(button.dataset.sectionTarget || button.dataset.target);
        showSection(target);
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
      const active = section.id === `section-${name}` || section.id === name;
      section.classList.toggle("active-section", active);
      section.classList.toggle("visible", active);
    });

    document.querySelectorAll(".nav-link").forEach((button) => {
      const target = normalizeSectionName(button.dataset.sectionTarget || button.dataset.target);
      button.classList.toggle("active", target === name);
    });

    if (els.navLinks) els.navLinks.classList.remove("open");
    if (els.navToggle) els.navToggle.setAttribute("aria-expanded", "false");

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
      setStatus("For now, Theorem supports pasted text, .txt, and .md files. Image/PDF homework upload is coming later.");
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

    const folders = buildStudyFolders(text);
    const classification = classifyStudyMaterial(text, folders);
    const tools = buildToolsFromFolders(folders, classification);

    const mathItems = folders.mathProblems
      .map((item, index) => {
        const problem = detectMathProblem(item.text || item);
        if (!problem) return null;

        return {
          id: `math-${index}`,
          supported: true,
          raw: item.text || item,
          problem,
          hintIndex: 0,
          attempted: false,
          saved: false
        };
      })
      .filter(Boolean);

    const session = {
      type: "studypath",
      originalText: text,
      folders,
      classification,
      tools,
      mathItems
    };

    state.session = session;
    state.currentView = { type: "overview" };
    state.currentMathIndex = 0;

    state.progress.sessions += 1;
    state.progress.materialsImported += 1;
    state.progress.subjectSessions[classification.subjectKey] =
      (state.progress.subjectSessions[classification.subjectKey] || 0) + 1;
    state.progress.lastSubject = classification.subject;
    state.progress.lastDocumentType = classification.documentType;
    state.progress.lastTaskType = classification.taskType;
    state.progress.lastStudyMethod = classification.studyMethod;
    state.progress.foldersExtracted += countNonEmptyFolders(folders);
    state.progress.problemsImported += mathItems.length;
    state.progress.unsupportedProblems += folders.unknown.length;

    saveProgress();

    if (els.learnWorkspace) els.learnWorkspace.classList.remove("hidden");

    renderLearningSession();
    showSection("learn");
  }

  function buildStudyFolders(text) {
    const cleanedText = String(text || "").replace(/\r/g, "");
    const codeBlocks = extractCodeBlocks(cleanedText);
    const textWithoutCode = removeCodeBlocks(cleanedText);

    const lines = textWithoutCode
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const folders = {
      questions: [],
      headings: [],
      keyTerms: [],
      facts: [],
      people: [],
      dates: [],
      events: [],
      formulas: [],
      sources: [],
      writingPrompts: [],
      codeBlocks: codeBlocks.map((block) => ({ text: block })),
      causeEffect: [],
      mathProblems: [],
      unknown: []
    };

    const seen = new Set();

    lines.forEach((line, index) => {
      const clean = cleanLine(line);
      if (!clean) return;

      let classified = false;

      if (isSource(clean)) {
        addUnique(folders.sources, clean, seen, "source");
        classified = true;
      }

      const terms = extractTermsFromLine(clean);
      if (terms.length) {
        terms.forEach((term) => addUnique(folders.keyTerms, term, seen, "term"));
        classified = true;
      }

      const dates = extractDates(clean);
      dates.forEach((date) => addUnique(folders.dates, date, seen, "date"));

      if (dates.length) classified = true;

      const importantEvent = extractEventFromLine(clean);
      if (importantEvent) {
        addUnique(folders.events, importantEvent, seen, "event");
        classified = true;
      }

      const mathProblem = detectMathProblem(clean);
      if (mathProblem) {
        addUnique(folders.mathProblems, clean, seen, "math");
        addUnique(folders.formulas, clean, seen, "formula");
        classified = true;
      }

      if (isQuestionLine(clean)) {
        addUnique(folders.questions, normalizePrompt(clean), seen, "question");
        classified = true;
      }

      if (isWritingPrompt(clean)) {
        addUnique(folders.writingPrompts, normalizePrompt(clean), seen, "writing");
        classified = true;
      }

      if (isCauseEffectLine(clean)) {
        addUnique(folders.causeEffect, clean, seen, "cause");
        classified = true;
      }

      if (looksLikeHeading(clean, index, lines.length)) {
        addUnique(folders.headings, clean, seen, "heading");
        classified = true;
      }

      extractPeople(clean).forEach((person) => addUnique(folders.people, person, seen, "person"));

      if (!classified && clean.length > 20) {
        addUnique(folders.facts, clean, seen, "fact");
        classified = true;
      }

      if (!classified) {
        addUnique(folders.unknown, clean, seen, "unknown");
      }
    });

    if (!folders.causeEffect.length && textWithoutCode.toLowerCase().includes("caused")) {
      addUnique(
        folders.causeEffect,
        "The material mentions causes. Theorem suggests reviewing cause and effect.",
        seen,
        "cause"
      );
    }

    return folders;
  }

  function classifyStudyMaterial(text, folders) {
    const lower = String(text).toLowerCase();
    const scores = {
      coding: folders.codeBlocks.length * 5 + countMatches(lower, ["function", "const ", "let ", "var ", "class ", "def ", "return", "console.log", "print("]),
      math: folders.mathProblems.length * 5 + countRegex(lower, [/\d*x\s*[+\-]\s*\d+\s*=/, /\d+\s*\(\s*x\s*[+\-]\s*\d+\s*\)/, /\bsimplify\b/, /\bsolve\b/]),
      science: countMatches(lower, ["photosynthesis", "cell", "energy", "molecule", "oxygen", "glucose", "ecosystem", "atom", "experiment", "hypothesis"]),
      history: countMatches(lower, ["revolution", "colonial", "colony", "taxation", "representation", "boston tea party", "government", "treaty", "war", "rights"]),
      english: countMatches(lower, ["theme", "character", "claim", "evidence", "author", "essay", "paragraph", "poem", "story", "argument"]),
      language: countMatches(lower, ["translate", "conjugate", "vocabulary", "spanish", "french", "german", "latin"])
    };

    let subjectKey = "general";
    let bestScore = 0;

    Object.entries(scores).forEach(([key, score]) => {
      if (score > bestScore) {
        subjectKey = key;
        bestScore = score;
      }
    });

    const documentType = detectDocumentType(lower, folders);
    const taskType = detectTaskType(subjectKey, folders);
    const studyMethod = detectStudyMethod(subjectKey, folders);

    return {
      subjectKey,
      subject: labelSubject(subjectKey),
      documentType,
      taskType,
      studyMethod
    };
  }

  function detectDocumentType(lower, folders) {
    if (folders.codeBlocks.length) return "Code snippet";
    if (lower.includes("study guide") || (folders.questions.length && folders.keyTerms.length)) return "Study guide";
    if (folders.mathProblems.length >= 2 || folders.questions.length >= 5) return "Worksheet";
    if (folders.writingPrompts.length) return "Writing assignment";
    if (folders.sources.length) return "Research material";
    if (folders.headings.length >= 2 || folders.facts.length >= 3) return "Notes";
    return "Study material";
  }

  function detectTaskType(subjectKey, folders) {
    if (subjectKey === "math") return "exact practice + mistake repair";
    if (subjectKey === "coding") return "code understanding + testing";
    if (folders.questions.length && folders.keyTerms.length) return "memorization + explanation";
    if (folders.writingPrompts.length) return "writing + outlining";
    if (folders.sources.length) return "research organization";
    if (folders.dates.length || folders.events.length) return "timeline + recall";
    return "active recall + review";
  }

  function detectStudyMethod(subjectKey, folders) {
    const methods = [];

    if (folders.keyTerms.length) methods.push("flashcards");
    if (folders.questions.length) methods.push("short-answer practice");
    if (folders.causeEffect.length || subjectKey === "history") methods.push("cause/effect practice");
    if (folders.dates.length || folders.events.length) methods.push("timeline review");
    if (folders.writingPrompts.length) methods.push("outline builder");
    if (folders.mathProblems.length) methods.push("exact-check tutoring");
    if (folders.codeBlocks.length) methods.push("code explanation + tests");
    if (folders.sources.length) methods.push("research organizer");

    methods.push("review plan");

    return methods.join(" + ");
  }

  function buildToolsFromFolders(folders, classification) {
    const tools = [];

    if (folders.keyTerms.length) {
      tools.push({
        id: "flashcards",
        title: "Flashcards",
        description: "Use extracted key terms for recall.",
        type: "flashcards"
      });
    }

    if (folders.questions.length) {
      tools.push({
        id: "short-answer",
        title: "Short-answer practice",
        description: "Answer extracted questions in your own words.",
        type: "questions"
      });
    }

    if (folders.causeEffect.length || classification.subjectKey === "history") {
      tools.push({
        id: "cause-effect",
        title: "Cause/effect practice",
        description: "Explain why events or ideas connect.",
        type: "causeEffect"
      });
    }

    if (folders.dates.length || folders.events.length) {
      tools.push({
        id: "timeline",
        title: "Timeline review",
        description: "Connect dates and events.",
        type: "timeline"
      });
    }

    if (folders.writingPrompts.length) {
      tools.push({
        id: "outline",
        title: "Outline builder",
        description: "Turn prompts into a usable writing plan.",
        type: "outline"
      });
    }

    if (folders.mathProblems.length) {
      tools.push({
        id: "math",
        title: "Exact-check math tutor",
        description: "Solve supported Algebra 1 problems with repair drills.",
        type: "math"
      });
    }

    if (folders.codeBlocks.length) {
      tools.push({
        id: "code",
        title: "Code tutor",
        description: "Explain code, find edge cases, and create test ideas.",
        type: "code"
      });
    }

    if (folders.sources.length) {
      tools.push({
        id: "sources",
        title: "Research organizer",
        description: "Organize sources, claims, and evidence.",
        type: "sources"
      });
    }

    if (classification.subjectKey === "history" || classification.subjectKey === "science" || folders.questions.length) {
      tools.push({
        id: "creative",
        title: "Creative thinking questions",
        description: "Check deeper understanding beyond memorization.",
        type: "creative"
      });
    }

    tools.push({
      id: "review-plan",
      title: "Review plan",
      description: "A simple study order based on extracted folders.",
      type: "reviewPlan"
    });

    return tools;
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

    const classification = session.classification;

    els.detectedSummary.append(
      statPill("Subject", classification.subject),
      statPill("Document type", classification.documentType),
      statPill("Task type", classification.taskType),
      statPill("Study method", classification.studyMethod)
    );
  }

  function renderOutline(session) {
    clear(els.outlineList);
    if (!els.outlineList) return;

    const overview = buttonEl("Extracted Material", "outline-button", () => {
      state.currentView = { type: "overview" };
      renderLearningSession();
    });

    overview.classList.toggle("active", state.currentView.type === "overview");
    els.outlineList.append(overview);

    FOLDER_CONFIG.forEach(([key, label]) => {
      const items = session.folders[key] || [];
      if (!items.length) return;

      const button = buttonEl(`${label} (${items.length})`, "outline-button", () => {
        state.currentView = { type: "folder", folderKey: key };
        renderLearningSession();
      });

      button.classList.toggle(
        "active",
        state.currentView.type === "folder" && state.currentView.folderKey === key
      );

      els.outlineList.append(button);
    });

    session.tools.forEach((tool) => {
      const button = buttonEl(tool.title, "outline-button", () => {
        state.currentView = { type: "tool", toolType: tool.type };
        renderLearningSession();
      });

      button.classList.toggle(
        "active",
        state.currentView.type === "tool" && state.currentView.toolType === tool.type
      );

      els.outlineList.append(button);
    });
  }

  function renderUnsupported(session) {
    clear(els.unsupportedList);
    if (!els.unsupportedList) return;

    if (!session.folders.unknown.length) return;

    els.unsupportedList.append(labelText("Needs Review", "micro-label"));

    session.folders.unknown.slice(0, 4).forEach((item) => {
      const card = div("unsupported-card");
      card.append(
        textP(item.text || item),
        textP("Theorem could not confidently classify this item yet.", "muted")
      );
      els.unsupportedList.append(card);
    });
  }

  function renderCurrentTutorCard(session) {
    clear(els.currentTutorCard);
    if (!els.currentTutorCard) return;

    if (state.currentView.type === "folder") {
      renderFolderDetail(session, state.currentView.folderKey);
      return;
    }

    if (state.currentView.type === "tool") {
      renderStudyTool(session, state.currentView.toolType);
      return;
    }

    renderExtractedMaterial(session);
  }

  function renderExtractedMaterial(session) {
    const box = div("concept-summary");

    box.append(
      heading("Theorem extracted your material and organized it into a study path.", 3),
      textP("Based on the material you provided, Theorem detected the folders below. This is a structured study path, not a claim of perfect understanding.", "muted")
    );

    const detected = div("feedback-grid");
    detected.append(
      feedbackBox("Subject", session.classification.subject),
      feedbackBox("Document type", session.classification.documentType),
      feedbackBox("Task type", session.classification.taskType),
      feedbackBox("Chosen study method", session.classification.studyMethod)
    );

    box.append(detected, heading("Study Folders", 3));

    const folderGrid = div("feedback-grid");

    FOLDER_CONFIG.forEach(([key, label]) => {
      const items = session.folders[key] || [];
      const card = div("feedback-box");
      card.append(strong(`${label} (${items.length})`));

      if (items.length) {
        card.append(list(items.slice(0, 5).map((item) => item.text || item), "checklist"));
      } else {
        card.append(textP("No items detected yet.", "muted"));
      }

      folderGrid.append(card);
    });

    box.append(folderGrid);
    els.currentTutorCard.append(box);
  }

  function renderFolderDetail(session, folderKey) {
    const label = folderLabel(folderKey);
    const items = session.folders[folderKey] || [];

    els.currentTutorCard.append(
      heading(label, 3),
      textP("Based on the material you provided, Theorem placed these items in this folder.", "muted")
    );

    if (!items.length) {
      els.currentTutorCard.append(textP("No items detected in this folder yet."));
      return;
    }

    const folderList = div("flashcard-list");

    items.forEach((item, index) => {
      const card = div("flashcard");
      card.append(strong(`${label} ${index + 1}`), textP(item.text || item));
      folderList.append(card);
    });

    els.currentTutorCard.append(folderList);
  }

  function renderStudyTool(session, toolType) {
    if (toolType === "flashcards") {
      renderFlashcardsTool(session);
      return;
    }

    if (toolType === "questions") {
      renderShortAnswerTool(session);
      return;
    }

    if (toolType === "causeEffect") {
      renderCauseEffectTool(session);
      return;
    }

    if (toolType === "timeline") {
      renderTimelineTool(session);
      return;
    }

    if (toolType === "outline") {
      renderOutlineBuilderTool(session);
      return;
    }

    if (toolType === "math") {
      renderMathTool(session);
      return;
    }

    if (toolType === "code") {
      renderCodeTool(session);
      return;
    }

    if (toolType === "sources") {
      renderResearchTool(session);
      return;
    }

    if (toolType === "creative") {
      renderCreativeTool(session);
      return;
    }

    renderReviewPlanTool(session);
  }

  function renderFlashcardsTool(session) {
    const terms = session.folders.keyTerms;

    els.currentTutorCard.append(
      heading("Flashcards", 3),
      textP("Try to answer before reading the back.", "muted")
    );

    const box = div("flashcard-list");

    terms.forEach((term, index) => {
      const text = term.text || term;
      const card = div("flashcard");
      const button = buttonEl("Mark reviewed", "btn btn-secondary", () => {
        state.progress.flashcardsReviewed += 1;
        saveProgress();
        buttonSetDone(button, "Reviewed");
      });

      card.append(
        strong(`Card ${index + 1}: ${text}`),
        textP(`Explain what ${text} means and why it matters in this material.`),
        button
      );

      box.append(card);
    });

    els.currentTutorCard.append(box);
  }

  function renderShortAnswerTool(session) {
    const questions = session.folders.questions;

    els.currentTutorCard.append(
      heading("Short-answer practice", 3),
      textP("Answer first. Then compare your answer to your notes or teacher materials.", "muted")
    );

    const box = div("quiz-list");

    questions.forEach((question, index) => {
      const prompt = question.text || question;
      const card = div("quiz-card");
      const input = document.createElement("textarea");
      input.placeholder = "Write your answer in your own words.";
      input.setAttribute("aria-label", prompt);

      const check = buttonEl("Check for key terms", "btn btn-secondary", () => {
        const result = checkTerms(input.value, session.folders.keyTerms.slice(0, 8).map((item) => item.text || item));
        card.append(feedbackBox("Self-check", result.message));
        state.progress.conceptQuizzesCompleted += 1;
        addWeakTerms(result.missing);
        saveProgress();
      });

      card.append(strong(`Question ${index + 1}`), textP(prompt), input, div("actions", [check]));
      box.append(card);
    });

    els.currentTutorCard.append(box);
  }

  function renderCauseEffectTool(session) {
    const items = session.folders.causeEffect.length
      ? session.folders.causeEffect
      : ["What caused the main event or idea?", "What changed because of it?", "Who was affected?"];

    els.currentTutorCard.append(
      heading("Cause/effect practice", 3),
      textP("Theorem suggests using these prompts to connect ideas.", "muted"),
      list(items.map((item) => item.text || item), "checklist")
    );
  }

  function renderTimelineTool(session) {
    const combined = [
      ...session.folders.events.map((item) => `Event: ${item.text || item}`),
      ...session.folders.dates.map((item) => `Date: ${item.text || item}`)
    ];

    els.currentTutorCard.append(
      heading("Timeline review", 3),
      textP("Connect each date to the event or idea it belongs with.", "muted"),
      list(combined.length ? combined : ["No dates or events found yet."], "timeline-list")
    );
  }

  function renderOutlineBuilderTool(session) {
    const prompts = session.folders.writingPrompts;

    els.currentTutorCard.append(
      heading("Outline builder", 3),
      textP("Turn each prompt into a claim, evidence, and explanation.", "muted")
    );

    const box = div("quiz-list");

    prompts.forEach((prompt, index) => {
      const card = div("quiz-card");
      card.append(
        strong(`Prompt ${index + 1}`),
        textP(prompt.text || prompt),
        list(["Claim:", "Evidence:", "Explanation:", "Conclusion:"], "checklist")
      );
      box.append(card);
    });

    els.currentTutorCard.append(box);
  }

  function renderMathTool(session) {
    if (!session.mathItems.length) {
      els.currentTutorCard.append(
        heading("No supported exact-check math found", 3),
        textP("Try Algebra 1 formats like 2x + 5 = 17, 3x + 2x + 5, or 3(x + 4).")
      );
      return;
    }

    const item = session.mathItems[state.currentMathIndex] || session.mathItems[0];

    els.currentTutorCard.append(
      renderProblemCard(item.problem, {
        context: "learn",
        item,
        onNext: () => {
          state.currentMathIndex = (state.currentMathIndex + 1) % session.mathItems.length;
          renderLearningSession();
        }
      })
    );
  }

  function renderCodeTool(session) {
    const code = session.folders.codeBlocks[0] ? session.folders.codeBlocks[0].text : "";

    els.currentTutorCard.append(
      heading("Code tutor", 3),
      textP("Theorem suggests explaining the code path before changing anything.", "muted"),
      feedbackBox("What to explain", "Inputs, outputs, branches, return values, and edge cases."),
      feedbackBox("Test ideas", "Try normal input, empty input, large input, and unexpected types.")
    );

    if (code) {
      const pre = document.createElement("pre");
      const codeNode = document.createElement("code");
      codeNode.textContent = code;
      pre.append(codeNode);
      els.currentTutorCard.append(pre);
    }
  }

  function renderResearchTool(session) {
    els.currentTutorCard.append(
      heading("Research organizer", 3),
      textP("Theorem suggests organizing sources by claim, evidence, and usefulness.", "muted"),
      list(session.folders.sources.map((item) => item.text || item), "checklist")
    );
  }

  function renderCreativeTool(session) {
    const subject = session.classification.subjectKey;
    let prompts = [
      "What is the most important idea in this material?",
      "What would be a confusing part for another student?",
      "How does one idea connect to another?"
    ];

    if (subject === "history") {
      prompts = [
        "What was one cause of the event?",
        "Who benefited and who was hurt?",
        "What might have happened if one decision changed?"
      ];
    }

    if (subject === "science") {
      prompts = [
        "What are the inputs and outputs?",
        "What would happen if one variable changed?",
        "How would you draw this process with arrows?"
      ];
    }

    els.currentTutorCard.append(
      heading("Creative thinking questions", 3),
      textP("These questions test understanding beyond memorization.", "muted"),
      list(prompts, "checklist")
    );
  }

  function renderReviewPlanTool(session) {
    const steps = [];

    if (session.folders.keyTerms.length) steps.push("Review flashcards for key terms.");
    if (session.folders.questions.length) steps.push("Answer the extracted questions without looking.");
    if (session.folders.events.length || session.folders.dates.length) steps.push("Connect events to dates.");
    if (session.folders.causeEffect.length || session.classification.subjectKey === "history") steps.push("Practice cause and effect.");
    if (session.folders.mathProblems.length) steps.push("Do exact-check math problems and repair mistakes.");
    if (session.folders.codeBlocks.length) steps.push("Explain the code path and write edge-case tests.");
    steps.push("End by teaching the material back in your own words.");

    els.currentTutorCard.append(
      heading("Review plan", 3),
      textP("Theorem suggests this study order based on your extracted folders.", "muted"),
      list(steps, "checklist")
    );
  }

  function renderStudyTools(session) {
    clear(els.studyTools);
    if (!els.studyTools) return;

    els.studyTools.append(
      toolCard("StudyPath Engine", "Theorem extracts, organizes, classifies, then builds tools from folders."),
      toolCard("Detected", `${session.classification.subject} · ${session.classification.documentType}`),
      toolCard("Suggested method", session.classification.studyMethod)
    );

    session.tools.forEach((tool) => {
      const button = buttonEl(tool.title, "tool-button", () => {
        state.currentView = { type: "tool", toolType: tool.type };
        renderLearningSession();
      });

      const card = div("tool-card");
      card.append(strong(tool.title), textP(tool.description), button);
      els.studyTools.append(card);
    });
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
          const folders = buildStudyFolders(repair.display);
          const classification = classifyStudyMaterial(repair.display, folders);
          const session = {
            type: "studypath",
            originalText: repair.display,
            folders,
            classification,
            tools: buildToolsFromFolders(folders, classification),
            mathItems: [
              {
                id: "repair-math",
                supported: true,
                raw: repair.display,
                problem: repair,
                hintIndex: 0,
                attempted: false,
                saved: false
              }
            ]
          };

          state.session = session;
          state.currentView = { type: "tool", toolType: "math" };
          state.currentMathIndex = 0;

          if (els.learnWorkspace) els.learnWorkspace.classList.remove("hidden");

          renderLearningSession();
          showSection("learn");
        }),
        buttonEl("Next problem", "btn btn-primary", onNext)
      ])
    );

    return panel;
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
      statCard("Folders extracted", progress.foldersExtracted),
      statCard("Math accuracy", `${percent(progress.correctAnswers, progress.mathProblemsAttempted)}%`),
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

  function defaultProgress() {
    return {
      sessions: 0,
      subjectSessions: Object.fromEntries(SUBJECTS.map((subject) => [subject, 0])),
      materialsImported: 0,
      foldersExtracted: 0,
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

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProgress();

      return mergeProgress(defaultProgress(), JSON.parse(raw));
    } catch {
      return defaultProgress();
    }
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

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch {
      /* Keep progress in memory if localStorage fails. */
    }
  }

  function cleanLine(line) {
    return String(line || "")
      .replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "")
      .trim();
  }

  function normalizePrompt(line) {
    return cleanLine(line).replace(/\s+/g, " ");
  }

  function extractCodeBlocks(text) {
    const matches = [];
    const regex = /```[\s\S]*?```/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[0].replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim());
    }

    if (!matches.length && looksLikeCode(text)) {
      matches.push(text.trim());
    }

    return matches.filter(Boolean);
  }

  function removeCodeBlocks(text) {
    return String(text || "").replace(/```[\s\S]*?```/g, "");
  }

  function looksLikeCode(text) {
    return /\b(function|const|let|var|class|def|return|console\.log|print\()\b|[{};]/.test(String(text));
  }

  function extractTermsFromLine(line) {
    const match = line.match(/^(?:vocabulary|key terms?|terms?)\s*:\s*(.+)$/i);
    if (!match) return [];

    return match[1]
      .split(/,|;/)
      .map((term) => term.trim())
      .filter(Boolean);
  }

  function extractDates(line) {
    const matches = line.match(/\b(?:1[0-9]{3}|20[0-9]{2})\b/g) || [];
    return Array.from(new Set(matches));
  }

  function extractEventFromLine(line) {
    const explicit = line.match(/^(?:important\s+event|event)\s*:\s*(.+)$/i);
    if (explicit) {
      return explicit[1].replace(/\b(?:1[0-9]{3}|20[0-9]{2})\b/g, "").replace(/,\s*$/, "").trim();
    }

    if (/Boston Tea Party/i.test(line)) return "Boston Tea Party";
    if (/American Revolution/i.test(line)) return "American Revolution";

    return "";
  }

  function isQuestionLine(line) {
    return (
      /\?$/.test(line) ||
      /^(?:explain|describe|what|why|how|compare|analyze|discuss|evaluate|name|identify)\b/i.test(line)
    );
  }

  function isWritingPrompt(line) {
    return /^(?:write|essay|prompt|draft|compose|argue|paragraph)\b/i.test(line);
  }

  function isCauseEffectLine(line) {
    return /\b(cause|caused|causes|because|effect|led to|resulted in|why)\b/i.test(line);
  }

  function isSource(line) {
    return /^(?:source|works cited|citation|reference)\s*:|https?:\/\//i.test(line);
  }

  function looksLikeHeading(line, index) {
    if (index > 2 && line.length > 70) return false;
    if (/[.!?]$/.test(line)) return false;
    return /study guide|notes|worksheet|review|chapter|unit/i.test(line) || /^[A-Z][A-Za-z0-9\s:&-]{4,60}$/.test(line);
  }

  function extractPeople(line) {
    const names = line.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
    return names.filter((name) => !/American Revolution|Boston Tea Party|Study Guide/i.test(name));
  }

  function addUnique(folder, text, seen, prefix) {
    const value = String(text || "").trim();
    if (!value) return;

    const key = `${prefix}:${value.toLowerCase()}`;
    if (seen.has(key)) return;

    seen.add(key);
    folder.push({ text: value });
  }

  function countNonEmptyFolders(folders) {
    return Object.values(folders).filter((items) => Array.isArray(items) && items.length > 0).length;
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
        message: "Good coverage. Your answer includes the key terms Theorem checked."
      };
    }

    return {
      missing,
      message: `You may be missing: ${missing.join(", ")}. Revise and try again.`
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

    return "Build a new StudyPath session and use teach-back mode.";
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

  function folderLabel(folderKey) {
    const found = FOLDER_CONFIG.find(([key]) => key === folderKey);
    return found ? found[1] : folderKey;
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
