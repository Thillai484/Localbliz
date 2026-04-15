const express = require('express');
const router = express.Router();
const db = require('../db');

// --- Auth Routes ---
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, password]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Registration failed. Email might already exist.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// --- Sales Routes ---
router.post('/sales', async (req, res) => {
    const { user_id, amount, date } = req.body;
    try {
        await db.query('INSERT INTO sales (user_id, amount, date) VALUES ($1, $2, $3)', [user_id, amount, date || new Date()]);
        res.json({ success: true, message: 'Sale added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error adding sale' });
    }
});

router.get('/sales/:user_id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM sales WHERE user_id = $1 ORDER BY date DESC', [req.params.user_id]);
        res.json({ success: true, sales: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching sales' });
    }
});

// --- Expenses Routes ---
router.post('/expenses', async (req, res) => {
    const { user_id, amount, category, date } = req.body;
    try {
        await db.query('INSERT INTO expenses (user_id, amount, category, date) VALUES ($1, $2, $3, $4)', [user_id, amount, category, date || new Date()]);
        res.json({ success: true, message: 'Expense added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error adding expense' });
    }
});

router.get('/expenses/:user_id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC', [req.params.user_id]);
        res.json({ success: true, expenses: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching expenses' });
    }
});

// --- Customers Routes ---
router.post('/customers', async (req, res) => {
    const { user_id, name, phone, total_purchase } = req.body;
    try {
        await db.query(
            'INSERT INTO customers (user_id, name, phone, total_purchase) VALUES ($1, $2, $3, $4)',
            [user_id, name, phone, total_purchase || 0.0]
        );
        res.json({ success: true, message: 'Customer added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error adding customer' });
    }
});

router.get('/customers/:user_id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM customers WHERE user_id = $1 ORDER BY name ASC', [req.params.user_id]);
        res.json({ success: true, customers: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching customers' });
    }
});

// --- Dashboard Summary & Health Score Route ---
router.get('/dashboard/:user_id', async (req, res) => {
    const userId = req.params.user_id;
    try {
        // Get total sales
        const salesResult = await db.query('SELECT SUM(amount) as total_sales FROM sales WHERE user_id = $1', [userId]);
        const totalSales = parseFloat(salesResult.rows[0].total_sales || 0);

        // Get total expenses
        const expensesResult = await db.query('SELECT SUM(amount) as total_expenses FROM expenses WHERE user_id = $1', [userId]);
        const totalExpenses = parseFloat(expensesResult.rows[0].total_expenses || 0);

        // Calculate profit
        const profit = totalSales - totalExpenses;

        // Calculate Business Health Score (0-100)
        // Simple logic: if profit <= 0, score is 0-30. If profit > 0, scaling up.
        // Let's make it simpler for Indian business owners to understand.
        // Margin = (profit / sales) * 100
        let healthScore = 50; // Default base score
        if (totalSales > 0) {
            const margin = (profit / totalSales) * 100;
            if (margin <= 0) {
                healthScore = 20; // Loss state
            } else if (margin > 0 && margin <= 10) {
                healthScore = 50;
            } else if (margin > 10 && margin <= 30) {
                healthScore = 75;
            } else {
                healthScore = 95;
            }
        } else if (totalSales === 0 && totalExpenses > 0) {
            healthScore = 10; // Only spending, no sales
        } else {
            healthScore = 0; // No data
        }

        res.json({
            success: true,
            dashboard: {
                totalSales,
                totalExpenses,
                profit,
                healthScore
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
    }
});

module.exports = router;
