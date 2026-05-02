(() => {
  "use strict";

  const subjectLabels = {
    math: "Math",
    science: "Science",
    socialStudies: "Social Studies",
    readingWriting: "Reading/Writing",
    general: "General Study"
  };

  const folderLabels = {
    questions: "Questions",
    vocabulary: "Vocabulary",
    keyFacts: "Key Facts",
    dates: "Dates",
    events: "Events",
    people: "People",
    mathProblems: "Math Problems",
    writingPrompts: "Writing Prompts",
    sources: "Sources",
    unknown: "Unknown / Needs Review"
  };

  const folderOrder = [
    "questions",
    "vocabulary",
    "keyFacts",
    "dates",
    "events",
    "people",
    "mathProblems",
    "writingPrompts",
    "sources",
    "unknown"
  ];

  const loadingPhrases = [
    "Reading the material…",
    "Extracting keywords…",
    "Detecting the subject…",
    "Building study tools…"
  ];

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
      "variable",
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

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    startLoadingScreen();

    if (els.buildPathBtn) {
      els.buildPathBtn.addEventListener("click", handleBuildStudyPath);
    }

    window.createStudyPath = createStudyPath;
  }

  function cacheElements() {
    els.loadingScreen = document.querySelector("#loadingScreen");
    els.loadingPhrase = document.querySelector("#loadingPhrase");
    els.materialInput = document.querySelector("#materialInput");
    els.buildPathBtn = document.querySelector("#buildPathBtn");
    els.statusMessage = document.querySelector("#statusMessage");
    els.resultPanel = document.querySelector("#resultPanel");
    els.detectedSubject = document.querySelector("#detectedSubject");
    els.confidenceValue = document.querySelector("#confidenceValue");
    els.confidenceMessage = document.querySelector("#confidenceMessage");
    els.strategyText = document.querySelector("#strategyText");
    els.firstActionText = document.querySelector("#firstActionText");
    els.scoreGrid = document.querySelector("#scoreGrid");
    els.keywordChips = document.querySelector("#keywordChips");
    els.folderGrid = document.querySelector("#folderGrid");
    els.toolsGrid = document.querySelector("#toolsGrid");
  }

  function startLoadingScreen() {
    if (!els.loadingScreen) return;

    let index = 0;

    const timer = window.setInterval(() => {
      index = (index + 1) % loadingPhrases.length;

      if (els.loadingPhrase) {
        els.loadingPhrase.textContent = loadingPhrases[index];
      }
    }, 360);

    window.setTimeout(() => {
      window.clearInterval(timer);
      els.loadingScreen.classList.add("hide");
    }, 1450);
  }

  function handleBuildStudyPath() {
    const text = els.materialInput ? els.materialInput.value : "";

    if (!text.trim()) {
      setStatus("Paste homework, notes, or assignment text first.");
      return;
    }

    const result = createStudyPath(text);

    setStatus("Theorem detected your material and organized it into a study path.");
    renderStudyPathResult(result);

    try {
      localStorage.setItem("theoremLastStudyPath", JSON.stringify(result));
    } catch {
      /* localStorage is optional for this V1 engine. */
    }
  }

  function createStudyPath(text) {
    const originalText = String(text || "");
    const cleanedText = cleanText(originalText);
    const folders = extractFolders(cleanedText);
    const keywords = extractKeywords(cleanedText, folders);
    const scores = scoreSubjects(cleanedText, folders);
    const detection = detectSubject(scores);
    const studyPath = chooseStudyPath(detection.detectedSubject);
    const studyTools = generateStudyTools(
      detection.detectedSubject,
      folders,
      keywords,
      cleanedText
    );

    return {
      originalText,
      detectedSubject: detection.detectedSubject,
      confidence: detection.confidence,
      scores,
      keywords,
      folders,
      studyPath,
      studyTools
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

  function extractFolders(text) {
    const folders = {
      questions: [],
      vocabulary: [],
      keyFacts: [],
      dates: [],
      events: [],
      people: [],
      mathProblems: [],
      writingPrompts: [],
      sources: [],
      unknown: []
    };

    const segments = splitIntoSegments(text);

    extractDates(text).forEach((date) => addUnique(folders.dates, date));

    segments.forEach((segment) => {
      const item = stripListMarker(segment);
      if (!item) return;

      let matched = false;

      if (isSource(item)) {
        addUnique(folders.sources, item);
        matched = true;
      }

      if (isVocabularyLine(item)) {
        extractVocabulary(item).forEach((term) => addUnique(folders.vocabulary, term));
        matched = true;
      }

      if (startsWithDefine(item)) {
        const defined = extractDefineTerm(item);
        if (defined) addUnique(folders.vocabulary, defined);
        addUnique(folders.questions, normalizeQuestion(item));
        matched = true;
      }

      if (isMathProblem(item)) {
        addUnique(folders.mathProblems, normalizeMathProblem(item));
        matched = true;
      }

      if (isQuestion(item)) {
        addUnique(folders.questions, normalizeQuestion(item));
        matched = true;
      }

      if (isWritingPrompt(item)) {
        addUnique(folders.writingPrompts, item);
        matched = true;
      }

      if (isEvent(item)) {
        extractEvents(item).forEach((event) => addUnique(folders.events, event));
        matched = true;
      }

      extractPeople(item).forEach((person) => {
        addUnique(folders.people, person);
        matched = true;
      });

      if (!matched && isKeyFact(item)) {
        addUnique(folders.keyFacts, item);
        matched = true;
      }

      if (!matched && !isLikelyHeading(item)) {
        addUnique(folders.unknown, item);
      }
    });

    return folders;
  }

  function splitIntoSegments(text) {
    const linePieces = String(text)
      .split(/\n+/)
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed) return [];

        return trimmed
          .split(/(?<=[.!?])\s+(?=(?:[A-Z0-9]|Explain|Describe|Define|Compare|Contrast|Analyze|Summarize|Identify|List|Write|Vocabulary|Terms))/)
          .map((piece) => piece.trim())
          .filter(Boolean);
      });

    return linePieces.length ? linePieces : [text.trim()].filter(Boolean);
  }

  function stripListMarker(line) {
    return String(line)
      .replace(/^\s*(\d+\.|\d+\)|[-•*])\s*/, "")
      .trim();
  }

  function isQuestion(text) {
    return (
      /\?$/.test(text.trim()) ||
      /^(explain|describe|define|compare|contrast|analyze|summarize|identify|list|what|why|how|when|where|who)\b/i.test(text.trim())
    );
  }

  function normalizeQuestion(text) {
    return stripListMarker(text)
      .replace(/[.]+$/g, "")
      .trim();
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
    return String(text)
      .replace(/^define\s+/i, "")
      .replace(/[.:?].*$/g, "")
      .trim();
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

    if (known) {
      results.push(titleCase(known[1]));
    }

    const phrase = cleaned.match(
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4}\s+(War|Revolution|Battle|Treaty|Movement|Party|Independence))\b/
    );

    if (phrase) {
      results.push(phrase[1]);
    }

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
      if (!looksLikeEventName(name) && !looksLikeSubjectHeading(name)) {
        results.push(name);
      }
    });

    return Array.from(new Set(results.map(cleanItem).filter(Boolean)));
  }

  function looksLikeEventName(name) {
    return /American Revolution|Boston Tea|Tea Party|Civil War|World War|French Revolution|Industrial Revolution/i.test(name);
  }

  function looksLikeSubjectHeading(name) {
    return /Study Guide|Text Evidence|Main Idea/i.test(name);
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
    return String(text)
      .replace(/^\s*(solve|simplify)\s*:?\s*/i, "")
      .trim();
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

  function extractKeywords(text, folders) {
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

    folders.vocabulary.forEach((term) => {
      const key = term.toLowerCase();
      counts[key] = (counts[key] || 0) + 4;
    });

    Object.values(signals).flat().forEach((signal) => {
      const key = signal.toLowerCase();
      if (String(text).toLowerCase().includes(key)) {
        counts[key] = (counts[key] || 0) + 3;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word]) => word);
  }

  function scoreSubjects(text, folders) {
    const lower = text.toLowerCase();

    const scores = {
      math: countSignals(lower, signals.math) + folders.mathProblems.length * 5,
      science: countSignals(lower, signals.science),
      socialStudies:
        countSignals(lower, signals.socialStudies) +
        folders.events.length * 2 +
        folders.dates.length,
      readingWriting:
        countSignals(lower, signals.readingWriting) +
        folders.writingPrompts.length * 3,
      general: 1
    };

    if (/\d*x\s*[+\-]\s*\d+\s*=/.test(lower)) scores.math += 5;
    if (lower.includes("photosynthesis")) scores.science += 4;
    if (lower.includes("american revolution") || lower.includes("boston tea party")) scores.socialStudies += 5;
    if (lower.includes("write an essay") || lower.includes("text evidence")) scores.readingWriting += 5;

    return scores;
  }

  function countSignals(text, list) {
    return list.reduce((score, signal) => {
      return score + (text.includes(signal.toLowerCase()) ? 1 : 0);
    }, 0);
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

  function chooseStudyPath(subject) {
    const paths = {
      math: {
        strategy: "Exact Check + Mistake Repair",
        tools: ["Practice list", "Hints placeholder", "Mistake repair mode", "Try first instruction"]
      },
      science: {
        strategy: "Remember → Explain → Apply",
        tools: ["Memory flashcards", "Process breakdown", "Teach-back prompt", "Application questions"]
      },
      socialStudies: {
        strategy: "Memorization + Analysis",
        tools: ["Flashcards", "Timeline", "Cause/effect questions", "Why-it-mattered questions", "Creative thinking test"]
      },
      readingWriting: {
        strategy: "Read → Prove → Write",
        tools: ["Main idea prompt", "Evidence finder", "CER builder", "Short answer practice", "Essay outline"]
      },
      general: {
        strategy: "Summary → Flashcards → Quiz → Review",
        tools: ["Short summary", "Keyword flashcards", "Quiz questions", "Teach-back prompt", "Review plan"]
      }
    };

    return paths[subject] || paths.general;
  }

  function generateStudyTools(subject, folders, keywords, text) {
    if (subject === "math") return generateMathTools(folders);
    if (subject === "science") return generateScienceTools(folders, keywords);
    if (subject === "socialStudies") return generateSocialStudiesTools(folders, keywords);
    if (subject === "readingWriting") return generateReadingWritingTools(folders);

    return generateGeneralTools(folders, keywords, text);
  }

  function generateMathTools(folders) {
    const problems = folders.mathProblems.length ? folders.mathProblems : ["No supported math problems found yet."];

    return [
      {
        title: "Practice list",
        items: problems.map((problem, index) => `${index + 1}. Try first: ${problem}`)
      },
      {
        title: "Hints placeholder",
        items: [
          "Try the problem before checking anything.",
          "Ask: what operation should be undone first?",
          "Check each step before moving on."
        ]
      },
      {
        title: "Mistake repair mode placeholder",
        items: [
          "If the answer is wrong, identify the step that broke.",
          "Redo a smaller repair drill.",
          "Then retry the original problem."
        ]
      }
    ];
  }

  function generateScienceTools(folders, keywords) {
    const terms = folders.vocabulary.length ? folders.vocabulary : keywords.slice(0, 5);
    const facts = folders.keyFacts.length ? folders.keyFacts : ["Find the main process or concept in the material."];

    return [
      {
        title: "Remember",
        items: terms.map((term) => `What does ${term} mean?`)
      },
      {
        title: "Explain",
        items: facts.slice(0, 4).map((fact) => `Explain in your own words: ${fact}`)
      },
      {
        title: "Apply",
        items: [
          "What might happen if one part of the process changed?",
          "Where could you see this concept in real life?",
          "What example would prove you understand it?"
        ]
      },
      {
        title: "Teach-back prompt",
        items: ["Explain the topic to someone who missed class, without reading your notes."]
      }
    ];
  }

  function generateSocialStudiesTools(folders, keywords) {
    const flashcardItems = [
      ...folders.vocabulary.map((term) => `Define: ${term}`),
      ...folders.people.map((person) => `Who was ${person}?`),
      ...folders.events.map((event) => `What happened during ${event}?`),
      ...folders.dates.map((date) => `What happened around ${date}?`)
    ];

    return [
      {
        title: "Flashcards",
        items: flashcardItems.length ? flashcardItems : keywords.slice(0, 6).map((word) => `Explain: ${word}`)
      },
      {
        title: "Timeline",
        items: buildTimelineItems(folders)
      },
      {
        title: "Cause/effect questions",
        items: [
          "What caused the main event?",
          "What changed because of it?",
          "How did this cause lead to that effect?"
        ]
      },
      {
        title: "Why-it-mattered questions",
        items: [
          "Why did this event matter?",
          "Who was affected by it?",
          "What changed afterward?"
        ]
      },
      {
        title: "Creative thinking test",
        items: [
          "What might have changed if this event did not happen?",
          "How would someone at the time explain this event?",
          "Compare this event to another conflict, protest, or decision."
        ]
      }
    ];
  }

  function buildTimelineItems(folders) {
    const items = [];

    folders.events.forEach((event, index) => {
      items.push(`${folders.dates[index] || "Date not found"}: ${event}`);
    });

    folders.dates.forEach((date) => {
      if (!items.some((item) => item.startsWith(date))) {
        items.push(`${date}: connect this date to an event from the material`);
      }
    });

    return items.length ? items : ["No clear timeline items found yet."];
  }

  function generateReadingWritingTools(folders) {
    const prompt = folders.writingPrompts[0] || folders.questions[0] || "Use the text to answer the prompt.";

    return [
      {
        title: "Main idea prompt",
        items: ["What is the main idea of the text or assignment?"]
      },
      {
        title: "Theme / claim prompt",
        items: ["What claim, theme, or argument should your answer prove?"]
      },
      {
        title: "Evidence finder",
        items: [
          "Find one quote or detail that supports the answer.",
          "Explain how the evidence proves the claim."
        ]
      },
      {
        title: "CER builder",
        items: ["Claim:", "Evidence:", "Reasoning:"]
      },
      {
        title: "Essay outline",
        items: [
          `Prompt: ${prompt}`,
          "Introduction / claim",
          "Body point 1 + evidence",
          "Body point 2 + evidence",
          "Conclusion"
        ]
      }
    ];
  }

  function generateGeneralTools(folders, keywords, text) {
    return [
      {
        title: "Short summary",
        items: [makeSummary(text)]
      },
      {
        title: "Flashcards",
        items: keywords.slice(0, 6).map((word) => `What should you remember about ${word}?`)
      },
      {
        title: "Quiz questions",
        items: folders.questions.length
          ? folders.questions
          : ["What is the main idea?", "What are the most important details?", "What should you review first?"]
      },
      {
        title: "Teach-back prompt",
        items: ["Explain the material in your own words without looking."]
      },
      {
        title: "Review plan",
        items: ["Review keywords.", "Answer questions.", "Explain the material out loud.", "Repeat weak spots."]
      }
    ];
  }

  function makeSummary(text) {
    const sentences = String(text)
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 20);

    return sentences.slice(0, 2).join(". ") || "Theorem found short material. Add more notes for a better summary.";
  }

  function getRecommendedFirstAction(subject, confidence) {
    const lowConfidenceNote =
      confidence < 0.55
        ? " Theorem is not fully sure. Review the folders before studying."
        : "";

    const actions = {
      math: "Start with the first problem and try before viewing hints.",
      science: "Start with Remember mode, then explain the concept out loud.",
      socialStudies: "Start with flashcards, then do the cause/effect questions.",
      readingWriting: "Start by finding the main idea and evidence.",
      general: "Start with the summary, then test yourself with flashcards."
    };

    return `${actions[subject] || actions.general}${lowConfidenceNote}`;
  }

  function renderStudyPathResult(result) {
    if (!els.resultPanel) return;

    els.resultPanel.classList.remove("hidden");

    const label = subjectLabels[result.detectedSubject] || subjectLabels.general;
    const confidencePercent = Math.round(result.confidence * 100);

    setText(els.detectedSubject, label);
    setText(els.confidenceValue, `${confidencePercent}%`);
    setText(els.strategyText, result.studyPath.strategy);
    setText(els.firstActionText, getRecommendedFirstAction(result.detectedSubject, result.confidence));

    if (els.confidenceMessage) {
      clear(els.confidenceMessage);

      const message = result.confidence < 0.55
        ? "Theorem is not fully sure. Review the folders before studying."
        : "Based on your material, Theorem suggests this study path.";

      els.confidenceMessage.textContent = message;
      els.confidenceMessage.classList.toggle("low-confidence", result.confidence < 0.55);
    }

    renderScores(result.scores);
    renderKeywords(result.keywords);
    renderFolders(result.folders);
    renderTools(result.studyTools);

    els.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderScores(scores) {
    clear(els.scoreGrid);
    if (!els.scoreGrid) return;

    const max = Math.max(1, ...Object.values(scores));

    Object.entries(scores).forEach(([subject, score]) => {
      const card = createEl("article", "score-card");
      const title = createEl("strong", "", subjectLabels[subject] || subject);
      const value = createEl("p", "", `Score: ${score}`);
      const bar = createEl("div", "score-bar");
      const fill = createEl("span");

      fill.style.width = `${Math.round((score / max) * 100)}%`;
      bar.append(fill);
      card.append(title, value, bar);
      els.scoreGrid.append(card);
    });
  }

  function renderKeywords(keywords) {
    clear(els.keywordChips);
    if (!els.keywordChips) return;

    const items = keywords.length ? keywords : ["No strong keywords found yet."];

    items.forEach((keyword) => {
      const chip = createEl("span", "chip", keyword);
      els.keywordChips.append(chip);
    });
  }

  function renderFolders(folders) {
    clear(els.folderGrid);
    if (!els.folderGrid) return;

    folderOrder.forEach((key) => {
      const items = folders[key] || [];
      const card = createEl("article", `folder-card ${items.length ? "" : "empty"}`);
      const count = createEl("span", "folder-count", `${items.length} item${items.length === 1 ? "" : "s"}`);
      const title = createEl("h3", "", folderLabels[key] || key);
      const list = createEl("ul", "item-list");

      const safeItems = items.length ? items : ["Nothing found here yet."];

      safeItems.slice(0, 8).forEach((item) => {
        const li = createEl("li", "", item);
        list.append(li);
      });

      if (items.length > 8) {
        list.append(createEl("li", "", `+ ${items.length - 8} more`));
      }

      card.append(count, title, list);
      els.folderGrid.append(card);
    });
  }

  function renderTools(tools) {
    clear(els.toolsGrid);
    if (!els.toolsGrid) return;

    tools.forEach((tool) => {
      const card = createEl("article", "tool-card");
      const title = createEl("h3", "", tool.title);
      const list = createEl("ul", "item-list");

      tool.items.forEach((item) => {
        const li = createEl("li", "", item);
        list.append(li);
      });

      card.append(title, list);
      els.toolsGrid.append(card);
    });
  }

  function cleanItem(value) {
    return String(value || "")
      .replace(/^[\s,.;:-]+/, "")
      .replace(/[\s,.;:-]+$/, "")
      .trim();
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

    if (!exists) {
      list.push(clean);
    }
  }

  function setStatus(message) {
    if (els.statusMessage) {
      els.statusMessage.textContent = message;
    }
  }

  function setText(node, text) {
    if (node) {
      node.textContent = text;
    }
  }

  function clear(node) {
    if (!node) return;

    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function createEl(tag, className, text) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();
