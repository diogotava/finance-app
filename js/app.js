document.getElementById("saveAuth").addEventListener("click", () => {
  const token = document.getElementById("token").value;
  const username = document.getElementById("username").value;
  saveCredentials(token, username);
  alert("Credenciais guardadas!");
  loadTransactions();
});

document.getElementById("addBtn").addEventListener("click", addTransaction);

async function loadTransactions() {
  const creds = getCredentials();
  if (!creds.token || !creds.username) return;

  const { content } = await getData();
  const list = document.getElementById("transactions");
  list.innerHTML = "";

  content.transactions.forEach(t => {
    const li = document.createElement("li");
    li.textContent = `${t.date} - ${t.amount}€ - ${t.category} - ${t.description}`;
    list.appendChild(li);
  });
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

window.onload = loadTransactions;