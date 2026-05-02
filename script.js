(() => {
  "use strict";

  const STORAGE_KEY = "theoremV1LocalState";
  const FREE_ACTIVE_PATH_LIMIT = 3;
  const FREE_UPLOADS_PER_DAY = 8;

  const loadingPhrases = [
    "Clearing the runway…",
    "Reading your workspace…",
    "Preparing study engines…",
    "Building your path…",
    "Ready for takeoff."
  ];

  const departments = ["Math", "Science", "Social Studies", "Reading/Writing"];

  const state = {
    db: loadState(),
    activePathId: null,
    activeCardIndex: 0,
    currentScreen: "dashboard"
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", () => {
    cacheElements();
    startLoading();
    bindAuth();
    bindNavigation();
    bindUpload();
    bindSettings();
    renderAll();
  });

  function cacheElements() {
    els.loadingScreen = document.querySelector("#loadingScreen");
    els.loadingPhrase = document.querySelector("#loadingPhrase");

    els.loginView = document.querySelector("#loginView");
    els.appView = document.querySelector("#appView");
    els.googleLoginBtn = document.querySelector("#googleLoginBtn");
    els.guestLoginBtn = document.querySelector("#guestLoginBtn");
    els.authMessage = document.querySelector("#authMessage");

    els.navToggle = document.querySelector("#navToggle");
    els.navLinks = document.querySelector("#navLinks");
    els.navButtons = Array.from(document.querySelectorAll("[data-screen-target]"));
    els.screens = Array.from(document.querySelectorAll(".screen"));

    els.uploadActionBtn = document.querySelector("#uploadActionBtn");
    els.pasteActionBtn = document.querySelector("#pasteActionBtn");
    els.materialInput = document.querySelector("#materialInput");
    els.materialFile = document.querySelector("#materialFile");
    els.imagePdfBtn = document.querySelector("#imagePdfBtn");
    els.buildPathBtn = document.querySelector("#buildPathBtn");
    els.uploadMessage = document.querySelector("#uploadMessage");

    els.activePathShell = document.querySelector("#activePathShell");
    els.detectedSummary = document.querySelector("#detectedSummary");
    els.pathSteps = document.querySelector("#pathSteps");
    els.studyStage = document.querySelector("#studyStage");
    els.studyTools = document.querySelector("#studyTools");

    els.pathsGrid = document.querySelector("#pathsGrid");
    els.reviewGrid = document.querySelector("#reviewGrid");
    els.progressDashboard = document.querySelector("#progressDashboard");

    els.planUsageText = document.querySelector("#planUsageText");
    els.accountModeText = document.querySelector("#accountModeText");
    els.signOutBtn = document.querySelector("#signOutBtn");
    els.resetDataBtn = document.querySelector("#resetDataBtn");
  }

  function startLoading() {
    let index = 0;

    const phraseTimer = window.setInterval(() => {
      index = (index + 1) % loadingPhrases.length;

      if (els.loadingPhrase) {
        els.loadingPhrase.textContent = loadingPhrases[index];
      }
    }, 520);

    window.setTimeout(() => {
      window.clearInterval(phraseTimer);

      if (els.loadingScreen) {
        els.loadingScreen.classList.add("hide");
      }

      showLogin();
    }, 2800);
  }

  function showLogin() {
    if (els.loginView) els.loginView.classList.remove("hidden");
    if (els.appView) els.appView.classList.add("hidden");
  }

  function showApp() {
    if (els.loginView) els.loginView.classList.add("hidden");
    if (els.appView) els.appView.classList.remove("hidden");

    showScreen("dashboard");
  }

  function bindAuth() {
    if (els.guestLoginBtn) {
      els.guestLoginBtn.addEventListener("click", () => {
        state.db.user = {
          mode: "guest",
          uid: "guest-local",
          displayName: "Guest",
          signedInAt: new Date().toISOString()
        };

        saveState();
        showApp();
        renderAll();
      });
    }

    if (els.googleLoginBtn) {
      els.googleLoginBtn.addEventListener("click", async () => {
        setAuthMessage("Checking Google sign-in…");

        const auth = window.TheoremAuth;

        if (!auth || typeof auth.signInWithGoogle !== "function") {
          setAuthMessage("Google sign-in is not connected yet.");
          return;
        }

        try {
          const result = await auth.signInWithGoogle();

          if (!result || !result.ok) {
            setAuthMessage(result?.message || "Google sign-in is not connected yet.");
            return;
          }

          state.db.user = {
            mode: "google",
            uid: result.user.uid,
            displayName: result.user.displayName || "Google user",
            email: result.user.email || "",
            signedInAt: new Date().toISOString()
          };

          saveState();
          showApp();
          renderAll();
        } catch {
          setAuthMessage("Google sign-in is not connected yet.");
        }
      });
    }
  }

  function setAuthMessage(message) {
    if (els.authMessage) {
      els.authMessage.textContent = message;
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
        const target = button.dataset.screenTarget;

        if (target) {
          showScreen(target);
        }
      });
    });
  }

  function showScreen(name) {
    state.currentScreen = name;

    els.screens.forEach((screen) => {
      screen.classList.toggle("active-screen", screen.id === `screen-${name}`);
    });

    document.querySelectorAll(".nav-link").forEach((button) => {
      button.classList.toggle("active", button.dataset.screenTarget === name);
    });

    if (els.navLinks) els.navLinks.classList.remove("open");
    if (els.navToggle) els.navToggle.setAttribute("aria-expanded", "false");

    renderAll();
  }

  function bindUpload() {
    if (els.uploadActionBtn && els.materialFile) {
      els.uploadActionBtn.addEventListener("click", () => {
        els.materialFile.click();
      });
    }

    if (els.pasteActionBtn && els.materialInput) {
      els.pasteActionBtn.addEventListener("click", () => {
        els.materialInput.focus();
        setUploadMessage("Paste your assignment, then click Build study path.");
      });
    }

    if (els.materialFile) {
      els.materialFile.addEventListener("change", handleTextFileUpload);
    }

    if (els.imagePdfBtn) {
      els.imagePdfBtn.addEventListener("click", () => {
        setUploadMessage("Image and PDF extraction is coming soon.");
      });
    }

    if (els.buildPathBtn) {
      els.buildPathBtn.addEventListener("click", buildStudyPathFromInput);
    }
  }

  function handleTextFileUpload() {
    const file = els.materialFile.files && els.materialFile.files[0];

    if (!file) return;

    const name = file.name.toLowerCase();

    const supported =
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      file.type === "text/plain" ||
      file.type === "text/markdown";

    if (!supported) {
      setUploadMessage("Image and PDF extraction is coming soon.");
      els.materialFile.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (els.materialInput) {
        els.materialInput.value = String(reader.result || "");
      }

      setUploadMessage(`Loaded ${file.name}. Click Build study path.`);
    };

    reader.onerror = () => {
      setUploadMessage("Theorem could not read that file. Try pasting the text instead.");
    };

    reader.readAsText(file);
  }

  function buildStudyPathFromInput() {
    const text = (els.materialInput?.value || "").trim();

    if (!text) {
      setUploadMessage("Paste or upload assignment text first.");
      return;
    }

    refreshDailyUsage();

    const activePaths = state.db.studyPaths.filter((path) => path.active !== false);

    if (activePaths.length >= FREE_ACTIVE_PATH_LIMIT) {
      setUploadMessage("Free plan limit reached: 3 active study paths. Delete one in Study Paths or wait for Pro later.");
      showScreen("paths");
      return;
    }

    if (!canUploadToday()) {
      setUploadMessage("Free plan daily upload limit reached. Try again tomorrow or upgrade when Pro is available.");
      return;
    }

    const path = createStudyPath(text);

    state.db.studyPaths.unshift(path);
    state.activePathId = path.id;
    state.activeCardIndex = 0;

    state.db.progress.totalStudyPaths += 1;
    state.db.progress.uploadsToday += 1;
    state.db.progress.lastUploadDate = todayKey();
    state.db.progress.departmentCounts[path.department] =
      (state.db.progress.departmentCounts[path.department] || 0) + 1;

    saveState();

    if (els.activePathShell) {
      els.activePathShell.classList.remove("hidden");
    }

    setUploadMessage("Theorem extracted your material and organized it into a study path.");
    renderAll();
  }

  function refreshDailyUsage() {
    const today = todayKey();

    if (state.db.progress.lastUploadDate !== today) {
      state.db.progress.lastUploadDate = today;
      state.db.progress.uploadsToday = 0;
      saveState();
    }
  }

  function canUploadToday() {
    refreshDailyUsage();
    return state.db.progress.uploadsToday < FREE_UPLOADS_PER_DAY;
  }

  function createStudyPath(text) {
    const folders = extractMaterial(text);
    const department = classifyDepartment(text, folders);
    const documentType = detectDocumentType(text, folders);
    const tools = buildTools(department, folders);
    const cards = buildCards(department, folders, tools);
    const title = createPathTitle(text, department, documentType);

    return {
      id: cryptoId(),
      title,
      department,
      documentType,
      taskType: detectTaskType(department, folders),
      createdAt: new Date().toISOString(),
      active: true,
      originalText: text,
      assignments: folders.assignments,
      folders,
      tools,
      cards,
      cardProgress: {
        completed: 0,
        total: cards.length
      },
      firestoreShape: {
        userPath: "users/{uid}",
        studyPathDoc: "users/{uid}/studyPaths/{studyPathId}",
        assignmentsSubcollection: "users/{uid}/assignments/{assignmentId}",
        progressDoc: "users/{uid}/progress/main",
        reviewItemsSubcollection: "users/{uid}/reviewItems/{reviewItemId}"
      }
    };
  }

  function extractMaterial(text) {
    const folders = emptyFolders();
    const codeBlocks = extractCodeBlocks(text);
    const textWithoutCode = removeCodeBlocks(text);

    const lines = textWithoutCode
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    codeBlocks.forEach((block) => {
      addObjectUnique(folders.codeBlocks, block, "text");
    });

    splitMaterial(textWithoutCode).forEach((piece) => {
      const problem = detectMathProblem(piece);

      if (problem) {
        addObjectUnique(
          folders.mathProblems,
          {
            raw: piece,
            problem,
            saved: false,
            hintIndex: 0
          },
          "raw"
        );
      }
    });

    lines.forEach((line) => {
      const clean = stripListMarker(line);

      if (!clean) return;

      extractDates(clean).forEach((date) => addUnique(folders.dates, date));

      if (isAssignmentLine(clean)) {
        addUnique(folders.assignments, clean);
        return;
      }

      if (isLikelyHeading(clean)) {
        addUnique(folders.assignments, clean);
        return;
      }

      if (isVocabularyLine(clean)) {
        extractVocabulary(clean).forEach((term) => addUnique(folders.vocabulary, term));
        return;
      }

      if (isQuestionLine(clean)) {
        addUnique(folders.questions, normalizeQuestion(clean));

        if (mentionsCauseEffect(clean)) {
          addUnique(folders.keyFacts, clean);
        }

        return;
      }

      if (isEventLine(clean)) {
        extractEvents(clean).forEach((event) => addUnique(folders.events, event));
        return;
      }

      if (isWritingPromptLine(clean)) {
        addUnique(folders.writingPrompts, clean);
        return;
      }

      if (isSourceLine(clean)) {
        addUnique(folders.sources, clean);
        return;
      }

      if (detectMathProblem(clean)) {
        return;
      }

      extractEvents(clean).forEach((event) => addUnique(folders.events, event));
      extractPeople(clean).forEach((person) => addUnique(folders.people, person));

      if (looksLikeFact(clean)) {
        addUnique(folders.keyFacts, clean);
      } else {
        addUnique(folders.unknown, clean);
      }
    });

    return folders;
  }

  function emptyFolders() {
    return {
      assignments: [],
      questions: [],
      vocabulary: [],
      keyFacts: [],
      dates: [],
      events: [],
      people: [],
      mathProblems: [],
      writingPrompts: [],
      codeBlocks: [],
      sources: [],
      unknown: []
    };
  }

  function classifyDepartment(text, folders) {
    const lower = text.toLowerCase();

    const scores = {
      Math:
        folders.mathProblems.length * 5 +
        countRegex(lower, [
          /\bsolve\b/,
          /\bsimplify\b/,
          /\d*x\s*[+\-*/=]/,
          /\d+\s*\(\s*x\s*[+\-]/
        ]),
      Science:
        countMatches(lower, [
          "photosynthesis",
          "cell",
          "cells",
          "energy",
          "force",
          "matter",
          "atom",
          "molecule",
          "ecosystem",
          "experiment",
          "hypothesis",
          "variable",
          "oxygen",
          "glucose",
          "carbon dioxide"
        ]),
      "Social Studies":
        folders.dates.length +
        folders.events.length * 2 +
        folders.people.length +
        countMatches(lower, [
          "revolution",
          "war",
          "government",
          "colony",
          "president",
          "rights",
          "treaty",
          "empire",
          "civilization",
          "economy",
          "taxation",
          "representation",
          "boston tea party"
        ]),
      "Reading/Writing":
        folders.writingPrompts.length * 3 +
        countMatches(lower, [
          "story",
          "poem",
          "theme",
          "character",
          "author",
          "essay",
          "claim",
          "evidence",
          "paragraph",
          "prompt",
          "text evidence"
        ])
    };

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [bestDepartment, bestScore] = sorted[0];

    return bestScore > 0 ? bestDepartment : "Reading/Writing";
  }

  function detectDocumentType(text, folders) {
    const lower = text.toLowerCase();

    if (lower.includes("study guide")) return "Study guide";
    if (lower.includes("worksheet")) return "Worksheet";
    if (lower.includes("homework")) return "Homework";
    if (lower.includes("test review") || lower.includes("quiz review")) return "Test review";
    if (folders.codeBlocks.length) return "Code assignment";
    if (folders.writingPrompts.length) return "Writing assignment";
    if (folders.questions.length >= 3 && folders.vocabulary.length) return "Study guide";
    if (folders.questions.length >= 3) return "Question set";

    return "Study material";
  }

  function detectTaskType(department, folders) {
    if (department === "Math") return "exact practice + mistake repair";
    if (department === "Science") return "Remember → Explain → Apply";
    if (department === "Social Studies") return "memorization + explanation";
    if (folders.writingPrompts.length) return "writing + evidence building";

    return "active recall + short answer";
  }

  function buildTools(department, folders) {
    const tools = [];

    if (department === "Math") {
      tools.push(
        "Step-by-step checking",
        "Hints",
        "Mistake diagnosis",
        "Repair drills",
        "Mastery problems"
      );
    }

    if (department === "Science") {
      tools.push(
        "Memory flashcards",
        "Vocabulary recall",
        "Process breakdown",
        "Teach-back mode",
        "Application questions",
        "Quick quiz"
      );
    }

    if (department === "Social Studies") {
      tools.push(
        "Flashcards",
        "Timeline",
        "People/events review",
        "Cause/effect map",
        "Why-it-mattered questions",
        "Creative thinking test",
        "Short-answer practice"
      );
    }

    if (department === "Reading/Writing") {
      tools.push(
        "Main idea",
        "Vocabulary",
        "Theme/character tracker",
        "Claim/evidence/reasoning builder",
        "Essay outline",
        "Short-answer practice"
      );
    }

    if (folders.codeBlocks.length) {
      tools.push("Code explanation", "Edge cases", "Test ideas");
    }

    if (folders.sources.length) {
      tools.push("Research organizer");
    }

    return Array.from(new Set(tools));
  }

  function buildCards(department, folders, tools) {
    const cards = [];

    folders.vocabulary.forEach((term) => {
      cards.push({
        type: "flashcard",
        title: `Vocabulary: ${term}`,
        term
      });
    });

    folders.questions.forEach((question) => {
      cards.push({
        type: "question",
        title: "Short answer",
        question
      });
    });

    if (department === "Science") {
      folders.keyFacts.slice(0, 4).forEach((fact) => {
        cards.push({
          type: "science",
          title: "Remember → Explain → Apply",
          fact
        });
      });
    }

    if (department === "Social Studies" && (folders.events.length || folders.dates.length)) {
      cards.push({ type: "timeline", title: "Timeline review" });
      cards.push({ type: "causeEffect", title: "Cause/effect map" });
      cards.push({ type: "creative", title: "Creative thinking test" });
    }

    if (department === "Reading/Writing") {
      folders.writingPrompts.forEach((prompt) => {
        cards.push({
          type: "outline",
          title: "Essay outline",
          prompt
        });
      });
    }

    folders.mathProblems.forEach((item) => {
      cards.push({
        type: "math",
        title: `Math: ${item.raw}`,
        problem: item.problem,
        saved: false,
        hintIndex: 0
      });
    });

    folders.codeBlocks.forEach((block) => {
      cards.push({
        type: "code",
        title: "Code review",
        code: block.text
      });
    });

    cards.push({
      type: "reviewPlan",
      title: "Review plan",
      tools
    });

    return cards;
  }

  function renderAll() {
    renderActivePath();
    renderPaths();
    renderReview();
    renderProgress();
    renderSettings();
  }

  function renderActivePath() {
    const path = getActivePath();

    if (!path) {
      if (els.activePathShell) {
        els.activePathShell.classList.add("hidden");
      }

      return;
    }

    if (els.activePathShell) {
      els.activePathShell.classList.remove("hidden");
    }

    clear(els.detectedSummary);
    clear(els.pathSteps);
    clear(els.studyTools);
    clear(els.studyStage);

    if (els.detectedSummary) {
      els.detectedSummary.append(
        statPill("Department", path.department),
        statPill("Document", path.documentType),
        statPill("Task", path.taskType)
      );
    }

    path.cards.forEach((card, index) => {
      const step = createEl("button", "path-card");
      step.type = "button";
      step.append(strong(`${index + 1}. ${card.title}`));

      step.addEventListener("click", () => {
        state.activeCardIndex = index;
        renderActivePath();
      });

      if (index === state.activeCardIndex) {
        step.classList.add("active");
      }

      if (els.pathSteps) {
        els.pathSteps.append(step);
      }
    });

    path.tools.forEach((tool) => {
      if (els.studyTools) {
        els.studyTools.append(toolCard(tool, toolDescription(tool)));
      }
    });

    renderStudyCard(path);
  }

  function renderStudyCard(path) {
    if (!els.studyStage) return;

    const card = path.cards[state.activeCardIndex];

    if (!card) {
      renderCompleteCard(path);
      return;
    }

    if (card.type === "flashcard") renderFlashcard(path, card);
    else if (card.type === "question") renderQuestion(path, card);
    else if (card.type === "science") renderScience(path, card);
    else if (card.type === "timeline") renderTimeline(path);
    else if (card.type === "causeEffect") renderCauseEffect(path);
    else if (card.type === "creative") renderCreative(path);
    else if (card.type === "outline") renderOutline(path, card);
    else if (card.type === "math") renderMath(path, card);
    else if (card.type === "code") renderCode(path, card);
    else renderReviewPlan(path);
  }

  function renderFlashcard(path, card) {
    const shell = studyShell(path, card);

    const answer = createEl("textarea");
    answer.placeholder = `Explain "${card.term}" in your own words.`;

    const reveal = div("tool-card hidden");
    reveal.append(
      strong("Check"),
      textP(`Your explanation should define "${card.term}" and connect it to the assignment.`)
    );

    shell.append(
      textP(`Term: ${card.term}`),
      answer,
      div("button-row", [
        buttonEl("Show check", "btn btn-secondary", () => {
          reveal.classList.remove("hidden");
          state.db.progress.flashcardsReviewed += 1;
          addReviewItem(`Review term: ${card.term}`, "Explain this term again later.");
          saveState();
        }),
        continueButton(path)
      ]),
      reveal
    );

    els.studyStage.append(shell);
  }

  function renderQuestion(path, card) {
    const shell = studyShell(path, card);

    const answer = createEl("textarea");
    answer.placeholder = "Answer in your own words.";

    const feedback = div("feedback-root");

    shell.append(
      textP(card.question),
      answer,
      div("button-row", [
        buttonEl("Check key words", "btn btn-secondary", () => {
          clear(feedback);

          const terms = path.folders.vocabulary.slice(0, 5);
          const result = checkTerms(answer.value, terms);

          feedback.append(feedbackBox("Self-check", result.message));

          state.db.progress.shortAnswers += 1;

          result.missing.forEach((term) => {
            addReviewItem(`Review term: ${term}`, "Use this term in a complete answer.");
          });

          saveState();
        }),
        continueButton(path)
      ]),
      feedback
    );

    els.studyStage.append(shell);
  }

  function renderScience(path, card) {
    const shell = studyShell(path, card);

    const answer = createEl("textarea");
    answer.placeholder = "Remember the fact, explain it, then apply it to an example.";

    shell.append(
      textP(card.fact),
      list([
        "Remember: What does it say?",
        "Explain: Why does it happen?",
        "Apply: Where would you see it?"
      ]),
      answer,
      div("button-row", [continueButton(path)])
    );

    els.studyStage.append(shell);
  }

  function renderTimeline(path) {
    const shell = studyShell(path, { title: "Timeline review" });
    const items = [];

    path.folders.events.forEach((event, index) => {
      items.push(`${path.folders.dates[index] || "Date not found"}: ${event}`);
    });

    path.folders.dates.forEach((date) => {
      if (!items.some((item) => item.startsWith(date))) {
        items.push(`${date}: connect this date to an event`);
      }
    });

    shell.append(
      textP("Connect each date to what happened."),
      list(items.length ? items : ["No dates/events were found."]),
      div("button-row", [continueButton(path)])
    );

    els.studyStage.append(shell);
  }

  function renderCauseEffect(path) {
    const shell = studyShell(path, { title: "Cause/effect map" });

    shell.append(
      list([
        "Cause: What started the event or problem?",
        "Effect: What changed afterward?",
        "Why it mattered: Why should this be remembered?"
      ]),
      div("button-row", [continueButton(path)])
    );

    els.studyStage.append(shell);
  }

  function renderCreative(path) {
    const shell = studyShell(path, { title: "Creative thinking test" });

    shell.append(
      list([
        "What might have happened if one major decision changed?",
        "How would someone at the time explain this event?",
        "Compare this to another conflict, discovery, or decision."
      ]),
      div("button-row", [continueButton(path)])
    );

    els.studyStage.append(shell);
  }

  function renderOutline(path, card) {
    const shell = studyShell(path, card);

    shell.append(
      textP(card.prompt),
      list([
        "Claim:",
        "Evidence 1:",
        "Evidence 2:",
        "Reasoning:",
        "Closing sentence:"
      ]),
      div("button-row", [continueButton(path)])
    );

    els.studyStage.append(shell);
  }

  function renderMath(path, card) {
    els.studyStage.append(
      renderProblemCard(card.problem, {
        item: card,
        onNext: () => completeAndContinue(path)
      })
    );
  }

  function renderCode(path, card) {
    const shell = studyShell(path, card);

    shell.append(
      codeBlock(card.code),
      list([
        "What are the inputs?",
        "What does the code return or change?",
        "What happens with empty input?",
        "What is one edge case?",
        "What is one test idea?"
      ]),
      div("button-row", [continueButton(path)])
    );

    els.studyStage.append(shell);
  }

  function renderReviewPlan(path) {
    const shell = studyShell(path, { title: "Review plan" });

    shell.append(
      list([
        "Review vocabulary without looking.",
        "Answer each question out loud.",
        "Redo math problems if present.",
        "Explain the assignment in your own words.",
        "Return to review items later."
      ]),
      div("button-row", [
        buttonEl("Finish path", "btn btn-primary", () => {
          path.cardProgress.completed = path.cards.length;
          addReviewItem(`Review ${path.title}`, "Come back and repeat the path later.");
          saveState();
          state.activeCardIndex = path.cards.length;
          renderAll();
        })
      ])
    );

    els.studyStage.append(shell);
  }

  function renderCompleteCard(path) {
    const shell = div("study-card");

    shell.append(
      pLabel("Complete"),
      heading("Path complete.", 3),
      textP("Nice work. Theorem saved your progress locally."),
      div("button-row", [
        buttonEl("Study again", "btn btn-secondary", () => {
          state.activeCardIndex = 0;
          renderAll();
        }),
        buttonEl("View progress", "btn btn-primary", () => showScreen("progress"))
      ])
    );

    els.studyStage.append(shell);
  }

  function studyShell(path, card) {
    const shell = div("study-card");

    shell.append(
      pLabel(`Step ${Math.min(state.activeCardIndex + 1, path.cards.length)} of ${path.cards.length}`),
      heading(card.title, 3)
    );

    return shell;
  }

  function continueButton(path) {
    return buttonEl("Continue", "btn btn-primary", () => completeAndContinue(path));
  }

  function completeAndContinue(path) {
    path.cardProgress.completed = Math.max(path.cardProgress.completed, state.activeCardIndex + 1);
    state.db.progress.completedCards += 1;
    state.activeCardIndex += 1;

    saveState();
    renderAll();
  }

  function renderPaths() {
    clear(els.pathsGrid);

    if (!els.pathsGrid) return;

    if (!state.db.studyPaths.length) {
      els.pathsGrid.append(infoCard("No study paths yet", "Build one from the dashboard."));
      return;
    }

    state.db.studyPaths.forEach((path) => {
      const card = div("info-card");

      card.append(
        heading(path.title, 3),
        textP(`${path.department} · ${path.documentType}`),
        textP(`Progress: ${path.cardProgress.completed}/${path.cardProgress.total}`),
        div("button-row", [
          buttonEl("Open", "btn btn-primary", () => {
            state.activePathId = path.id;
            state.activeCardIndex = Math.min(path.cardProgress.completed, path.cards.length);
            showScreen("dashboard");

            if (els.activePathShell) {
              els.activePathShell.classList.remove("hidden");
            }

            renderAll();
          }),
          buttonEl("Delete", "btn btn-ghost", () => {
            state.db.studyPaths = state.db.studyPaths.filter((item) => item.id !== path.id);

            if (state.activePathId === path.id) {
              state.activePathId = null;
              state.activeCardIndex = 0;
            }

            saveState();
            renderAll();
          })
        ])
      );

      els.pathsGrid.append(card);
    });
  }

  function renderReview() {
    clear(els.reviewGrid);

    if (!els.reviewGrid) return;

    if (!state.db.reviewItems.length) {
      els.reviewGrid.append(infoCard("No review items yet", "Complete cards and Theorem will add review here."));
      return;
    }

    state.db.reviewItems.slice(0, 24).forEach((item) => {
      els.reviewGrid.append(infoCard(item.title, item.body));
    });
  }

  function renderProgress() {
    clear(els.progressDashboard);

    if (!els.progressDashboard) return;

    refreshDailyUsage();

    const active = state.db.studyPaths.filter((path) => path.active !== false).length;

    els.progressDashboard.append(
      statCard("Active paths", active),
      statCard("Completed cards", state.db.progress.completedCards),
      statCard("Flashcards reviewed", state.db.progress.flashcardsReviewed),
      statCard("Short answers", state.db.progress.shortAnswers),
      statCard("Uploads today", `${state.db.progress.uploadsToday}/${FREE_UPLOADS_PER_DAY}`),
      statCard("Total paths", state.db.progress.totalStudyPaths)
    );
  }

  function renderSettings() {
    refreshDailyUsage();

    const active = state.db.studyPaths.filter((path) => path.active !== false).length;

    if (els.planUsageText) {
      els.planUsageText.textContent =
        `Active paths: ${active}/${FREE_ACTIVE_PATH_LIMIT}. Uploads today: ${state.db.progress.uploadsToday}/${FREE_UPLOADS_PER_DAY}.`;
    }

    if (els.accountModeText) {
      els.accountModeText.textContent = `Current mode: ${state.db.user?.mode || "not signed in"}`;
    }
  }

  function bindSettings() {
    if (els.signOutBtn) {
      els.signOutBtn.addEventListener("click", () => {
        state.db.user = null;
        saveState();
        showLogin();
      });
    }

    if (els.resetDataBtn) {
      els.resetDataBtn.addEventListener("click", () => {
        if (!window.confirm("Reset all local Theorem data?")) return;

        localStorage.removeItem(STORAGE_KEY);

        state.db = defaultState();
        state.activePathId = null;
        state.activeCardIndex = 0;

        saveState();
        renderAll();
        showLogin();
      });
    }
  }

  function renderProblemCard(problem, options) {
    const wrapper = document.createElement("article");
    wrapper.className = "study-card";

    const stage = div("problem-stage");

    stage.append(
      pLabel(problem.skillLabel),
      div("problem-display", null, problem.display),
      textP(problem.instruction)
    );

    const form = document.createElement("form");

    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = problem.answerPlaceholder;

    const row = div("answer-row");

    const checkButton = buttonEl("Check", "btn btn-primary");
    checkButton.type = "submit";

    row.append(input, checkButton);
    form.append(row);

    const hintText = textP("", "hint-text");
    let hintIndex = options.item?.hintIndex || 0;

    const hintButton = buttonEl("Show hint", "btn btn-secondary", () => {
      hintText.textContent = problem.hints[Math.min(hintIndex, problem.hints.length - 1)];
      hintIndex += 1;

      if (options.item) {
        options.item.hintIndex = hintIndex;
      }

      if (hintIndex >= problem.hints.length) {
        hintButton.disabled = true;
      }
    });

    const feedback = div("feedback-root");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const result = checkAnswer(problem, input.value);

      if (options.item && !options.item.saved) {
        saveMathAttempt(problem, result);
        options.item.saved = true;
      }

      clear(feedback);
      feedback.append(renderMathFeedback(problem, result, options.onNext));

      saveState();
    });

    wrapper.append(stage, form, div("hint-zone", [hintButton, hintText]), feedback);

    return wrapper;
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
    const number = parseNumericAnswer(input);
    const expression = parseLinearExpression(input);

    let mistakeType = forced || "random_or_unclear";
    let message = "Theorem is not sure which mistake happened, but here is the safest next step.";
    let why = "The answer does not match the expected structure.";
    let fix = "Go one step at a time and check each operation.";

    if (problem.kind === "equation") {
      if (forced === "incomplete_solution") {
        message = "Enter a number for x, like 6 or x = 6.";
        why = "Theorem needs an attempted value before showing the worked steps.";
        fix = "Type the value you think x equals.";
      } else if (number !== null && nearly(number, problem.middleValue)) {
        mistakeType = "skipped_inverse_operation";
        message = `You reached ${problem.coefficient}x = ${formatNumber(problem.middleValue)}, but stopped early.`;
        why = `x is still multiplied by ${problem.coefficient}.`;
        fix = `Divide both sides by ${problem.coefficient}.`;
      } else {
        mistakeType = "arithmetic_error";
        message = "Your setup may be right, but one calculation is off.";
        why = "The final value does not satisfy the original equation.";
        fix = "Substitute your answer back into the original equation.";
      }
    }

    if (problem.kind === "combine" && expression) {
      mistakeType = "combined_unlike_terms";
      message = "It looks like unlike terms may have been combined.";
      why = "x terms and constants must stay separate.";
      fix = "Combine x terms with x terms. Keep constants separate.";
    }

    if (problem.kind === "distribute") {
      mistakeType = "distribution_error";
      message = "The distribution pattern is off.";
      why = "The outside number multiplies every term inside parentheses.";
      fix = "Use a(b + c) = ab + ac.";
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

  function renderMathFeedback(problem, result, onNext) {
    const panel = div(`feedback-panel ${result.correct ? "correct" : "repair-needed"}`);

    if (result.correct) {
      panel.append(
        heading("Correct.", 3),
        textP(problem.correctMessage),
        div("button-row", [buttonEl("Continue", "btn btn-primary", onNext)])
      );

      return panel;
    }

    const repair = result.repairDrill || problem;

    panel.append(
      heading("Not quite — here is the likely break.", 3),
      div("feedback-grid", [
        feedbackBox("Likely mistake", result.message),
        feedbackBox("Why it happened", result.why),
        feedbackBox("Tiny fix", result.fix),
        feedbackBox("Repair drill", repair.display)
      ]),
      strong("Correct steps"),
      list(problem.steps, "steps-list"),
      div("button-row", [buttonEl("Continue", "btn btn-primary", onNext)])
    );

    return panel;
  }

  function saveMathAttempt(problem, result) {
    state.db.progress.mathAttempts += 1;

    if (result.correct) {
      state.db.progress.mathCorrect += 1;
    } else {
      state.db.progress.mistakes[result.mistakeType] =
        (state.db.progress.mistakes[result.mistakeType] || 0) + 1;

      addReviewItem(result.mistakeType, result.message);
    }

    const skill = state.db.progress.skills[problem.skill] || {
      attempts: 0,
      correct: 0
    };

    skill.attempts += 1;

    if (result.correct) {
      skill.correct += 1;
    }

    state.db.progress.skills[problem.skill] = skill;
  }

  function detectMathProblem(raw) {
    const text = String(raw || "")
      .replace(/^\s*(solve|simplify)\s*:?\s*/i, "")
      .trim();

    const equation = text.match(/^([+-]?\d*)x\s*([+-])\s*(\d+)\s*=\s*([+-]?\d+)$/i);

    if (equation) {
      return makeTwoStep(
        text,
        parseCoefficient(equation[1]),
        equation[2],
        Number(equation[3]),
        Number(equation[4])
      );
    }

    const distribute = text.match(/^([+-]?\d+)\s*\(\s*x\s*([+-])\s*(\d+)\s*\)$/i);

    if (distribute) {
      return makeDistribute(
        text,
        Number(distribute[1]),
        distribute[2],
        Number(distribute[3])
      );
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
      correctAnswer: correct,
      correctMessage: `x = ${formatNumber(correct)} works because substituting it back makes both sides equal.`,
      steps: [
        display,
        `${coefficient}x = ${formatNumber(middleValue)}`,
        `x = ${formatNumber(correct)}`
      ],
      hints: [
        "Undo the operation farthest from x first.",
        sign === "+" ? `Subtract ${constant} from both sides first.` : `Add ${constant} to both sides first.`,
        `Then divide by ${coefficient}.`
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
      correctMessage: `The expression simplifies to ${formatExpression(x, c)}.`,
      steps: [
        display,
        `${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}x ${formatSigned(c)}`,
        formatExpression(x, c)
      ],
      hints: [
        "Like terms have the same variable part.",
        "Combine only the x coefficients.",
        "Keep the constant separate."
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
      correctMessage: `${coefficient} multiplies both terms inside the parentheses.`,
      steps: [
        display,
        `${coefficient} · x ${sign} ${coefficient} · ${insideConstant}`,
        formatExpression(coefficient, c)
      ],
      hints: [
        "Multiply the outside number by every term.",
        `First multiply ${coefficient} by x.`,
        `Then multiply ${coefficient} by ${insideConstant}.`
      ],
      repairDrill: withRepair
        ? makeDistribute(`${coefficient + 1}(x + ${insideConstant})`, coefficient + 1, "+", insideConstant, false)
        : null
    };
  }

  function isAssignmentLine(line) {
    return /assignment|homework|worksheet|study guide|review/i.test(line);
  }

  function isLikelyHeading(line) {
    return (
      line.length < 90 &&
      !/[.!?]$/.test(line) &&
      /study guide|notes|review|chapter|unit|lesson|worksheet/i.test(line)
    );
  }

  function isVocabularyLine(line) {
    return /^(vocabulary|vocab|key terms?|terms?)\s*:/i.test(line);
  }

  function extractVocabulary(line) {
    return String(line)
      .replace(/^(vocabulary|vocab|key terms?|terms?)\s*:/i, "")
      .split(/,|;|\|/)
      .map(cleanItem)
      .filter(Boolean);
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

  function isEventLine(line) {
    return /^(important event|event|battle|war|treaty|movement)\s*:/i.test(line);
  }

  function extractEvents(line) {
    const results = [];
    const clean = stripListMarker(line);

    const labeled = clean.match(/^(important event|event)\s*:\s*(.+)$/i);

    if (labeled) {
      labeled[2]
        .replace(/\b(1[0-9]{3}|20[0-9]{2})\b/g, "")
        .split(/,|;|\band\b/)
        .map(cleanItem)
        .filter(Boolean)
        .forEach((item) => results.push(item));
    }

    const known = clean.match(
      /\b(American Revolution|Boston Tea Party|Civil War|World War I|World War II|French Revolution|Industrial Revolution)\b/i
    );

    if (known) {
      results.push(titleCase(known[1]));
    }

    return Array.from(new Set(results));
  }

  function extractDates(line) {
    return Array.from(new Set(String(line).match(/\b(1[0-9]{3}|20[0-9]{2})\b/g) || []));
  }

  function extractPeople(line) {
    const names = line.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || [];

    return Array.from(
      new Set(
        names.filter((name) => !/American Revolution|Boston Tea|Tea Party|Civil War|World War/i.test(name))
      )
    );
  }

  function isWritingPromptLine(line) {
    return /^(writing prompt|essay prompt|prompt|write|essay|paragraph)\b/i.test(stripListMarker(line));
  }

  function isSourceLine(line) {
    return /^(source|citation|works cited|reference)\s*:|https?:\/\/|www\./i.test(line);
  }

  function mentionsCauseEffect(line) {
    return /\bcause|caused|effect|because|led to|resulted in\b/i.test(line);
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

  function splitMaterial(text) {
    return String(text)
      .replace(/\r/g, "")
      .split(/\n|;|(?=\s*\d+\.\s+)|(?=\s*[-•*]\s+)/)
      .map((line) => line.replace(/^\s*(\d+\.|[-•*])\s*/, "").trim())
      .filter(Boolean);
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

  function checkTerms(answer, terms) {
    const lower = String(answer || "").toLowerCase();
    const missing = terms.filter((term) => !lower.includes(term.toLowerCase()));

    if (!String(answer || "").trim()) {
      return {
        missing: terms,
        message: "Write an answer first. Then compare it to the checklist."
      };
    }

    if (!terms.length) {
      return {
        missing: [],
        message: "Good. Compare this against your class notes."
      };
    }

    if (!missing.length) {
      return {
        missing: [],
        message: "Good coverage. You included the key terms Theorem checked."
      };
    }

    return {
      missing,
      message: `You may be missing: ${missing.join(", ")}.`
    };
  }

  function toolDescription(tool) {
    const map = {
      "Step-by-step checking": "Check each math step after you try.",
      "Hints": "Get help before the answer.",
      "Mistake diagnosis": "Find the step that broke.",
      "Repair drills": "Practice the exact weak skill.",
      "Mastery problems": "Prove you learned it.",
      "Memory flashcards": "Recall key terms.",
      "Vocabulary recall": "Practice definitions.",
      "Process breakdown": "Turn a process into steps.",
      "Teach-back mode": "Explain in your own words.",
      "Application questions": "Use the concept in a new situation.",
      "Quick quiz": "Check understanding quickly.",
      "Flashcards": "Recall vocabulary and facts.",
      "Timeline": "Connect dates and events.",
      "People/events review": "Match people to what happened.",
      "Cause/effect map": "Explain why events connect.",
      "Why-it-mattered questions": "Explain importance.",
      "Creative thinking test": "Apply the material in a new way.",
      "Short-answer practice": "Practice written answers.",
      "Main idea": "Find the central point.",
      "Theme/character tracker": "Track reading details.",
      "Claim/evidence/reasoning builder": "Build better responses.",
      "Essay outline": "Plan before writing.",
      "Code explanation": "Explain code before changing it.",
      "Edge cases": "Find unusual inputs.",
      "Test ideas": "Plan what to test.",
      "Research organizer": "Match sources to claims."
    };

    return map[tool] || "Study tool generated from your material.";
  }

  function createPathTitle(text, department, docType) {
    const first = String(text)
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean);

    if (first && first.length < 70) return first;

    return `${department} ${docType}`;
  }

  function getActivePath() {
    if (state.activePathId) {
      return state.db.studyPaths.find((path) => path.id === state.activePathId) || null;
    }

    return state.db.studyPaths[0] || null;
  }

  function addReviewItem(title, body) {
    state.db.reviewItems.unshift({
      id: cryptoId(),
      title: readableMistake(title),
      body,
      createdAt: new Date().toISOString()
    });

    state.db.reviewItems = state.db.reviewItems.slice(0, 80);
  }

  function canUseCrypto() {
    return window.crypto && typeof window.crypto.randomUUID === "function";
  }

  function cryptoId() {
    return canUseCrypto()
      ? window.crypto.randomUUID()
      : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function setUploadMessage(message) {
    if (els.uploadMessage) {
      els.uploadMessage.textContent = message;
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return defaultState();
      }

      return mergeState(defaultState(), JSON.parse(raw));
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.db));
    } catch {
      setUploadMessage("Progress could not be saved locally in this browser.");
    }
  }

  function defaultState() {
    return {
      user: null,
      studyPaths: [],
      reviewItems: [],
      assignments: [],
      plan: {
        name: "Free",
        activePathLimit: FREE_ACTIVE_PATH_LIMIT,
        uploadsPerDay: FREE_UPLOADS_PER_DAY
      },
      progress: {
        totalStudyPaths: 0,
        completedCards: 0,
        flashcardsReviewed: 0,
        shortAnswers: 0,
        uploadsToday: 0,
        lastUploadDate: todayKey(),
        mathAttempts: 0,
        mathCorrect: 0,
        departmentCounts: Object.fromEntries(departments.map((item) => [item, 0])),
        mistakes: {},
        skills: {}
      }
    };
  }

  function mergeState(base, saved) {
    return {
      ...base,
      ...saved,
      plan: {
        ...base.plan,
        ...(saved.plan || {})
      },
      progress: {
        ...base.progress,
        ...(saved.progress || {}),
        departmentCounts: {
          ...base.progress.departmentCounts,
          ...((saved.progress && saved.progress.departmentCounts) || {})
        },
        mistakes: {
          ...base.progress.mistakes,
          ...((saved.progress && saved.progress.mistakes) || {})
        },
        skills: {
          ...base.progress.skills,
          ...((saved.progress && saved.progress.skills) || {})
        }
      },
      studyPaths: saved.studyPaths || [],
      reviewItems: saved.reviewItems || []
    };
  }

  function clear(node) {
    if (!node) return;

    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function createEl(tag, className, text) {
    const node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    if (text !== undefined) {
      node.textContent = text;
    }

    return node;
  }

  function div(className, children, text) {
    const node = createEl("div", className, text);

    if (children) {
      children.forEach((child) => node.append(child));
    }

    return node;
  }

  function textP(text, className) {
    return createEl("p", className, text);
  }

  function heading(text, level) {
    return createEl(`h${level}`, "", text);
  }

  function strong(text) {
    return createEl("strong", "", text);
  }

  function pLabel(text) {
    return createEl("p", "eyebrow", text);
  }

  function buttonEl(text, className, handler) {
    const button = createEl("button", className, text);
    button.type = "button";

    if (handler) {
      button.addEventListener("click", handler);
    }

    return button;
  }

  function list(items, className = "checklist") {
    const ul = createEl("ul", className);
    const safeItems = Array.isArray(items) && items.length ? items : ["No items found yet."];

    safeItems.forEach((item) => {
      const li = createEl("li", "", typeof item === "string" ? item : JSON.stringify(item));
      ul.append(li);
    });

    return ul;
  }

  function statPill(label, value) {
    const node = createEl("div", "subject-pill");
    node.append(strong(label), document.createTextNode(` ${value}`));
    return node;
  }

  function toolCard(title, body) {
    const node = div("tool-card");
    node.append(strong(title), textP(body));
    return node;
  }

  function infoCard(title, body) {
    const node = div("info-card");
    node.append(heading(title, 3), textP(body));
    return node;
  }

  function statCard(label, value) {
    const node = div("info-card");
    node.append(div("stat-value", null, String(value)), textP(label));
    return node;
  }

  function feedbackBox(title, body) {
    const node = div("feedback-box");
    node.append(strong(title), textP(body));
    return node;
  }

  function codeBlock(text) {
    const pre = createEl("pre", "code-block-view");
    const code = createEl("code");
    code.textContent = text;
    pre.append(code);
    return pre;
  }

  function addUnique(listRef, value) {
    const clean = cleanItem(value);

    if (clean && !listRef.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      listRef.push(clean);
    }
  }

  function addObjectUnique(listRef, object, key) {
    if (!object || !object[key]) return;

    const value = String(object[key]).toLowerCase();

    if (!listRef.some((item) => String(item[key]).toLowerCase() === value)) {
      listRef.push(object);
    }
  }

  function cleanItem(value) {
    return String(value)
      .replace(/^[\s,.;:-]+/, "")
      .replace(/[\s,.;:-]+$/, "")
      .trim();
  }

  function stripListMarker(line) {
    return String(line)
      .replace(/^\s*(\d+\.|\d+\)|[-•*])\s*/, "")
      .trim();
  }

  function titleCase(value) {
    return String(value)
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function countMatches(text, words) {
    return words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
  }

  function countRegex(text, regexes) {
    return regexes.reduce((count, regex) => count + (regex.test(text) ? 1 : 0), 0);
  }

  function parseNumericAnswer(input) {
    const cleaned = String(input)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

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
        const raw = part.replace("x", "");
        const coeff = raw === "" ? 1 : raw === "-" ? -1 : Number(raw);

        if (!Number.isFinite(coeff)) {
          return null;
        }

        x += coeff;
      } else {
        const number = Number(part);

        if (!Number.isFinite(number)) {
          return null;
        }

        c += number;
      }
    }

    return { x, c };
  }

  function parseCoefficient(value) {
    if (value === "" || value === "+") return 1;
    if (value === "-") return -1;

    return Number(value);
  }

  function nearly(a, b) {
    return Math.abs(a - b) < 0.000001;
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

  function readableMistake(type) {
    const labels = {
      skipped_inverse_operation: "Stopped at the middle step",
      arithmetic_error: "Arithmetic slip",
      combined_unlike_terms: "Combined unlike terms",
      distribution_error: "Distribution error",
      incomplete_solution: "Incomplete answer",
      random_or_unclear: "Unclear answer"
    };

    return labels[type] || String(type).replace(/_/g, " ");
  }
})();
