"use strict";

const STORAGE_KEY = "theoremProgressV1";

const mistakeLabels = {
  skipped_inverse_operation: "Skipped inverse operation",
  wrong_operation: "Wrong inverse operation",
  sign_error: "Sign error",
  arithmetic_error: "Arithmetic error",
  combined_unlike_terms: "Combined unlike terms",
  distribution_error: "Distribution error",
  variable_confusion: "Variable confusion",
  incomplete_solution: "Incomplete solution",
  random_or_unclear: "Random or unclear"
};

const modules = [
  {
    id: "two_step_equations",
    title: "Two-step equations",
    description: "Solve equations like 2x + 5 = 17.",
    active: true
  },
  {
    id: "combining_like_terms",
    title: "Combining like terms",
    description: "Simplify expressions like 3x + 2x + 5.",
    active: true
  },
  {
    id: "distributive_property",
    title: "Distributive property",
    description: "Simplify expressions like 3(x + 4).",
    active: true
  },
  {
    id: "variables_both_sides",
    title: "Variables on both sides",
    description: "Coming soon.",
    active: false
  },
  {
    id: "slope_basics",
    title: "Slope basics",
    description: "Coming soon.",
    active: false
  },
  {
    id: "word_problem_translation",
    title: "Word problem translation",
    description: "Coming soon.",
    active: false
  }
];

const problemBank = [
  twoStep("ts1", "2x + 5 = 17", 2, 5, 17),
  twoStep("ts2", "3x - 4 = 11", 3, -4, 11),
  twoStep("ts3", "5x + 2 = 27", 5, 2, 27),
  twoStep("ts4", "4x - 9 = 15", 4, -9, 15),
  twoStep("ts5", "7x + 3 = 31", 7, 3, 31),
  twoStep("ts6", "6x - 8 = 16", 6, -8, 16),
  twoStep("ts7", "2x - 7 = 9", 2, -7, 9),
  twoStep("ts8", "9x + 6 = 42", 9, 6, 42),
  twoStep("ts9", "5x - 10 = 15", 5, -10, 15),
  twoStep("ts10", "8x + 1 = 33", 8, 1, 33),
  twoStep("ts11", "3x + 12 = 24", 3, 12, 24),
  twoStep("ts12", "10x - 5 = 45", 10, -5, 45),

  linearProblem("clt1", "Simplify: 3x + 2x + 5", "combining_like_terms", 5, 5, {
    combined_unlike_terms: ["10x"],
    incomplete_solution: ["5x"]
  }),
  linearProblem("clt2", "Simplify: 4x + x + 7", "combining_like_terms", 5, 7, {
    combined_unlike_terms: ["12x"],
    incomplete_solution: ["5x"]
  }),
  linearProblem("clt3", "Simplify: 6x - 2x + 9", "combining_like_terms", 4, 9, {
    combined_unlike_terms: ["13x"],
    incomplete_solution: ["4x"]
  }),
  linearProblem("clt4", "Simplify: 8x + 3 - 2x", "combining_like_terms", 6, 3, {
    incomplete_solution: ["6x"]
  }),
  linearProblem("clt5", "Simplify: x + 5x + 4", "combining_like_terms", 6, 4, {
    incomplete_solution: ["6x"]
  }),
  linearProblem("clt6", "Simplify: 10x - 3x + 2", "combining_like_terms", 7, 2, {
    incomplete_solution: ["7x"]
  }),
  linearProblem("clt7", "Simplify: 2x + 6 + 4x", "combining_like_terms", 6, 6, {
    incomplete_solution: ["6x"]
  }),
  linearProblem("clt8", "Simplify: 9x + 1 - 5x", "combining_like_terms", 4, 1, {
    incomplete_solution: ["4x"]
  }),
  linearProblem("clt9", "Simplify: 7x + 2x - 3", "combining_like_terms", 9, -3, {
    incomplete_solution: ["9x"]
  }),
  linearProblem("clt10", "Simplify: 5x + 8 - x", "combining_like_terms", 4, 8, {
    incomplete_solution: ["4x"]
  }),

  distributionProblem("dp1", "Simplify: 3(x + 4)", 3, 4),
  distributionProblem("dp2", "Simplify: 2(x + 5)", 2, 5),
  distributionProblem("dp3", "Simplify: 4(x + 3)", 4, 3),
  distributionProblem("dp4", "Simplify: 5(x - 2)", 5, -2),
  distributionProblem("dp5", "Simplify: 6(x + 1)", 6, 1),
  distributionProblem("dp6", "Simplify: 7(x - 3)", 7, -3),
  distributionProblem("dp7", "Simplify: 2(x - 8)", 2, -8),
  distributionProblem("dp8", "Simplify: 9(x + 2)", 9, 2),
  distributionProblem("dp9", "Simplify: 3(x - 6)", 3, -6),
  distributionProblem("dp10", "Simplify: 8(x + 4)", 8, 4)
];

let progress = loadProgress();
let selectedSkill = "two_step_equations";
let currentProblem = getProblemsForSkill(selectedSkill)[0];
let currentProblemIndex = 0;
let currentHintIndex = 0;
let submittedCurrentProblem = false;

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindNavigation();
  bindTutor();
  renderSkillList();
  renderPracticeModules();
  renderProblem();
  renderProgressDashboard();
  renderReviewDashboard();
}

function twoStep(id, display, a, b, c) {
  const correctValue = (c - b) / a;
  const middleValue = c - b;
  const sign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;

  return {
    id,
    skill: "two_step_equations",
    topic: "Algebra 1",
    title: "Two-step equations",
    type: "twoStep",
    display,
    instruction: "Enter the value of x.",
    a,
    b,
    c,
    correctValue,
    middleValue,
    correctText: `x = ${formatNumber(correctValue)}`,
    steps: [
      `${a}x ${sign} = ${c}`,
      `${a}x = ${middleValue}`,
      `x = ${formatNumber(correctValue)}`
    ],
    hints: [
      "Undo the operation farthest from x first.",
      b >= 0 ? `Start by subtracting ${b} from both sides.` : `Start by adding ${Math.abs(b)} to both sides.`,
      `After the first inverse operation, you should have ${a}x = ${middleValue}.`
    ],
    repairDrill: "Try another two-step equation and finish all the way to x."
  };
}

function linearProblem(id, display, skill, coef, constant, knownMistakes = {}) {
  return {
    id,
    skill,
    topic: "Algebra 1",
    title: skillTitle(skill),
    type: "linearExpression",
    display,
    instruction: "Enter the simplified expression.",
    correctCoef: coef,
    correctConstant: constant,
    correctText: formatLinear(coef, constant),
    knownMistakes,
    steps: [
      "Group the x terms together.",
      "Combine only the x terms with x terms.",
      `Final answer: ${formatLinear(coef, constant)}`
    ],
    hints: [
      "Only like terms can combine.",
      "x terms combine with x terms. Constants combine with constants.",
      "Keep the constant term separate unless there is another constant to combine with it."
    ],
    repairDrill: "Try a smaller expression and identify which terms are alike."
  };
}

function distributionProblem(id, display, a, b) {
  const constant = a * b;

  return {
    id,
    skill: "distributive_property",
    topic: "Algebra 1",
    title: "Distributive property",
    type: "distribution",
    display,
    instruction: "Enter the simplified expression.",
    a,
    b,
    correctCoef: a,
    correctConstant: constant,
    correctText: formatLinear(a, constant),
    steps: [
      `Multiply ${a} by x.`,
      `Multiply ${a} by ${b}.`,
      `Final answer: ${formatLinear(a, constant)}`
    ],
    hints: [
      "The outside number must multiply every term inside the parentheses.",
      `First multiply ${a} by x.`,
      `Then multiply ${a} by ${b}.`
    ],
    repairDrill: "Try another distribution problem and check both terms."
  };
}

function bindNavigation() {
  document.querySelectorAll("[data-target]").forEach((button) => {
    button.addEventListener("click", () => showSection(button.dataset.target));
  });

  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

function showSection(sectionId) {
  document.querySelectorAll(".app-section").forEach((section) => {
    section.classList.toggle("visible", section.id === sectionId);
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.target === sectionId);
  });

  const navLinks = document.getElementById("navLinks");
  navLinks.classList.remove("open");

  if (sectionId === "progress") {
    renderProgressDashboard();
  }

  if (sectionId === "review") {
    renderReviewDashboard();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindTutor() {
  const form = document.getElementById("answerForm");
  const hintButton = document.getElementById("hintButton");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit();
  });

  hintButton.addEventListener("click", showNextHint);
}

function renderSkillList() {
  const skillList = document.getElementById("skillList");
  skillList.innerHTML = "";

  modules.forEach((module) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "skill-button";
    button.disabled = !module.active;

    if (module.id === selectedSkill) {
      button.classList.add("active");
    }

    button.textContent = module.title;

    const small = document.createElement("small");
    small.textContent = module.description;
    button.appendChild(small);

    if (module.active) {
      button.addEventListener("click", () => {
        selectSkill(module.id);
        showSection("tutor");
      });
    }

    skillList.appendChild(button);
  });
}

function renderPracticeModules() {
  const container = document.getElementById("practiceModules");
  container.innerHTML = "";

  modules.forEach((module) => {
    const card = document.createElement("article");
    card.className = "module-card";

    if (!module.active) {
      card.classList.add("coming-soon");
    }

    const title = document.createElement("h3");
    title.textContent = module.title;

    const desc = document.createElement("p");
    desc.textContent = module.description;

    const button = document.createElement("button");
    button.className = module.active ? "btn btn-primary" : "btn btn-ghost";
    button.type = "button";
    button.textContent = module.active ? "Practice this" : "Coming soon";
    button.disabled = !module.active;

    if (module.active) {
      button.addEventListener("click", () => {
        selectSkill(module.id);
        showSection("tutor");
      });
    }

    card.append(title, desc, button);
    container.appendChild(card);
  });
}

function selectSkill(skillId) {
  selectedSkill = skillId;
  currentProblemIndex = 0;
  currentHintIndex = 0;
  submittedCurrentProblem = false;
  currentProblem = getProblemsForSkill(skillId)[0];
  renderSkillList();
  renderProblem();
}

function renderProblem() {
  const problems = getProblemsForSkill(selectedSkill);
  currentProblem = problems[currentProblemIndex % problems.length];

  document.getElementById("currentTopic").textContent = currentProblem.topic;
  document.getElementById("problemTitle").textContent = currentProblem.title;
  document.getElementById("problemCount").textContent = `Problem ${currentProblemIndex + 1}`;
  document.getElementById("problemDisplay").textContent = currentProblem.display;
  document.getElementById("problemInstruction").textContent = currentProblem.instruction;
  document.getElementById("answerInput").value = "";
  document.getElementById("answerInput").focus();

  currentHintIndex = 0;
  submittedCurrentProblem = false;
  document.getElementById("hintText").textContent = "";
  document.getElementById("hintButton").disabled = false;

  const feedback = document.getElementById("feedbackPanel");
  feedback.className = "feedback-panel hidden";
  feedback.innerHTML = "";
}

function handleSubmit() {
  const input = document.getElementById("answerInput").value;
  const result = checkAnswer(currentProblem, input);

  if (!submittedCurrentProblem) {
    saveAttempt(result);
    submittedCurrentProblem = true;
  }

  showFeedback(result);
  renderProgressDashboard();
  renderReviewDashboard();
}

function checkAnswer(problem, input) {
  const raw = String(input || "").trim();

  if (!raw) {
    return {
      correct: false,
      mistakeType: "incomplete_solution",
      title: "Not quite — enter an answer first.",
      message: "Type a value or expression before checking.",
      fix: "For example, write 6 or x = 6.",
      problem
    };
  }

  if (problem.type === "twoStep") {
    const value = parseNumericAnswer(raw);

    if (value === null) {
      return wrong(problem, "random_or_unclear", "Theorem could not read that answer.", "Enter a number for x, like 6 or x = 6.");
    }

    if (nearlyEqual(value, problem.correctValue)) {
      return {
        correct: true,
        mistakeType: null,
        title: "Correct.",
        message: `${problem.correctText} works because substituting it back satisfies the equation.`,
        fix: "You finished both inverse operations.",
        problem
      };
    }

    return diagnoseTwoStep(problem, value);
  }

  const parsed = parseLinearExpression(raw);

  if (!parsed) {
    return wrong(problem, "random_or_unclear", "Theorem could not read that expression.", "Use a form like 5x + 5 or 3x + 12.");
  }

  if (nearlyEqual(parsed.coef, problem.correctCoef) && nearlyEqual(parsed.constant, problem.correctConstant)) {
    return {
      correct: true,
      mistakeType: null,
      title: "Correct.",
      message: `${problem.correctText} is the simplified form.`,
      fix: "Your expression has the right x term and the right constant.",
      problem
    };
  }

  if (problem.type === "linearExpression") {
    return diagnoseLikeTerms(problem, parsed, raw);
  }

  if (problem.type === "distribution") {
    return diagnoseDistribution(problem, parsed);
  }

  return wrong(problem, "random_or_unclear", "That is not the target answer.", "Try again carefully.");
}

function diagnoseTwoStep(problem, value) {
  const oppositeOperationValue = (problem.c + problem.b) / problem.a;

  if (nearlyEqual(value, problem.middleValue)) {
    return wrong(
      problem,
      "skipped_inverse_operation",
      "You stopped at the middle step.",
      `After the first move, you got ${problem.a}x = ${problem.middleValue}. But x is still multiplied by ${problem.a}. Divide by ${problem.a}.`
    );
  }

  if (nearlyEqual(value, oppositeOperationValue)) {
    return wrong(
      problem,
      "wrong_operation",
      "You used the wrong inverse operation.",
      problem.b >= 0
        ? `Since +${problem.b} is attached to the x term, undo it with -${problem.b}.`
        : `Since -${Math.abs(problem.b)} is attached to the x term, undo it with +${Math.abs(problem.b)}.`
    );
  }

  if (nearlyEqual(value, -problem.correctValue)) {
    return wrong(
      problem,
      "sign_error",
      "The size is right, but the sign changed.",
      "Check where the negative sign came from."
    );
  }

  return wrong(
    problem,
    "arithmetic_error",
    "Your answer is not correct yet.",
    "Redo the arithmetic slowly and check by substitution."
  );
}

function diagnoseLikeTerms(problem, parsed, rawInput) {
  const normalized = normalizeText(rawInput);

  if (problem.knownMistakes.combined_unlike_terms?.some((item) => normalizeText(item) === normalized)) {
    return wrong(
      problem,
      "combined_unlike_terms",
      "You combined unlike terms.",
      "x terms can combine with x terms. Constants must stay separate."
    );
  }

  if (problem.knownMistakes.incomplete_solution?.some((item) => normalizeText(item) === normalized)) {
    return wrong(
      problem,
      "incomplete_solution",
      "You left out the constant.",
      "Keep the number term in the final expression."
    );
  }

  if (nearlyEqual(parsed.coef, problem.correctCoef) && !nearlyEqual(parsed.constant, problem.correctConstant)) {
    return wrong(
      problem,
      "incomplete_solution",
      "The x term is right, but the constant is missing or wrong.",
      "Keep constants separate and carry them into the final answer."
    );
  }

  if (!nearlyEqual(parsed.coef, problem.correctCoef) && nearlyEqual(parsed.constant, problem.correctConstant)) {
    return wrong(
      problem,
      "arithmetic_error",
      "The constant is right, but the x coefficient is wrong.",
      "Add or subtract only the coefficients attached to x."
    );
  }

  return wrong(
    problem,
    "combined_unlike_terms",
    "The expression is not simplified correctly.",
    "Separate x terms from constants, then combine only like terms."
  );
}

function diagnoseDistribution(problem, parsed) {
  if (nearlyEqual(parsed.coef, problem.a) && nearlyEqual(parsed.constant, problem.b)) {
    return wrong(
      problem,
      "distribution_error",
      "You forgot to distribute to the second term.",
      `The outside ${problem.a} must multiply both x and ${problem.b}.`
    );
  }

  if (nearlyEqual(parsed.coef, 1) && nearlyEqual(parsed.constant, problem.correctConstant)) {
    return wrong(
      problem,
      "distribution_error",
      "You distributed to the number but not to x.",
      `The x term should become ${problem.a}x.`
    );
  }

  if (nearlyEqual(parsed.coef, problem.a * problem.b) && nearlyEqual(parsed.constant, 0)) {
    return wrong(
      problem,
      "distribution_error",
      "You turned the whole expression into one x term.",
      "Distribution creates an x term and a constant term."
    );
  }

  return wrong(
    problem,
    "distribution_error",
    "The distribution is not complete yet.",
    "Multiply the outside number by every term inside the parentheses."
  );
}

function wrong(problem, mistakeType, message, fix) {
  return {
    correct: false,
    mistakeType,
    title: "Not quite — here is the likely break.",
    message,
    fix,
    problem
  };
}

function showFeedback(result) {
  const panel = document.getElementById("feedbackPanel");
  panel.className = result.correct ? "feedback-panel correct" : "feedback-panel repair-needed";
  panel.innerHTML = "";

  const title = document.createElement("div");
  title.className = "feedback-title";
  title.textContent = result.title;

  const message = document.createElement("p");
  message.textContent = result.message;

  const grid = document.createElement("div");
  grid.className = "feedback-grid";

  const box1 = feedbackBox("Tiny fix", result.fix);
  const box2 = feedbackBox("Correct steps", "");

  const list = document.createElement("ol");
  list.className = "steps-list";

  result.problem.steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    list.appendChild(li);
  });

  box2.appendChild(list);
  grid.append(box1, box2);

  const actions = document.createElement("div");
  actions.className = "hero-actions";

  const nextButton = document.createElement("button");
  nextButton.className = "btn btn-primary";
  nextButton.type = "button";
  nextButton.textContent = result.correct ? "Next challenge" : "Repair drill";
  nextButton.addEventListener("click", nextProblem);

  const retryButton = document.createElement("button");
  retryButton.className = "btn btn-ghost";
  retryButton.type = "button";
  retryButton.textContent = "Try this one again";
  retryButton.addEventListener("click", () => {
    submittedCurrentProblem = true;
    document.getElementById("answerInput").focus();
  });

  actions.append(nextButton, retryButton);
  panel.append(title, message, grid, actions);
}

function feedbackBox(label, text) {
  const box = document.createElement("div");
  box.className = "feedback-box";

  const strong = document.createElement("strong");
  strong.textContent = label;

  const p = document.createElement("p");
  p.textContent = text;

  box.append(strong, p);
  return box;
}

function nextProblem() {
  const problems = getProblemsForSkill(selectedSkill);
  currentProblemIndex = (currentProblemIndex + 1) % problems.length;
  renderProblem();
}

function showNextHint() {
  const hintText = document.getElementById("hintText");
  const hintButton = document.getElementById("hintButton");

  hintText.textContent = currentProblem.hints[currentHintIndex];

  currentHintIndex += 1;

  if (currentHintIndex >= currentProblem.hints.length) {
    hintButton.disabled = true;
    hintButton.textContent = "No more hints";
  } else {
    hintButton.textContent = "Show next hint";
  }
}

function saveAttempt(result) {
  progress.attempts += 1;

  if (result.correct) {
    progress.correct += 1;
    progress.streak += 1;
  } else {
    progress.streak = 0;
    progress.mistakes[result.mistakeType] = (progress.mistakes[result.mistakeType] || 0) + 1;
  }

  const skill = result.problem.skill;

  if (!progress.skills[skill]) {
    progress.skills[skill] = { attempts: 0, correct: 0 };
  }

  progress.skills[skill].attempts += 1;

  if (result.correct) {
    progress.skills[skill].correct += 1;
  }

  progress.recentAttempts.unshift({
    time: new Date().toISOString(),
    skill,
    problem: result.problem.display,
    correct: result.correct,
    mistakeType: result.mistakeType
  });

  progress.recentAttempts = progress.recentAttempts.slice(0, 15);
  saveProgress(progress);
}

function defaultProgress() {
  return {
    attempts: 0,
    correct: 0,
    streak: 0,
    mistakes: {
      skipped_inverse_operation: 0,
      wrong_operation: 0,
      sign_error: 0,
      arithmetic_error: 0,
      combined_unlike_terms: 0,
      distribution_error: 0,
      variable_confusion: 0,
      incomplete_solution: 0,
      random_or_unclear: 0
    },
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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultProgress();

    return {
      ...defaultProgress(),
      ...JSON.parse(saved)
    };
  } catch {
    return defaultProgress();
  }
}

function saveProgress(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn("Progress could not be saved. The app will still work for this session.");
  }
}

function renderProgressDashboard() {
  const container = document.getElementById("progressDashboard");
  container.innerHTML = "";

  const accuracy = progress.attempts === 0 ? 0 : Math.round((progress.correct / progress.attempts) * 100);
  const weakest = getWeakestSkill();
  const strongest = getStrongestSkill();
  const commonMistake = getMostCommonMistake();

  container.append(
    statCard("Attempts", progress.attempts),
    statCard("Correct", progress.correct),
    statCard("Accuracy", `${accuracy}%`),
    statCard("Current streak", progress.streak),
    detailCard("Strongest skill", strongest),
    detailCard("Weakest skill", weakest),
    detailCard("Most common mistake", commonMistake),
    detailCard("Recommended next practice", weakest === "No data yet" ? "Start a diagnostic" : weakest)
  );

  const wide = document.createElement("article");
  wide.className = "stat-card wide-card";
  wide.innerHTML = "<h3>Mistake pattern map</h3>";

  const bars = document.createElement("div");
  bars.className = "mistake-bars";

  Object.entries(progress.mistakes).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "mistake-row";

    const label = document.createElement("span");
    label.textContent = mistakeLabels[key] || key;

    const bar = document.createElement("div");
    bar.className = "bar";

    const fill = document.createElement("span");
    fill.style.width = `${Math.min(100, value * 18)}%`;

    const count = document.createElement("span");
    count.textContent = String(value);

    bar.appendChild(fill);
    row.append(label, bar, count);
    bars.appendChild(row);
  });

  wide.appendChild(bars);

  const reset = document.createElement("button");
  reset.className = "btn btn-ghost";
  reset.type = "button";
  reset.textContent = "Reset progress";
  reset.addEventListener("click", () => {
    if (confirm("Reset all local progress?")) {
      progress = defaultProgress();
      saveProgress(progress);
      renderProgressDashboard();
      renderReviewDashboard();
    }
  });

  wide.appendChild(reset);
  container.appendChild(wide);
}

function renderReviewDashboard() {
  const container = document.getElementById("reviewDashboard");
  container.innerHTML = "";

  if (progress.attempts === 0) {
    const card = document.createElement("article");
    card.className = "review-card";
    card.innerHTML = "<h3>Complete a diagnostic first.</h3><p>Theorem will build your review list after you answer a few questions.</p>";
    container.appendChild(card);
    return;
  }

  const weakest = getWeakestSkillKey();
  const commonMistakeKey = getMostCommonMistakeKey();

  const reviewSkill = modules.find((item) => item.id === weakest)?.title || "Two-step equations";
  const reviewMistake = mistakeLabels[commonMistakeKey] || "Mistake pattern";

  const card1 = document.createElement("article");
  card1.className = "review-card";
  card1.innerHTML = `<h3>Review skill</h3><p>${reviewSkill}</p>`;

  const card2 = document.createElement("article");
  card2.className = "review-card";
  card2.innerHTML = `<h3>Watch this mistake</h3><p>${reviewMistake}</p>`;

  const card3 = document.createElement("article");
  card3.className = "review-card";
  card3.innerHTML = `<h3>Next move</h3><p>Practice your weakest skill until you get three correct in a row.</p>`;

  const button = document.createElement("button");
  button.className = "btn btn-primary";
  button.type = "button";
  button.textContent = "Start review";
  button.addEventListener("click", () => {
    selectSkill(weakest);
    showSection("tutor");
  });

  card3.appendChild(button);
  container.append(card1, card2, card3);
}

function statCard(label, value) {
  const card = document.createElement("article");
  card.className = "stat-card";

  const number = document.createElement("div");
  number.className = "stat-value";
  number.textContent = value;

  const text = document.createElement("div");
  text.className = "stat-label";
  text.textContent = label;

  card.append(number, text);
  return card;
}

function detailCard(label, value) {
  const card = document.createElement("article");
  card.className = "stat-card";

  const title = document.createElement("h3");
  title.textContent = label;

  const p = document.createElement("p");
  p.className = "stat-label";
  p.textContent = value;

  card.append(title, p);
  return card;
}

function getProblemsForSkill(skill) {
  return problemBank.filter((problem) => problem.skill === skill);
}

function skillTitle(skill) {
  const found = modules.find((item) => item.id === skill);
  return found ? found.title : skill;
}

function getWeakestSkillKey() {
  let weakest = "two_step_equations";
  let weakestScore = Infinity;

  Object.entries(progress.skills).forEach(([skill, data]) => {
    if (data.attempts === 0) return;

    const score = data.correct / data.attempts;

    if (score < weakestScore) {
      weakestScore = score;
      weakest = skill;
    }
  });

  return weakest;
}

function getWeakestSkill() {
  if (progress.attempts === 0) return "No data yet";
  return skillTitle(getWeakestSkillKey());
}

function getStrongestSkill() {
  if (progress.attempts === 0) return "No data yet";

  let strongest = "two_step_equations";
  let strongestScore = -1;

  Object.entries(progress.skills).forEach(([skill, data]) => {
    if (data.attempts === 0) return;

    const score = data.correct / data.attempts;

    if (score > strongestScore) {
      strongestScore = score;
      strongest = skill;
    }
  });

  return skillTitle(strongest);
}

function getMostCommonMistakeKey() {
  let best = "random_or_unclear";
  let max = 0;

  Object.entries(progress.mistakes).forEach(([key, value]) => {
    if (value > max) {
      max = value;
      best = key;
    }
  });

  return best;
}

function getMostCommonMistake() {
  if (progress.attempts === 0) return "No data yet";

  const key = getMostCommonMistakeKey();
  return progress.mistakes[key] === 0 ? "No mistakes yet" : mistakeLabels[key];
}

function parseNumericAnswer(input) {
  let text = normalizeText(input);
  text = text.replace(/^x=/, "");

  if (text.includes("/")) {
    const parts = text.split("/");
    if (parts.length === 2) {
      const top = Number(parts[0]);
      const bottom = Number(parts[1]);
      if (Number.isFinite(top) && Number.isFinite(bottom) && bottom !== 0) {
        return top / bottom;
      }
    }
  }

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function parseLinearExpression(input) {
  let text = normalizeText(input);
  text = text.replace(/\s/g, "");
  text = text.replace(/−/g, "-");
  text = text.replace(/--/g, "+");

  if (!text) return null;

  if (!/^[0-9xX+\-.]+$/.test(text)) {
    return null;
  }

  text = text.replace(/X/g, "x");
  text = text.replace(/-/g, "+-");

  if (text.startsWith("+")) {
    text = text.slice(1);
  }

  const terms = text.split("+").filter(Boolean);
  let coef = 0;
  let constant = 0;

  for (const term of terms) {
    if (term.includes("x")) {
      const raw = term.replace("x", "");
      if (raw === "" || raw === "+") {
        coef += 1;
      } else if (raw === "-") {
        coef -= 1;
      } else {
        const value = Number(raw);
        if (!Number.isFinite(value)) return null;
        coef += value;
      }
    } else {
      const value = Number(term);
      if (!Number.isFinite(value)) return null;
      constant += value;
    }
  }

  return { coef, constant };
}

function normalizeText(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/−/g, "-");
}

function formatLinear(coef, constant) {
  let first;

  if (coef === 1) {
    first = "x";
  } else if (coef === -1) {
    first = "-x";
  } else {
    first = `${formatNumber(coef)}x`;
  }

  if (constant === 0) {
    return first;
  }

  const sign = constant > 0 ? "+" : "-";
  return `${first} ${sign} ${formatNumber(Math.abs(constant))}`;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

function nearlyEqual(a, b) {
  return Math.abs(a - b) < 0.000001;
}
