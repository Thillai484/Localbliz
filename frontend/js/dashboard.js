requireAuth();

// ==============================
// LOAD USER NAME
// ==============================
async function loadUser() {
  try {
    const user = await apiCall('/auth/me');

    console.log("USER DATA:", user);

    const nameFromAPI = user?.name;
    const nameFromStorage = localStorage.getItem('user_name');

    const name = nameFromAPI || nameFromStorage || "U";

    
    document.getElementById('user-name-display').innerText = name;
    
    document.getElementById('user-avatar').innerText =
    name.charAt(0).toUpperCase();

  } catch (err) {
    console.error("USER ERROR:", err);

    const nameFromStorage = localStorage.getItem('user_name');
    document.getElementById('user-name-display').innerText =
      nameFromStorage || "User";
  }
}

// ==============================
// LOAD SALES
// ==============================
async function loadSales() {
  try {
    const data = await apiCall('/sales');
    console.log("SALES DATA:", data);

    const container = document.getElementById('sales-list');
    container.innerHTML = '';

    let total = 0;
    data.forEach(s => {
      total += Number(s.amount);
    });


    const recent = [...data].reverse().slice(0, 5);

    recent.forEach(s => {
      total += Number(s.amount);

      const li = document.createElement('li');
      li.className = "data-item";

      li.innerHTML = `
        <span>${s.notes || 'Sale'} - ₹${s.amount}</span>
        <button onclick="deleteSale(${s.id})">❌</button>
      `;

      container.appendChild(li);
    });

    document.getElementById('totalSales').innerText = `₹${total}`;

    if (data.length === 0) {
      container.innerHTML = "No sales yet";
    }

    document.getElementById('totalSales').innerText = `₹${total}`;

  } catch (err) {
    console.error("SALES ERROR:", err.message);
  }
}
async function deleteSale(id) {
  if (!confirm("Delete this sale?")) return;

  try {
    await apiCall(`/sales/${id}`, 'DELETE');

    // reload updated data
    loadSales();

  } catch (err) {
    alert(err.message);
  }
}
// ==============================
// LOAD EXPENSES
// ==============================
async function loadExpenses() {
  try {
    const data = await apiCall('/expenses');
    console.log("EXPENSE DATA:", data);

    const container = document.getElementById('expenses-list');
    container.innerHTML = '';

    let total = 0;
    data.forEach(e => {
    total += Number(e.amount);
});

    const recent = [...data].reverse().slice(0, 5);

    recent.forEach(e => {
      total += Number(e.amount);

      const li = document.createElement('li');
      li.className = "data-item";

      li.innerHTML = `
        <span>${e.category || 'Expense'} - ₹${e.amount}</span>
        <button onclick="deleteExpense(${e.id})">❌</button>
      `;

      container.appendChild(li);
    });

    if (data.length === 0) {
      container.innerHTML = "No expenses yet";
    }

    document.getElementById('totalExpenses').innerText = `₹${total}`;

  } catch (err) {
    console.error("EXPENSE ERROR:", err.message);
  }
}

async function calculateDashboard() {
  try {
    const sales = await apiCall('/sales');
    const expenses = await apiCall('/expenses');

    let totalSales = 0;
    let totalExpenses = 0;

    sales.forEach(s => totalSales += Number(s.amount));
    expenses.forEach(e => totalExpenses += Number(e.amount));

    const profit = totalSales - totalExpenses;

    let score = 0;
    if (totalSales > 0) {
      score = Math.round((profit / totalSales) * 100);
    }

    // ✅ UPDATE YOUR EXISTING HTML IDs
    document.getElementById('stat-sales').innerText = totalSales.toFixed(2);
    document.getElementById('stat-expenses').innerText = totalExpenses.toFixed(2);
    document.getElementById('stat-profit').innerText = profit.toFixed(2);
    document.getElementById('stat-health').innerText = score;

    // ✅ Update health bar
    const bar = document.getElementById('health-bar');
    bar.style.width = score + "%";

    if (score < 40) bar.style.background = "#ef4444"; // red
    else if (score < 70) bar.style.background = "#f59e0b"; // yellow
    else bar.style.background = "#10b981"; // green

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
  }
}

// ==============================
// INIT
// ==============================
window.onload = function () {
  loadUser();
  loadSales();
  loadExpenses();

  setTimeout(calculateDashboard, 1000);
};