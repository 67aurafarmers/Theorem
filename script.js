const STORAGE_KEY = "decision-desk-tasks-v1";

const taskForm = document.querySelector("#taskForm");
const taskTitle = document.querySelector("#taskTitle");
const impactInput = document.querySelector("#impact");
const urgencyInput = document.querySelector("#urgency");
const effortInput = document.querySelector("#effort");

const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const taskCount = document.querySelector("#taskCount");
const summaryText = document.querySelector("#summaryText");
const toast = document.querySelector("#toast");

const showAllBtn = document.querySelector("#showAllBtn");
const showActiveBtn = document.querySelector("#showActiveBtn");
const showDoneBtn = document.querySelector("#showDoneBtn");
const clearDoneBtn = document.querySelector("#clearDoneBtn");

let tasks = loadTasks();
let currentFilter = "all";

function createTask(title, impact, urgency, effort) {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    impact: Number(impact),
    urgency: Number(urgency),
    effort: Number(effort),
    done: false,
    createdAt: Date.now()
  };
}

function calculateScore(task) {
  return task.impact * 2 + task.urgency * 2 - task.effort;
}

function getRankedTasks() {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return Number(a.done) - Number(b.done);

    const scoreDifference = calculateScore(b) - calculateScore(a);
    if (scoreDifference !== 0) return scoreDifference;

    return b.createdAt - a.createdAt;
  });
}

function getVisibleTasks() {
  const rankedTasks = getRankedTasks();

  if (currentFilter === "active") {
    return rankedTasks.filter(task => !task.done);
  }

  if (currentFilter === "done") {
    return rankedTasks.filter(task => task.done);
  }

  return rankedTasks;
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(task => {
      return (
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.impact === "number" &&
        typeof task.urgency === "number" &&
        typeof task.effort === "number" &&
        typeof task.done === "boolean"
      );
    });
  } catch {
    return [];
  }
}

function render() {
  const visibleTasks = getVisibleTasks();
  taskList.innerHTML = "";

  visibleTasks.forEach((task, index) => {
    const card = document.createElement("article");
    card.className = `task-card ${task.done ? "done" : ""}`;

    const score = calculateScore(task);

    card.innerHTML = `
      <div class="rank">#${index + 1}</div>

      <div class="task-main">
        <div class="task-title">${escapeHTML(task.title)}</div>

        <div class="task-meta">
          <span class="pill score-pill">Score ${score}</span>
          <span class="pill">Impact ${labelValue(task.impact)}</span>
          <span class="pill">Urgency ${labelValue(task.urgency)}</span>
          <span class="pill">Effort ${labelValue(task.effort)}</span>
        </div>
      </div>

      <div class="task-actions">
        <button class="icon-btn" type="button" data-action="toggle" data-id="${task.id}" aria-label="Toggle done">
          ${task.done ? "↩" : "✓"}
        </button>
        <button class="icon-btn" type="button" data-action="delete" data-id="${task.id}" aria-label="Delete task">
          ✕
        </button>
      </div>
    `;

    taskList.appendChild(card);
  });

  const activeTasks = tasks.filter(task => !task.done);
  const doneTasks = tasks.filter(task => task.done);

  taskCount.textContent = activeTasks.length;

  if (tasks.length === 0) {
    summaryText.textContent = "Add your first task to begin.";
  } else if (activeTasks.length === 0) {
    summaryText.textContent = `Everything is done. ${doneTasks.length} completed.`;
  } else {
    const topTask = getRankedTasks().find(task => !task.done);
    summaryText.textContent = `Best next move: ${topTask.title}`;
  }

  emptyState.classList.toggle("visible", visibleTasks.length === 0);
}

function labelValue(value) {
  const labels = {
    1: "1",
    2: "2",
    3: "3",
    4: "4",
    5: "5"
  };

  return labels[value] || String(value);
}

function escapeHTML(text) {
  return text.replace(/[&<>"']/g, character => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return replacements[character];
  });
}

function setFilter(filter) {
  currentFilter = filter;

  showAllBtn.classList.toggle("active", filter === "all");
  showActiveBtn.classList.toggle("active", filter === "active");
  showDoneBtn.classList.toggle("active", filter === "done");

  render();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 1800);
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskTitle.value.trim();

  if (title.length < 2) {
    showToast("Add a clearer task name.");
    taskTitle.focus();
    return;
  }

  const task = createTask(
    title,
    impactInput.value,
    urgencyInput.value,
    effortInput.value
  );

  tasks.push(task);
  saveTasks();
  render();

  taskForm.reset();
  impactInput.value = "3";
  urgencyInput.value = "3";
  effortInput.value = "3";
  taskTitle.focus();

  showToast("Decision added.");
});

taskList.addEventListener("click", event => {
  const button = event.target.closest("button");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "toggle") {
    tasks = tasks.map(task => {
      if (task.id !== id) return task;
      return { ...task, done: !task.done };
    });

    saveTasks();
    render();
    showToast("Status updated.");
  }

  if (action === "delete") {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    render();
    showToast("Decision deleted.");
  }
});

showAllBtn.addEventListener("click", () => setFilter("all"));
showActiveBtn.addEventListener("click", () => setFilter("active"));
showDoneBtn.addEventListener("click", () => setFilter("done"));

clearDoneBtn.addEventListener("click", () => {
  const doneCount = tasks.filter(task => task.done).length;

  if (doneCount === 0) {
    showToast("No completed tasks to clear.");
    return;
  }

  tasks = tasks.filter(task => !task.done);
  saveTasks();
  render();
  showToast(`${doneCount} completed task${doneCount === 1 ? "" : "s"} cleared.`);
});

render();
