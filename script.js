/* Theorem: static mistake-first Algebra 1 tutor.
   Runs on GitHub Pages with no backend, no build step, and no external dependencies. */

const STORAGE_KEY = "theoremProgressV1";

const skillLabels = {
  two_step_equations: "Two-step equations",
  combining_like_terms: "Combining like terms",
  distributive_property: "Distributive property",
  variables_both_sides: "Variables on both sides",
  slope_basics: "Slope basics",
  word_problem_translation: "Word problem translation"
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

const mistakeBank = {
  skipped_inverse_operation: {
    why: "You started the solving path, but stopped before isolating the variable.",
    tinyFix: "Keep undoing operations until the variable is alone.",
    repairDrill: {
      prompt: "Solve: 3x + 4 = 19",
      correctAnswer: 5,
      answerType: "number",
      steps: ["3x + 4 = 19", "3x = 15", "x = 5"]
    }
  },
  wrong_operation: {
    why: "The operation attached to the variable was undone in the wrong direction.",
    tinyFix: "Use the inverse operation: addition undoes subtraction, and subtraction undoes addition.",
    repairDrill: {
      prompt: "Solve: 4x - 6 = 14",
      correctAnswer: 5,
      answerType: "number",
      steps: ["4x - 6 = 14", "4x = 20", "x = 5"]
    }
  },
  sign_error: {
    why: "The size is close, but the positive or negative sign changed along the way.",
    tinyFix: "Track the sign on every move, especially when subtracting or dividing by a negative.",
    repairDrill: {
      prompt: "Solve: -2x + 5 = 17",
      correctAnswer: -6,
      answerType: "number",
      steps: ["-2x + 5 = 17", "-2x = 12", "x = -6"]
    }
  },
  arithmetic_error: {
    why: "The method looks close, but one calculation does not match.",
    tinyFix: "Redo the small arithmetic step before changing the method.",
    repairDrill: {
      prompt: "Simplify: 4x + 3x + 2",
      correctAnswer: "7x + 2",
      answerType: "expression",
      steps: ["4x + 3x + 2", "(4x + 3x) + 2", "7x + 2"]
    }
  },
  combined_unlike_terms: {
    why: "x-terms and number terms are different kinds of terms.",
    tinyFix: "Combine x with x, and constants with constants.",
    repairDrill: {
      prompt: "Simplify: 2x + 5 + 3x",
      correctAnswer: "5x + 5",
      answerType: "expression",
      steps: ["2x + 5 + 3x", "2x + 3x + 5", "5x + 5"]
    }
  },
  distribution_error: {
    why: "The outside multiplier must reach every term inside the parentheses.",
    tinyFix: "Multiply the outside number by each inside term, one at a time.",
    repairDrill: {
      prompt: "Simplify: 2(x + 6)",
      correctAnswer: "2x + 12",
      answerType: "expression",
      steps: ["2(x + 6)", "2 · x + 2 · 6", "2x + 12"]
    }
  },
  variable_confusion: {
    why: "The variable part changed in a way that does not follow the expression.",
    tinyFix: "Keep the x attached only to terms that already have x, unless distribution creates a new x-term.",
    repairDrill: {
      prompt: "Simplify: 3(x + 2)",
      correctAnswer: "3x + 6",
      answerType: "expression",
      steps: ["3(x + 2)", "3 · x + 3 · 2", "3x + 6"]
    }
  },
  incomplete_solution: {
    why: "The answer is not in the final form the question asks for.",
    tinyFix: "Finish until you have one clear value or one simplified expression.",
    repairDrill: {
      prompt: "Solve: 2x + 8 = 18",
      correctAnswer: 5,
      answerType: "number",
      steps: ["2x + 8 = 18", "2x = 10", "x = 5"]
    }
  },
  random_or_unclear: {
    why: "Theorem could not read this as a number or a simple Algebra 1 expression.",
    tinyFix: "Use a format like 6, x = 6, 5x + 5, or 3x + 12.",
    repairDrill: {
      prompt: "Solve: 2x + 4 = 14",
      correctAnswer: 5,
      answerType: "number",
      steps: ["2x + 4 = 14", "2x = 10", "x = 5"]
    }
  }
};

function formatSignedNumber(n) {
  if (n < 0) return `- ${Math.abs(n)}`;
  return `+ ${n}`;
}

function formatCoeff(n) {
  if (n === 1) return "x";
  if (n === -1) return "-x";
  return `${n}x`;
}

function formatExpression(coeff, constant) {
  const variable = formatCoeff(coeff);
  if (constant === 0) return variable;
  return `${variable} ${formatSignedNumber(constant)}`;
}

function normalizeAnswer(input) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/−/g, "-")
    .replace(/\s+/g, "")
    .replace(/^answer[:=]/, "")
    .replace(/^x[:=]/, "");
}

function parseSubmittedNumber(input) {
  const normalized = normalizeAnswer(input);
  if (!normalized) return { ok: false, reason: "empty" };
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
    return { ok: false, reason: "not_number" };
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) return { ok: false, reason: "not_number" };
  return { ok: true, value, normalized };
}

function parseLinearExpression(input) {
  let text = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/−/g, "-")
    .replace(/\s+/g, "")
    .replace(/^answer[:=]/, "")
    .replace(/\*/g, "");

  if (!text) return { ok: false, reason: "empty" };
  if (/[()^/]|[a-wyz]/.test(text)) return { ok: false, reason: "unsupported" };

  if (!/^[+-]/.test(text)) text = `+${text}`;
  const terms = text.match(/[+-][^+-]+/g);
  if (!terms || terms.join("") !== text) return { ok: false, reason: "unsupported" };

  let coeff = 0;
  let constant = 0;

  for (const term of terms) {
    const sign = term[0] === "-" ? -1 : 1;
    const body = term.slice(1);
    if (!body) return { ok: false, reason: "unsupported" };

    if (body.includes("x")) {
      if ((body.match(/x/g) || []).length > 1 || !body.endsWith("x")) {
        return { ok: false, reason: "unsupported" };
      }
      const coefficientText = body.slice(0, -1);
      let coefficient = 1;
      if (coefficientText !== "") {
        if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(coefficientText)) {
          return { ok: false, reason: "unsupported" };
        }
        coefficient = Number(coefficientText);
      }
      coeff += sign * coefficient;
    } else {
      if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(body)) {
        return { ok: false, reason: "unsupported" };
      }
      constant += sign * Number(body);
    }
  }

  if (!Number.isFinite(coeff) || !Number.isFinite(constant)) {
    return { ok: false, reason: "unsupported" };
  }

  return {
    ok: true,
    coeff: roundSafe(coeff),
    constant: roundSafe(constant),
    normalized: formatExpression(roundSafe(coeff), roundSafe(constant))
  };
}

function roundSafe(value) {
  return Math.round((value + Number.EPSILON) * 1e10) / 1e10;
}

function nearlyEqual(a, b) {
  return Math.abs(Number(a) - Number(b)) < 1e-9;
}

function makeDrill(prompt, correctAnswer, answerType, steps) {
  return { prompt, correctAnswer, answerType, steps };
}

function makeMastery(id, prompt, correctAnswer, answerType, steps, explanation) {
  return {
    id,
    topic: "Algebra 1",
    skill: "mastery",
    prompt,
    questionText: prompt,
    equationDisplay: prompt.replace(/^Solve:\s*/i, "").replace(/^Simplify:\s*/i, ""),
    correctAnswer,
    answerType,
    steps,
    explanation,
    hints: [
      "Use the same repair move, not the same final answer.",
      "Work one operation or one term group at a time.",
      "Check the final form before submitting."
    ],
    commonMistakes: [],
    repairDrill: makeDrill(prompt, correctAnswer, answerType, steps),
    masteryProblem: null
  };
}

function makeTwoStep(id, a, b, c) {
  const answer = roundSafe((c - b) / a);
  const equation = `${formatCoeff(a)} ${formatSignedNumber(b)} = ${c}`;
  const middle = c - b;
  const wrongMiddle = c + b;
  const displayB = b >= 0 ? `+${b}` : `${b}`;

  const problem = {
    id,
    topic: "Algebra 1",
    skill: "two_step_equations",
    title: "Two-Step Equations",
    equationDisplay: equation,
    prompt: `Solve: ${equation}`,
    questionText: `Solve: ${equation}`,
    correctAnswer: answer,
    acceptedNormalizedAnswer: String(answer),
    answerType: "number",
    instruction: "Enter the value of x.",
    steps: [equation, `${formatCoeff(a)} = ${middle}`, `x = ${answer}`],
    explanation: `x = ${answer} works because substituting it back gives ${a}(${answer}) ${formatSignedNumber(b)} = ${c}.`,
    hints: [
      "Undo the operation farthest from x first.",
      b >= 0 ? `Start by subtracting ${b} from both sides.` : `Start by adding ${Math.abs(b)} to both sides.`,
      `After that move, you should have ${formatCoeff(a)} = ${middle}.`
    ],
    commonMistakes: [
      {
        values: [middle],
        type: "skipped_inverse_operation",
        title: "You stopped at the middle step.",
        why: `After the first move, you got ${formatCoeff(a)} = ${middle}. But x is still multiplied by ${a}.`,
        tinyFix: `Divide both sides by ${a} to isolate x.`
      },
      {
        values: [wrongMiddle, roundSafe(wrongMiddle / a)],
        type: "wrong_operation",
        title: "You used the wrong inverse operation.",
        why: `${displayB} is attached to the x-term, so it must be undone with the opposite operation.`,
        tinyFix: b >= 0 ? `Use -${b}, not +${b}.` : `Use +${Math.abs(b)}, not -${Math.abs(b)}.`
      },
      {
        values: [-answer],
        type: "sign_error",
        title: "The size is right, but the sign changed.",
        why: "The number matches the solution size, but the sign flipped.",
        tinyFix: "Check the sign on each inverse operation."
      },
      {
        values: [roundSafe(answer + 1), roundSafe(answer - 1)],
        type: "arithmetic_error",
        title: "Your solving path is close, but one calculation slipped.",
        why: "The structure of the answer is near the correct value.",
        tinyFix: "Redo the subtract/add step and the final division slowly."
      }
    ],
    repairDrill: makeDrill(
      `Solve: ${formatCoeff(a + 1)} ${formatSignedNumber(b + 1)} = ${(a + 1) * (answer + 1) + b + 1}`,
      answer + 1,
      "number",
      [
        `${formatCoeff(a + 1)} ${formatSignedNumber(b + 1)} = ${(a + 1) * (answer + 1) + b + 1}`,
        `${formatCoeff(a + 1)} = ${(a + 1) * (answer + 1)}`,
        `x = ${answer + 1}`
      ]
    ),
    masteryProblem: makeMastery(
      `${id}_mastery`,
      `Solve: ${formatCoeff(a + 2)} ${formatSignedNumber(b)} = ${(a + 2) * (answer + 2) + b}`,
      answer + 2,
      "number",
      [
        `${formatCoeff(a + 2)} ${formatSignedNumber(b)} = ${(a + 2) * (answer + 2) + b}`,
        `${formatCoeff(a + 2)} = ${(a + 2) * (answer + 2)}`,
        `x = ${answer + 2}`
      ],
      `The fresh solution is x = ${answer + 2} after undoing the constant and dividing.`
    )
  };

  if (id === "two_001") {
    problem.commonMistakes.unshift({
      values: [11],
      type: "arithmetic_error",
      title: "The first arithmetic step drifted.",
      why: "For 2x + 5 = 17, subtracting 5 from 17 gives 12, not 11. Then divide by 2.",
      tinyFix: "Redo one small calculation at a time: 17 - 5 = 12, then 12 ÷ 2 = 6."
    });
  }

  return problem;
}

function makeCombine(id, expression, correctCoeff, correctConstant, variants) {
  const correctAnswer = formatExpression(correctCoeff, correctConstant);
  return {
    id,
    topic: "Algebra 1",
    skill: "combining_like_terms",
    title: "Combining Like Terms",
    equationDisplay: expression,
    prompt: `Simplify: ${expression}`,
    questionText: `Simplify: ${expression}`,
    correctAnswer,
    acceptedNormalizedAnswer: correctAnswer,
    answerType: "expression",
    instruction: "Enter the simplified expression.",
    steps: [
      expression,
      "Group x-terms with x-terms and number terms with number terms.",
      correctAnswer
    ],
    explanation: `${correctAnswer} is simplified because all x-terms are combined and the constant term is kept separate.`,
    hints: [
      "Only like terms can combine.",
      "Terms with x combine with other x-terms. Plain numbers combine with plain numbers.",
      "Keep the constant term in your final expression."
    ],
    commonMistakes: [
      {
        expressions: variants.combinedUnlike || [],
        type: "combined_unlike_terms",
        title: "You combined unlike terms.",
        why: "A number term cannot turn into an x-term.",
        tinyFix: "Combine x-coefficients only, then carry the constant separately."
      },
      {
        expressions: variants.arithmetic || [],
        type: "arithmetic_error",
        title: "This looks like an arithmetic slip.",
        why: "You kept the right kinds of terms, but one coefficient or constant is off.",
        tinyFix: "Re-add the x-coefficients and constants separately."
      },
      {
        expressions: variants.missing || [],
        type: "incomplete_solution",
        title: "One term went missing.",
        why: "The simplified expression still needs the leftover constant or x-term.",
        tinyFix: "Bring down every term that does not combine away."
      }
    ],
    repairDrill: makeDrill(
      "Simplify: 2x + 5 + 3x",
      "5x + 5",
      "expression",
      ["2x + 5 + 3x", "2x + 3x + 5", "5x + 5"]
    ),
    masteryProblem: makeMastery(
      `${id}_mastery`,
      "Simplify: 4x + 6 + x",
      "5x + 6",
      "expression",
      ["4x + 6 + x", "4x + x + 6", "5x + 6"],
      "The x-terms combine to 5x, and 6 stays as the constant."
    )
  };
}

function makeDistribute(id, outside, insideCoeff, insideConstant) {
  const coeff = outside * insideCoeff;
  const constant = outside * insideConstant;
  const inside = `${formatCoeff(insideCoeff)} ${formatSignedNumber(insideConstant)}`;
  const expression = `${outside}(${inside})`;
  const correctAnswer = formatExpression(coeff, constant);
  const forgotSecond = formatExpression(coeff, insideConstant);
  const forgotVariable = formatExpression(insideCoeff, constant);
  const confusedProduct = `${outside * insideConstant}x`;

  return {
    id,
    topic: "Algebra 1",
    skill: "distributive_property",
    title: "Distributive Property",
    equationDisplay: expression,
    prompt: `Simplify: ${expression}`,
    questionText: `Simplify: ${expression}`,
    correctAnswer,
    acceptedNormalizedAnswer: correctAnswer,
    answerType: "expression",
    instruction: "Distribute and simplify.",
    steps: [
      expression,
      `${outside} · (${formatCoeff(insideCoeff)}) ${formatSignedNumber(outside)} · ${insideConstant}`,
      correctAnswer
    ],
    explanation: `${correctAnswer} is correct because ${outside} multiplies every term inside the parentheses.`,
    hints: [
      "The outside number must reach every term inside the parentheses.",
      `Multiply ${outside} by the x-term, then multiply ${outside} by the number term.`,
      `The x-term becomes ${formatCoeff(coeff)}. Now multiply the constant.`
    ],
    commonMistakes: [
      {
        expressions: [forgotSecond],
        type: "distribution_error",
        title: "You only distributed to one term.",
        why: "The outside multiplier must also multiply the second term.",
        tinyFix: `Multiply ${outside} by ${insideConstant}, too.`
      },
      {
        expressions: [forgotVariable],
        type: "distribution_error",
        title: "The constant was distributed, but the x-term was not.",
        why: "Every term inside the parentheses gets multiplied.",
        tinyFix: `Multiply ${outside} by the x-term as well.`
      },
      {
        expressions: [confusedProduct, `${outside + insideConstant}x`],
        type: "variable_confusion",
        title: "Multiplication was mixed up with combining terms.",
        why: "Distribution multiplies each inside term; it does not add the outside number to the inside term.",
        tinyFix: "Write two mini-products before simplifying."
      }
    ],
    repairDrill: makeDrill(
      "Simplify: 2(x + 6)",
      "2x + 12",
      "expression",
      ["2(x + 6)", "2 · x + 2 · 6", "2x + 12"]
    ),
    masteryProblem: makeMastery(
      `${id}_mastery`,
      "Simplify: 5(x + 2)",
      "5x + 10",
      "expression",
      ["5(x + 2)", "5 · x + 5 · 2", "5x + 10"],
      "The outside 5 multiplies both x and 2."
    )
  };
}

const problemBank = {
  two_step_equations: [
    makeTwoStep("two_001", 2, 5, 17),
    makeTwoStep("two_002", 3, -4, 11),
    makeTwoStep("two_003", 4, 7, 31),
    makeTwoStep("two_004", 5, -6, 19),
    makeTwoStep("two_005", 6, 3, 45),
    makeTwoStep("two_006", 7, -8, 27),
    makeTwoStep("two_007", 2, -9, 15),
    makeTwoStep("two_008", 8, 4, 52),
    makeTwoStep("two_009", 9, -5, 22),
    makeTwoStep("two_010", 3, 10, 28),
    makeTwoStep("two_011", 4, -11, 13),
    makeTwoStep("two_012", 5, 2, -18)
  ],
  combining_like_terms: [
    makeCombine("combine_001", "3x + 2x + 5", 5, 5, { combinedUnlike: ["10x"], arithmetic: ["6x + 5"], missing: ["5x"] }),
    makeCombine("combine_002", "4x + x + 7", 5, 7, { combinedUnlike: ["12x"], arithmetic: ["4x + 7", "6x + 7"], missing: ["5x"] }),
    makeCombine("combine_003", "6x - 2x + 9", 4, 9, { combinedUnlike: ["13x"], arithmetic: ["8x + 9"], missing: ["4x"] }),
    makeCombine("combine_004", "-2x + 5x + 3", 3, 3, { combinedUnlike: ["6x"], arithmetic: ["7x + 3"], missing: ["3x"] }),
    makeCombine("combine_005", "8 + 2x + 3x", 5, 8, { combinedUnlike: ["13x"], arithmetic: ["6x + 8"], missing: ["5x"] }),
    makeCombine("combine_006", "7x + 4 - 2x", 5, 4, { combinedUnlike: ["9x"], arithmetic: ["9x + 4"], missing: ["5x"] }),
    makeCombine("combine_007", "x + 9 + 6x", 7, 9, { combinedUnlike: ["16x"], arithmetic: ["6x + 9"], missing: ["7x"] }),
    makeCombine("combine_008", "10x - 3x - 2", 7, -2, { combinedUnlike: ["5x"], arithmetic: ["13x - 2"], missing: ["7x"] }),
    makeCombine("combine_009", "-x + 4x + 6", 3, 6, { combinedUnlike: ["9x"], arithmetic: ["5x + 6"], missing: ["3x"] }),
    makeCombine("combine_010", "5 + 2x + 2 + 3x", 5, 7, { combinedUnlike: ["12x"], arithmetic: ["5x + 5"], missing: ["5x"] })
  ],
  distributive_property: [
    makeDistribute("dist_001", 3, 1, 4),
    makeDistribute("dist_002", 2, 1, 5),
    makeDistribute("dist_003", 4, 1, -2),
    makeDistribute("dist_004", 5, 1, 3),
    makeDistribute("dist_005", -2, 1, 6),
    makeDistribute("dist_006", 6, 1, -1),
    makeDistribute("dist_007", 3, 2, 5),
    makeDistribute("dist_008", 2, 3, -4),
    makeDistribute("dist_009", -3, 1, -2),
    makeDistribute("dist_010", 4, 2, 1)
  ]
};

const functionalSkills = ["two_step_equations", "combining_like_terms", "distributive_property"];
const comingSoonSkills = ["variables_both_sides", "slope_basics", "word_problem_translation"];

let memoryProgress = null;

function defaultProgress() {
  return {
    attempts: 0,
    correct: 0,
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
    masteredSkills: {},
    weakSkills: [],
    recentAttempts: [],
    currentStreak: 0,
    selectedSkill: "two_step_equations",
    cursors: {
      two_step_equations: 0,
      combining_like_terms: 0,
      distributive_property: 0
    }
  };
}

let userProgress = loadProgress();

const appState = {
  currentSection: "landing",
  selectedSkill: userProgress.selectedSkill || "two_step_equations",
  currentProblem: null,
  hintIndex: 0,
  attemptedCurrent: false,
  currentResult: null,
  recordedSubmissionKeys: new Set()
};

const dom = {};

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  cacheDom();
  renderSkillList();
  renderPracticeModules();
  wireEvents();
  setSkill(appState.selectedSkill, { renderOnly: true });
  const firstProblem = generateProblem(appState.selectedSkill, { doNotAdvance: true });
  renderProblem(firstProblem);
  renderProgressDashboard();
  renderReviewDashboard();
}

function cacheDom() {
  dom.sections = Array.from(document.querySelectorAll(".app-section"));
  dom.navButtons = Array.from(document.querySelectorAll("[data-target]"));
  dom.navLinks = Array.from(document.querySelectorAll(".nav-link"));
  dom.navToggle = document.querySelector(".nav-toggle");
  dom.mainNav = document.getElementById("mainNav");
  dom.skillList = document.getElementById("skillList");
  dom.practiceModules = document.getElementById("practiceModules");
  dom.problemTitle = document.getElementById("problemTitle");
  dom.currentTopic = document.getElementById("currentTopic");
  dom.problemCount = document.getElementById("problemCount");
  dom.problemDisplay = document.getElementById("problemDisplay");
  dom.problemInstruction = document.getElementById("problemInstruction");
  dom.answerForm = document.getElementById("answerForm");
  dom.answerInput = document.getElementById("answerInput");
  dom.submitAnswer = document.getElementById("submitAnswer");
  dom.hintButton = document.getElementById("hintButton");
  dom.hintText = document.getElementById("hintText");
  dom.feedbackPanel = document.getElementById("feedbackPanel");
  dom.progressDashboard = document.getElementById("progressDashboard");
  dom.reviewDashboard = document.getElementById("reviewDashboard");
}

function wireEvents() {
  dom.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.target;
      if (target) showSection(target);
    });
  });

  dom.navToggle.addEventListener("click", () => {
    const isOpen = dom.mainNav.classList.toggle("open");
    dom.navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  dom.answerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmitAnswer();
  });

  dom.hintButton.addEventListener("click", showNextHint);
}

function showSection(sectionId) {
  appState.currentSection = sectionId;
  dom.sections.forEach((section) => section.classList.toggle("visible", section.id === sectionId));
  dom.navLinks.forEach((link) => link.classList.toggle("active", link.dataset.target === sectionId));

  if (dom.mainNav.classList.contains("open")) {
    dom.mainNav.classList.remove("open");
    dom.navToggle.setAttribute("aria-expanded", "false");
  }

  if (sectionId === "progress") renderProgressDashboard();
  if (sectionId === "review") renderReviewDashboard();

  const section = document.getElementById(sectionId);
  if (section) section.scrollIntoView({ block: "start" });
}

function renderSkillList() {
  clearNode(dom.skillList);

  functionalSkills.forEach((skill) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "skill-button";
    button.dataset.skill = skill;

    const title = document.createElement("strong");
    title.textContent = skillLabels[skill];

    const meta = document.createElement("span");
    meta.textContent = `${problemBank[skill].length} diagnostic problems`;

    button.append(title, meta);
    button.addEventListener("click", () => {
      setSkill(skill);
      showSection("tutor");
    });

    dom.skillList.appendChild(button);
  });

  comingSoonSkills.forEach((skill) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "skill-button";
    button.disabled = true;

    const title = document.createElement("strong");
    title.textContent = skillLabels[skill];

    const meta = document.createElement("span");
    meta.textContent = "Coming soon";

    button.append(title, meta);
    dom.skillList.appendChild(button);
  });
}

function renderPracticeModules() {
  clearNode(dom.practiceModules);

  const moduleCopy = {
    two_step_equations: {
      description: "Solve equations like 2x + 5 = 17 by undoing operations in order.",
      tag: "Diagnostic ready"
    },
    combining_like_terms: {
      description: "Simplify expressions by grouping x-terms and constants correctly.",
      tag: "Functional"
    },
    distributive_property: {
      description: "Distribute a multiplier to every term inside parentheses.",
      tag: "Functional"
    },
    variables_both_sides: {
      description: "Solve equations with x on both sides.",
      tag: "Coming soon"
    },
    slope_basics: {
      description: "Understand rise, run, slope, and line direction.",
      tag: "Coming soon"
    },
    word_problem_translation: {
      description: "Turn short word problems into algebra expressions.",
      tag: "Coming soon"
    }
  };

  [...functionalSkills, ...comingSoonSkills].forEach((skill) => {
    const card = document.createElement("article");
    card.className = `module-card ${functionalSkills.includes(skill) ? "functional" : "coming-soon"}`;

    const top = document.createElement("div");

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = moduleCopy[skill].tag;

    const title = document.createElement("h3");
    title.textContent = skillLabels[skill];

    const description = document.createElement("p");
    description.textContent = moduleCopy[skill].description;

    top.append(badge, title, description);

    const meta = document.createElement("div");
    meta.className = "module-meta";
    const count = document.createElement("span");
    count.className = "badge";
    count.textContent = functionalSkills.includes(skill) ? `${problemBank[skill].length} problems` : "Visible roadmap";
    meta.appendChild(count);

    const action = document.createElement("button");
    action.type = "button";
    action.className = functionalSkills.includes(skill) ? "btn btn-primary" : "btn btn-ghost";
    action.textContent = functionalSkills.includes(skill) ? "Start practice" : "Coming soon";
    action.disabled = !functionalSkills.includes(skill);
    action.addEventListener("click", () => {
      setSkill(skill);
      showSection("tutor");
    });

    card.append(top, meta, action);
    dom.practiceModules.appendChild(card);
  });
}

function setSkill(skill, options = {}) {
  if (!functionalSkills.includes(skill)) return;

  appState.selectedSkill = skill;
  userProgress.selectedSkill = skill;
  saveProgressObject();

  Array.from(document.querySelectorAll(".skill-button")).forEach((button) => {
    button.classList.toggle("active", button.dataset.skill === skill);
  });

  if (!options.renderOnly) {
    const problem = generateProblem(skill);
    renderProblem(problem);
  }
}

function generateProblem(topic, options = {}) {
  const bank = problemBank[topic] || problemBank.two_step_equations;
  const cursor = userProgress.cursors?.[topic] || 0;
  const problem = bank[cursor % bank.length];

  if (!options.doNotAdvance) {
    userProgress.cursors[topic] = (cursor + 1) % bank.length;
    userProgress.selectedSkill = topic;
    saveProgressObject();
  }

  return problem;
}

function renderProblem(problem) {
  appState.currentProblem = problem;
  appState.hintIndex = 0;
  appState.attemptedCurrent = false;
  appState.currentResult = null;

  dom.problemTitle.textContent = problem.title || skillLabels[problem.skill] || "Practice";
  dom.currentTopic.textContent = problem.topic || "Algebra 1";
  dom.problemDisplay.textContent = problem.equationDisplay || problem.prompt;
  dom.problemInstruction.textContent = problem.instruction || "Enter your answer.";
  dom.problemCount.textContent = problem.id ? problem.id.replace(/_/g, " #") : "Problem";

  dom.answerInput.value = "";
  dom.answerInput.disabled = false;
  dom.submitAnswer.disabled = false;
  dom.hintButton.disabled = false;
  dom.hintButton.textContent = "Show hint";
  dom.hintText.textContent = "";
  hideFeedback();

  window.setTimeout(() => dom.answerInput.focus({ preventScroll: true }), 0);
}

function handleSubmitAnswer() {
  const problem = appState.currentProblem;
  if (!problem) return;

  const result = checkAnswer(problem, dom.answerInput.value);
  const key = `${problem.id}|${normalizeAnswer(dom.answerInput.value)}|${result.correct ? "correct" : result.mistakeType}`;

  if (!appState.recordedSubmissionKeys.has(key)) {
    saveProgress(result);
    appState.recordedSubmissionKeys.add(key);
  }

  appState.attemptedCurrent = true;
  appState.currentResult = result;
  showFeedback(result);

  if (result.correct) {
    dom.answerInput.disabled = true;
    dom.submitAnswer.disabled = true;
  }
}

function checkAnswer(problem, input) {
  const answerType = problem.answerType || "number";
  let isCorrect = false;
  let parsed = null;

  if (answerType === "number") {
    parsed = parseSubmittedNumber(input);
    isCorrect = parsed.ok && nearlyEqual(parsed.value, problem.correctAnswer);
  } else {
    parsed = parseLinearExpression(input);
    const expected = parseLinearExpression(problem.correctAnswer);
    isCorrect = parsed.ok && expected.ok &&
      nearlyEqual(parsed.coeff, expected.coeff) &&
      nearlyEqual(parsed.constant, expected.constant);
  }

  if (isCorrect) {
    return {
      correct: true,
      problem,
      normalized: answerType === "number" ? parsed.normalized : parsed.normalized,
      mistakeType: null,
      title: "Correct.",
      message: problem.explanation || "That answer works."
    };
  }

  const diagnosis = diagnoseMistake(problem, input, parsed);
  return {
    correct: false,
    problem,
    normalized: normalizeAnswer(input),
    mistakeType: diagnosis.type,
    title: "Not quite — here’s the likely break.",
    diagnosis
  };
}

function diagnoseMistake(problem, input, parsedValue = null) {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return {
      type: "incomplete_solution",
      title: "Enter an answer to check.",
      why: problem.answerType === "number" ? "Theorem needs a number for x, like 6 or x = 6." : "Theorem needs a simplified expression, like 5x + 5.",
      tinyFix: problem.answerType === "number" ? "Enter a number for x." : "Enter a simplified expression."
    };
  }

  const parsed = parsedValue || (problem.answerType === "number" ? parseSubmittedNumber(input) : parseLinearExpression(input));

  if (!parsed.ok) {
    return {
      type: "random_or_unclear",
      title: "The input was unclear.",
      why: problem.answerType === "number" ? "Enter a number for x, like 6 or x = 6." : "Enter a simple expression, like 5x + 5.",
      tinyFix: "Use only numbers, x, plus signs, minus signs, and equals when needed."
    };
  }

  const matched = matchCommonMistake(problem, parsed);
  if (matched) return matched;

  if (problem.answerType === "number") {
    if (nearlyEqual(parsed.value, -problem.correctAnswer)) {
      return {
        type: "sign_error",
        title: "The sign changed.",
        why: "The size of the number is right, but the positive/negative direction flipped.",
        tinyFix: "Check where a negative entered the steps."
      };
    }

    if (Math.abs(parsed.value - problem.correctAnswer) <= 2) {
      return {
        type: "arithmetic_error",
        title: "This looks close.",
        why: "Your answer is near the target, so the strategy may be right but a calculation slipped.",
        tinyFix: "Redo the arithmetic in the middle step."
      };
    }

    return {
      type: "wrong_operation",
      title: "The inverse operation may be off.",
      why: "The answer is a readable number, but it does not satisfy the equation.",
      tinyFix: "Undo addition or subtraction first, then undo multiplication or division."
    };
  }

  const expected = parseLinearExpression(problem.correctAnswer);

  if (parsed.ok && expected.ok) {
    if (nearlyEqual(parsed.coeff, expected.coeff) && !nearlyEqual(parsed.constant, expected.constant)) {
      return {
        type: problem.skill === "distributive_property" ? "distribution_error" : "arithmetic_error",
        title: "The x-term is right, but the constant is not.",
        why: "That means the variable part was handled, but the number term needs another look.",
        tinyFix: problem.skill === "distributive_property"
          ? "Multiply the outside number by the constant inside the parentheses."
          : "Combine the plain numbers separately."
      };
    }

    if (!nearlyEqual(parsed.coeff, expected.coeff) && nearlyEqual(parsed.constant, expected.constant)) {
      return {
        type: problem.skill === "combining_like_terms" ? "arithmetic_error" : "distribution_error",
        title: "The constant is right, but the x-term is not.",
        why: "The number term survived correctly, but the coefficient of x changed incorrectly.",
        tinyFix: "Recalculate the coefficient attached to x."
      };
    }

    if (nearlyEqual(parsed.constant, 0) && !nearlyEqual(expected.constant, 0)) {
      return {
        type: "incomplete_solution",
        title: "A constant term is missing.",
        why: "The expression still needs its plain number term.",
        tinyFix: "Carry down the constant or distribute to it."
      };
    }
  }

  return {
    type: problem.skill === "distributive_property" ? "distribution_error" : "combined_unlike_terms",
    title: "The expression needs a cleaner structure.",
    why: "The answer is readable, but at least one term was transformed incorrectly.",
    tinyFix: problem.skill === "distributive_property"
      ? "Write each multiplication separately before simplifying."
      : "Group like terms first, then combine."
  };
}

function matchCommonMistake(problem, parsed) {
  for (const mistake of problem.commonMistakes || []) {
    if (mistake.values && parsed.ok && typeof parsed.value === "number") {
      if (mistake.values.some((value) => nearlyEqual(parsed.value, value))) {
        return {
          type: mistake.type,
          title: mistake.title,
          why: mistake.why,
          tinyFix: mistake.tinyFix
        };
      }
    }

    if (mistake.expressions && parsed.ok) {
      const matches = mistake.expressions.some((expression) => {
        const expected = parseLinearExpression(expression);
        return expected.ok &&
          nearlyEqual(parsed.coeff, expected.coeff) &&
          nearlyEqual(parsed.constant, expected.constant);
      });

      if (matches) {
        return {
          type: mistake.type,
          title: mistake.title,
          why: mistake.why,
          tinyFix: mistake.tinyFix
        };
      }
    }
  }

  return null;
}

function showNextHint() {
  const problem = appState.currentProblem;
  if (!problem || !Array.isArray(problem.hints)) return;

  const hints = problem.hints;
  const hint = hints[Math.min(appState.hintIndex, hints.length - 1)];
  dom.hintText.textContent = hint;

  if (appState.hintIndex < hints.length - 1) {
    appState.hintIndex += 1;
    dom.hintButton.textContent = `Show hint ${appState.hintIndex + 1}`;
  } else {
    dom.hintButton.disabled = true;
    dom.hintButton.textContent = "No more hints";
  }
}

function showFeedback(result) {
  clearNode(dom.feedbackPanel);
  dom.feedbackPanel.className = "feedback-panel";
  dom.feedbackPanel.classList.add(result.correct ? "correct" : result.mistakeType === "random_or_unclear" ? "unclear" : "repair");

  const header = document.createElement("div");
  header.className = "feedback-title-row";

  const titleWrap = document.createElement("div");
  const kicker = document.createElement("p");
  kicker.className = "feedback-kicker";
  kicker.textContent = result.correct ? "Check complete" : "Mistake pattern";

  const title = document.createElement("h3");
  title.textContent = result.correct ? "Correct." : "Not quite — here’s the likely break.";

  const body = document.createElement("p");
  body.textContent = result.correct ? result.message : (result.diagnosis.title || mistakeLabels[result.mistakeType]);

  titleWrap.append(kicker, title, body);
  header.appendChild(titleWrap);
  dom.feedbackPanel.appendChild(header);

  if (result.correct) {
    const steps = makeStepsList(result.problem.steps || []);
    dom.feedbackPanel.appendChild(steps);

    const actions = document.createElement("div");
    actions.className = "feedback-actions";

    const next = document.createElement("button");
    next.className = "btn btn-primary";
    next.type = "button";
    next.textContent = "Next challenge";
    next.addEventListener("click", () => {
      const nextProblem = generateProblem(appState.selectedSkill);
      renderProblem(nextProblem);
    });

    const review = document.createElement("button");
    review.className = "btn btn-ghost";
    review.type = "button";
    review.textContent = "View progress";
    review.addEventListener("click", () => showSection("progress"));

    actions.append(next, review);
    dom.feedbackPanel.appendChild(actions);
  } else {
    const explainGrid = document.createElement("div");
    explainGrid.className = "explain-grid";

    explainGrid.append(
      makeExplainCard("Likely mistake", result.diagnosis.title || mistakeLabels[result.mistakeType]),
      makeExplainCard("Why", result.diagnosis.why),
      makeExplainCard("Tiny fix", result.diagnosis.tinyFix)
    );

    dom.feedbackPanel.appendChild(explainGrid);

    const stepsTitle = document.createElement("p");
    stepsTitle.className = "feedback-kicker";
    stepsTitle.textContent = "Correct steps";
    dom.feedbackPanel.append(stepsTitle, makeStepsList(result.problem.steps || []));

    const actions = document.createElement("div");
    actions.className = "feedback-actions";

    const repair = document.createElement("button");
    repair.className = "btn btn-secondary";
    repair.type = "button";
    repair.textContent = "Start repair drill";
    repair.addEventListener("click", () => showRepairDrill(result.mistakeType));

    const tryAgain = document.createElement("button");
    tryAgain.className = "btn btn-ghost";
    tryAgain.type = "button";
    tryAgain.textContent = "Try this problem again";
    tryAgain.addEventListener("click", () => {
      dom.answerInput.disabled = false;
      dom.submitAnswer.disabled = false;
      dom.answerInput.value = "";
      dom.answerInput.focus();
    });

    actions.append(repair, tryAgain);
    dom.feedbackPanel.appendChild(actions);
  }

  dom.feedbackPanel.classList.remove("hidden");
}

function showRepairDrill(mistakeType) {
  const drill = appState.currentProblem?.repairDrill || mistakeBank[mistakeType]?.repairDrill;
  if (!drill) return;

  const existing = dom.feedbackPanel.querySelector(".drill-card");
  if (existing) existing.remove();

  const card = document.createElement("section");
  card.className = "drill-card";
  card.setAttribute("aria-label", "Repair drill");

  const title = document.createElement("h3");
  title.textContent = "Tiny repair drill";

  const copy = document.createElement("p");
  copy.textContent = drill.prompt;

  const form = document.createElement("form");
  form.noValidate = true;

  const label = document.createElement("label");
  label.className = "sr-only";
  label.textContent = "Repair drill answer";

  const input = document.createElement("input");
  input.autocomplete = "off";
  input.placeholder = drill.answerType === "number" ? "Example: 5" : "Example: 5x + 5";

  const button = document.createElement("button");
  button.className = "btn btn-primary";
  button.type = "submit";
  button.textContent = "Check drill";

  const resultText = document.createElement("p");
  resultText.className = "hint-text";
  resultText.setAttribute("aria-live", "polite");

  form.append(label, input, button);
  card.append(title, copy, form, resultText);
  dom.feedbackPanel.appendChild(card);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const miniProblem = {
      id: `${appState.currentProblem.id}_repair`,
      skill: appState.currentProblem.skill,
      answerType: drill.answerType,
      correctAnswer: drill.correctAnswer,
      commonMistakes: [],
      steps: drill.steps || [],
      explanation: "Repair drill checked."
    };

    const result = checkAnswer(miniProblem, input.value);

    if (result.correct) {
      resultText.textContent = "Repair locked in. Now prove it with a fresh problem.";
      input.disabled = true;
      button.disabled = true;

      const masteryButton = document.createElement("button");
      masteryButton.type = "button";
      masteryButton.className = "btn btn-secondary";
      masteryButton.textContent = "Prove mastery";
      masteryButton.addEventListener("click", () => showMasteryProblem(appState.currentProblem.skill));

      if (!card.querySelector(".btn-secondary")) card.appendChild(masteryButton);
    } else {
      resultText.textContent = mistakeBank[result.mistakeType]?.tinyFix || "Try the smallest next step again.";
    }
  });

  input.focus();
}

function showMasteryProblem(skill) {
  const mastery = appState.currentProblem?.masteryProblem || generateProblem(skill);
  const masteryProblem = {
    ...mastery,
    id: mastery.id || `${skill}_mastery_${Date.now()}`,
    skill,
    title: `Mastery: ${skillLabels[skill]}`,
    topic: "Fresh proof",
    commonMistakes: mastery.commonMistakes || [],
    repairDrill: mastery.repairDrill || null,
    masteryProblem: null
  };

  renderProblem(masteryProblem);
  appState.selectedSkill = skill;

  const note = document.createElement("p");
  note.className = "hint-text";
  note.textContent = "Fresh proof loaded. Solve this without using the previous final answer.";
  dom.hintText.textContent = note.textContent;
}

function makeExplainCard(label, text) {
  const card = document.createElement("div");
  card.className = "explain-card";

  const strong = document.createElement("strong");
  strong.textContent = label;

  const p = document.createElement("p");
  p.textContent = text || "Theorem is not fully sure, but this is the closest pattern.";

  card.append(strong, p);
  return card;
}

function makeStepsList(steps) {
  const list = document.createElement("ol");
  list.className = "steps-list";
  steps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    list.appendChild(item);
  });
  return list;
}

function hideFeedback() {
  clearNode(dom.feedbackPanel);
  dom.feedbackPanel.className = "feedback-panel hidden";
}

function saveProgress(result) {
  if (!result || !result.problem) return;

  const progress = userProgress;
  const skill = functionalSkills.includes(result.problem.skill) ? result.problem.skill : appState.selectedSkill;
  const record = {
    id: result.problem.id,
    skill,
    correct: Boolean(result.correct),
    mistakeType: result.correct ? null : result.mistakeType,
    at: new Date().toISOString()
  };

  const last = progress.recentAttempts[0];
  if (last && last.id === record.id && last.correct === record.correct && last.mistakeType === record.mistakeType) {
    return;
  }

  progress.attempts += 1;
  progress.skills[skill] ||= { attempts: 0, correct: 0 };
  progress.skills[skill].attempts += 1;

  if (result.correct) {
    progress.correct += 1;
    progress.skills[skill].correct += 1;
    progress.currentStreak += 1;
  } else {
    progress.currentStreak = 0;
    if (progress.mistakes[result.mistakeType] !== undefined) {
      progress.mistakes[result.mistakeType] += 1;
    } else {
      progress.mistakes.random_or_unclear += 1;
    }
  }

  progress.recentAttempts.unshift(record);
  progress.recentAttempts = progress.recentAttempts.slice(0, 12);

  updateDerivedProgress(progress);
  saveProgressObject();
}

function updateDerivedProgress(progress) {
  const weak = [];

  Object.entries(progress.skills).forEach(([skill, stats]) => {
    if (stats.attempts >= 2) {
      const accuracy = stats.correct / stats.attempts;
      if (accuracy >= 0.75 && stats.correct >= 2) {
        progress.masteredSkills[skill] = true;
      }
      if (accuracy < 0.7) {
        weak.push(skill);
      }
    }
  });

  const mistakeWeak = topMistakes(progress, 2)
    .map((entry) => inferSkillFromMistake(entry[0]))
    .filter(Boolean);

  progress.weakSkills = Array.from(new Set([...weak, ...mistakeWeak])).slice(0, 3);
}

function inferSkillFromMistake(type) {
  if (["skipped_inverse_operation", "wrong_operation", "sign_error"].includes(type)) return "two_step_equations";
  if (["combined_unlike_terms", "arithmetic_error"].includes(type)) return "combining_like_terms";
  if (["distribution_error", "variable_confusion"].includes(type)) return "distributive_property";
  return null;
}

function loadProgress() {
  const fallback = defaultProgress();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      memoryProgress = fallback;
      return fallback;
    }

    const parsed = JSON.parse(stored);
    const merged = deepMerge(fallback, parsed);
    memoryProgress = merged;
    return merged;
  } catch {
    memoryProgress = fallback;
    return fallback;
  }
}

function saveProgressObject() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
  } catch {
    memoryProgress = userProgress;
  }
}

function resetProgress() {
  const confirmed = window.confirm("Reset Theorem progress in this browser?");
  if (!confirmed) return;

  userProgress = defaultProgress();
  memoryProgress = userProgress;
  appState.selectedSkill = "two_step_equations";
  appState.recordedSubmissionKeys.clear();

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
  } catch {
    memoryProgress = userProgress;
  }

  setSkill("two_step_equations");
  renderProgressDashboard();
  renderReviewDashboard();
}

function deepMerge(base, saved) {
  const output = structuredCloneSafe(base);

  Object.keys(saved || {}).forEach((key) => {
    if (saved[key] && typeof saved[key] === "object" && !Array.isArray(saved[key]) && output[key] && typeof output[key] === "object") {
      output[key] = deepMerge(output[key], saved[key]);
    } else {
      output[key] = saved[key];
    }
  });

  return output;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function renderProgressDashboard() {
  clearNode(dom.progressDashboard);
  updateDerivedProgress(userProgress);

  const accuracy = userProgress.attempts ? Math.round((userProgress.correct / userProgress.attempts) * 100) : 0;
  const strongest = getStrongestSkill(userProgress);
  const weakest = getWeakestSkill(userProgress);
  const commonMistake = topMistakes(userProgress, 1)[0];
  const recommendation = userProgress.weakSkills[0] || weakest?.skill || appState.selectedSkill;

  const hero = document.createElement("div");
  hero.className = "dashboard-hero";

  const big = document.createElement("section");
  big.className = "big-stat";
  big.innerHTML = `
    <span class="stat-number">${accuracy}%</span>
    <span class="stat-label">Accuracy across ${userProgress.attempts} attempt${userProgress.attempts === 1 ? "" : "s"}</span>
  `;

  const summary = document.createElement("section");
  summary.className = "metric-card";
  summary.append(
    makeMetricLine("Current streak", `${userProgress.currentStreak}`),
    makeMetricLine("Strongest skill", strongest ? skillLabels[strongest.skill] : "No data yet"),
    makeMetricLine("Weakest skill", weakest ? skillLabels[weakest.skill] : "No data yet"),
    makeMetricLine("Most common mistake", commonMistake ? mistakeLabels[commonMistake[0]] : "No mistakes tracked yet"),
    makeMetricLine("Recommended next practice", skillLabels[recommendation] || "Start diagnostic")
  );

  hero.append(big, summary);

  const metrics = document.createElement("div");
  metrics.className = "metric-grid";
  metrics.append(
    makeStatCard("Questions attempted", userProgress.attempts),
    makeStatCard("Correct answers", userProgress.correct),
    makeStatCard("Mastered skills", Object.keys(userProgress.masteredSkills || {}).length)
  );

  const bars = document.createElement("section");
  bars.className = "metric-card";
  const barsTitle = document.createElement("h3");
  barsTitle.textContent = "Mistake pattern map";
  const barsWrap = document.createElement("div");
  barsWrap.className = "mistake-bars";

  const entries = topMistakes(userProgress, 9);
  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No mistake patterns yet. Complete a diagnostic to build your map.";
    barsWrap.appendChild(empty);
  } else {
    const max = Math.max(...entries.map((entry) => entry[1]), 1);
    entries.forEach(([type, count]) => {
      const row = document.createElement("div");
      row.className = "bar-row";

      const label = document.createElement("div");
      label.className = "bar-label";

      const name = document.createElement("span");
      name.textContent = mistakeLabels[type];

      const value = document.createElement("span");
      value.textContent = String(count);

      const track = document.createElement("div");
      track.className = "bar-track";

      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.setProperty("--bar-width", `${Math.round((count / max) * 100)}%`);

      label.append(name, value);
      track.appendChild(fill);
      row.append(label, track);
      barsWrap.appendChild(row);
    });
  }

  bars.append(barsTitle, barsWrap);

  const recent = document.createElement("section");
  recent.className = "metric-card";
  const recentTitle = document.createElement("h3");
  recentTitle.textContent = "Recent attempts";
  const list = document.createElement("ul");
  list.className = "recent-list";

  if (userProgress.recentAttempts.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No recent attempts yet.";
    list.appendChild(emptyItem);
  } else {
    userProgress.recentAttempts.forEach((attempt) => {
      const item = document.createElement("li");

      const left = document.createElement("span");
      left.textContent = skillLabels[attempt.skill] || "Practice";

      const right = document.createElement("strong");
      right.textContent = attempt.correct ? "Correct" : mistakeLabels[attempt.mistakeType] || "Needs review";

      item.append(left, right);
      list.appendChild(item);
    });
  }

  recent.append(recentTitle, list);

  const actions = document.createElement("div");
  actions.className = "feedback-actions";

  const practice = document.createElement("button");
  practice.className = "btn btn-primary";
  practice.type = "button";
  practice.textContent = "Practice recommendation";
  practice.addEventListener("click", () => {
    setSkill(recommendation);
    showSection("tutor");
  });

  const reset = document.createElement("button");
  reset.className = "btn btn-ghost";
  reset.type = "button";
  reset.textContent = "Reset progress";
  reset.addEventListener("click", resetProgress);

  actions.append(practice, reset);

  dom.progressDashboard.append(hero, metrics, bars, recent, actions);
}

function makeMetricLine(label, value) {
  const wrap = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  wrap.append(strong, span);
  return wrap;
}

function makeStatCard(label, value) {
  const card = document.createElement("section");
  card.className = "metric-card";
  const strong = document.createElement("strong");
  strong.textContent = String(value);
  const p = document.createElement("p");
  p.textContent = label;
  card.append(strong, p);
  return card;
}

function renderReviewDashboard() {
  clearNode(dom.reviewDashboard);
  updateDerivedProgress(userProgress);

  if (userProgress.attempts === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state review-card full";
    empty.textContent = "Complete a diagnostic first.";
    dom.reviewDashboard.appendChild(empty);
    return;
  }

  const mistakes = topMistakes(userProgress, 3);
  const skills = userProgress.weakSkills.length ? userProgress.weakSkills : [getWeakestSkill(userProgress)?.skill || appState.selectedSkill];

  const overview = document.createElement("section");
  overview.className = "review-card full";
  const title = document.createElement("h3");
  title.textContent = "Review focus";
  const body = document.createElement("p");
  body.textContent = mistakes.length
    ? `Theorem will review ${mistakes.map(([type]) => mistakeLabels[type]).join(", ")}.`
    : "No missed mistake types yet, so Theorem recommends a fresh diagnostic challenge.";
  overview.append(title, body);
  dom.reviewDashboard.appendChild(overview);

  skills.slice(0, 3).forEach((skill) => {
    const problem = generateProblem(skill, { doNotAdvance: true });
    const card = document.createElement("article");
    card.className = "review-card";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = skillLabels[skill];

    const h3 = document.createElement("h3");
    h3.textContent = "Fresh review question";

    const prompt = document.createElement("p");
    prompt.textContent = problem.prompt;

    const action = document.createElement("button");
    action.className = "btn btn-primary";
    action.type = "button";
    action.textContent = "Try this review";
    action.addEventListener("click", () => {
      setSkill(skill, { renderOnly: true });
      renderProblem(problem);
      showSection("tutor");
    });

    card.append(badge, h3, prompt, action);
    dom.reviewDashboard.appendChild(card);
  });
}

function getStrongestSkill(progress) {
  return Object.entries(progress.skills)
    .filter(([, stats]) => stats.attempts > 0)
    .map(([skill, stats]) => ({ skill, accuracy: stats.correct / stats.attempts, attempts: stats.attempts }))
    .sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts)[0] || null;
}

function getWeakestSkill(progress) {
  return Object.entries(progress.skills)
    .filter(([, stats]) => stats.attempts > 0)
    .map(([skill, stats]) => ({ skill, accuracy: stats.correct / stats.attempts, attempts: stats.attempts }))
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)[0] || null;
}

function topMistakes(progress, limit) {
  return Object.entries(progress.mistakes || {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function clearNode(node) {
  while (node && node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

:root {
  color-scheme: dark;
  --bg: #07111f;
  --bg-2: #0b1728;
  --panel: rgba(13, 27, 46, 0.78);
  --panel-strong: rgba(16, 31, 52, 0.96);
  --panel-soft: rgba(255, 255, 255, 0.055);
  --line: rgba(174, 205, 255, 0.16);
  --line-strong: rgba(151, 205, 255, 0.32);
  --text: #f5f9ff;
  --muted: #a9b9cd;
  --muted-2: #7f91a8;
  --accent: #50d9ff;
  --accent-2: #7c6cff;
  --accent-soft: rgba(80, 217, 255, 0.15);
  --good: #67e8a5;
  --good-soft: rgba(103, 232, 165, 0.14);
  --warn: #ffd166;
  --warn-soft: rgba(255, 209, 102, 0.15);
  --bad: #ff7a90;
  --bad-soft: rgba(255, 122, 144, 0.12);
  --shadow: 0 28px 80px rgba(0, 0, 0, 0.45);
  --radius-lg: 28px;
  --radius-md: 20px;
  --radius-sm: 14px;
  --max: 1180px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(80, 217, 255, 0.16), transparent 32rem),
    radial-gradient(circle at 80% 10%, rgba(124, 108, 255, 0.18), transparent 30rem),
    linear-gradient(135deg, var(--bg), #081425 45%, #050a12);
  color: var(--text);
  line-height: 1.55;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

a {
  color: inherit;
}

.skip-link {
  position: absolute;
  left: 1rem;
  top: -10rem;
  z-index: 1000;
  background: var(--accent);
  color: #00101a;
  padding: 0.8rem 1rem;
  border-radius: 999px;
  font-weight: 800;
}

.skip-link:focus {
  top: 1rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(22px);
  background: rgba(5, 10, 18, 0.72);
  border-bottom: 1px solid var(--line);
}

.nav-shell {
  width: min(var(--max), calc(100% - 2rem));
  margin: 0 auto;
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
}

.brand {
  border: 0;
  background: transparent;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  font-weight: 900;
  font-size: 1.18rem;
  letter-spacing: -0.03em;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 0.9rem;
  color: #00111a;
  background: linear-gradient(135deg, var(--accent), #b8f3ff);
  box-shadow: 0 0 34px rgba(80, 217, 255, 0.38);
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
}

.nav-link {
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--muted);
  background: transparent;
  padding: 0.64rem 0.9rem;
  transition: 180ms ease;
}

.nav-link:hover,
.nav-link.active {
  color: var(--text);
  background: rgba(255, 255, 255, 0.065);
  border-color: var(--line);
}

.nav-toggle {
  display: none;
  width: 2.7rem;
  height: 2.7rem;
  border-radius: 0.95rem;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.06);
}

.nav-toggle span[aria-hidden="true"],
.nav-toggle span[aria-hidden="true"]::before,
.nav-toggle span[aria-hidden="true"]::after {
  display: block;
  width: 1.2rem;
  height: 2px;
  background: var(--text);
  margin: auto;
  position: relative;
  border-radius: 999px;
}

.nav-toggle span[aria-hidden="true"]::before,
.nav-toggle span[aria-hidden="true"]::after {
  content: "";
  position: absolute;
  left: 0;
}

.nav-toggle span[aria-hidden="true"]::before {
  top: -0.4rem;
}

.nav-toggle span[aria-hidden="true"]::after {
  top: 0.4rem;
}

main {
  width: min(var(--max), calc(100% - 2rem));
  margin: 0 auto;
}

.app-section {
  display: none;
  padding: clamp(2.5rem, 5vw, 5rem) 0;
  min-height: calc(100vh - 74px);
}

.app-section.visible {
  display: block;
}

.hero-section {
  position: relative;
  overflow: hidden;
}

.hero-grid {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(320px, 0.72fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 5rem);
  min-height: calc(100vh - 110px);
}

.ambient-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(10px);
  pointer-events: none;
  opacity: 0.8;
}

.orb-one {
  width: 24rem;
  height: 24rem;
  background: radial-gradient(circle, rgba(80, 217, 255, 0.2), transparent 68%);
  left: -8rem;
  top: 10rem;
}

.orb-two {
  width: 18rem;
  height: 18rem;
  background: radial-gradient(circle, rgba(124, 108, 255, 0.22), transparent 68%);
  right: -5rem;
  top: 4rem;
}

.eyebrow,
.micro-label,
.mini-label,
.prompt-label {
  margin: 0 0 0.65rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 900;
  font-size: 0.75rem;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 1.2rem;
  font-size: clamp(3.1rem, 8vw, 6.8rem);
  line-height: 0.92;
  letter-spacing: -0.075em;
  max-width: 9.2em;
}

h2 {
  margin-bottom: 0.8rem;
  font-size: clamp(2rem, 4.2vw, 4.1rem);
  line-height: 1;
  letter-spacing: -0.055em;
}

h3 {
  margin-bottom: 0.65rem;
  line-height: 1.12;
  letter-spacing: -0.03em;
}

.hero-lede {
  max-width: 41rem;
  color: var(--muted);
  font-size: clamp(1.05rem, 2.2vw, 1.35rem);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin: 2rem 0 1.3rem;
}

.btn {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.85rem 1.15rem;
  min-height: 2.9rem;
  font-weight: 850;
  color: var(--text);
  background: rgba(255, 255, 255, 0.055);
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--line-strong);
  background: rgba(255, 255, 255, 0.09);
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent), #83eeff);
  border-color: transparent;
  color: #01131f;
  box-shadow: 0 14px 34px rgba(80, 217, 255, 0.26);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 18px 42px rgba(80, 217, 255, 0.34);
  background: linear-gradient(135deg, #8deeff, #c4f8ff);
}

.btn-secondary {
  background: linear-gradient(135deg, rgba(124, 108, 255, 0.95), rgba(80, 217, 255, 0.62));
  border-color: transparent;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.04);
}

button:focus-visible,
input:focus-visible {
  outline: 3px solid rgba(80, 217, 255, 0.72);
  outline-offset: 3px;
}

.trust-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.trust-row span,
.problem-pill,
.mastery-chip,
.badge {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.055);
  color: var(--muted);
  border-radius: 999px;
  padding: 0.48rem 0.75rem;
  font-size: 0.88rem;
  font-weight: 750;
}

.glass-card,
.side-card,
.tutor-card,
.module-card,
.metric-card,
.review-card,
.about-card,
.principle-card,
.law-card,
.feedback-panel {
  border: 1px solid var(--line);
  background: linear-gradient(145deg, rgba(16, 31, 52, 0.84), rgba(9, 19, 34, 0.78));
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.hero-card {
  perspective: 1000px;
}

.diagnostic-preview {
  position: relative;
  padding: clamp(1.25rem, 3vw, 1.8rem);
  min-height: 34rem;
  overflow: hidden;
}

.diagnostic-preview::before {
  content: "";
  position: absolute;
  inset: -2px;
  background:
    radial-gradient(circle at 70% 8%, rgba(80, 217, 255, 0.26), transparent 17rem),
    radial-gradient(circle at 20% 75%, rgba(124, 108, 255, 0.26), transparent 15rem);
  pointer-events: none;
}

.preview-topline,
.mini-panel,
.equation-orbit,
.mastery-chip {
  position: relative;
  z-index: 1;
}

.preview-topline {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--muted);
  font-weight: 800;
}

.status-dot {
  width: 0.7rem;
  height: 0.7rem;
  background: var(--good);
  border-radius: 999px;
  box-shadow: 0 0 24px rgba(103, 232, 165, 0.75);
}

.equation-orbit {
  display: grid;
  place-items: center;
  width: min(100%, 21rem);
  aspect-ratio: 1;
  margin: 1.7rem auto;
  border-radius: 999px;
  border: 1px solid rgba(80, 217, 255, 0.23);
  background:
    radial-gradient(circle, rgba(80, 217, 255, 0.14), transparent 56%),
    rgba(255, 255, 255, 0.035);
  box-shadow: inset 0 0 80px rgba(80, 217, 255, 0.08), 0 0 44px rgba(80, 217, 255, 0.13);
}

.equation-orbit span {
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 950;
  letter-spacing: -0.06em;
}

.mini-panel {
  padding: 1rem;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.055);
  border-radius: var(--radius-md);
  margin-top: 0.9rem;
}

.mini-panel p:last-child {
  color: var(--text);
  margin-bottom: 0;
}

.mini-panel.repair {
  border-color: rgba(255, 209, 102, 0.28);
  background: var(--warn-soft);
}

.mastery-chip {
  display: inline-flex;
  margin-top: 1rem;
  color: var(--text);
}

.section-heading {
  text-align: center;
  max-width: 780px;
  margin: 0 auto clamp(1.8rem, 4vw, 3rem);
}

.section-heading p:not(.eyebrow) {
  color: var(--muted);
  font-size: 1.05rem;
}

.left-align {
  text-align: left;
  margin-left: 0;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 330px minmax(0, 1fr);
  gap: 1.2rem;
  align-items: start;
}

.side-card,
.tutor-card {
  padding: clamp(1rem, 3vw, 1.4rem);
}

.side-card {
  position: sticky;
  top: 96px;
}

.side-card p,
.module-card p,
.metric-card p,
.review-card p,
.principle-card p,
.about-card p,
.law-card p {
  color: var(--muted);
}

.muted {
  color: var(--muted);
}

.skill-list {
  display: grid;
  gap: 0.65rem;
  margin: 1rem 0;
}

.skill-button {
  width: 100%;
  text-align: left;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.85rem;
  background: rgba(255, 255, 255, 0.045);
  color: var(--text);
  transition: 180ms ease;
}

.skill-button strong {
  display: block;
}

.skill-button span {
  color: var(--muted);
  font-size: 0.9rem;
}

.skill-button:hover:not(:disabled),
.skill-button.active {
  border-color: rgba(80, 217, 255, 0.48);
  background: var(--accent-soft);
}

.law-card {
  display: flex;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  box-shadow: none;
}

.law-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  border-radius: 0.75rem;
  background: var(--accent-soft);
  color: var(--accent);
}

.problem-header,
.answer-row,
.feedback-actions,
.dashboard-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.problem-stage {
  margin: 1rem 0 1.3rem;
  padding: clamp(1rem, 4vw, 1.6rem);
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background:
    radial-gradient(circle at 20% 0%, rgba(80, 217, 255, 0.14), transparent 18rem),
    rgba(255, 255, 255, 0.045);
}

.problem-display {
  font-size: clamp(2.3rem, 8vw, 5.2rem);
  line-height: 1.02;
  letter-spacing: -0.065em;
  font-weight: 950;
  word-break: break-word;
}

.problem-instruction {
  color: var(--muted);
  margin: 0.8rem 0 0;
}

.answer-form label {
  display: block;
  margin-bottom: 0.55rem;
  color: var(--text);
  font-weight: 800;
}

.answer-row input {
  width: 100%;
  min-height: 3.25rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.22);
  color: var(--text);
  padding: 0.85rem 1.05rem;
}

.answer-row input::placeholder {
  color: var(--muted-2);
}

.hint-zone {
  margin-top: 1rem;
  display: grid;
  gap: 0.7rem;
}

.hint-text {
  min-height: 1.5rem;
  margin: 0;
  color: var(--muted);
}

.feedback-panel {
  margin-top: 1.1rem;
  padding: clamp(1rem, 3vw, 1.35rem);
  box-shadow: none;
}

.feedback-panel.hidden {
  display: none;
}

.feedback-panel.correct {
  border-color: rgba(103, 232, 165, 0.35);
  background: linear-gradient(145deg, var(--good-soft), rgba(16, 31, 52, 0.84));
}

.feedback-panel.repair {
  border-color: rgba(255, 209, 102, 0.38);
  background: linear-gradient(145deg, var(--warn-soft), rgba(16, 31, 52, 0.84));
}

.feedback-panel.unclear {
  border-color: rgba(255, 122, 144, 0.24);
  background: linear-gradient(145deg, var(--bad-soft), rgba(16, 31, 52, 0.84));
}

.feedback-title-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.feedback-kicker {
  color: var(--muted);
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
}

.feedback-panel h3 {
  margin-bottom: 0.35rem;
}

.explain-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin: 1rem 0;
}

.explain-card {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-md);
  padding: 0.9rem;
}

.explain-card strong {
  display: block;
  margin-bottom: 0.35rem;
}

.explain-card p {
  margin-bottom: 0;
  color: var(--muted);
}

.steps-list {
  margin: 0.85rem 0 1rem;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.5rem;
}

.steps-list li {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 0.9rem;
  padding: 0.65rem 0.8rem;
  font-weight: 800;
}

.drill-card {
  margin-top: 1rem;
  border: 1px solid rgba(255, 209, 102, 0.34);
  background: rgba(255, 209, 102, 0.08);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.drill-card form {
  display: flex;
  gap: 0.7rem;
  margin-top: 0.8rem;
}

.drill-card input {
  min-width: 0;
  flex: 1;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.23);
  color: var(--text);
  padding: 0.75rem 0.95rem;
}

.module-grid,
.metric-grid,
.principles-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.module-card,
.metric-card,
.review-card,
.principle-card {
  padding: 1.2rem;
  min-height: 100%;
  box-shadow: none;
}

.module-card {
  display: grid;
  gap: 1rem;
  align-content: space-between;
}

.module-card.functional {
  position: relative;
  overflow: hidden;
}

.module-card.functional::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(80, 217, 255, 0.12), transparent 12rem);
  pointer-events: none;
}

.module-card.coming-soon {
  opacity: 0.72;
}

.module-card h3 {
  position: relative;
}

.module-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.dashboard {
  display: grid;
  gap: 1rem;
}

.dashboard-hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1rem;
}

.big-stat {
  padding: clamp(1.2rem, 3vw, 1.6rem);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(80, 217, 255, 0.28);
  background:
    radial-gradient(circle at 10% 0, rgba(80, 217, 255, 0.18), transparent 15rem),
    var(--panel);
}

.stat-number {
  display: block;
  font-size: clamp(3rem, 10vw, 6rem);
  line-height: 0.92;
  letter-spacing: -0.08em;
  font-weight: 1000;
}

.stat-label {
  color: var(--muted);
  font-weight: 800;
}

.metric-card strong {
  display: block;
  font-size: 1.15rem;
}

.mistake-bars {
  display: grid;
  gap: 0.75rem;
}

.bar-row {
  display: grid;
  gap: 0.35rem;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--muted);
  font-size: 0.92rem;
}

.bar-track {
  height: 0.7rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.bar-fill {
  height: 100%;
  width: var(--bar-width, 0%);
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--warn));
}

.recent-list {
  display: grid;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.recent-list li {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.review-card.full {
  grid-column: 1 / -1;
}

.about-shell {
  max-width: 980px;
  margin: 0 auto;
}

.about-card {
  padding: clamp(1.2rem, 3vw, 1.7rem);
  margin-bottom: 1rem;
}

.principle-card span {
  display: inline-grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  margin-bottom: 1rem;
  border-radius: 0.85rem;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 950;
}

.empty-state {
  padding: 1.3rem;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
}

@media (max-width: 900px) {
  .nav-toggle {
    display: inline-grid;
    place-items: center;
  }

  .nav-links {
    position: absolute;
    top: 74px;
    left: 1rem;
    right: 1rem;
    display: none;
    flex-direction: column;
    align-items: stretch;
    padding: 0.8rem;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: rgba(5, 10, 18, 0.96);
    box-shadow: var(--shadow);
  }

  .nav-links.open {
    display: flex;
  }

  .nav-link {
    width: 100%;
    text-align: left;
  }

  .hero-grid,
  .workspace-grid,
  .dashboard-hero,
  .review-grid {
    grid-template-columns: 1fr;
  }

  .side-card {
    position: static;
  }

  .module-grid,
  .metric-grid,
  .principles-grid,
  .explain-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 580px) {
  main,
  .nav-shell {
    width: min(100% - 1rem, var(--max));
  }

  .app-section {
    padding: 2rem 0;
  }

  .hero-grid {
    min-height: auto;
    padding: 1rem 0 2rem;
  }

  .hero-actions,
  .answer-row,
  .problem-header,
  .feedback-title-row,
  .dashboard-topline,
  .drill-card form {
    flex-direction: column;
    align-items: stretch;
  }

  .btn,
  .answer-row input {
    width: 100%;
  }

  .diagnostic-preview {
    min-height: auto;
  }

  .equation-orbit {
    margin: 1rem auto;
  }

  .recent-list li {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .equation-orbit {
    animation: floatOrb 6s ease-in-out infinite;
  }

  .ambient-orb {
    animation: breathe 8s ease-in-out infinite;
  }

  @keyframes floatOrb {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.75; }
    50% { transform: scale(1.06); opacity: 1; }
  }
}
