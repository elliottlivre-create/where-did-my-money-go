const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

const lightBtn = document.getElementById("lightTheme");
const darkBtn = document.getElementById("darkTheme");

// öppna / stäng panel
settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});

// stäng om man klickar utanför
document.addEventListener("click", (e) => {
  if (
    !settingsPanel.contains(e.target) &&
    !settingsBtn.contains(e.target)
  ) {
    settingsPanel.classList.add("hidden");
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

let budget = Number(localStorage.getItem("budget")) || 0;
budgetInput.value = budget;
function renderChart() {
  const labels = expenses.map(e => e.title);
  const data = expenses.map(e => e.amount);
  const total = data.reduce((sum, value) => sum + value, 0);

  if (expenseChart) {
    expenseChart.destroy();
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
              return `${context.label}: ${value} SEK (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}
const chartCanvas = document.getElementById("expenseChart");
let expenseChart = null;
const form = document.getElementById("expense-form");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const list = document.getElementById("expense-list");
const totalEl = document.getElementById("total");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];



function deleteExpense(index) {
    expenses.splice(index, 1);
    renderExpenses();
}

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const expense = {
        title: titleInput.value, 
        amount: parseFloat(amountInput.value),
    };

    expenses.push(expense);
    form.reset();
    renderExpenses();
});

function updateRemaining(totalExpenses) {
  const remaining = budget - totalExpenses;
  remainingEl.textContent = remaining.toLocaleString("sv-SE");
}

renderExpenses();
function renderExpenses() {
  list.innerHTML = "";
  let total = 0;

  expenses.forEach((expense, index) => {
    total += expense.amount;

    const li = document.createElement("li");
    li.textContent = `${expense.title} - ${expense.amount} SEK`;

    const btn = document.createElement("button");
    btn.textContent = "Ta bort";
    btn.onclick = () => deleteExpense(index);

    li.appendChild(btn);
    list.appendChild(li);
  });

  // 👇 HÄR är slutet
  totalEl.textContent = total.toLocaleString("sv-SE");
updateRemaining(total);
localStorage.setItem("expenses", JSON.stringify(expenses));
renderChart();
}


budgetInput.addEventListener("input", () => {
  budget = Number(budgetInput.value);
  localStorage.setItem("budget", budget);
  renderExpenses();
});
