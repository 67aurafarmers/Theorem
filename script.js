const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const feedback = document.getElementById("feedback");
const currentTask = document.getElementById("currentTask");
const statusPill = document.getElementById("statusPill");
const timer = document.getElementById("timer");
const timerLabel = document.getElementById("timerLabel");
const progressCircle = document.getElementById("progressCircle");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const themeBtn = document.getElementById("themeBtn");
const completedCount = document.getElementById("completedCount");
const streakCount = document.getElementById("streakCount");
const minutesCount = document.getElementById("minutesCount");
const winsList = document.getElementById("winsList");

const FOCUS_SECONDS = 25 * 60;
const CIRCLE_LENGTH = 603;

let state = {
  task: "",
  secondsLeft: FOCUS_SECONDS,
  isRunning: false,
  timerId: null,
  completed: 0,
  minutes: 0,
  streak: 0,
  wins: []
};

function loadState() {
  const saved = localStorage.getItem("orbitFocusState");

  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);

    state.completed = Number(parsed.completed) || 0;
    state.minutes = Number(parsed.minutes) || 0;
    state.streak = Number(parsed.streak) || 0;
    state.wins = Array.isArray(parsed.wins) ? parsed.wins.slice(0, 5) : [];
  } catch {
    localStorage.removeItem("orbitFocusState");
  }
}

function saveState() {
  localStorage.setItem(
    "orbitFocusState",
    JSON.stringify({
      completed: state.completed,
      minutes: state.minutes,
      streak: state.streak,
      wins: state.wins
    })
  );
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function setFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

function updateTimerView() {
  timer.textContent = formatTime(state.secondsLeft);

  const progress = 1 - state.secondsLeft / FOCUS_SECONDS;
  const dashOffset = CIRCLE_LENGTH - progress * CIRCLE_LENGTH;

  progressCircle.style.strokeDashoffset = dashOffset;
}

function updateDashboard() {
  currentTask.textContent = state.task || "No mission yet. Type one task above to begin.";
  currentTask.className = state.task ? "" : "empty-state";

  statusPill.textContent = state.isRunning ? "Active" : state.task ? "Paused" : "Idle";
  statusPill.className = state.isRunning ? "pill active" : "pill";

  completedCount.textContent = state.completed;
  streakCount.textContent = state.streak;
  minutesCount.textContent = state.minutes;

  winsList.innerHTML = "";

  if (state.wins.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Completed missions will appear here.";
    winsList.appendChild(empty);
    return;
  }

  state.wins.forEach((win) => {
    const item = document.createElement("li");
    item.textContent = win;
    winsList.appendChild(item);
  });
}

function render() {
  updateTimerView();
  updateDashboard();
}

function stopTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.isRunning = false;
}

function completeSprint() {
  stopTimer();

  const completedTask = state.task || "Focus sprint";

  state.completed += 1;
  state.minutes += 25;
  state.streak = Math.max(1, state.streak);
  state.wins.unshift(completedTask);
  state.wins = state.wins.slice(0, 5);

  state.task = "";
  state.secondsLeft = FOCUS_SECONDS;

  saveState();
  setFeedback("Sprint complete. That is real momentum.", "success");
  timerLabel.textContent = "Mission complete";
  render();
}

function tick() {
  if (state.secondsLeft <= 1) {
    completeSprint();
    return;
  }

  state.secondsLeft -= 1;
  render();
}

function startFocus(taskText) {
  stopTimer();

  state.task = taskText;
  state.secondsLeft = FOCUS_SECONDS;
  state.isRunning = true;
  timerLabel.textContent = "Focus sprint";

  state.timerId = setInterval(tick, 1000);

  setFeedback("Focus sprint started. Keep the orbit clean.", "success");
  render();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const taskText = taskInput.value.trim();

  if (taskText.length < 2) {
    setFeedback("Add a real mission first.", "error");
    taskInput.focus();
    return;
  }

  taskInput.value = "";
  startFocus(taskText);
});

pauseBtn.addEventListener("click", () => {
  if (!state.task) {
    setFeedback("Start a mission before pausing.", "error");
    return;
  }

  if (state.isRunning) {
    stopTimer();
    setFeedback("Paused. Your mission is saved on screen.");
  } else {
    state.isRunning = true;
    state.timerId = setInterval(tick, 1000);
    setFeedback("Back in motion.", "success");
  }

  render();
});

resetBtn.addEventListener("click", () => {
  stopTimer();

  state.task = "";
  state.secondsLeft = FOCUS_SECONDS;
  timerLabel.textContent = "Focus sprint";

  setFeedback("Reset complete. Choose the next mission.");
  render();
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");

  const isLight = document.body.classList.contains("light");
  localStorage.setItem("orbitFocusTheme", isLight ? "light" : "dark");

  setFeedback(isLight ? "Light mood activated." : "Dark mood activated.", "success");
});

function loadTheme() {
  const theme = localStorage.getItem("orbitFocusTheme");

  if (theme === "light") {
    document.body.classList.add("light");
  }
}

loadTheme();
loadState();
render();
