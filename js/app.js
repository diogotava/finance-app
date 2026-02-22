document.getElementById("addBtn").addEventListener("click", addTransaction);
document.getElementById("saveBudget").addEventListener("click", saveBudget);

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