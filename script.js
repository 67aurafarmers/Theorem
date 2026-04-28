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
    practiceSkill: "two_step_equations",
    practiceProblem: null,
    practiceAttemptSaved: false
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
      makeTwoStep("10x + 5 = 65", 10, "+", 5, 65)
    ],
    combining_like_terms: [
      makeCombine("3x + 2x + 5", 3, 2, "+", 5),
      makeCombine("4x + x + 7", 4, 1, "+", 7),
      makeCombine("6x - 2x + 9", 6, -2, "+", 9),
      makeCombine("8x + 3x - 4", 8, 3, "-", 4),
      makeCombine("9x - 5x + 2", 9, -5, "+", 2)
    ],
    distributive_property: [
      makeDistribute("3(x + 4)", 3, "+", 4),
      makeDistribute("2(x + 5)", 2, "+", 5),
      makeDistribute("5(x - 2)", 5, "-", 2),
      makeDistribute("4(x + 3)", 4, "+", 3),
      makeDistribute("6(x - 1)", 6, "-", 1)
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

    const folders = extractFolders(text);
    const classification = classifyMaterial(text, folders);
    const path = buildGuidedPath(folders, classification);

    state.session = {
      originalText: text,
      folders,
      classification,
      path,
      mode: "summary",
      stepIndex: 0
    };

    state.progress.sessions += 1;
    state.progress.materialsImported += 1;
    state.progress.subjectSessions[classification.subjectKey] =
      (state.progress.subjectSessions[classification.subjectKey] || 0) + 1;
    state.progress.lastSubject = classification.subject;
    state.progress.lastStrategy = classification.studyMethod;
    state.progress.problemsImported += folders.mathProblems.length;
    state.progress.unsupportedProblems += folders.unknown.length;

    saveProgress();

    if (els.learnWorkspace) els.learnWorkspace.classList.remove("hidden");

    setStatus("Theorem extracted your material and organized it into a study path.");
    renderGuidedSession();
    showSection("learn");
  }

  function renderGuidedSession() {
    const session = state.session;
    if (!session) return;

    renderDetectedSummary(session);
    renderSimplePathPanel(session);
    renderSimpleToolsPanel(session);

    clear(els.currentTutorCard);

    if (session.mode === "summary") {
      renderStudySummary(session);
      return;
    }

    renderCurrentStudyCard(session);
    renderProgressDashboard();
    renderReview();
  }

  function renderDetectedSummary(session) {
    clear(els.detectedSummary);
    if (!els.detectedSummary) return;

    els.detectedSummary.append(
      statPill("Subject", session.classification.subject),
      statPill("Document", session.classification.documentType),
      statPill("Task", session.classification.taskType)
    );
  }

  function renderSimplePathPanel(session) {
    clear(els.outlineList);
    clear(els.unsupportedList);

    if (!els.outlineList) return;

    els.outlineList.append(labelText("Study Path", "micro-label"));

    const steps = session.path.length ? session.path : [];
    steps.forEach((step, index) => {
      const item = div("tool-card");
      item.append(
        strong(`${index + 1}. ${step.title}`),
        textP(step.short || "Study this next.")
      );
      els.outlineList.append(item);
    });

    if (session.folders.unknown.length && els.unsupportedList) {
      els.unsupportedList.append(labelText("Needs Review", "micro-label"));
      els.unsupportedList.append(
        textP(`${session.folders.unknown.length} item(s) could not be confidently sorted yet.`, "muted")
      );
    }
  }

  function renderSimpleToolsPanel(session) {
    clear(els.studyTools);
    if (!els.studyTools) return;

    els.studyTools.append(
      toolCard(
        "Theorem found",
        `${session.folders.questions.length} question(s), ${session.folders.keyTerms.length} key term(s), ${session.folders.events.length} event(s), ${session.folders.dates.length} date(s).`
      ),
      toolCard(
        "Suggested method",
        session.classification.studyMethod
      ),
      toolCard(
        "Study rule",
        "Continue one card at a time. Answer first, then check or move on."
      )
    );
  }

  function renderStudySummary(session) {
    const found = [
      `${session.folders.questions.length} question(s)`,
      `${session.folders.keyTerms.length} key term(s)`,
      `${session.folders.events.length} event(s)`,
      `${session.folders.dates.length} date(s)`,
      `${session.folders.mathProblems.length} math problem(s)`,
      `${session.folders.codeBlocks.length} code block(s)`
    ];

    const card = div("study-path-overview");
    card.append(
      labelText("Ready", "micro-label"),
      heading("Theorem extracted your material and built a study path.", 3),
      textP("Based on the material you provided, Theorem detected the items below. It may not understand everything perfectly, but it gives you a clean place to start.", "muted"),
      list(found, "checklist"),
      heading("Suggested path", 3),
      list(session.path.map((step) => step.title), "checklist")
    );

    const actions = div("actions");
    actions.append(
      buttonEl("Continue", "btn btn-primary", () => {
        session.mode = "study";
        session.stepIndex = 0;
        renderGuidedSession();
      })
    );

    card.append(actions);
    els.currentTutorCard.append(card);
  }

  function renderCurrentStudyCard(session) {
    if (!session.path.length) {
      els.currentTutorCard.append(
        heading("Add a little more material.", 3),
        textP("Theorem could not find enough study items. Try pasting questions, vocabulary, notes, math problems, or code.")
      );
      return;
    }

    const step = session.path[session.stepIndex];

    if (!step) {
      renderSessionComplete(session);
      return;
    }

    if (step.type === "flashcard") renderFlashcardStep(session, step);
    else if (step.type === "question") renderQuestionStep(session, step);
    else if (step.type === "cause_effect") renderCauseEffectStep(session, step);
    else if (step.type === "timeline") renderTimelineStep(session, step);
    else if (step.type === "math") renderMathStep(session, step);
    else if (step.type === "code") renderCodeStep(session, step);
    else renderReviewPlanStep(session, step);
  }

  function renderStepShell(session, step) {
    const shell = div("study-card");
    shell.append(
      labelText(`Step ${session.stepIndex + 1} of ${session.path.length}`, "micro-label"),
      heading(step.title, 3)
    );
    return shell;
  }

  function renderFlashcardStep(session, step) {
    const shell = renderStepShell(session, step);

    const answer = document.createElement("textarea");
    answer.placeholder = `Explain "${step.term}" in your own words.`;
    answer.setAttribute("aria-label", `Explain ${step.term}`);

    const reveal = div("tool-card hidden");
    reveal.append(
      strong("Check yourself"),
      textP(`Your answer should explain what "${step.term}" means and why it matters in this material.`)
    );

    shell.append(
      textP(`Key term: ${step.term}`),
      answer,
      div("actions", [
        buttonEl("Show check", "btn btn-secondary", () => {
          reveal.classList.remove("hidden");
          state.progress.flashcardsReviewed += 1;
          saveProgress();
        }),
        buttonEl("Continue", "btn btn-primary", () => nextStudyStep(session))
      ]),
      reveal
    );

    els.currentTutorCard.append(shell);
  }

  function renderQuestionStep(session, step) {
    const shell = renderStepShell(session, step);

    const answer = document.createElement("textarea");
    answer.placeholder = "Answer in your own words.";
    answer.setAttribute("aria-label", step.question);

    const feedback = div("feedback-root");

    shell.append(
      textP(step.question),
      answer,
      div("actions", [
        buttonEl("Check key terms", "btn btn-secondary", () => {
          clear(feedback);
          const result = checkTerms(answer.value, session.folders.keyTerms.slice(0, 5));
          feedback.append(feedbackBox("Self-check", result.message));
          state.progress.conceptQuizzesCompleted += 1;
          addWeakTerms(result.missing);
          saveProgress();
        }),
        buttonEl("Continue", "btn btn-primary", () => nextStudyStep(session))
      ]),
      feedback
    );

    els.currentTutorCard.append(shell);
  }

  function renderCauseEffectStep(session, step) {
    const shell = renderStepShell(session, step);

    const answer = document.createElement("textarea");
    answer.placeholder = "Write the cause, then the effect.";
    answer.setAttribute("aria-label", "Cause and effect answer");

    shell.append(
      textP(step.prompt),
      list([
        "Cause: What started it?",
        "Effect: What changed after?",
        "Why it matters: Why should you remember this?"
      ], "checklist"),
      answer,
      div("actions", [
        buttonEl("Continue", "btn btn-primary", () => nextStudyStep(session))
      ])
    );

    els.currentTutorCard.append(shell);
  }

  function renderTimelineStep(session, step) {
    const shell = renderStepShell(session, step);

    const timelineItems = [];

    session.folders.events.forEach((event, index) => {
      const date = session.folders.dates[index] || "Date not found";
      timelineItems.push(`${date}: ${event}`);
    });

    session.folders.dates.forEach((date) => {
      if (!timelineItems.some((item) => item.startsWith(`${date}:`))) {
        timelineItems.push(`${date}: connect this date to an event from your assignment`);
      }
    });

    shell.append(
      textP("Connect each date to what happened."),
      list(timelineItems.length ? timelineItems : ["No timeline items were found."], "timeline-list"),
      div("actions", [
        buttonEl("Continue", "btn btn-primary", () => nextStudyStep(session))
      ])
    );

    els.currentTutorCard.append(shell);
  }

  function renderMathStep(session, step) {
    els.currentTutorCard.append(
      renderProblemCard(step.problem, {
        context: "learn",
        item: step,
        onNext: () => nextStudyStep(session)
      })
    );
  }

  function renderCodeStep(session, step) {
    const shell = renderStepShell(session, step);

    shell.append(
      textP("Explain what this code does before running or changing it.", "muted"),
      codeBlock(step.code),
      list([
        "What are the inputs?",
        "What does it return or change?",
        "What happens with empty input?",
        "What is one small test case?",
        "What is one edge case?"
      ], "checklist"),
      div("actions", [
        buttonEl("Continue", "btn btn-primary", () => nextStudyStep(session))
      ])
    );

    els.currentTutorCard.append(shell);
  }

  function renderReviewPlanStep(session, step) {
    const shell = renderStepShell(session, step);

    const plan = [];

    if (session.folders.keyTerms.length) plan.push("Review key terms without looking.");
    if (session.folders.questions.length) plan.push("Answer each question out loud.");
    if (session.folders.events.length || session.folders.dates.length) plan.push("Connect dates and events.");
    if (session.folders.causeEffect.length) plan.push("Explain cause and effect.");
    if (session.folders.mathProblems.length) plan.push("Redo supported math problems.");
    if (session.folders.codeBlocks.length) plan.push("Explain code and write test ideas.");
    plan.push("Finish with a teach-back: explain the assignment in your own words.");

    shell.append(
      textP("Use this as your final review checklist.", "muted"),
      list(plan, "checklist"),
      div("actions", [
        buttonEl("Finish session", "btn btn-primary", () => {
          session.stepIndex = session.path.length;
          renderGuidedSession();
        })
      ])
    );

    els.currentTutorCard.append(shell);
  }

  function renderSessionComplete(session) {
    const card = div("study-path-overview");
    card.append(
      labelText("Complete", "micro-label"),
      heading("Nice work. You finished this study path.", 3),
      textP("Theorem saved your progress locally in this browser.", "muted"),
      div("actions", [
        buttonEl("Review again", "btn btn-secondary", () => {
          session.mode = "summary";
          session.stepIndex = 0;
          renderGuidedSession();
        }),
        buttonEl("View progress", "btn btn-primary", () => {
          renderProgressDashboard();
          showSection("progress");
        })
      ])
    );

    els.currentTutorCard.append(card);
  }

  function nextStudyStep(session) {
    session.stepIndex += 1;
    renderGuidedSession();
  }

  function extractFolders(text) {
    const folders = {
      questions: [],
      keyTerms: [],
      facts: [],
      people: [],
      dates: [],
      events: [],
      causeEffect: [],
      writingPrompts: [],
      mathProblems: [],
      codeBlocks: [],
      sources: [],
      unknown: []
    };

    const codeBlocks = extractCodeBlocks(text);
    codeBlocks.forEach((block) => addObjectUnique(folders.codeBlocks, block, "text"));

    const textWithoutCode = removeCodeBlocks(text);
    const lines = textWithoutCode
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    splitMaterial(textWithoutCode).forEach((item) => {
      const problem = detectMathProblem(item);
      if (problem) {
        addObjectUnique(folders.mathProblems, {
          raw: item,
          problem,
          hintIndex: 0,
          saved: false
        }, "raw");
      }
    });

    lines.forEach((line) => {
      const clean = stripListMarker(line);

      extractDates(clean).forEach((date) => addUnique(folders.dates, date));

      if (isLikelyHeading(clean)) return;

      if (isVocabularyLine(clean)) {
        extractVocabularyTerms(clean).forEach((term) => addUnique(folders.keyTerms, term));
        return;
      }

      if (isQuestionLine(clean)) {
        addUnique(folders.questions, normalizeQuestion(clean));

        if (/\bcause|caused|effect|why|because|led to\b/i.test(clean)) {
          addUnique(folders.causeEffect, normalizeQuestion(clean));
        }

        return;
      }

      if (isEventLine(clean)) {
        extractEvents(clean).forEach((event) => addUnique(folders.events, event));
        return;
      }

      if (isSourceLine(clean)) {
        addUnique(folders.sources, clean);
        return;
      }

      if (isWritingPromptLine(clean)) {
        addUnique(folders.writingPrompts, clean);
        return;
      }

      if (detectMathProblem(clean)) return;

      extractEvents(clean).forEach((event) => addUnique(folders.events, event));
      extractPeople(clean).forEach((person) => addUnique(folders.people, person));
      extractCauseEffect(clean).forEach((item) => addUnique(folders.causeEffect, item));

      if (looksLikeFact(clean)) {
        addUnique(folders.facts, clean);
      } else if (clean.length > 3) {
        addUnique(folders.unknown, clean);
      }
    });

    return folders;
  }

  function classifyMaterial(text, folders) {
    const subjectKey = detectSubject(text, folders);
    const documentType = detectDocumentType(text, folders);
    const taskType = detectTaskType(folders, subjectKey);
    const studyMethod = suggestStudyMethod(folders, subjectKey);

    return {
      subjectKey,
      subject: subjectLabels[subjectKey] || "General Study",
      documentType,
      taskType,
      studyMethod
    };
  }

  function detectSubject(text, folders) {
    const lower = text.toLowerCase();

    const scores = {
      coding:
        folders.codeBlocks.length * 5 +
        countMatches(lower, ["function", "const ", "let ", "var ", "class ", "def ", "return", "console.log"]),
      math:
        folders.mathProblems.length * 5 +
        countRegex(lower, [/\bsimplify\b/, /\bsolve\b/, /\d*x\s*[+\-]/, /\d+\s*\(\s*x\s*[+\-]/]),
      science: countMatches(lower, [
        "cell", "energy", "force", "atom", "molecule", "photosynthesis", "ecosystem",
        "experiment", "hypothesis", "oxygen", "glucose", "carbon dioxide"
      ]),
      history:
        folders.events.length * 2 +
        folders.dates.length +
        countMatches(lower, [
          "war", "revolution", "government", "colony", "colonial", "treaty", "rights",
          "taxation", "representation", "resistance", "boston tea party", "american revolution"
        ]),
      english: countMatches(lower, [
        "theme", "character", "essay", "claim", "evidence", "author", "poem", "story", "argument"
      ]),
      language: countMatches(lower, [
        "translate", "conjugate", "vocabulary", "spanish", "french", "german", "latin"
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

  function detectDocumentType(text, folders) {
    const lower = text.toLowerCase();

    if (lower.includes("study guide")) return "Study guide";
    if (lower.includes("worksheet")) return "Worksheet";
    if (lower.includes("homework")) return "Homework";
    if (lower.includes("quiz") || lower.includes("test review")) return "Test review";
    if (folders.codeBlocks.length) return "Code / programming material";
    if (folders.writingPrompts.length) return "Writing assignment";
    if (folders.sources.length) return "Research notes";
    if (folders.questions.length >= 3 && folders.keyTerms.length) return "Study guide";
    if (folders.questions.length >= 3) return "Question set";
    if (folders.facts.length >= 3) return "Notes";

    return "Study material";
  }

  function detectTaskType(folders, subjectKey) {
    if (folders.mathProblems.length) return "exact practice + mistake repair";
    if (folders.codeBlocks.length) return "code understanding + testing";
    if (folders.writingPrompts.length) return "writing + outlining";
    if (subjectKey === "history" && (folders.questions.length || folders.events.length || folders.dates.length)) {
      return "memorization + explanation";
    }
    if (subjectKey === "science") return "process recall + explanation";
    if (subjectKey === "english") return "reading analysis + evidence";
    if (folders.questions.length && folders.keyTerms.length) return "memorization + explanation";
    if (folders.keyTerms.length) return "vocabulary + recall";
    if (folders.questions.length) return "short-answer practice";

    return "active recall";
  }

  function suggestStudyMethod(folders, subjectKey) {
    const methods = [];

    if (folders.keyTerms.length) methods.push("flashcards");
    if (folders.questions.length) methods.push("short-answer practice");
    if (folders.causeEffect.length || subjectKey === "history") methods.push("cause/effect practice");
    if (folders.dates.length || folders.events.length) methods.push("timeline review");
    if (folders.mathProblems.length) methods.push("exact-check tutoring");
    if (folders.codeBlocks.length) methods.push("code explanation");
    methods.push("review plan");

    return methods.join(" + ");
  }

  function buildGuidedPath(folders, classification) {
    const path = [];

    folders.keyTerms.forEach((term) => {
      path.push({
        type: "flashcard",
        title: `Key term: ${term}`,
        short: "Explain this term.",
        term
      });
    });

    folders.questions.forEach((question) => {
      path.push({
        type: "question",
        title: "Short-answer practice",
        short: "Answer in your own words.",
        question
      });
    });

    if (folders.events.length || folders.dates.length) {
      path.push({
        type: "timeline",
        title: "Timeline review",
        short: "Connect dates and events."
      });
    }

    const causePrompts = folders.causeEffect.length
      ? folders.causeEffect
      : classification.subjectKey === "history"
        ? ["What caused the main event, and what changed because of it?"]
        : [];

    causePrompts.forEach((prompt) => {
      path.push({
        type: "cause_effect",
        title: "Cause/effect practice",
        short: "Explain the connection.",
        prompt
      });
    });

    folders.mathProblems.forEach((item) => {
      path.push({
        type: "math",
        title: `Math problem: ${item.raw}`,
        short: "Use exact-check mode.",
        problem: item.problem,
        hintIndex: 0,
        saved: false
      });
    });

    folders.codeBlocks.forEach((block) => {
      path.push({
        type: "code",
        title: "Code review",
        short: "Explain code and test ideas.",
        code: block.text
      });
    });

    path.push({
      type: "review_plan",
      title: "Review plan",
      short: "Finish with a checklist."
    });

    return path;
  }

  function isQuestionLine(line) {
    return (
      /\?$/.test(line) ||
      /^(explain|describe|what|why|how|when|where|who|list|compare|contrast|define|identify)\b/i.test(line)
    );
  }

  function normalizeQuestion(line) {
    return stripListMarker(line).replace(/\s+/g, " ").trim();
  }

  function stripListMarker(line) {
    return String(line)
      .replace(/^\s*(\d+\.|\d+\)|[-•*])\s*/, "")
      .trim();
  }

  function isVocabularyLine(line) {
    return /^(vocabulary|vocab|key terms?|terms?)\s*:/i.test(line);
  }

  function extractVocabularyTerms(line) {
    return String(line)
      .replace(/^(vocabulary|vocab|key terms?|terms?)\s*:/i, "")
      .split(/,|;|\|/)
      .map(cleanExtractedItem)
      .filter(Boolean);
  }

  function isEventLine(line) {
    return /^(important event|event|battle|war|treaty|movement)\s*:/i.test(line);
  }

  function extractEvents(line) {
    const results = [];
    const clean = stripListMarker(line);

    const eventLabel = clean.match(/^(important event|event)\s*:\s*(.+)$/i);
    if (eventLabel) {
      const body = eventLabel[2]
        .replace(/\b(1[0-9]{3}|20[0-9]{2})\b/g, "")
        .replace(/[,.;]+$/g, "");

      body
        .split(/,|;|\band\b/)
        .map(cleanExtractedItem)
        .filter(Boolean)
        .forEach((item) => results.push(item));
    }

    const knownEvent = clean.match(/\b(American Revolution|Boston Tea Party|Civil War|World War I|World War II|French Revolution|Industrial Revolution)\b/i);
    if (knownEvent) results.push(titleCaseKnown(knownEvent[1]));

    return Array.from(new Set(results));
  }

  function extractDates(line) {
    return Array.from(new Set(String(line).match(/\b(1[0-9]{3}|20[0-9]{2})\b/g) || []));
  }

  function extractPeople(line) {
    const names = line.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || [];

    return Array.from(
      new Set(
        names.filter((name) => !/American Revolution|Boston Tea|Tea Party|Civil War|World War|United States/i.test(name))
      )
    );
  }

  function extractCauseEffect(line) {
    if (/\bcause|caused|effect|because|led to|resulted in\b/i.test(line)) return [line];
    return [];
  }

  function isSourceLine(line) {
    return /^(source|citation|works cited|reference)\s*:|https?:\/\/|www\./i.test(line);
  }

  function isWritingPromptLine(line) {
    return /^(writing prompt|essay prompt|prompt|write|essay|paragraph)\b/i.test(stripListMarker(line));
  }

  function isLikelyHeading(line) {
    const clean = stripListMarker(line);

    return (
      clean.length < 80 &&
      !/[.!?]$/.test(clean) &&
      /study guide|notes|review|chapter|unit|lesson|worksheet/i.test(clean)
    );
  }

  function looksLikeFact(line) {
    const clean = stripListMarker(line);

    return (
      clean.length > 14 &&
      !isQuestionLine(clean) &&
      !isVocabularyLine(clean) &&
      !isWritingPromptLine(clean) &&
      !detectMathProblem(clean)
    );
  }

  function cleanExtractedItem(item) {
    return String(item)
      .replace(/^[\s,.;:-]+/, "")
      .replace(/[\s,.;:-]+$/, "")
      .trim();
  }

  function titleCaseKnown(value) {
    return String(value)
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function extractCodeBlocks(text) {
    const blocks = [];
    const regex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(String(text))) !== null) {
      blocks.push({
        language: match[1] || "code",
        text: match[2].trim()
      });
    }

    if (!blocks.length && /\b(function|const|let|var|class|def|return)\b|[{};]/.test(text)) {
      blocks.push({
        language: "code",
        text: String(text).trim()
      });
    }

    return blocks.filter((block) => block.text);
  }

  function removeCodeBlocks(text) {
    return String(text).replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, "");
  }

  function splitMaterial(text) {
    return String(text)
      .replace(/\r/g, "")
      .split(/\n|;|(?=\s*\d+\.\s+)|(?=\s*[-•*]\s+)/)
      .map((line) => line.replace(/^\s*(\d+\.|[-•*])\s*/, "").trim())
      .filter(Boolean);
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
      panel.append(div("actions", [buttonEl("Continue", "btn btn-primary", onNext)]));
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
        buttonEl("Continue", "btn btn-primary", onNext)
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
        mistakeType = "distribution_error";
        message = "The distribution pattern is off.";
        why = "Each term inside the parentheses must be multiplied by the outside number.";
        fix = "Use a(b + c) = ab + ac.";
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

  function renderReview() {
    if (!els.reviewGrid) return;

    clear(els.reviewGrid);

    const progress = state.progress;
    const hasProgress =
      progress.sessions ||
      progress.mathProblemsAttempted ||
      progress.flashcardsReviewed ||
      progress.conceptQuizzesCompleted;

    if (!hasProgress) {
      els.reviewGrid.append(
        reviewCard("Complete a learning session first.", "Paste notes, homework, code, or supported Algebra 1 problems in the Learn Workspace.")
      );
      return;
    }

    Object.entries(progress.mistakes)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([type, count]) => {
        els.reviewGrid.append(reviewCard(readableMistake(type), `${count} time(s). Try a repair drill in Practice.`));
      });

    progress.weakTerms.slice(0, 6).forEach((term) => {
      els.reviewGrid.append(reviewCard(`Review term: ${term}`, "Explain it out loud, then compare against your notes."));
    });

    if (!els.reviewGrid.children.length) {
      els.reviewGrid.append(reviewCard("Review is ready.", "Keep using Theorem and review cards will appear here."));
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
      weakSubjects: saved.weakSubjects || {},
      weakTerms: saved.weakTerms || [],
      recentAttempts: saved.recentAttempts || []
    };
  }

  function checkTerms(answer, required) {
    const lower = String(answer || "").toLowerCase();
    const missing = required.filter((term) => !lower.includes(String(term).toLowerCase()));

    if (!String(answer || "").trim()) {
      return {
        missing: required,
        message: "Write an answer first. Then compare it to the checklist."
      };
    }

    if (!required.length) {
      return {
        missing: [],
        message: "Good. Now compare your answer against your class notes."
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

  function addUnique(list, value) {
    const clean = cleanExtractedItem(value);
    if (clean && !list.some((item) => String(item).toLowerCase() === clean.toLowerCase())) {
      list.push(clean);
    }
  }

  function addObjectUnique(list, object, key) {
    if (!object || !object[key]) return;

    const value = String(object[key]).toLowerCase();

    if (!list.some((item) => String(item[key]).toLowerCase() === value)) {
      list.push(object);
    }
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
    if (!progress.sessions) return "Start by building a study path.";

    if (progress.mathProblemsAttempted && percent(progress.correctAnswers, progress.mathProblemsAttempted) < 80) {
      return `Practice ${titleSkill(weakestSkill)} and watch for ${readableMistake(commonMistake)}.`;
    }

    if (progress.weakTerms.length) {
      return `Review these terms: ${progress.weakTerms.slice(0, 3).join(", ")}.`;
    }

    return "Build another study path and continue one card at a time.";
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

  function list(items, className) {
    const node = document.createElement("ul");
    if (className) node.className = className;

    const safeItems = items && items.length ? items : ["No items found yet."];

    safeItems.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = typeof item === "string" ? item : JSON.stringify(item);
      node.append(li);
    });

    return node;
  }

  function codeBlock(text) {
    const pre = document.createElement("pre");
    pre.className = "code-block-view";

    const code = document.createElement("code");
    code.textContent = text;

    pre.append(code);
    return pre;
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
