const API_BASE = 'http://localhost:5000/api';

// State
let user = null;

// DOM Elements
const views = {
    login: document.getElementById('login-view'),
    app: document.getElementById('app-view')
};

const sections = {
    dashboard: document.getElementById('dashboard'),
    sales: document.getElementById('sales'),
    expenses: document.getElementById('expenses'),
    customers: document.getElementById('customers'),
};

const navLinks = document.querySelectorAll('.nav-links li');

// Check Local Storage on Load
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('localbiz_user');
    if (savedUser) {
        user = JSON.parse(savedUser);
        showApp();
    }
});

// --- UI Navigation ---
function showApp() {
    views.login.classList.remove('active');
    views.app.classList.add('active');
    document.getElementById('user-name-display').textContent = user.name;
    loadDashboard();
}

function showLogin() {
    views.app.classList.remove('active');
    views.login.classList.add('active');
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = isError ? 'var(--danger)' : 'var(--success)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        navLinks.forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const target = e.currentTarget.dataset.target;

        Object.values(sections).forEach(s => s.classList.remove('active'));
        sections[target].classList.add('active');
        document.getElementById('page-title').textContent = e.currentTarget.textContent.trim();

        // Load data based on section
        if (target === 'dashboard') loadDashboard();
        if (target === 'sales') loadSales();
        if (target === 'expenses') loadExpenses();
        if (target === 'customers') loadCustomers();
    });
});

// --- API Helpers ---
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (user) headers['x-user-id'] = user.id;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN');
}

// --- Login / Logout ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');

    try {
        const data = await apiCall('/login', 'POST', { email, password });
        user = data.user;
        localStorage.setItem('localbiz_user', JSON.stringify(user));
        errorMsg.textContent = '';
        showApp();
        showToast('Login Successful!');
    } catch (err) {
        errorMsg.textContent = err.message;
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    user = null;
    localStorage.removeItem('localbiz_user');
    showLogin();
});

// --- Dashboard ---
async function loadDashboard() {
    try {
        const data = await apiCall('/dashboard');
        // Format to Indian amount format roughly
        const formatAmt = (num) => parseFloat(num).toLocaleString('en-IN');
        document.getElementById('dash-sales').textContent = formatAmt(data.totalSales);
        document.getElementById('dash-expenses').textContent = formatAmt(data.totalExpenses);
        document.getElementById('dash-profit').textContent = formatAmt(data.profit);
        
        const scoreEl = document.getElementById('dash-score');
        scoreEl.textContent = data.healthScore;
        
        // Color coding health score
        const scoreRing = scoreEl.parentElement;
        if (data.healthScore >= 70) scoreRing.style.borderColor = 'var(--success)';
        else if (data.healthScore >= 40) scoreRing.style.borderColor = 'var(--warning)';
        else scoreRing.style.borderColor = 'var(--danger)';
    } catch (err) {
        showToast('Failed to load dashboard data', true);
    }
}

// --- Sales ---
async function loadSales() {
    try {
        const sales = await apiCall('/sales');
        const tbody = document.querySelector('#sales-table tbody');
        tbody.innerHTML = sales.map(s => `
            <tr>
                <td>${formatDate(s.date)}</td>
                <td style="color: var(--success); font-weight: 600;">₹${parseFloat(s.amount).toLocaleString('en-IN')}</td>
            </tr>
        `).join('');
    } catch (err) {
        showToast('Error loading sales', true);
    }
}

document.getElementById('sales-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('sale-amount').value;
    const date = document.getElementById('sale-date').value;
    try {
        await apiCall('/sales', 'POST', { amount, date });
        showToast('Sale added successfully!');
        e.target.reset();
        loadSales();
    } catch (err) {
        showToast(err.message, true);
    }
});

// --- Expenses ---
async function loadExpenses() {
    try {
        const expenses = await apiCall('/expenses');
        const tbody = document.querySelector('#expenses-table tbody');
        tbody.innerHTML = expenses.map(e => `
            <tr>
                <td>${formatDate(e.date)}</td>
                <td><span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">${e.category}</span></td>
                <td style="color: var(--warning); font-weight: 600;">₹${parseFloat(e.amount).toLocaleString('en-IN')}</td>
            </tr>
        `).join('');
    } catch (err) {
        showToast('Error loading expenses', true);
    }
}

document.getElementById('expenses-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    try {
        await apiCall('/expenses', 'POST', { amount, category, date });
        showToast('Expense added successfully!');
        e.target.reset();
        loadExpenses();
    } catch (err) {
        showToast(err.message, true);
    }
});

// --- Customers ---
async function loadCustomers() {
    try {
        const customers = await apiCall('/customers');
        const tbody = document.querySelector('#customers-table tbody');
        tbody.innerHTML = customers.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone || 'N/A'}</td>
                <td>₹${parseFloat(c.total_purchase).toLocaleString('en-IN')}</td>
            </tr>
        `).join('');
    } catch (err) {
        showToast('Error loading customers', true);
    }
}

document.getElementById('customers-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const total_purchase = document.getElementById('customer-purchase').value || 0;
    try {
        await apiCall('/customers', 'POST', { name, phone, total_purchase });
        showToast('Customer added successfully!');
        e.target.reset();
        loadCustomers();
    } catch (err) {
        showToast(err.message, true);
    }
});
