(() => {
  'use strict';

  const STORAGE_KEY = 'theoremProgressV2';
  const MISTAKE_TYPES = [
    'skipped_inverse_operation',
    'wrong_operation',
    'sign_error',
    'arithmetic_error',
    'combined_unlike_terms',
    'distribution_error',
    'variable_confusion',
    'incomplete_solution',
    'random_or_unclear'
  ];

  const SUBJECTS = ['math', 'science', 'english', 'history', 'coding', 'language', 'general'];

  const state = {
    progress: loadProgress(),
    session: null,
    currentIndex: 0,
    practiceSkill: 'two_step_equations',
    practiceProblem: null,
    practiceAttemptSaved: false
  };

  const els = {};

  const problemBank = {
    two_step_equations: [
      makeTwoStep('2x + 5 = 17', 2, '+', 5, 17),
      makeTwoStep('3x + 4 = 19', 3, '+', 4, 19),
      makeTwoStep('5x + 2 = 27', 5, '+', 2, 27),
      makeTwoStep('4x - 3 = 21', 4, '-', 3, 21),
      makeTwoStep('6x - 5 = 31', 6, '-', 5, 31),
      makeTwoStep('7x + 1 = 36', 7, '+', 1, 36),
      makeTwoStep('8x - 4 = 44', 8, '-', 4, 44),
      makeTwoStep('9x + 6 = 51', 9, '+', 6, 51),
      makeTwoStep('3x - 7 = 14', 3, '-', 7, 14),
      makeTwoStep('10x + 5 = 65', 10, '+', 5, 65),
      makeTwoStep('2x - 9 = 15', 2, '-', 9, 15),
      makeTwoStep('4x + 8 = 32', 4, '+', 8, 32)
    ],
    combining_like_terms: [
      makeCombine('3x + 2x + 5', 3, 2, '+', 5),
      makeCombine('4x + x + 7', 4, 1, '+', 7),
      makeCombine('6x - 2x + 9', 6, -2, '+', 9),
      makeCombine('8x + 3x - 4', 8, 3, '-', 4),
      makeCombine('9x - 5x + 2', 9, -5, '+', 2),
      makeCombine('7x + 6x + 1', 7, 6, '+', 1),
      makeCombine('10x - 4x - 8', 10, -4, '-', 8),
      makeCombine('2x + 9x + 3', 2, 9, '+', 3),
      makeCombine('12x - 7x + 6', 12, -7, '+', 6),
      makeCombine('5x + 5x - 10', 5, 5, '-', 10)
    ],
    distributive_property: [
      makeDistribute('3(x + 4)', 3, '+', 4),
      makeDistribute('2(x + 5)', 2, '+', 5),
      makeDistribute('5(x - 2)', 5, '-', 2),
      makeDistribute('4(x + 3)', 4, '+', 3),
      makeDistribute('6(x - 1)', 6, '-', 1),
      makeDistribute('7(x + 2)', 7, '+', 2),
      makeDistribute('8(x - 3)', 8, '-', 3),
      makeDistribute('9(x + 1)', 9, '+', 1),
      makeDistribute('10(x - 4)', 10, '-', 4),
      makeDistribute('3(x - 6)', 3, '-', 6)
    ]
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheEls();
    bindNavigation();
    bindLearnWorkspace();
    bindPractice();
    bindProgress();
    renderProgressDashboard();
    renderReview();
  }

  function cacheEls() {
    els.navToggle = qs('#navToggle');
    els.navLinks = qs('#navLinks');
    els.sections = Array.from(document.querySelectorAll('.app-section'));
    els.navButtons = Array.from(document.querySelectorAll('[data-section-target]'));
    els.materialInput = qs('#materialInput');
    els.materialFile = qs('#materialFile');
    els.subjectSelect = qs('#subjectSelect');
    els.buildSessionBtn = qs('#buildSessionBtn');
    els.uploadMessage = qs('#uploadMessage');
    els.learnWorkspace = qs('#learnWorkspace');
    els.detectedSummary = qs('#detectedSummary');
    els.outlineList = qs('#outlineList');
    els.unsupportedList = qs('#unsupportedList');
    els.currentTutorCard = qs('#currentTutorCard');
    els.studyTools = qs('#studyTools');
    els.practiceShell = qs('#practiceShell');
    els.practiceSkillName = qs('#practiceSkillName');
    els.practiceTutorCard = qs('#practiceTutorCard');
    els.newPracticeProblemBtn = qs('#newPracticeProblemBtn');
    els.progressDashboard = qs('#progressDashboard');
    els.refreshProgressBtn = qs('#refreshProgressBtn');
    els.resetProgressBtn = qs('#resetProgressBtn');
    els.reviewGrid = qs('#reviewGrid');
  }

  function bindNavigation() {
    if (els.navToggle) {
      els.navToggle.addEventListener('click', () => {
        const open = els.navLinks.classList.toggle('open');
        els.navToggle.setAttribute('aria-expanded', String(open));
      });
    }

    els.navButtons.forEach((button) => {
      button.addEventListener('click', () => showSection(button.dataset.sectionTarget));
    });
  }

  function showSection(name) {
    els.sections.forEach((section) => section.classList.toggle('active-section', section.id === `section-${name}`));
    document.querySelectorAll('.nav-link').forEach((button) => button.classList.toggle('active', button.dataset.sectionTarget === name));
    if (els.navLinks) els.navLinks.classList.remove('open');
    if (els.navToggle) els.navToggle.setAttribute('aria-expanded', 'false');
    if (name === 'progress') renderProgressDashboard();
    if (name === 'review') renderReview();
  }

  function bindLearnWorkspace() {
    els.buildSessionBtn?.addEventListener('click', buildLearningSession);

    els.materialFile?.addEventListener('change', () => {
      const file = els.materialFile.files && els.materialFile.files[0];
      if (!file) return;
      const name = file.name.toLowerCase();
      const isSupported = name.endsWith('.txt') || name.endsWith('.md') || file.type === 'text/plain' || file.type === 'text/markdown';
      if (!isSupported) {
        setStatus('Image and PDF upload is coming later. For now, paste the text or upload .txt/.md.');
        els.materialFile.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        els.materialInput.value = String(reader.result || '');
        setStatus(`Loaded ${file.name}.`);
      };
      reader.onerror = () => setStatus('Theorem could not read that file. Try pasting the text instead.');
      reader.readAsText(file);
    });
  }

  function buildLearningSession() {
    const text = (els.materialInput.value || '').trim();
    if (!text) {
      setStatus('Paste homework, notes, study material, or code first.');
      return;
    }

    const chosen = els.subjectSelect.value;
    const subject = chosen === 'auto' ? detectSubject(text) : chosen;
    let session;

    if (subject === 'coding') session = buildCodeSession(text, subject);
    else if (subject === 'math') session = buildMathSession(text, subject);
    else session = buildConceptSession(text, subject);

    state.session = session;
    state.currentIndex = 0;
    state.progress.sessions += 1;
    state.progress.materialsImported += 1;
    state.progress.subjectSessions[subject] = (state.progress.subjectSessions[subject] || 0) + 1;
    state.progress.lastSubject = subject;
    if (session.type === 'math') {
      state.progress.problemsImported += session.items.filter((item) => item.supported).length;
      state.progress.unsupportedProblems += session.unsupported.length;
    }
    saveProgress();
    els.learnWorkspace.classList.remove('hidden');
    renderLearningSession();
    showSection('learn');
  }

  function buildMathSession(text, subject) {
    const rawItems = splitMaterial(text);
    const items = rawItems.map((raw, index) => {
      const problem = detectMathProblem(raw);
      if (!problem) return { id: `unsupported-${index}`, type: 'unsupported', supported: false, raw };
      return { id: `math-${index}`, type: 'math', supported: true, raw, problem, hintIndex: 0, attempted: false, saved: false };
    });
    return {
      type: 'math',
      subject,
      items,
      unsupported: items.filter((item) => !item.supported),
      title: 'Math exact-check session'
    };
  }

  function buildConceptSession(text, subject) {
    const sentences = splitSentences(text);
    const terms = extractTerms(text, subject);
    const flashcards = makeFlashcards(text, terms);
    const quiz = makeConceptQuiz(sentences, terms);
    return {
      type: 'concept',
      subject,
      title: labelSubject(subject),
      text,
      sentences,
      terms,
      summary: summarizeText(sentences),
      flashcards,
      quiz,
      teachBack: terms.slice(0, 6)
    };
  }

  function buildCodeSession(text, subject) {
    const lines = text.split(/\r?\n/).map((line, i) => ({ number: i + 1, text: line })).filter((line) => line.text.trim());
    const terms = extractCodeTerms(text);
    return {
      type: 'code',
      subject,
      title: 'Coding tutor session',
      text,
      lines,
      terms,
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
    els.detectedSummary.append(
      statPill('Mode', session.type === 'math' ? 'Exact check' : session.type === 'code' ? 'Code tutor' : 'Concept tutor'),
      statPill('Subject', labelSubject(session.subject))
    );
    if (session.type === 'math') {
      els.detectedSummary.append(
        statPill('Supported', String(session.items.filter((item) => item.supported).length)),
        statPill('Unsupported', String(session.unsupported.length))
      );
    } else {
      els.detectedSummary.append(statPill('Key ideas', String(session.terms.length)));
    }
  }

  function renderOutline(session) {
    clear(els.outlineList);
    if (session.type === 'math') {
      session.items.forEach((item, index) => {
        const button = buttonEl(item.supported ? item.problem.display : item.raw, 'outline-button', () => {
          state.currentIndex = index;
          renderLearningSession();
        });
        button.classList.toggle('active', state.currentIndex === index);
        button.disabled = !item.supported;
        els.outlineList.append(button);
      });
      return;
    }

    const outline = session.type === 'code'
      ? ['What this code does', 'Important lines', 'Edge cases', 'Explain a line', 'Modification challenge']
      : ['Summary', 'Key terms', 'Flashcards', 'Quiz', 'Teach-back'];

    outline.forEach((label, index) => {
      const button = buttonEl(label, 'outline-button', () => {
        state.currentIndex = index;
        renderLearningSession();
      });
      button.classList.toggle('active', state.currentIndex === index);
      els.outlineList.append(button);
    });
  }

  function renderUnsupported(session) {
    clear(els.unsupportedList);
    if (session.type !== 'math' || !session.unsupported.length) return;
    els.unsupportedList.append(labelText('Unsupported', 'micro-label'));
    session.unsupported.forEach((item) => {
      const card = div('unsupported-card');
      card.append(textP(item.raw), textP('Not supported yet — try typing this one manually or choose a supported Algebra 1 format.', 'muted'));
      els.unsupportedList.append(card);
    });
  }

  function renderCurrentTutorCard(session) {
    clear(els.currentTutorCard);
    if (session.type === 'math') renderMathTutor(session);
    else if (session.type === 'code') renderCodeTutor(session);
    else renderConceptTutor(session);
  }

  function renderMathTutor(session) {
    const supportedItems = session.items.filter((item) => item.supported);
    if (!supportedItems.length) {
      els.currentTutorCard.append(heading('No supported math found', 3), textP('Try Algebra 1 formats like 2x + 5 = 17, 3x + 2x + 5, or 3(x + 4).'));
      return;
    }
    let item = session.items[state.currentIndex];
    if (!item || !item.supported) {
      const firstIndex = session.items.findIndex((candidate) => candidate.supported);
      state.currentIndex = firstIndex;
      item = session.items[firstIndex];
    }
    els.currentTutorCard.append(renderProblemCard(item.problem, {
      context: 'learn',
      item,
      onNext: () => {
        const next = nextSupportedIndex(session.items, state.currentIndex);
        state.currentIndex = next;
        renderLearningSession();
      }
    }));
  }

  function renderConceptTutor(session) {
    const index = state.currentIndex;
    if (index === 0) {
      const card = div('concept-summary');
      card.append(heading('Based on the text you pasted...', 3));
      card.append(textP('Theorem found these likely main ideas. Check this against your class notes.', 'muted'));
      session.summary.forEach((line) => card.append(textP(line)));
      els.currentTutorCard.append(card);
    } else if (index === 1) {
      els.currentTutorCard.append(heading('Likely key terms', 3), textP('These are terms Theorem saw repeated or defined in your material.', 'muted'), list(session.terms, 'term-list'));
    } else if (index === 2) {
      const box = div('flashcard-list');
      session.flashcards.forEach((card, i) => {
        const item = div('flashcard');
        item.append(strong(`Card ${i + 1}: ${card.front}`), textP(card.back));
        const reviewed = buttonEl('Mark reviewed', 'btn btn-secondary', () => {
          state.progress.flashcardsReviewed += 1;
          addWeakTerms(session.terms.slice(0, 2));
          saveProgress();
          buttonSetDone(reviewed, 'Reviewed');
        });
        item.append(reviewed);
        box.append(item);
      });
      els.currentTutorCard.append(heading('Flashcards', 3), textP('Retrieve the answer before reading the back.', 'muted'), box);
    } else if (index === 3) {
      const box = div('quiz-list');
      session.quiz.forEach((q, i) => {
        const card = div('quiz-card');
        card.append(strong(`Question ${i + 1}`), textP(q.question));
        if (q.options) {
          const options = div('quiz-options');
          q.options.forEach((option) => {
            options.append(buttonEl(option, 'quiz-option', (event) => {
              Array.from(options.children).forEach((child) => child.classList.remove('selected'));
              event.currentTarget.classList.add('selected');
              state.progress.conceptQuizzesCompleted += 1;
              saveProgress();
            }));
          });
          card.append(options);
        } else {
          const input = document.createElement('textarea');
          input.setAttribute('aria-label', q.question);
          input.placeholder = 'Answer in your own words.';
          const check = buttonEl('Check key words', 'btn btn-secondary', () => {
            const result = checkTerms(input.value, session.terms.slice(0, 5));
            card.append(feedbackBox('Self-check', result.message));
            state.progress.conceptQuizzesCompleted += 1;
            addWeakTerms(result.missing);
            saveProgress();
          });
          card.append(input, check);
        }
        box.append(card);
      });
      els.currentTutorCard.append(heading('Quiz mode', 3), textP('Theorem can check key words, but not perfectly grade open-ended answers.', 'muted'), box);
    } else {
      const input = document.createElement('textarea');
      input.placeholder = 'Explain the idea in your own words.';
      input.setAttribute('aria-label', 'Teach-back answer');
      const output = div('tool-card');
      const check = buttonEl('Check my explanation', 'btn btn-primary', () => {
        clear(output);
        const result = checkTerms(input.value, session.teachBack);
        output.append(strong('Teach-back checklist'), textP(result.message), list(session.teachBack, 'checklist'));
        state.progress.teachBackAttempts += 1;
        addWeakTerms(result.missing);
        saveProgress();
      });
      els.currentTutorCard.append(heading('Teach-back mode', 3), textP('Explain first. Then use the checklist to revise.', 'muted'), input, div('actions', [check]), output);
    }
  }

  function renderCodeTutor(session) {
    const index = state.currentIndex;
    if (index === 0) {
      els.currentTutorCard.append(heading('What this code appears to do', 3), textP('Based on the code you pasted, check this against your assignment instructions.', 'muted'), textP(session.summary));
    } else if (index === 1) {
      const items = session.lines.slice(0, 12).map((line) => `Line ${line.number}: ${line.text.trim()}`);
      els.currentTutorCard.append(heading('Important parts', 3), list(items, 'line-list'));
    } else if (index === 2) {
      const edges = ['What happens with empty input?', 'What happens with very large input?', 'What happens if the type is different than expected?', 'Does the function return a value every time?'];
      els.currentTutorCard.append(heading('Possible bugs or edge cases', 3), textP('These are safe questions to test locally.', 'muted'), list(edges, 'checklist'));
    } else if (index === 3) {
      const line = session.lines[0]?.text.trim() || 'the first line';
      const input = document.createElement('textarea');
      input.placeholder = `Explain this line: ${line}`;
      const check = buttonEl('Save teach-back', 'btn btn-primary', () => {
        state.progress.teachBackAttempts += 1;
        saveProgress();
        buttonSetDone(check, 'Saved');
      });
      els.currentTutorCard.append(heading('Explain this line', 3), textP(line), input, div('actions', [check]));
    } else {
      els.currentTutorCard.append(heading('Modification challenge', 3), textP(session.challenge), textP('Next action: make the smallest change, then write one test case before running it.', 'muted'));
    }
  }

  function renderStudyTools(session) {
    clear(els.studyTools);
    const tools = div('tool-list');
    if (session.type === 'math') {
      tools.append(
        toolCard('Rule', 'No answer before attempt. Hints are allowed.'),
        toolCard('Next action', 'Solve the current problem, then use the repair drill if needed.'),
        toolCard('Accuracy', `${percent(state.progress.correctAnswers, state.progress.mathProblemsAttempted)}% math accuracy`)
      );
    } else if (session.type === 'code') {
      tools.append(
        toolCard('Best move', 'Explain one line, then write one small test case.'),
        toolCard('No fake grading', 'Theorem guides your reasoning without pretending to run your code.'),
        toolCard('Terms found', session.terms.join(', ') || 'No strong coding terms found')
      );
    } else {
      tools.append(
        toolCard('Study rule', 'Retrieve before reading. Explain before checking.'),
        toolCard('Key terms', session.terms.slice(0, 6).join(', ') || 'No strong terms found'),
        toolCard('Review plan', 'Flashcards → quiz → teach-back → revise missing terms')
      );
    }
    els.studyTools.append(tools);
  }

  function bindPractice() {
    document.querySelectorAll('[data-practice-skill]').forEach((button) => {
      button.addEventListener('click', () => {
        state.practiceSkill = button.dataset.practiceSkill;
        state.practiceProblem = randomProblem(state.practiceSkill);
        state.practiceAttemptSaved = false;
        els.practiceShell.classList.remove('hidden');
        els.practiceSkillName.textContent = titleSkill(state.practiceSkill);
        renderPracticeProblem();
      });
    });
    els.newPracticeProblemBtn?.addEventListener('click', () => {
      state.practiceProblem = randomProblem(state.practiceSkill);
      state.practiceAttemptSaved = false;
      renderPracticeProblem();
    });
  }

  function renderPracticeProblem() {
    clear(els.practiceTutorCard);
    els.practiceTutorCard.append(renderProblemCard(state.practiceProblem, {
      context: 'practice',
      onNext: () => {
        state.practiceProblem = randomProblem(state.practiceSkill);
        state.practiceAttemptSaved = false;
        renderPracticeProblem();
      }
    }));
  }

  function renderProblemCard(problem, options) {
    const wrapper = document.createElement('article');
    const title = div('problem-header');
    title.append(heading(problem.skillLabel, 3), span(problem.topic, 'problem-pill'));
    const stage = div('problem-stage');
    stage.append(labelText('Problem', 'micro-label'), div('problem-display', null, problem.display), textP(problem.instruction, 'problem-instruction'));
    const form = document.createElement('form');
    form.className = 'answer-form';
    const inputId = `answer-${Math.random().toString(36).slice(2)}`;
    const label = document.createElement('label');
    label.setAttribute('for', inputId);
    label.textContent = 'Your answer';
    const row = div('answer-row');
    const input = document.createElement('input');
    input.id = inputId;
    input.type = 'text';
    input.autocomplete = 'off';
    input.placeholder = problem.answerPlaceholder;
    const submit = buttonEl('Check answer', 'btn btn-primary');
    row.append(input, submit);
    form.append(label, row);
    const hintZone = div('hint-zone');
    const hintButton = buttonEl('Show hint', 'btn btn-ghost');
    const hintText = textP('', 'hint-text');
    let hintIndex = options.item ? options.item.hintIndex || 0 : 0;
    hintButton.addEventListener('click', () => {
      hintText.textContent = problem.hints[Math.min(hintIndex, problem.hints.length - 1)];
      hintIndex += 1;
      if (options.item) options.item.hintIndex = hintIndex;
      if (hintIndex >= problem.hints.length) hintButton.disabled = true;
    });
    hintZone.append(hintButton, hintText);
    const feedback = div('feedback-root');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const result = checkAnswer(problem, input.value);
      if (options.item) options.item.attempted = true;
      if (options.context === 'learn' && options.item && !options.item.saved) {
        saveMathAttempt(problem, result);
        options.item.saved = true;
      } else if (options.context === 'practice' && !state.practiceAttemptSaved) {
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
    const panel = div(`feedback-panel ${result.correct ? 'correct' : 'repair-needed'}`);
    panel.append(div('feedback-title', null, result.correct ? 'Correct.' : 'Not quite — here’s the likely break.'));
    if (result.correct) {
      panel.append(textP(problem.correctMessage));
      panel.append(div('actions', [buttonEl('Next challenge', 'btn btn-primary', onNext)]));
      return panel;
    }

    const grid = div('feedback-grid');
    grid.append(
      feedbackBox('Likely mistake', result.message),
      feedbackBox('Why it happened', result.why),
      feedbackBox('Tiny fix', result.fix),
      feedbackBox('Repair drill', result.repairDrill.display)
    );
    panel.append(grid, strong('Correct steps'), list(problem.steps, 'steps-list'));
    panel.append(div('actions', [buttonEl('Try repair drill', 'btn btn-secondary', () => {
      const session = buildMathSession(result.repairDrill.display, 'math');
      state.session = session;
      state.currentIndex = 0;
      renderLearningSession();
    }), buttonEl('Next problem', 'btn btn-primary', onNext)]));
    return panel;
  }

  function saveMathAttempt(problem, result) {
    state.progress.mathProblemsAttempted += 1;
    if (result.correct) state.progress.correctAnswers += 1;
    else state.progress.mistakes[result.mistakeType] = (state.progress.mistakes[result.mistakeType] || 0) + 1;
    const skill = state.progress.skills[problem.skill] || { attempts: 0, correct: 0 };
    skill.attempts += 1;
    if (result.correct) skill.correct += 1;
    state.progress.skills[problem.skill] = skill;
    if (!result.correct) addWeakSubject('math');
    state.progress.recentAttempts.unshift({ subject: 'math', skill: problem.skill, correct: result.correct, mistake: result.mistakeType || null, at: new Date().toISOString() });
    state.progress.recentAttempts = state.progress.recentAttempts.slice(0, 20);
    saveProgress();
  }

  function checkAnswer(problem, input) {
    if (!input || !input.trim()) return diagnoseMistake(problem, input, 'incomplete_solution');
    if (problem.kind === 'equation') {
      const value = parseNumericAnswer(input);
      if (value !== null && nearly(value, problem.correctAnswer)) return { correct: true };
      return diagnoseMistake(problem, input);
    }
    const parsed = parseLinearExpression(input);
    if (parsed && parsed.x === problem.correctAnswer.x && parsed.c === problem.correctAnswer.c) return { correct: true };
    return diagnoseMistake(problem, input);
  }

  function diagnoseMistake(problem, input, forced) {
    const normalized = String(input || '').trim().toLowerCase();
    const number = parseNumericAnswer(normalized);
    const expression = parseLinearExpression(normalized);
    let mistakeType = forced || 'random_or_unclear';
    let message = 'Theorem is not sure which mistake happened, but here is the safest next step.';
    let why = 'The answer does not match the structure Theorem expected.';
    let fix = 'Go one step at a time and check whether each operation was undone or distributed correctly.';

    if (problem.kind === 'equation') {
      if (forced === 'incomplete_solution' || normalized === '') {
        mistakeType = 'incomplete_solution';
        message = 'Enter a number for x, like 6 or x = 6.';
        why = 'Theorem needs an attempted value before showing the worked steps.';
        fix = 'Type the value you think x equals.';
      } else if (number !== null) {
        if (nearly(number, problem.middleValue)) {
          mistakeType = 'skipped_inverse_operation';
          message = `You reached ${problem.coefficient}x = ${problem.middleValue}, but stopped before solving for x.`;
          why = `x is still multiplied by ${problem.coefficient}.`;
          fix = `Divide both sides by ${problem.coefficient}.`;
        } else if (nearly(number, -problem.correctAnswer)) {
          mistakeType = 'sign_error';
          message = 'The size is right, but the sign changed.';
          why = 'A negative may have appeared during an inverse operation.';
          fix = 'Track the sign on each side after every operation.';
        } else if (nearly(number, problem.wrongInverseValue)) {
          mistakeType = 'wrong_operation';
          message = 'You used the wrong inverse operation.';
          why = `The constant is ${problem.sign}${problem.constant}, so you undo it with the opposite operation.`;
          fix = problem.sign === '+' ? `Subtract ${problem.constant} first.` : `Add ${problem.constant} first.`;
        } else {
          mistakeType = 'arithmetic_error';
          message = 'Your setup may be right, but one calculation is off.';
          why = 'The final value does not satisfy the original equation.';
          fix = 'Substitute your answer back into the original equation to check it.';
        }
      }
    } else if (problem.kind === 'combine') {
      if (expression) {
        if (expression.c === 0 && problem.correctAnswer.c !== 0) {
          mistakeType = 'incomplete_solution';
          message = 'You combined the x terms but dropped the constant.';
          why = 'Constants without x do not disappear.';
          fix = 'Bring the constant along unchanged.';
        } else if (expression.x !== problem.correctAnswer.x && expression.c === problem.correctAnswer.c) {
          mistakeType = 'arithmetic_error';
          message = 'The constant is right, but the x coefficient is off.';
          why = 'The like terms were combined with a calculation error.';
          fix = 'Add or subtract only the coefficients in front of x.';
        } else if (expression.c === 0 || Math.abs(expression.x) > Math.abs(problem.correctAnswer.x + problem.correctAnswer.c)) {
          mistakeType = 'combined_unlike_terms';
          message = 'It looks like x terms and constants were combined together.';
          why = 'Terms with x and terms without x are unlike terms.';
          fix = 'Combine x terms with x terms. Keep constants separate.';
        }
      }
    } else if (problem.kind === 'distribute') {
      if (expression) {
        if (expression.x === problem.coefficient && expression.c === problem.insideConstant) {
          mistakeType = 'distribution_error';
          message = 'You distributed to x but not to the second term.';
          why = 'The outside number multiplies every term inside parentheses.';
          fix = `Multiply ${problem.coefficient} by ${problem.insideConstant} too.`;
        } else if (expression.x === 1 && expression.c === problem.correctAnswer.c) {
          mistakeType = 'variable_confusion';
          message = 'The constant was multiplied, but the x coefficient was lost.';
          why = `${problem.coefficient} times x becomes ${problem.coefficient}x.`;
          fix = 'Keep the coefficient attached to x.';
        } else {
          mistakeType = 'distribution_error';
          message = 'The distribution pattern is off.';
          why = 'Each term inside the parentheses must be multiplied by the outside number.';
          fix = 'Use a(b + c) = ab + ac.';
        }
      }
    }

    return { correct: false, mistakeType, message, why, fix, repairDrill: problem.repairDrill };
  }

  function detectSubject(text) {
    const t = text.toLowerCase();
    const score = {
      coding: countMatches(t, ['function', 'const ', 'let ', 'var ', 'class ', 'def ', 'return', 'if ', 'for ', 'while ', '{}', 'console.log', 'print(']),
      math: countRegex(t, [/\bx\s*=/, /\bsimplify\b/, /\bsolve\b/, /\d\s*[+\-*/=()]\s*\d/, /\d*x\s*[+\-]/]),
      science: countMatches(t, ['cell', 'energy', 'force', 'atom', 'molecule', 'photosynthesis', 'ecosystem', 'experiment', 'hypothesis', 'variable']),
      history: countMatches(t, ['war', 'revolution', 'government', 'empire', 'president', 'colony', 'treaty', 'rights', 'economy', 'civilization']),
      english: countMatches(t, ['theme', 'character', 'paragraph', 'essay', 'claim', 'evidence', 'author', 'poem', 'story', 'argument']),
      language: countMatches(t, ['translate', 'conjugate', 'vocabulary', 'spanish', 'french', 'german', 'latin', 'sentence'])
    };
    let best = 'general';
    let bestScore = 0;
    Object.entries(score).forEach(([subject, value]) => {
      if (value > bestScore) { best = subject; bestScore = value; }
    });
    return best;
  }

  function detectMathProblem(raw) {
    const text = raw.replace(/^\s*(solve|simplify)\s*:?\s*/i, '').trim();
    const equation = text.match(/^([+-]?\d*)x\s*([+-])\s*(\d+)\s*=\s*([+-]?\d+)$/i);
    if (equation) {
      const coefficient = parseCoefficient(equation[1]);
      return makeTwoStep(text, coefficient, equation[2], Number(equation[3]), Number(equation[4]));
    }
    const distribute = text.match(/^([+-]?\d+)\s*\(\s*x\s*([+-])\s*(\d+)\s*\)$/i);
    if (distribute) return makeDistribute(text, Number(distribute[1]), distribute[2], Number(distribute[3]));
    const combined = text.match(/^([+-]?\d*)x\s*([+-])\s*([+-]?\d*)x\s*([+-])\s*(\d+)$/i);
    if (combined) {
      const a = parseCoefficient(combined[1]);
      const b = parseCoefficient(combined[3]);
      const signedB = combined[2] === '-' ? -Math.abs(b) : b;
      return makeCombine(text, a, signedB, combined[4], Number(combined[5]));
    }
    return null;
  }

  function makeTwoStep(display, coefficient, sign, constant, right) {
    const middleValue = sign === '+' ? right - constant : right + constant;
    const correct = middleValue / coefficient;
    const wrongInverseValue = sign === '+' ? (right + constant) / coefficient : (right - constant) / coefficient;
    return {
      id: `eq-${display}`,
      kind: 'equation',
      topic: 'Algebra 1',
      skill: 'two_step_equations',
      skillLabel: 'Two-step equations',
      display,
      instruction: 'Solve for x.',
      answerPlaceholder: 'Example: x = 6',
      coefficient,
      sign,
      constant,
      right,
      middleValue,
      wrongInverseValue,
      correctAnswer: correct,
      correctMessage: `x = ${formatNumber(correct)} works because substituting it back makes both sides equal.`,
      steps: [display, `${coefficient}x = ${formatNumber(middleValue)}`, `x = ${formatNumber(correct)}`],
      hints: ['Undo the operation farthest from x first.', sign === '+' ? `Start by subtracting ${constant} from both sides.` : `Start by adding ${constant} to both sides.`, `You should get ${coefficient}x = ${formatNumber(middleValue)} before dividing.`],
      repairDrill: makeTwoStep(`${coefficient + 1}x + ${constant} = ${(coefficient + 1) * correct + constant}`, coefficient + 1, '+', constant, (coefficient + 1) * correct + constant)
    };
  }

  function makeCombine(display, a, b, constSign, constant) {
    const c = constSign === '-' ? -Math.abs(constant) : Math.abs(constant);
    const x = a + b;
    return {
      id: `combine-${display}`,
      kind: 'combine',
      topic: 'Algebra 1',
      skill: 'combining_like_terms',
      skillLabel: 'Combining like terms',
      display,
      instruction: 'Simplify the expression.',
      answerPlaceholder: 'Example: 5x + 5',
      correctAnswer: { x, c },
      correctMessage: `The x terms combine to ${formatTerm(x, 'x')}, and the constant stays ${formatSigned(c)}.`,
      steps: [display, `${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}x ${formatSigned(c)}`, `${formatExpression(x, c)}`],
      hints: ['Like terms have the same variable part.', 'Combine only the x coefficients first.', `The constant ${formatSigned(c)} stays separate.`],
      repairDrill: makeCombine(`${a + 1}x + ${Math.abs(b)}x + ${Math.abs(c || 4)}`, a + 1, Math.abs(b), '+', Math.abs(c || 4))
    };
  }

  function makeDistribute(display, coefficient, sign, insideConstant) {
    const c = sign === '-' ? -coefficient * insideConstant : coefficient * insideConstant;
    return {
      id: `dist-${display}`,
      kind: 'distribute',
      topic: 'Algebra 1',
      skill: 'distributive_property',
      skillLabel: 'Distributive property',
      display,
      instruction: 'Simplify using distribution.',
      answerPlaceholder: 'Example: 3x + 12',
      coefficient,
      sign,
      insideConstant,
      correctAnswer: { x: coefficient, c },
      correctMessage: `${coefficient} multiplies both x and ${insideConstant}.`,
      steps: [display, `${coefficient} · x ${sign} ${coefficient} · ${insideConstant}`, formatExpression(coefficient, c)],
      hints: ['The outside number multiplies every term inside parentheses.', `First multiply ${coefficient} by x.`, `Then multiply ${coefficient} by ${insideConstant}.`],
      repairDrill: makeDistribute(`${coefficient + 1}(x + ${insideConstant})`, coefficient + 1, '+', insideConstant)
    };
  }

  function splitMaterial(text) {
    return text
      .replace(/\r/g, '')
      .split(/\n|;|(?=\s*\d+\.\s+)|(?=\s*[-•*]\s+)/)
      .map((line) => line.replace(/^\s*(\d+\.|[-•*])\s*/, '').trim())
      .filter(Boolean);
  }

  function splitSentences(text) {
    return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 8).slice(0, 16);
  }

  function summarizeText(sentences) {
    if (!sentences.length) return ['Theorem found short material. Try adding more notes for a better summary.'];
    return sentences.slice(0, 4).map((sentence) => `• ${sentence}`);
  }

  function extractTerms(text, subject) {
    const lower = text.toLowerCase();
    const stop = new Set(['the','and','that','with','from','this','into','were','was','are','for','you','your','use','uses','have','has','not','but','can','will','they','their','about','because','process']);
    const words = lower.match(/\b[a-z][a-z]{3,}\b/g) || [];
    const counts = {};
    words.forEach((word) => { if (!stop.has(word)) counts[word] = (counts[word] || 0) + 1; });
    const repeated = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word]) => word);
    const caps = Array.from(new Set((text.match(/\b[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{3,})?\b/g) || []).slice(0, 8)));
    const subjectTerms = {
      science: ['energy','cell','photosynthesis','molecule','ecosystem','hypothesis','variable'],
      history: ['revolution','government','colony','rights','treaty','economy','civilization'],
      english: ['theme','claim','evidence','character','author','argument'],
      language: ['translate','conjugate','vocabulary','sentence'],
      general: []
    }[subject] || [];
    return Array.from(new Set([...subjectTerms.filter((t) => lower.includes(t)), ...caps, ...repeated])).slice(0, 12);
  }

  function makeFlashcards(text, terms) {
    const sentences = splitSentences(text);
    const cards = [];
    sentences.forEach((sentence) => {
      const definition = sentence.match(/^(.+?)\s+(is|are|means|refers to)\s+(.+)$/i);
      if (definition && cards.length < 5) cards.push({ front: `What is ${definition[1].trim()}?`, back: definition[3].trim() });
    });
    terms.slice(0, 6).forEach((term) => {
      if (cards.length < 8) cards.push({ front: `What should you remember about ${term}?`, back: `Check your notes for how ${term} connects to the main idea.` });
    });
    return cards.length ? cards : [{ front: 'What is the main idea?', back: 'Use your notes to explain the most important point in one sentence.' }];
  }

  function makeConceptQuiz(sentences, terms) {
    const key = terms[0] || 'the main idea';
    return [
      { question: `Explain ${key} in your own words.` },
      { question: `Which term appears most important based on the text?`, options: terms.slice(0, 4).length ? terms.slice(0, 4) : ['main idea', 'detail', 'example', 'definition'] },
      { question: 'What is one connection between two ideas in the material?' }
    ];
  }

  function checkTerms(answer, required) {
    const lower = String(answer || '').toLowerCase();
    const missing = required.filter((term) => !lower.includes(String(term).toLowerCase()));
    if (!answer.trim()) return { missing: required, message: 'Write an explanation first. Then compare it to the checklist.' };
    if (!missing.length) return { missing: [], message: 'Good coverage. Your explanation includes the key terms Theorem checked.' };
    return { missing, message: `You may be missing: ${missing.join(', ')}. Revise and try again.` };
  }

  function extractCodeTerms(text) {
    const terms = [];
    if (/function|def\s+/.test(text)) terms.push('function');
    if (/return/.test(text)) terms.push('return value');
    if (/for\s*\(|while\s*\(|for\s+/.test(text)) terms.push('loop');
    if (/if\s*\(/.test(text)) terms.push('conditional');
    if (/class\s+/.test(text)) terms.push('class');
    if (/const|let|var/.test(text)) terms.push('variable');
    return terms;
  }

  function summarizeCode(text) {
    if (/function\s+([a-zA-Z_$][\w$]*)/.test(text)) return `This appears to define a function named ${RegExp.$1}. Look at its parameters, return value, and edge cases.`;
    if (/def\s+([a-zA-Z_]\w*)/.test(text)) return `This appears to define a Python function named ${RegExp.$1}. Check inputs, branches, and return values.`;
    if (/class\s+([a-zA-Z_$][\w$]*)/.test(text)) return `This appears to define a class named ${RegExp.$1}. Check its fields and methods.`;
    return 'This appears to be code or pseudocode. Start by identifying inputs, outputs, and the smallest test case.';
  }

  function makeCodeChallenge(text) {
    if (/add|sum|total/i.test(text)) return 'Modify the code so it handles zero, negative numbers, and one larger test case.';
    if (/return/i.test(text)) return 'Add one condition before the return and write a test for that condition.';
    return 'Change one small behavior, then write the expected input and output before running it.';
  }

  function renderProgressDashboard() {
    if (!els.progressDashboard) return;
    clear(els.progressDashboard);
    const p = state.progress;
    const subjects = Object.entries(p.subjectSessions).sort((a, b) => b[1] - a[1]);
    const mostStudied = subjects[0]?.[0] || 'None yet';
    const weakestSkill = Object.entries(p.skills).sort((a, b) => skillAccuracy(a[1]) - skillAccuracy(b[1]))[0]?.[0] || 'None yet';
    const commonMistake = Object.entries(p.mistakes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';
    els.progressDashboard.append(
      statCard('Sessions', p.sessions),
      statCard('Most studied', labelSubject(mostStudied)),
      statCard('Math accuracy', `${percent(p.correctAnswers, p.mathProblemsAttempted)}%`),
      statCard('Flashcards', p.flashcardsReviewed),
      wideCard('Recommendation', recommendNext(p, weakestSkill, commonMistake)),
      wideCard('Most common mistake', readableMistake(commonMistake))
    );
  }

  function bindProgress() {
    els.refreshProgressBtn?.addEventListener('click', renderProgressDashboard);
    els.resetProgressBtn?.addEventListener('click', () => {
      if (!window.confirm('Reset local Theorem progress?')) return;
      state.progress = defaultProgress();
      saveProgress();
      renderProgressDashboard();
      renderReview();
    });
  }

  function renderReview() {
    if (!els.reviewGrid) return;
    clear(els.reviewGrid);
    const p = state.progress;
    const hasProgress = p.sessions || p.mathProblemsAttempted || p.flashcardsReviewed || p.teachBackAttempts;
    if (!hasProgress) {
      els.reviewGrid.append(reviewCard('Complete a learning session first.', 'Paste notes, code, or Algebra 1 problems in the Learn Workspace.'));
      return;
    }
    const mistakes = Object.entries(p.mistakes).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    mistakes.forEach(([type, count]) => els.reviewGrid.append(reviewCard(readableMistake(type), `${count} time(s). Try a repair drill in Practice.`)));
    p.weakTerms.slice(0, 6).forEach((term) => els.reviewGrid.append(reviewCard(`Review term: ${term}`, 'Explain it out loud, then compare against your notes.')));
    Object.entries(p.weakSubjects).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([subject]) => els.reviewGrid.append(reviewCard(`Weak subject: ${labelSubject(subject)}`, 'Build a new session and use teach-back mode.')));
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress)); }
    catch { /* Local storage can fail; keep session progress in memory. */ }
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
      subjectSessions: Object.fromEntries(SUBJECTS.map((s) => [s, 0])),
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
      mistakes: Object.fromEntries(MISTAKE_TYPES.map((m) => [m, 0])),
      skills: {
        two_step_equations: { attempts: 0, correct: 0 },
        combining_like_terms: { attempts: 0, correct: 0 },
        distributive_property: { attempts: 0, correct: 0 }
      },
      recentAttempts: []
    };
  }

  function mergeProgress(base, saved) {
    return { ...base, ...saved, subjectSessions: { ...base.subjectSessions, ...(saved.subjectSessions || {}) }, mistakes: { ...base.mistakes, ...(saved.mistakes || {}) }, skills: { ...base.skills, ...(saved.skills || {}) }, weakSubjects: { ...(saved.weakSubjects || {}) }, weakTerms: saved.weakTerms || [], recentAttempts: saved.recentAttempts || [] };
  }

  function parseNumericAnswer(input) {
    const cleaned = String(input).trim().toLowerCase().replace(/\s+/g, '');
    const match = cleaned.match(/^(?:x=)?([+-]?\d+(?:\.\d+)?)$/);
    return match ? Number(match[1]) : null;
  }

  function parseLinearExpression(input) {
    const cleaned = String(input).toLowerCase().replace(/\s+/g, '').replace(/-/g, '+-');
    if (!cleaned) return null;
    const parts = cleaned.split('+').filter(Boolean);
    let x = 0;
    let c = 0;
    for (const part of parts) {
      if (part.includes('x')) {
        const value = part.replace('x', '');
        x += value === '' ? 1 : value === '-' ? -1 : Number(value);
      } else {
        c += Number(part);
      }
    }
    if (Number.isNaN(x) || Number.isNaN(c)) return null;
    return { x, c };
  }

  function randomProblem(skill) {
    const bank = problemBank[skill] || problemBank.two_step_equations;
    return bank[Math.floor(Math.random() * bank.length)];
  }

  function nextSupportedIndex(items, current) {
    for (let i = current + 1; i < items.length; i++) if (items[i].supported) return i;
    const first = items.findIndex((item) => item.supported);
    return first === -1 ? 0 : first;
  }

  function addWeakTerms(terms) {
    terms.forEach((term) => {
      if (term && !state.progress.weakTerms.includes(term)) state.progress.weakTerms.push(term);
    });
    state.progress.weakTerms = state.progress.weakTerms.slice(0, 30);
  }

  function addWeakSubject(subject) {
    state.progress.weakSubjects[subject] = (state.progress.weakSubjects[subject] || 0) + 1;
  }

  function recommendNext(p, weakestSkill, commonMistake) {
    if (!p.sessions) return 'Start with the Learn Workspace.';
    if (p.mathProblemsAttempted && percent(p.correctAnswers, p.mathProblemsAttempted) < 80) return `Practice ${titleSkill(weakestSkill)} and watch for ${readableMistake(commonMistake)}.`;
    if (p.weakTerms.length) return `Review these terms: ${p.weakTerms.slice(0, 3).join(', ')}.`;
    return 'Build a new session and use teach-back mode.';
  }

  function skillAccuracy(skill) { return skill.attempts ? skill.correct / skill.attempts : 1; }
  function percent(part, total) { return total ? Math.round((part / total) * 100) : 0; }
  function nearly(a, b) { return Math.abs(a - b) < 0.000001; }
  function parseCoefficient(value) { return value === '' || value === '+' ? 1 : value === '-' ? -1 : Number(value); }
  function countMatches(text, words) { return words.reduce((n, word) => n + (text.includes(word) ? 1 : 0), 0); }
  function countRegex(text, regexes) { return regexes.reduce((n, regex) => n + (regex.test(text) ? 1 : 0), 0); }
  function labelSubject(subject) { return ({ math: 'Math', science: 'Science', english: 'English / Reading', history: 'History / Social Studies', coding: 'Coding', language: 'Foreign Language', general: 'General Study' }[subject] || subject); }
  function titleSkill(skill) { return ({ two_step_equations: 'Two-step equations', combining_like_terms: 'Combining like terms', distributive_property: 'Distributive property' }[skill] || skill); }
  function readableMistake(type) { return String(type || 'None yet').replace(/_/g, ' '); }
  function formatNumber(n) { return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))); }
  function formatSigned(n) { return n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`; }
  function formatTerm(n, variable) { return n === 1 ? variable : n === -1 ? `-${variable}` : `${n}${variable}`; }
  function formatExpression(x, c) { return `${formatTerm(x, 'x')} ${formatSigned(c)}`; }

  function setStatus(message) { if (els.uploadMessage) els.uploadMessage.textContent = message; }
  function qs(selector) { return document.querySelector(selector); }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function div(className, children, text) { const node = document.createElement('div'); if (className) node.className = className; if (text !== undefined) node.textContent = text; if (children) children.forEach((child) => node.append(child)); return node; }
  function span(text, className) { const node = document.createElement('span'); if (className) node.className = className; node.textContent = text; return node; }
  function strong(text) { const node = document.createElement('strong'); node.textContent = text; return node; }
  function heading(text, level) { const node = document.createElement(`h${level}`); node.textContent = text; return node; }
  function textP(text, className) { const node = document.createElement('p'); if (className) node.className = className; node.textContent = text; return node; }
  function labelText(text, className) { const node = document.createElement('p'); node.className = className || 'micro-label'; node.textContent = text; return node; }
  function buttonEl(text, className, handler) { const node = document.createElement('button'); node.type = 'button'; node.className = className; node.textContent = text; if (handler) node.addEventListener('click', handler); return node; }
  function buttonSetDone(button, text) { button.textContent = text; button.disabled = true; }
  function list(items, className) { const node = document.createElement('ul'); if (className) node.className = className; (items.length ? items : ['No items found yet.']).forEach((item) => { const li = document.createElement('li'); li.textContent = item; node.append(li); }); return node; }
  function statPill(label, value) { const node = div('subject-pill'); node.append(strong(label), document.createTextNode(` ${value}`)); return node; }
  function toolCard(title, body) { const node = div('tool-card'); node.append(strong(title), textP(body)); return node; }
  function feedbackBox(title, body) { const node = div('feedback-box'); node.append(strong(title), textP(body)); return node; }
  function statCard(label, value) { const node = div('stat-card'); node.append(div('stat-value', null, String(value)), textP(label, 'stat-label')); return node; }
  function wideCard(title, body) { const node = div('stat-card wide-card'); node.append(heading(title, 3), textP(body)); return node; }
  function reviewCard(title, body) { const node = div('review-card'); node.append(heading(title, 3), textP(body)); return node; }
})();
