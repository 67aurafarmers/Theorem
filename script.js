(() => {
  "use strict";

  const STORAGE_KEY = "theoremFlightPathOSV1";
  const LAST_PATH_KEY = "theoremLastFlightPathV1";

  const subjectLabels = {
    math: "Math",
    science: "Science",
    socialStudies: "Social Studies",
    readingWriting: "Reading/Writing",
    general: "General Study"
  };

  const loadingPhrases = [
    "Reading your workspace…",
    "Extracting schoolwork…",
    "Building missions…",
    "Ranking the route…",
    "Ready for takeoff."
  ];

  const learningTypeLabels = {
    fact_memory: "Fact memory",
    concept_understanding: "Concept understanding",
    procedure_practice: "Procedure practice",
    application: "Application",
    writing_explanation: "Writing explanation",
    analysis: "Analysis",
    creative_thinking: "Creative thinking"
  };

  const signals = {
    math: [
      "solve",
      "simplify",
      "equation",
      "graph",
      "slope",
      "variable",
      "x =",
      "y =",
      "algebra",
      "formula"
    ],
    science: [
      "photosynthesis",
      "cell",
      "energy",
      "force",
      "atom",
      "molecule",
      "ecosystem",
      "experiment",
      "hypothesis",
      "chlorophyll",
      "glucose",
      "oxygen",
      "carbon dioxide",
      "matter",
      "organism"
    ],
    socialStudies: [
      "revolution",
      "war",
      "government",
      "colony",
      "treaty",
      "rights",
      "president",
      "civilization",
      "empire",
      "economy",
      "constitution",
      "taxation",
      "representation",
      "boycott",
      "congress",
      "independence"
    ],
    readingWriting: [
      "theme",
      "character",
      "author",
      "claim",
      "evidence",
      "essay",
      "paragraph",
      "poem",
      "story",
      "main idea",
      "inference",
      "argument",
      "thesis",
      "quote",
      "text evidence"
    ]
  };

  const stopWords = new Set([
    "about",
    "after",
    "again",
    "also",
    "because",
    "been",
    "before",
    "being",
    "between",
    "could",
    "does",
    "done",
    "each",
    "from",
    "have",
    "into",
    "like",
    "make",
    "many",
    "more",
    "most",
    "much",
    "need",
    "only",
    "other",
    "over",
    "should",
    "some",
    "such",
    "than",
    "that",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "through",
    "uses",
    "very",
    "what",
    "when",
    "where",
    "which",
    "while",
    "with",
    "would",
    "your",
    "you",
    "and",
    "the",
    "for",
    "are",
    "was",
    "were",
    "his",
    "her",
    "its",
    "our"
  ]);

  const state = {
    flightPath: null,
    selectedMissionId: null,
    reviewQueue: loadReviewQueue(),
    weakMap: loadWeakMap()
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    startLoadingScreen();
    bindEvents();

    const previous = loadLastPath();
    if (previous) {
      state.flightPath = previous;
      state.selectedMissionId = previous.route && previous.route[0] ? previous.route[0].id : null;
      renderFlightPath(previous);
    }

    window.createFlightPath = createFlightPath;
  }

  function cacheElements() {
    els.loadingScreen = document.querySelector("#loadingScreen");
    els.loadingPhrase = document.querySelector("#loadingPhrase");
    els.materialInput = document.querySelector("#materialInput");
    els.materialFile = document.querySelector("#materialFile");
    els.buildPathBtn = document.querySelector("#buildPathBtn");
    els.statusMessage = document.querySelector("#statusMessage");
    els.resultPanel = document.querySelector("#resultPanel");
    els.detectedSubject = document.querySelector("#detectedSubject");
    els.confidenceValue = document.querySelector("#confidenceValue");
    els.confidenceMessage = document.querySelector("#confidenceMessage");
    els.detectedGrid = document.querySelector("#detectedGrid");
    els.missionList = document.querySelector("#missionList");
    els.routeList = document.querySelector("#routeList");
    els.firstActionText = document.querySelector("#firstActionText");
    els.currentMission = document.querySelector("#currentMission");
    els.masteryGate = document.querySelector("#masteryGate");
    els.reviewQueue = document.querySelector("#reviewQueue");
  }

  function startLoadingScreen() {
    if (!els.loadingScreen) return;

    let index = 0;

    const timer = window.setInterval(() => {
      index = (index + 1) % loadingPhrases.length;
      if (els.loadingPhrase) els.loadingPhrase.textContent = loadingPhrases[index];
    }, 340);

    window.setTimeout(() => {
      window.clearInterval(timer);
      els.loadingScreen.classList.add("hide");
    }, 1450);
  }

  function bindEvents() {
    if (els.buildPathBtn) {
      els.buildPathBtn.addEventListener("click", handleBuildFlightPath);
    }

    if (els.materialFile) {
      els.materialFile.addEventListener("change", handleTextFileUpload);
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
      setStatus("Image and PDF extraction are coming later. For now, use pasted text, .txt, or .md.");
      els.materialFile.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (els.materialInput) els.materialInput.value = String(reader.result || "");
      setStatus(`Loaded ${file.name}. Click Build flight path.`);
    };

    reader.onerror = () => {
      setStatus("Theorem could not read that file. Try pasting the text instead.");
    };

    reader.readAsText(file);
  }

  function handleBuildFlightPath() {
    const text = els.materialInput ? els.materialInput.value : "";

    if (!text.trim()) {
      setStatus("Paste homework, notes, or assignment text first.");
      return;
    }

    const flightPath = createFlightPath(text);
    state.flightPath = flightPath;
    state.selectedMissionId = flightPath.route[0] ? flightPath.route[0].id : null;

    saveLastPath(flightPath);
    setStatus("Theorem extracted your work and built a flight path.");
    renderFlightPath(flightPath);
  }

  function createFlightPath(text) {
    const originalText = String(text || "");
    const cleanedText = cleanText(originalText);
    const extracted = extractMaterial(cleanedText);
    const scores = scoreSubjects(cleanedText, extracted);
    const detection = detectSubject(scores);
    const missions = buildMissions(extracted, detection.detectedSubject, detection.confidence);
    const rankedMissions = rankMissions(missions, extracted.dueDate);
    const route = rankedMissions.slice(0, 5);
    const firstFiveMinutes = buildFirstFiveMinuteAction(route[0], detection.confidence);

    return {
      originalText,
      cleanedText,
      detectedWork: {
        subject: detection.detectedSubject,
        confidence: detection.confidence,
        scores,
        dueDate: extracted.dueDate,
        counts: getExtractedCounts(extracted),
        extracted
      },
      missions: rankedMissions,
      route,
      firstFiveMinutes,
      reviewQueue: state.reviewQueue
    };
  }

  function cleanText(text) {
    return String(text || "")
      .replace(/\r/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\u00a0/g, " ")
      .replace(/[ ]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function extractMaterial(text) {
    const extracted = {
      questions: [],
      vocabulary: [],
      keyFacts: [],
      dates: [],
      events: [],
      people: [],
      mathProblems: [],
      writingPrompts: [],
      sources: [],
      unknown: [],
      dueDate: extractDueDate(text),
      keywords: []
    };

    const segments = splitIntoSegments(text);

    extractDates(text).forEach((date) => addUnique(extracted.dates, date));

    segments.forEach((segment) => {
      const item = stripListMarker(segment);
      if (!item) return;

      let matched = false;

      if (isSource(item)) {
        addUnique(extracted.sources, item);
        matched = true;
      }

      if (isVocabularyLine(item)) {
        extractVocabulary(item).forEach((term) => addUnique(extracted.vocabulary, term));
        matched = true;
      }

      if (startsWithDefine(item)) {
        const term = extractDefineTerm(item);
        if (term) addUnique(extracted.vocabulary, term);
        addUnique(extracted.questions, normalizeQuestion(item));
        matched = true;
      }

      if (isMathProblem(item)) {
        addUnique(extracted.mathProblems, normalizeMathProblem(item));
        matched = true;
      }

      if (isQuestion(item)) {
        addUnique(extracted.questions, normalizeQuestion(item));
        matched = true;
      }

      if (isWritingPrompt(item)) {
        addUnique(extracted.writingPrompts, item);
        matched = true;
      }

      if (isEvent(item)) {
        extractEvents(item).forEach((event) => addUnique(extracted.events, event));
        matched = true;
      }

      extractPeople(item).forEach((person) => {
        addUnique(extracted.people, person);
        matched = true;
      });

      if (!matched && isKeyFact(item)) {
        addUnique(extracted.keyFacts, item);
        matched = true;
      }

      if (!matched && !isLikelyHeading(item)) {
        addUnique(extracted.unknown, item);
      }
    });

    extracted.keywords = extractKeywords(text, extracted);

    return extracted;
  }

  function buildMissions(extracted, subject, confidence) {
    const missions = [];

    extracted.mathProblems.forEach((problem, index) => {
      missions.push(createMission({
        title: `Practice procedure: ${problem}`,
        subject: "math",
        learningType: "procedure_practice",
        sourceItems: [problem],
        difficulty: estimateDifficulty("procedure_practice", [problem]),
        urgency: 2,
        estimatedMinutes: 8,
        recommendedTool: "Exact Check + Mistake Repair",
        studyTools: buildMissionTools("math", "procedure_practice", [problem]),
        masteryGate: `Solve ${problem} again without hints and explain the first operation you used.`,
        importance: 5,
        orderBias: index
      }));
    });

    if (extracted.vocabulary.length) {
      missions.push(createMission({
        title: "Lock in key vocabulary",
        subject,
        learningType: "fact_memory",
        sourceItems: extracted.vocabulary,
        difficulty: estimateDifficulty("fact_memory", extracted.vocabulary),
        urgency: 2,
        estimatedMinutes: Math.min(12, Math.max(5, extracted.vocabulary.length * 2)),
        recommendedTool: subject === "socialStudies" ? "Flashcards + why-it-mattered" : "Flashcards",
        studyTools: buildMissionTools(subject, "fact_memory", extracted.vocabulary),
        masteryGate: "Define each term without looking, then use one term in a complete sentence.",
        importance: 4,
        orderBias: 1
      }));
    }

    if (subject === "science" && extracted.keyFacts.length) {
      missions.push(createMission({
        title: "Explain the core science idea",
        subject,
        learningType: "concept_understanding",
        sourceItems: extracted.keyFacts.slice(0, 5),
        difficulty: estimateDifficulty("concept_understanding", extracted.keyFacts),
        urgency: 2,
        estimatedMinutes: 10,
        recommendedTool: "Remember → Explain → Apply",
        studyTools: buildMissionTools(subject, "concept_understanding", extracted.keyFacts),
        masteryGate: "Explain the concept out loud, then give one real-world example.",
        importance: 5,
        orderBias: 2
      }));
    }

    if (subject === "socialStudies" && (extracted.events.length || extracted.dates.length)) {
      missions.push(createMission({
        title: "Connect events, dates, and causes",
        subject,
        learningType: "analysis",
        sourceItems: [...extracted.events, ...extracted.dates],
        difficulty: estimateDifficulty("analysis", [...extracted.events, ...extracted.dates]),
        urgency: 2,
        estimatedMinutes: 10,
        recommendedTool: "Memorization → Cause/Effect → Why it mattered",
        studyTools: buildMissionTools(subject, "analysis", [...extracted.events, ...extracted.dates]),
        masteryGate: "Explain one event, one cause, one effect, and why it mattered.",
        importance: 5,
        orderBias: 2
      }));
    }

    extracted.questions.slice(0, 8).forEach((question, index) => {
      const type = chooseQuestionLearningType(question, subject);

      missions.push(createMission({
        title: shortenTitle(question),
        subject,
        learningType: type,
        sourceItems: [question],
        difficulty: estimateDifficulty(type, [question]),
        urgency: 2,
        estimatedMinutes: type === "writing_explanation" ? 12 : 7,
        recommendedTool: getRecommendedTool(subject, type),
        studyTools: buildMissionTools(subject, type, [question]),
        masteryGate: buildMasteryGate(subject, type, question),
        importance: questionImportance(question),
        orderBias: 3 + index
      }));
    });

    extracted.writingPrompts.forEach((prompt, index) => {
      missions.push(createMission({
        title: `Build response: ${shortenTitle(prompt)}`,
        subject: "readingWriting",
        learningType: "writing_explanation",
        sourceItems: [prompt],
        difficulty: estimateDifficulty("writing_explanation", [prompt]),
        urgency: 2,
        estimatedMinutes: 14,
        recommendedTool: "Read → Prove → Write",
        studyTools: buildMissionTools("readingWriting", "writing_explanation", [prompt]),
        masteryGate: "Write a claim, choose one piece of evidence, and explain how it proves the claim.",
        importance: 5,
        orderBias: index
      }));
    });

    if (!missions.length && extracted.keyFacts.length) {
      missions.push(createMission({
        title: "Understand the main idea",
        subject,
        learningType: "concept_understanding",
        sourceItems: extracted.keyFacts.slice(0, 4),
        difficulty: 2,
        urgency: 1,
        estimatedMinutes: 8,
        recommendedTool: "Summary → Flashcards → Quiz → Review",
        studyTools: buildMissionTools(subject, "concept_understanding", extracted.keyFacts),
        masteryGate: "Explain the material in your own words without looking.",
        importance: 3,
        orderBias: 0
      }));
    }

    if (!missions.length) {
      missions.push(createMission({
        title: "Review unclear material",
        subject: "general",
        learningType: "concept_understanding",
        sourceItems: extracted.unknown.length ? extracted.unknown : ["Theorem needs more text to build stronger missions."],
        difficulty: 1,
        urgency: 1,
        estimatedMinutes: 5,
        recommendedTool: "Review and confirm",
        studyTools: ["Read the material once.", "Highlight what looks like a question.", "Add more notes if needed."],
        masteryGate: "Confirm what this assignment is asking you to do.",
        importance: 2,
        orderBias: 0
      }));
    }

    return missions.map((mission) => ({
      ...mission,
      urgency: applyDueDateUrgency(mission.urgency, extracted.dueDate),
      confidence
    }));
  }

  function createMission(data) {
    return {
      id: cryptoId(),
      title: data.title,
      subject: data.subject || "general",
      learningType: data.learningType,
      sourceItems: data.sourceItems || [],
      difficulty: clampInt(data.difficulty || 2, 1, 5),
      urgency: clampInt(data.urgency || 1, 1, 5),
      estimatedMinutes: Math.max(5, data.estimatedMinutes || 8),
      recommendedTool: data.recommendedTool || "Study tool",
      studyTools: data.studyTools || [],
      masteryGate: data.masteryGate || "Explain this mission in your own words without looking.",
      status: "ready",
      importance: clampInt(data.importance || 3, 1, 5),
      orderBias: data.orderBias || 0
    };
  }

  function rankMissions(missions, dueDate) {
    return [...missions]
      .map((mission) => {
        const weakKey = `${mission.subject}:${mission.learningType}`;
        const weakness = state.weakMap[weakKey] || 0;
        const dependencyBonus = getDependencyBonus(mission.learningType);
        const dueBonus = dueDate ? 2 : 0;

        const rankScore =
          mission.urgency * 4 +
          mission.importance * 3 +
          mission.difficulty * 2 +
          weakness * 3 +
          dependencyBonus +
          dueBonus -
          mission.estimatedMinutes / 12 -
          mission.orderBias * 0.12;

        return { ...mission, rankScore: Number(rankScore.toFixed(2)) };
      })
      .sort((a, b) => b.rankScore - a.rankScore);
  }

  function getDependencyBonus(type) {
    const map = {
      fact_memory: 3,
      concept_understanding: 2.5,
      procedure_practice: 2.25,
      writing_explanation: 2,
      analysis: 1.5,
      application: 1,
      creative_thinking: 0.5
    };

    return map[type] || 0;
  }

  function buildFirstFiveMinuteAction(mission, confidence) {
    if (!mission) {
      return "Paste more schoolwork so Theorem can build a first mission.";
    }

    const confirm = confidence < 0.55
      ? " First, confirm this mission matches your assignment."
      : "";

    if (mission.subject === "math") {
      return `Spend 5 minutes trying the first step of "${mission.title}" before looking at hints.${confirm}`;
    }

    if (mission.subject === "science") {
      return `Spend 5 minutes on Remember mode: define the key words, then explain one idea out loud.${confirm}`;
    }

    if (mission.subject === "socialStudies") {
      return `Spend 5 minutes making flashcards for the people, terms, dates, or events in "${mission.title}".${confirm}`;
    }

    if (mission.subject === "readingWriting") {
      return `Spend 5 minutes finding the main idea, one claim, and one piece of evidence.${confirm}`;
    }

    return `Spend 5 minutes reading the mission and writing what you think the assignment is asking.${confirm}`;
  }

  function renderFlightPath(path) {
    if (!els.resultPanel) return;

    els.resultPanel.classList.remove("hidden");

    const subject = path.detectedWork.subject;
    const confidencePercent = Math.round(path.detectedWork.confidence * 100);

    setText(els.detectedSubject, subjectLabels[subject] || subjectLabels.general);
    setText(els.confidenceValue, `${confidencePercent}%`);
    setText(els.firstActionText, path.firstFiveMinutes);

    if (els.confidenceMessage) {
      const low = path.detectedWork.confidence < 0.55;
      els.confidenceMessage.textContent = low
        ? "Theorem is not fully sure. Confirm the missions before studying."
        : "Based on your material, Theorem suggests this flight path.";
      els.confidenceMessage.classList.toggle("low-confidence", low);
    }

    renderDetectedWork(path);
    renderMissions(path);
    renderRoute(path);
    renderCurrentMission(path);
    renderMasteryGate(path);
    renderReviewQueue();

    els.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderDetectedWork(path) {
    clear(els.detectedGrid);
    if (!els.detectedGrid) return;

    const counts = path.detectedWork.counts;
    const due = path.detectedWork.dueDate ? formatDueDate(path.detectedWork.dueDate) : "No due date found";

    const cards = [
      ["Subject", subjectLabels[path.detectedWork.subject] || "General Study"],
      ["Questions", String(counts.questions)],
      ["Key terms", String(counts.vocabulary)],
      ["Math problems", String(counts.mathProblems)],
      ["Events / dates", `${counts.events} / ${counts.dates}`],
      ["Writing prompts", String(counts.writingPrompts)],
      ["Due date", due],
      ["Total missions", String(path.missions.length)]
    ];

    cards.forEach(([title, body]) => {
      const card = createEl("article", "detected-card");
      card.append(strong(title), textP(body));
      els.detectedGrid.append(card);
    });
  }

  function renderMissions(path) {
    clear(els.missionList);
    if (!els.missionList) return;

    const visible = path.route.slice(0, 5);

    visible.forEach((mission, index) => {
      const card = createEl("article", "mission-card");
      const main = createEl("div", "mission-main");
      const actions = createEl("div", "mission-actions");

      const input = createEl("input", "mission-title-input");
      input.type = "text";
      input.value = mission.title;
      input.setAttribute("aria-label", `Mission ${index + 1} title`);

      input.addEventListener("input", () => {
        mission.title = input.value.trim() || mission.title;
        const original = path.missions.find((item) => item.id === mission.id);
        if (original) original.title = mission.title;
        saveLastPath(path);
        renderRoute(path);
        renderCurrentMission(path);
        renderMasteryGate(path);
      });

      const meta = createEl("div", "mission-meta");
      meta.append(
        tag(learningTypeLabels[mission.learningType] || mission.learningType),
        tag(`${mission.estimatedMinutes} min`),
        tag(`Difficulty ${mission.difficulty}/5`),
        tag(`Urgency ${mission.urgency}/5`, mission.urgency >= 4 ? "urgent" : ""),
        tag(mission.status, mission.status === "complete" || mission.status === "mastered" ? "complete" : "")
      );

      main.append(input, meta);

      actions.append(
        buttonEl("Open", "btn btn-secondary", () => {
          state.selectedMissionId = mission.id;
          renderCurrentMission(path);
          renderMasteryGate(path);
        }),
        buttonEl("Complete", "btn btn-primary", () => {
          updateMissionStatus(path, mission.id, "complete");
        }),
        buttonEl("Save for review", "btn btn-ghost", () => {
          saveMissionForReview(path, mission);
        })
      );

      card.append(main, actions);
      els.missionList.append(card);
    });
  }

  function renderRoute(path) {
    clear(els.routeList);
    if (!els.routeList) return;

    path.route.slice(0, 5).forEach((mission, index) => {
      const row = createEl("div", "route-step");
      row.append(
        createEl("span", "", String(index + 1)),
        div("", [
          strong(mission.title),
          textP(`${mission.recommendedTool} · ${mission.estimatedMinutes} minutes`)
        ])
      );
      els.routeList.append(row);
    });
  }

  function renderCurrentMission(path) {
    clear(els.currentMission);
    if (!els.currentMission) return;

    const mission = getSelectedMission(path);

    if (!mission) {
      els.currentMission.append(textP("No current mission selected."));
      return;
    }

    els.currentMission.append(
      heading(mission.title, 3),
      textP(`Theorem suggests: ${mission.recommendedTool}`),
      createTagRow([
        subjectLabels[mission.subject] || mission.subject,
        learningTypeLabels[mission.learningType] || mission.learningType,
        `${mission.estimatedMinutes} minutes`,
        `Difficulty ${mission.difficulty}/5`
      ]),
      heading("Source items", 3),
      list(mission.sourceItems, "source-list"),
      heading("Study tools", 3),
      list(mission.studyTools, "tool-list"),
      div("mission-actions", [
        buttonEl("Mark complete", "btn btn-primary", () => updateMissionStatus(path, mission.id, "complete")),
        buttonEl("Save for review", "btn btn-secondary", () => saveMissionForReview(path, mission))
      ])
    );
  }

  function renderMasteryGate(path) {
    clear(els.masteryGate);
    if (!els.masteryGate) return;

    const mission = getSelectedMission(path);

    if (!mission) {
      els.masteryGate.append(textP("Open a mission to see its mastery gate."));
      return;
    }

    els.masteryGate.append(
      heading("Before you move on:", 3),
      div("mastery-box", [textP(mission.masteryGate)]),
      div("mission-actions", [
        buttonEl("I passed this gate", "btn btn-primary", () => updateMissionStatus(path, mission.id, "mastered")),
        buttonEl("Not yet — review later", "btn btn-secondary", () => saveMissionForReview(path, mission))
      ])
    );
  }

  function renderReviewQueue() {
    clear(els.reviewQueue);
    if (!els.reviewQueue) return;

    if (!state.reviewQueue.length) {
      els.reviewQueue.append(
        div("empty-state", [
          strong("No weak missions saved yet."),
          textP("When a mission feels hard, save it for review.")
        ])
      );
      return;
    }

    state.reviewQueue.slice(0, 8).forEach((item) => {
      const card = createEl("article", "review-card");
      card.append(
        strong(item.title),
        textP(`${subjectLabels[item.subject] || item.subject} · ${learningTypeLabels[item.learningType] || item.learningType}`),
        textP(item.reason || "Saved for review.")
      );
      els.reviewQueue.append(card);
    });
  }

  function getSelectedMission(path) {
    if (!path || !path.missions.length) return null;

    if (state.selectedMissionId) {
      const found = path.missions.find((mission) => mission.id === state.selectedMissionId);
      if (found) return found;
    }

    return path.route[0] || path.missions[0];
  }

  function updateMissionStatus(path, missionId, status) {
    path.missions.forEach((mission) => {
      if (mission.id === missionId) mission.status = status;
    });

    path.route.forEach((mission) => {
      if (mission.id === missionId) mission.status = status;
    });

    saveLastPath(path);
    renderFlightPath(path);
  }

  function saveMissionForReview(path, mission) {
    const key = `${mission.subject}:${mission.learningType}`;

    state.weakMap[key] = (state.weakMap[key] || 0) + 1;

    const item = {
      id: cryptoId(),
      title: mission.title,
      subject: mission.subject,
      learningType: mission.learningType,
      sourceItems: mission.sourceItems,
      reason: "Saved because this mission needs more practice.",
      savedAt: new Date().toISOString()
    };

    state.reviewQueue.unshift(item);
    state.reviewQueue = dedupeByTitle(state.reviewQueue).slice(0, 30);

    updateMissionStatus(path, mission.id, "review");
    saveReviewQueue();
    saveWeakMap();
    saveLastPath(path);

    renderFlightPath(path);
  }

  function dedupeByTitle(items) {
    const seen = new Set();

    return items.filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function scoreSubjects(text, extracted) {
    const lower = text.toLowerCase();

    const scores = {
      math: countSignals(lower, signals.math) + extracted.mathProblems.length * 5,
      science: countSignals(lower, signals.science),
      socialStudies:
        countSignals(lower, signals.socialStudies) +
        extracted.events.length * 2 +
        extracted.dates.length,
      readingWriting:
        countSignals(lower, signals.readingWriting) +
        extracted.writingPrompts.length * 3,
      general: 1
    };

    if (/\d*x\s*[+\-]\s*\d+\s*=/.test(lower)) scores.math += 5;
    if (lower.includes("photosynthesis")) scores.science += 4;
    if (lower.includes("american revolution") || lower.includes("boston tea party")) scores.socialStudies += 5;
    if (lower.includes("write an essay") || lower.includes("text evidence")) scores.readingWriting += 5;

    return scores;
  }

  function detectSubject(scores) {
    const entries = Object.entries(scores)
      .filter(([subject]) => subject !== "general")
      .sort((a, b) => b[1] - a[1]);

    const [topSubject, topScore] = entries[0];
    const secondScore = entries[1] ? entries[1][1] : 0;

    if (!topScore || topScore <= 0) {
      return {
        detectedSubject: "general",
        confidence: 0.35
      };
    }

    const difference = Math.max(0, topScore - secondScore);
    const strength = Math.min(1, topScore / 8);
    const separation = Math.min(1, difference / Math.max(1, topScore));
    const confidence = clamp(0.35 + strength * 0.4 + separation * 0.25, 0.35, 0.98);

    return {
      detectedSubject: topSubject,
      confidence: Number(confidence.toFixed(2))
    };
  }

  function countSignals(text, list) {
    return list.reduce((score, signal) => {
      return score + (text.includes(signal.toLowerCase()) ? 1 : 0);
    }, 0);
  }

  function extractKeywords(text, extracted) {
    const counts = Object.create(null);

    const words = String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 3 && !stopWords.has(word));

    words.forEach((word) => {
      counts[word] = (counts[word] || 0) + 1;
    });

    extracted.vocabulary.forEach((term) => {
      const key = term.toLowerCase();
      counts[key] = (counts[key] || 0) + 4;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word]) => word);
  }

  function chooseQuestionLearningType(question, subject) {
    const lower = question.toLowerCase();

    if (subject === "math") return "procedure_practice";
    if (subject === "readingWriting") return "writing_explanation";
    if (/\bwhy|cause|caused|effect|analyze|compare|contrast\b/.test(lower)) return "analysis";
    if (/\bwhat might|imagine|create|predict\b/.test(lower)) return "creative_thinking";
    if (/\bapply|example|real world\b/.test(lower)) return "application";
    if (/\bexplain|describe|how\b/.test(lower)) return "concept_understanding";

    return "fact_memory";
  }

  function getRecommendedTool(subject, learningType) {
    if (subject === "math") return "Exact Check + Mistake Repair";
    if (subject === "science") return "Remember → Explain → Apply";
    if (subject === "socialStudies") return "Memorization → Cause/Effect → Why it mattered";
    if (subject === "readingWriting") return "Read → Prove → Write";

    const map = {
      fact_memory: "Flashcards",
      concept_understanding: "Teach-back",
      procedure_practice: "Step practice",
      application: "Apply it",
      writing_explanation: "Outline builder",
      analysis: "Cause/effect map",
      creative_thinking: "Creative thinking test"
    };

    return map[learningType] || "Study tool";
  }

  function buildMissionTools(subject, learningType, sourceItems) {
    if (subject === "math") {
      return [
        "Try the problem before viewing help.",
        "Identify the first operation.",
        "Check each step.",
        "If wrong, redo a smaller repair drill."
      ];
    }

    if (subject === "science") {
      return [
        "Remember: define the key words.",
        "Explain: say the concept in your own words.",
        "Apply: give a real-world example.",
        "Teach-back: explain it to someone who missed class."
      ];
    }

    if (subject === "socialStudies") {
      return [
        "Memorize the key terms, people, events, or dates.",
        "Explain one cause and one effect.",
        "Answer: why did this matter?",
        "Try one creative what-if question."
      ];
    }

    if (subject === "readingWriting") {
      return [
        "Read the prompt carefully.",
        "Find the main idea or claim.",
        "Choose one piece of evidence.",
        "Build Claim → Evidence → Reasoning."
      ];
    }

    if (learningType === "fact_memory") {
      return sourceItems.map((item) => `Make a flashcard for: ${item}`);
    }

    return [
      "Read the source item.",
      "Explain it in your own words.",
      "Write one question about it.",
      "Review anything unclear."
    ];
  }

  function buildMasteryGate(subject, learningType, sourceItem) {
    if (subject === "math") {
      return "Solve the problem again without hints, then explain why each step is legal.";
    }

    if (subject === "science") {
      return "Explain the idea, then apply it to a new example.";
    }

    if (subject === "socialStudies") {
      return "Name the event or idea, explain the cause/effect, and say why it mattered.";
    }

    if (subject === "readingWriting") {
      return "Write one claim, one piece of evidence, and one reasoning sentence.";
    }

    if (learningType === "fact_memory") {
      return "Recall the answer without looking, then use it in a sentence.";
    }

    return `Explain this without looking: ${sourceItem}`;
  }

  function questionImportance(question) {
    const lower = question.toLowerCase();

    if (/\bwhy|cause|caused|effect|analyze|explain\b/.test(lower)) return 5;
    if (/\bdescribe|compare|contrast|summarize\b/.test(lower)) return 4;
    if (/\bdefine|identify|list\b/.test(lower)) return 3;

    return 2;
  }

  function estimateDifficulty(type, items) {
    const count = items.length;
    const base = {
      fact_memory: 1,
      concept_understanding: 3,
      procedure_practice: 3,
      application: 4,
      writing_explanation: 4,
      analysis: 4,
      creative_thinking: 3
    }[type] || 2;

    return clampInt(base + Math.floor(count / 5), 1, 5);
  }

  function applyDueDateUrgency(currentUrgency, dueDate) {
    if (!dueDate) return currentUrgency;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const days = Math.round((dueDay - startOfToday) / 86400000);

    if (days <= 0) return 5;
    if (days === 1) return 4;
    if (days <= 3) return Math.max(currentUrgency, 3);

    return currentUrgency;
  }

  function extractDueDate(text) {
    const lower = text.toLowerCase();
    const now = new Date();

    if (/\bdue\s+today\b/.test(lower)) return now;

    if (/\bdue\s+tomorrow\b/.test(lower)) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    const numeric = text.match(/\bdue\s+(?:on\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/i);

    if (numeric) {
      const month = Number(numeric[1]) - 1;
      const day = Number(numeric[2]);
      const yearRaw = numeric[3] ? Number(numeric[3]) : now.getFullYear();
      const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
      const date = new Date(year, month, day);

      if (!Number.isNaN(date.getTime())) return date;
    }

    return null;
  }

  function formatDueDate(date) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function getExtractedCounts(extracted) {
    return {
      questions: extracted.questions.length,
      vocabulary: extracted.vocabulary.length,
      keyFacts: extracted.keyFacts.length,
      dates: extracted.dates.length,
      events: extracted.events.length,
      people: extracted.people.length,
      mathProblems: extracted.mathProblems.length,
      writingPrompts: extracted.writingPrompts.length,
      sources: extracted.sources.length,
      unknown: extracted.unknown.length
    };
  }

  function splitIntoSegments(text) {
    return String(text)
      .split(/\n+/)
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed) return [];

        return trimmed
          .split(/(?<=[.!?])\s+(?=(?:[A-Z0-9]|Explain|Describe|Define|Compare|Contrast|Analyze|Summarize|Identify|List|Write|Vocabulary|Terms|Important))/)
          .map((piece) => piece.trim())
          .filter(Boolean);
      });
  }

  function isQuestion(text) {
    return (
      /\?$/.test(text.trim()) ||
      /^(explain|describe|define|compare|contrast|analyze|summarize|identify|list|what|why|how|when|where|who)\b/i.test(text.trim())
    );
  }

  function normalizeQuestion(text) {
    return stripListMarker(text).replace(/[.]+$/g, "").trim();
  }

  function isVocabularyLine(text) {
    return /\b(vocabulary|vocab|terms|key terms)\s*:/i.test(text);
  }

  function extractVocabulary(text) {
    const afterLabel = String(text)
      .replace(/^.*?\b(vocabulary|vocab|terms|key terms)\s*:/i, "")
      .replace(/[.]+$/g, "");

    return afterLabel
      .split(/,|;|\|/)
      .map(cleanItem)
      .filter((item) => item && item.length <= 45);
  }

  function startsWithDefine(text) {
    return /^define\b/i.test(text.trim());
  }

  function extractDefineTerm(text) {
    return String(text).replace(/^define\s+/i, "").replace(/[.:?].*$/g, "").trim();
  }

  function extractDates(text) {
    const years = String(text).match(/\b(1[0-9]{3}|20[0-9]{2})\b/g) || [];

    const writtenDates =
      String(text).match(/\b(?:Jan\.?|January|Feb\.?|February|Mar\.?|March|Apr\.?|April|May|Jun\.?|June|Jul\.?|July|Aug\.?|August|Sep\.?|Sept\.?|September|Oct\.?|October|Nov\.?|November|Dec\.?|December)\s+\d{1,2}(?:,\s*\d{4})?\b/gi) || [];

    return Array.from(new Set([...years, ...writtenDates]));
  }

  function isEvent(text) {
    return /\b(event|war|revolution|battle|treaty|movement|party|independence)\b/i.test(text);
  }

  function extractEvents(text) {
    const cleaned = stripListMarker(text);
    const results = [];

    const labeled = cleaned.match(/^(important event|event)\s*:\s*(.+)$/i);

    if (labeled) {
      labeled[2]
        .replace(/\b(1[0-9]{3}|20[0-9]{2})\b/g, "")
        .split(/,|;|\band\b/)
        .map(cleanItem)
        .filter(Boolean)
        .forEach((item) => {
          if (!/^\d+$/.test(item)) results.push(item);
        });
    }

    const known = cleaned.match(
      /\b(American Revolution|Boston Tea Party|Civil War|World War I|World War II|French Revolution|Industrial Revolution|Declaration of Independence)\b/i
    );

    if (known) results.push(titleCase(known[1]));

    const phrase = cleaned.match(
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4}\s+(War|Revolution|Battle|Treaty|Movement|Party|Independence))\b/
    );

    if (phrase) results.push(phrase[1]);

    return Array.from(new Set(results.map(cleanItem).filter(Boolean)));
  }

  function extractPeople(text) {
    const results = [];
    const labeled = String(text).match(/\b(person|people|leader|president|king|queen)\s*:?\s+(.+)$/i);

    if (labeled) {
      labeled[2]
        .split(/,|;|\band\b/)
        .map(cleanItem)
        .filter(Boolean)
        .forEach((item) => results.push(item));
    }

    const names = String(text).match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || [];

    names.forEach((name) => {
      if (!/American Revolution|Boston Tea|Tea Party|Civil War|World War|Study Guide/i.test(name)) {
        results.push(name);
      }
    });

    return Array.from(new Set(results.map(cleanItem).filter(Boolean)));
  }

  function isMathProblem(text) {
    const value = text.trim();

    return (
      /^(solve|simplify)\s*:/i.test(value) ||
      /\b(equation|formula|slope|graph)\b/i.test(value) ||
      /[xy]\s*=/.test(value) ||
      /^[+-]?\d*x\s*[+\-]\s*\d+\s*=\s*[+-]?\d+$/i.test(removeCommand(value)) ||
      /^[+-]?\d*x\s*[+\-]\s*[+-]?\d*x\s*[+\-]\s*\d+$/i.test(removeCommand(value)) ||
      /^[+-]?\d+\s*\(\s*x\s*[+\-]\s*\d+\s*\)$/i.test(removeCommand(value))
    );
  }

  function normalizeMathProblem(text) {
    return removeCommand(text).trim();
  }

  function removeCommand(text) {
    return String(text).replace(/^\s*(solve|simplify)\s*:?\s*/i, "").trim();
  }

  function isWritingPrompt(text) {
    return /\b(essay|paragraph|write|prompt|claim|evidence|cer|thesis|text evidence)\b/i.test(text);
  }

  function isSource(text) {
    return /https?:\/\/|www\.|source\s*:|article\s*:|author\s*:|website\s*:/i.test(text);
  }

  function isKeyFact(text) {
    return (
      text.length > 25 &&
      !isQuestion(text) &&
      !isVocabularyLine(text) &&
      !isMathProblem(text) &&
      !isWritingPrompt(text) &&
      !isSource(text)
    );
  }

  function isLikelyHeading(text) {
    return (
      text.length < 80 &&
      !/[.!?]$/.test(text) &&
      /\b(study guide|notes|review|chapter|unit|lesson|worksheet|homework)\b/i.test(text)
    );
  }

  function stripListMarker(line) {
    return String(line).replace(/^\s*(\d+\.|\d+\)|[-•*])\s*/, "").trim();
  }

  function cleanItem(value) {
    return String(value || "").replace(/^[\s,.;:-]+/, "").replace(/[\s,.;:-]+$/, "").trim();
  }

  function titleCase(value) {
    return String(value)
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function addUnique(list, value) {
    const clean = cleanItem(value);
    if (!clean) return;

    const exists = list.some((item) => item.toLowerCase() === clean.toLowerCase());
    if (!exists) list.push(clean);
  }

  function saveReviewQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        reviewQueue: state.reviewQueue,
        weakMap: state.weakMap
      }));
    } catch {
      /* Local storage is optional. */
    }
  }

  function loadReviewQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw).reviewQueue || [];
    } catch {
      return [];
    }
  }

  function saveWeakMap() {
    saveReviewQueue();
  }

  function loadWeakMap() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw).weakMap || {};
    } catch {
      return {};
    }
  }

  function saveLastPath(path) {
    try {
      localStorage.setItem(LAST_PATH_KEY, JSON.stringify(path));
    } catch {
      /* Local storage is optional. */
    }
  }

  function loadLastPath() {
    try {
      const raw = localStorage.getItem(LAST_PATH_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function cryptoId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `mission-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function createTagRow(items) {
    const row = createEl("div", "tag-row");
    items.forEach((item) => row.append(tag(item)));
    return row;
  }

  function tag(text, extraClass) {
    return createEl("span", `tag ${extraClass || ""}`.trim(), text);
  }

  function list(items, className) {
    const ul = createEl("ul", className || "tool-list");
    const safeItems = Array.isArray(items) && items.length ? items : ["No items found yet."];

    safeItems.forEach((item) => {
      ul.append(createEl("li", "", typeof item === "string" ? item : JSON.stringify(item)));
    });

    return ul;
  }

  function buttonEl(text, className, handler) {
    const button = createEl("button", className, text);
    button.type = "button";
    if (handler) button.addEventListener("click", handler);
    return button;
  }

  function div(className, children, text) {
    const node = createEl("div", className, text);
    if (children) children.forEach((child) => node.append(child));
    return node;
  }

  function heading(text, level) {
    return createEl(`h${level}`, "", text);
  }

  function textP(text, className) {
    return createEl("p", className || "", text);
  }

  function strong(text) {
    return createEl("strong", "", text);
  }

  function setText(node, text) {
    if (node) node.textContent = text;
  }

  function setStatus(message) {
    if (els.statusMessage) els.statusMessage.textContent = message;
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function createEl(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function countSignals(text, list) {
    return list.reduce((score, signal) => {
      return score + (text.includes(signal.toLowerCase()) ? 1 : 0);
    }, 0);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function clampInt(value, min, max) {
    return Math.round(clamp(value, min, max));
  }
})();
