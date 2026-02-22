let chartInstance = null;

document.getElementById("addBtn").addEventListener("click", addTransaction);
document.getElementById("saveBudget").addEventListener("click", saveBudget);
document.getElementById("addCategoryBtn").addEventListener("click", addCategory);

document.getElementById("settingsBtn").addEventListener("click", () => {
  document.getElementById("settingsModal").classList.remove("hidden");
});

document.getElementById("saveAuth").addEventListener("click", () => {
  const token = document.getElementById("token").value;
  const username = document.getElementById("username").value;

  saveCredentials(token, username);
  document.getElementById("settingsModal").classList.add("hidden");
  loadTransactions();
});

async function loadTransactions() {
  try {
    const creds = getCredentials();
    if (!creds.token || !creds.username) return;

    const { content } = await getData();

    // Ensure categories array exists
    if (!content.settings.categories || !Array.isArray(content.settings.categories) || content.settings.categories.length === 0) {
      content.settings.categories = ["Alimentação", "Transportes", "Lazer", "Outros"];
    }

    renderCategoriesUI(content.settings.categories);

    const container = document.getElementById("transactions");
    container.innerHTML = "";

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let totalExpense = 0;
    let totalIncome = 0;

    // For the chart
    const expensesByCategory = {};

    content.transactions.forEach(t => {
      const type = t.type || "expense"; // Fallback para transações antigas
      const isCurrentMonth = new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear;

      if (isCurrentMonth) {
        if (type === "expense") {
          totalExpense += t.amount;
          expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        } else {
          totalIncome += t.amount;
        }
      }

      const div = document.createElement("div");
      div.className = "transaction-card";

      const isIncome = type === "income";
      const color = isIncome ? "#10b981" : "#ef4444";
      const sign = isIncome ? "+" : "-";

      div.innerHTML = `
        <strong style="color: ${color}">${sign}${t.amount}€</strong> - ${t.category}<br/>
        <small>${t.date} | ${t.description}</small>
        <div class="actions">
          <button onclick="editTransaction(${t.id})">✏️</button>
          <button onclick="deleteTransaction(${t.id})">🗑️</button>
        </div>
      `;

      container.appendChild(div);
    });

    updateDashboard(totalIncome, totalExpense, content.settings.monthlyBudget);
    renderChart(expensesByCategory);

  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}

function renderCategoriesUI(categories) {
  const select = document.getElementById("category");
  const list = document.getElementById("categoriesList");

  select.innerHTML = "";
  list.innerHTML = "";

  categories.forEach(c => {
    // Add to Select
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    select.appendChild(option);

    // Add to List
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.background = "#fff";
    li.style.padding = "8px";
    li.style.marginBottom = "5px";
    li.style.borderRadius = "5px";
    li.style.border = "1px solid #eee";

    li.innerHTML = `
      <span style="display:flex; align-items:center;">${c}</span>
      <button style="width:30px; padding:5px; background:#ef4444; margin:0;" onclick="deleteCategory('${c}')">X</button>
    `;
    list.appendChild(li);
  });
}

async function addCategory() {
  const input = document.getElementById("newCategory");
  const val = input.value.trim();
  if (!val) return;

  const { content, sha } = await getData();
  if (!content.settings.categories) content.settings.categories = ["Alimentação", "Transportes", "Lazer", "Outros"];

  if (!content.settings.categories.includes(val)) {
    content.settings.categories.push(val);
    await updateData(content, sha);
    input.value = "";
    await loadTransactions();
  }
}

async function deleteCategory(cat) {
  if (!confirm(`Remover categoria: ${cat}?`)) return;
  const { content, sha } = await getData();
  if (content.settings.categories) {
    content.settings.categories = content.settings.categories.filter(c => c !== cat);
    await updateData(content, sha);
    await loadTransactions();
  }
}
window.deleteCategory = deleteCategory;

function updateDashboard(incomes, expenses, budget) {
  document.getElementById("totalIncome").textContent = incomes.toFixed(2) + "€";
  document.getElementById("totalSpent").textContent = expenses.toFixed(2) + "€";

  const balance = incomes - expenses;
  const balanceEl = document.getElementById("balance");
  balanceEl.textContent = balance.toFixed(2) + "€";
  balanceEl.style.color = balance >= 0 ? "#10b981" : "#ef4444";

  document.getElementById("monthlyBudget").textContent = (budget || 0) + "€";

  const remaining = (budget || 0) - expenses;
  document.getElementById("remaining").textContent = remaining.toFixed(2) + "€";

  const percent = budget > 0 ? (expenses / budget) * 100 : 0;
  document.getElementById("progress").style.width = Math.min(percent, 100) + "%";
  document.getElementById("progress").style.backgroundColor = percent > 100 ? "#ef4444" : "#4f46e5";
}

function renderChart(expensesByCategory) {
  const ctx = document.getElementById('categoryChart').getContext('2d');

  const labels = Object.keys(expensesByCategory);
  const data = Object.values(expensesByCategory);

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
          '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}

async function addTransaction() {
  const date = document.getElementById("date").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;
  const type = document.getElementById("type").value;

  if (!date || isNaN(amount)) {
    alert("Preencha a data e o valor.");
    return;
  }

  const { content, sha } = await getData();

  content.transactions.push({
    id: Date.now(),
    date,
    amount,
    category,
    description,
    type
  });

  await updateData(content, sha);
  document.getElementById("amount").value = "";
  document.getElementById("description").value = "";

  await loadTransactions();
}

async function saveBudget() {
  const budget = parseFloat(document.getElementById("budgetInput").value);
  const { content, sha } = await getData();

  content.settings.monthlyBudget = budget;

  await updateData(content, sha);
  document.getElementById("budgetInput").value = "";
  await loadTransactions();
}

window.onload = loadTransactions;

async function deleteTransaction(id) {
  if (!confirm("O utilizador de certeza quer eliminar?")) return;
  const { content, sha } = await getData();

  content.transactions = content.transactions.filter(t => t.id !== id);

  await updateData(content, sha);
  await loadTransactions();
}

async function editTransaction(id) {
  const { content, sha } = await getData();
  const transaction = content.transactions.find(t => t.id === id);

  const newAmount = prompt("Novo valor:", transaction.amount);
  const newCategoryInput = prompt("Nova categoria:", transaction.category);
  const newDescription = prompt("Nova descrição:", transaction.description);

  if (newAmount !== null) transaction.amount = parseFloat(newAmount);
  if (newCategoryInput !== null) transaction.category = newCategoryInput;
  if (newDescription !== null) transaction.description = newDescription;

  await updateData(content, sha);
  await loadTransactions();
}

window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;