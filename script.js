const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const checklistBtn = document.getElementById("checklistBtn");
const checklistPanel = document.getElementById("checklistPanel");
const checklistCloseBtn = document.getElementById("checklistClose");
const checklistForm = document.getElementById("checklistForm");
const checklistInput = document.getElementById("checklistInput");
const checklistItems = document.getElementById("checklistItems");
const calculatorBtn = document.getElementById("calculatorBtn");
const calculatorPanel = document.getElementById("calculatorPanel");
const calculatorCloseBtn = document.getElementById("calculatorClose");
const monthLabel = document.getElementById("monthLabel");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

const lightBtn = document.getElementById("lightTheme");
const darkBtn = document.getElementById("darkTheme");
const categories = [
  { id: "matDryck", label: "Mat & dryck", icon: "🍽️" },
  { id: "boende", label: "Hus och el", icon: "🏠" },
  { id: "studielan", label: "Studielån", icon: "🎓" },
  { id: "transport", label: "Transport", icon: "🚗" },
  { id: "abonnemang", label: "Abonnemang & tjänster", icon: "📱" },
  { id: "nojen", label: "Nöjen & fritid", icon: "🎉" },
  { id: "sparande", label: "Sparande", icon: "💰" },
  { id: "ovrigt", label: "Övrigt", icon: "🧾" },
];
const STORAGE_KEY = "budgetApp";
const panels = [settingsPanel, checklistPanel, calculatorPanel];
const panelButtons = [settingsBtn, checklistBtn, calculatorBtn];

function formatMonth(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function currentMonthId() {
  return formatMonth(new Date());
}

function shiftMonth(monthId, delta) {
  const [year, month] = monthId.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return formatMonth(d);
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

function formatMonthLabel(monthId) {
  const [year, month] = monthId.split("-").map(Number);
  const name = monthNames[month - 1] || monthId;
  return `${name} ${year}`;
}

function loadRoot() {
  return (
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      activeMonth: currentMonthId(),
      months: {},
    }
  );
}

function saveRoot() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
}

let root = loadRoot();
let activeMonth = root.activeMonth || currentMonthId();

function ensureMonthInRoot(monthId) {
  if (!root.months[monthId]) {
    root.months[monthId] = { budget: 0, expenses: [], checklist: [] };
  }
}

function migrateLegacy() {
  const legacyExpenses = JSON.parse(localStorage.getItem("expenses") || "[]");
  const legacyBudget = Number(localStorage.getItem("budget")) || 0;
  const legacyChecklist = JSON.parse(localStorage.getItem("checklist") || "[]");

  if (
    legacyExpenses.length ||
    legacyBudget ||
    legacyChecklist.length
  ) {
    ensureMonthInRoot(activeMonth);
    const month = root.months[activeMonth];
    if (!month.expenses.length && month.budget === 0 && !month.checklist.length) {
      month.budget = legacyBudget;
      month.expenses = legacyExpenses.map((expense) => ({
        title: expense.title,
        amount: Number(expense.amount),
        category: expense.category || "ovrigt",
        createdAt: expense.createdAt || new Date().toISOString(),
      }));
      month.checklist = legacyChecklist;
      saveRoot();
    }
  }
}

migrateLegacy();
ensureMonthInRoot(activeMonth);
root.activeMonth = activeMonth;
saveRoot();

function closeAllPanels() {
  panels.forEach((panel) => panel.classList.add("hidden"));
}

function togglePanel(panel) {
  const shouldOpen = panel.classList.contains("hidden");
  closeAllPanels();

  if (shouldOpen) {
    panel.classList.remove("hidden");
  }
}

// öppna / stäng panel
settingsBtn.addEventListener("click", () => {
  togglePanel(settingsPanel);
});

// stäng om man klickar utanför
document.addEventListener("click", (e) => {
  const insidePanel = panels.some((panel) => panel.contains(e.target));
  const onButton = panelButtons.some((btn) => btn.contains(e.target));

  if (!insidePanel && !onButton) {
    closeAllPanels();
  }
});

// sätt tema
function setTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  settingsPanel.classList.add("hidden");
}

lightBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  setTheme("light");
});

darkBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  setTheme("dark");
});

// ladda sparat tema
const savedTheme = localStorage.getItem("theme") || "light";
setTheme(savedTheme);
const budgetInput = document.getElementById("budget-input");
const remainingEl = document.getElementById("remaining");

const chartCanvas = document.getElementById("expenseChart");
let expenseChart = null;
const form = document.getElementById("expense-form");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const categoryLists = document.getElementById("categoryLists");
const totalEl = document.getElementById("total");

function getMonthData() {
  ensureMonthInRoot(activeMonth);
  return root.months[activeMonth];
}

function saveMonthData(monthData) {
  root.months[activeMonth] = monthData;
  root.activeMonth = activeMonth;
  saveRoot();
}

function renderChart(groupedData) {
  const visibleGroups = groupedData.filter((group) => group.total > 0);
  const labels = visibleGroups.map((group) =>
    `${group.icon ? group.icon + " " : ""}${group.label}`
  );
  const data = visibleGroups.map((group) => group.total);
  const total = data.reduce((sum, value) => sum + value, 0) || 1;

  if (expenseChart) {
    expenseChart.destroy();
  }

  if (data.length === 0) {
    return;
  }

  expenseChart = new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
        },
      ],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              const formatted = value.toLocaleString("sv-SE");
              return `${context.label}: ${formatted} SEK (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

function deleteExpense(index) {
  const monthData = getMonthData();
  monthData.expenses.splice(index, 1);
  saveMonthData(monthData);
  renderAll();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const monthData = getMonthData();
  const expense = {
    title: titleInput.value,
    amount: parseFloat(amountInput.value),
    category: categorySelect.value,
    createdAt: new Date().toISOString(),
  };

  monthData.expenses.push(expense);
  saveMonthData(monthData);
  form.reset();
  renderAll();
});

function updateRemaining(totalExpenses, budget) {
  const remaining = budget - totalExpenses;
  remainingEl.textContent = remaining.toLocaleString("sv-SE");
}

function renderExpenses(monthData) {
  categoryLists.innerHTML = "";
  const grouped = getGroupedExpenses(monthData.expenses);

  grouped.forEach((group) => {
    const section = document.createElement("section");
    section.className = "category-group";

    const heading = document.createElement("div");
    heading.className = "category-heading";
    const title = document.createElement("h3");
    title.textContent = `${group.icon ? group.icon + " " : ""}${group.label}`;
    const amount = document.createElement("span");
    amount.textContent = `${group.total.toLocaleString("sv-SE")} SEK`;
    heading.appendChild(title);
    heading.appendChild(amount);
    section.appendChild(heading);

    if (group.items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "category-empty";
      empty.textContent = "Inga utgifter";
      section.appendChild(empty);
    } else {
      const ul = document.createElement("ul");
      group.items.forEach((expense) => {
        const li = document.createElement("li");
        li.textContent = `${expense.title} - ${expense.amount.toLocaleString("sv-SE")} SEK`;

        const btn = document.createElement("button");
        btn.textContent = "Ta bort";
        btn.onclick = () => deleteExpense(expense.index);

        li.appendChild(btn);
        ul.appendChild(li);
      });
      section.appendChild(ul);
    }

    categoryLists.appendChild(section);
  });

  const total = grouped.reduce((sum, group) => sum + group.total, 0);
  totalEl.textContent = total.toLocaleString("sv-SE");
  updateRemaining(total, monthData.budget);
  renderChart(grouped);
}

function getGroupedExpenses(expenses = []) {
  const map = {};
  categories.forEach((category) => {
    map[category.id] = { ...category, items: [], total: 0 };
  });

  expenses.forEach((expense, index) => {
    const bucket = map[expense.category] || map.ovrigt;
    const amount = Number(expense.amount) || 0;
    bucket.items.push({
      title: expense.title,
      amount,
      index,
    });
    bucket.total += amount;
  });

  return Object.values(map);
}

function renderAll() {
  const monthData = getMonthData();
  monthLabel.textContent = formatMonthLabel(activeMonth);
  budgetInput.value = monthData.budget || "";
  renderExpenses(monthData);
  renderChecklist(monthData);
}

function changeMonth(delta) {
  activeMonth = shiftMonth(activeMonth, delta);
  ensureMonthInRoot(activeMonth);
  root.activeMonth = activeMonth;
  saveRoot();
  renderAll();
}

prevMonthBtn.addEventListener("click", () => changeMonth(-1));
nextMonthBtn.addEventListener("click", () => changeMonth(1));


budgetInput.addEventListener("input", () => {
  const monthData = getMonthData();
  monthData.budget = Number(budgetInput.value) || 0;
  saveMonthData(monthData);
  renderAll();
});

const calcInput = document.getElementById("calcInput");
const calcBtn = document.getElementById("calcBtn");
const calcResult = document.getElementById("calcResult");

calcBtn.addEventListener("click", () => {
  try {
    // räkna uttrycket
    const result = Function(`"use strict"; return (${calcInput.value})`)();

    if (typeof result === "number" && !isNaN(result)) {
      calcResult.textContent = result.toLocaleString("sv-SE");
    } else {
      calcResult.textContent = "Ogiltigt";
    }
  } catch {
    calcResult.textContent = "Fel";
  }
});

// öppna / stäng checklist-panel
checklistBtn.addEventListener("click", () => {
  togglePanel(checklistPanel);
});

// stäng checklist-panel
checklistCloseBtn.addEventListener("click", () => {
  checklistPanel.classList.add("hidden");
});

// öppna miniräknar-panel
calculatorBtn.addEventListener("click", () => {
  togglePanel(calculatorPanel);
});

calculatorCloseBtn.addEventListener("click", () => {
  calculatorPanel.classList.add("hidden");
});

// render checklist
function renderChecklist(monthData = getMonthData()) {
  const checklist = monthData.checklist || [];
  checklistItems.innerHTML = "";

  checklist.forEach((item, index) => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.done;

    checkbox.addEventListener("change", () => {
      const updated = getMonthData();
      updated.checklist[index].done = checkbox.checked;
      saveMonthData(updated);
      renderChecklist(updated);
    });

    const text = document.createElement("span");
    text.textContent = item.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "checklist-delete";
    deleteBtn.setAttribute("aria-label", "Ta bort punkt");
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      removeChecklistItem(index);
    });

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);
    checklistItems.appendChild(li);
  });
}

function removeChecklistItem(index) {
  const monthData = getMonthData();
  monthData.checklist.splice(index, 1);
  saveMonthData(monthData);
  renderChecklist(monthData);
}

function saveChecklist(newChecklist) {
  const monthData = getMonthData();
  monthData.checklist = newChecklist;
  saveMonthData(monthData);
  renderChecklist(monthData);
}

// add item
checklistForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const monthData = getMonthData();
  monthData.checklist.push({
    text: checklistInput.value,
    done: false
  });

  checklistInput.value = "";
  saveMonthData(monthData);
  renderChecklist(monthData);
});

renderAll();
