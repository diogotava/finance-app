document.getElementById("addBtn").addEventListener("click", addTransaction);
document.getElementById("saveBudget").addEventListener("click", saveBudget);

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
  const { content } = await getData();
  const container = document.getElementById("transactions");
  container.innerHTML = "";

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let total = 0;

  content.transactions.forEach(t => {
    const dateObj = new Date(t.date);
    if (
      dateObj.getMonth() === currentMonth &&
      dateObj.getFullYear() === currentYear
    ) {
      total += t.amount;
    }

    const div = document.createElement("div");
    div.className = "transaction-card";

    div.innerHTML = `
    <strong>${t.amount}€</strong> - ${t.category}<br/>
    <small>${t.date} | ${t.description}</small>
    <div class="actions">
        <button onclick="editTransaction(${t.id})">✏️</button>
        <button onclick="deleteTransaction(${t.id})">🗑️</button>
    </div>
    `;
    container.appendChild(div);
  });

  updateDashboard(total, content.settings.monthlyBudget);
}

function updateDashboard(total, budget) {
  document.getElementById("totalSpent").textContent = total + "€";
  document.getElementById("monthlyBudget").textContent = budget + "€";

  const remaining = budget - total;
  document.getElementById("remaining").textContent = remaining + "€";

  const percent = budget > 0 ? (total / budget) * 100 : 0;
  document.getElementById("progress").style.width = percent + "%";
}

async function addTransaction() {
  const date = document.getElementById("date").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;

  const { content, sha } = await getData();

  content.transactions.push({
    id: Date.now(),
    date,
    amount,
    category,
    description
  });

  await updateData(content, sha);
  await loadTransactions();
}

async function saveBudget() {
  const budget = parseFloat(document.getElementById("budgetInput").value);
  const { content, sha } = await getData();

  content.settings.monthlyBudget = budget;

  await updateData(content, sha);
  await loadTransactions();
}

window.onload = loadTransactions;

async function deleteTransaction(id) {
  const { content, sha } = await getData();

  content.transactions = content.transactions.filter(t => t.id !== id);

  await updateData(content, sha);
  await loadTransactions();
}

async function editTransaction(id) {
  const { content, sha } = await getData();
  const transaction = content.transactions.find(t => t.id === id);

  const newAmount = prompt("Novo valor:", transaction.amount);
  const newCategory = prompt("Nova categoria:", transaction.category);
  const newDescription = prompt("Nova descrição:", transaction.description);

  if (newAmount !== null) transaction.amount = parseFloat(newAmount);
  if (newCategory !== null) transaction.category = newCategory;
  if (newDescription !== null) transaction.description = newDescription;

  await updateData(content, sha);
  await loadTransactions();
}