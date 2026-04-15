const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Authentication Dummy Routes ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        // Note: Plaintext used for simplicity in beginner context. 
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Sales Routes ---
app.get('/api/sales', async (req, res) => {
    const userId = req.headers['x-user-id'];
    try {
        const result = await pool.query('SELECT * FROM sales WHERE user_id = $1 ORDER BY date DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/sales', async (req, res) => {
    const userId = req.headers['x-user-id'];
    const { amount, date } = req.body;
    try {
        const newSale = await pool.query(
            'INSERT INTO sales (user_id, amount, date) VALUES ($1, $2, $3) RETURNING *',
            [userId, amount, date || new Date()]
        );
        res.json(newSale.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Expenses Routes ---
app.get('/api/expenses', async (req, res) => {
    const userId = req.headers['x-user-id'];
    try {
        const result = await pool.query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/expenses', async (req, res) => {
    const userId = req.headers['x-user-id'];
    const { amount, category, date } = req.body;
    try {
        const newExpense = await pool.query(
            'INSERT INTO expenses (user_id, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, amount, category, date || new Date()]
        );
        res.json(newExpense.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Customers Routes ---
app.get('/api/customers', async (req, res) => {
    const userId = req.headers['x-user-id'];
    try {
        const result = await pool.query('SELECT * FROM customers WHERE user_id = $1 ORDER BY name ASC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/customers', async (req, res) => {
    const userId = req.headers['x-user-id'];
    const { name, phone, total_purchase } = req.body;
    try {
        const newCustomer = await pool.query(
            'INSERT INTO customers (user_id, name, phone, total_purchase) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, name, phone, total_purchase || 0]
        );
        res.json(newCustomer.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Dashboard / Summary Report ---
app.get('/api/dashboard', async (req, res) => {
    const userId = req.headers['x-user-id'];
    try {
        const salesResult = await pool.query('SELECT SUM(amount) as total FROM sales WHERE user_id = $1', [userId]);
        const expensesResult = await pool.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = $1', [userId]);
        
        const totalSales = parseFloat(salesResult.rows[0].total) || 0;
        const totalExpenses = parseFloat(expensesResult.rows[0].total) || 0;
        const profit = totalSales - totalExpenses;
        
        // Business Health Score Logic:
        // Score = 50 (base) + (profit / totalSales) * 50 if sales > 0
        // Capped between 0 and 100
        let healthScore = 50; 
        if (totalSales > 0) {
            const margin = profit / totalSales;
            healthScore = Math.min(100, Math.max(0, 50 + (margin * 100)));
        } else if (totalExpenses > 0) {
            healthScore = 20; // Default low score if only expenses
        }

        res.json({
            totalSales,
            totalExpenses,
            profit,
            healthScore: Math.round(healthScore)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
