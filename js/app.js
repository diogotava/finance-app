let chartInstance = null;

const defaultCategories = {
  expense: ["Alimentação", "Transportes", "Lazer", "Outros"],
  income: ["Salário", "Investimentos", "Vendas", "Outros"]
};

// Event Listeners - Addition
document.getElementById("addBtn").addEventListener("click", addTransaction);
document.getElementById("saveBudget").addEventListener("click", saveBudget);
document.getElementById("addCategoryBtn").addEventListener("click", addCategory);

// Modais Lógica
document.getElementById("settingsBtn").addEventListener("click", () => {
  document.getElementById("settingsModal").classList.remove("hidden");
});
document.getElementById("closeSettingsBtn").addEventListener("click", () => {
  document.getElementById("settingsModal").classList.add("hidden");
});
document.getElementById("closeEditBtn").addEventListener("click", () => {
  document.getElementById("editModal").classList.add("hidden");
});

document.getElementById("saveAuth").addEventListener("click", () => {
  const token = document.getElementById("token").value;
  const username = document.getElementById("username").value;

  saveCredentials(token, username);
  document.getElementById("settingsModal").classList.add("hidden");
  loadTransactions();
});

// Atualizar select de categorias baseado no tipo (Gasto/Recebimento)
document.getElementById("type").addEventListener("change", async () => {
  const t = document.getElementById("type").value;
  const { content } = await getData();
  const cats = ensureCategoriesStruct(content.settings.categories);
  renderCategorySelect(document.getElementById("category"), cats[t]);
});

document.getElementById("manageCategoryType").addEventListener("change", async () => {
  const t = document.getElementById("manageCategoryType").value;
  const { content } = await getData();
  const cats = ensureCategoriesStruct(content.settings.categories);
  renderCategoryList(cats[t]);
});

document.getElementById("editType").addEventListener("change", async () => {
  const t = document.getElementById("editType").value;
  const { content } = await getData();
  const cats = ensureCategoriesStruct(content.settings.categories);
  renderCategorySelect(document.getElementById("editCategory"), cats[t]);
});

// Guardar edições pelo modal
document.getElementById("saveEditBtn").addEventListener("click", saveEditedTransaction);

function ensureCategoriesStruct(categories) {
  // Migração de array antigo para o novo formato { income: [], expense: [] }
  if (!categories || Array.isArray(categories)) {
    return defaultCategories;
  }
  if (!categories.expense || !categories.income) {
    return defaultCategories;
  }
  return categories;
}

async function loadTransactions() {
  try {
    const creds = getCredentials();
    if (!creds.token || !creds.username) return;

    const { content, sha } = await getData();

    // Validate or Migrate categories format
    let migated = false;
    if (!content.settings.categories || Array.isArray(content.settings.categories)) {
      content.settings.categories = defaultCategories;
      migrated = true;
    }

    if (migrated) {
      await updateData(content, sha);
    }

    const typeAdd = document.getElementById("type").value;
    const typeManage = document.getElementById("manageCategoryType").value;

    renderCategorySelect(document.getElementById("category"), content.settings.categories[typeAdd]);
    renderCategoryList(content.settings.categories[typeManage]);

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
          <button onclick="openEditModal(${t.id})">✏️</button>
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

function renderCategorySelect(selectElement, categories) {
  selectElement.innerHTML = "";
  categories.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    selectElement.appendChild(option);
  });
}

function renderCategoryList(categories) {
  const list = document.getElementById("categoriesList");
  const typeManage = document.getElementById("manageCategoryType").value;

  list.innerHTML = "";
  categories.forEach(c => {
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
      <button style="width:30px; padding:5px; background:#ef4444; margin:0;" onclick="deleteCategory('${c}', '${typeManage}')">X</button>
    `;
    list.appendChild(li);
  });
}

async function addCategory() {
  const input = document.getElementById("newCategory");
  const val = input.value.trim();
  const typeManage = document.getElementById("manageCategoryType").value;

  if (!val) return;

  const { content, sha } = await getData();
  const cats = ensureCategoriesStruct(content.settings.categories);
  content.settings.categories = cats;

  if (!content.settings.categories[typeManage].includes(val)) {
    content.settings.categories[typeManage].push(val);
    await updateData(content, sha);
    input.value = "";
    await loadTransactions();
  }
}

async function deleteCategory(cat, type) {
  if (!confirm(`Remover categoria: ${cat}?`)) return;
  const { content, sha } = await getData();
  const cats = ensureCategoriesStruct(content.settings.categories);

  cats[type] = cats[type].filter(c => c !== cat);
  content.settings.categories = cats;

  await updateData(content, sha);
  await loadTransactions();
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

async function openEditModal(id) {
  const { content } = await getData();
  const transaction = content.transactions.find(t => t.id === id);
  if (!transaction) return;

  const cats = ensureCategoriesStruct(content.settings.categories);

  document.getElementById("editId").value = transaction.id;
  document.getElementById("editType").value = transaction.type || "expense";
  document.getElementById("editDate").value = transaction.date;
  document.getElementById("editAmount").value = transaction.amount;
  document.getElementById("editDescription").value = transaction.description || "";

  // Carregar categorias baseadas no tipo
  const catSelect = document.getElementById("editCategory");
  renderCategorySelect(catSelect, cats[transaction.type || "expense"]);

  // Garantir que a categoria da transação é selecionada (ou a primeira opção se entretanto foi apagada)
  catSelect.value = transaction.category;

  document.getElementById("editModal").classList.remove("hidden");
}

async function saveEditedTransaction() {
  const id = parseInt(document.getElementById("editId").value);
  const type = document.getElementById("editType").value;
  const date = document.getElementById("editDate").value;
  const amount = parseFloat(document.getElementById("editAmount").value);
  const category = document.getElementById("editCategory").value;
  const description = document.getElementById("editDescription").value;

  if (!date || isNaN(amount)) {
    alert("Preencha a data e o valor.");
    return;
  }

  const { content, sha } = await getData();

  const index = content.transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    content.transactions[index] = {
      id: id,
      type: type,
      date: date,
      amount: amount,
      category: category,
      description: description
    };

    await updateData(content, sha);
    document.getElementById("editModal").classList.add("hidden");
    await loadTransactions();
  }
}

window.openEditModal = openEditModal;
window.deleteTransaction = deleteTransaction;