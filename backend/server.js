const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================
// MIDDLEWARE
// ==============================
app.use(cors());
app.use(express.json());

// ==============================
// AUTH MIDDLEWARE
// ==============================
function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded.user;
    next();

  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
}

// ==============================
// REGISTER
// ==============================
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    const token = jwt.sign(
      { user: { id: newUser.rows[0].id } },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================
// LOGIN
// ==============================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { user: { id: user.rows[0].id } },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================
// 🔥 GET CURRENT USER (FIXED)
// ==============================
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json(user.rows[0]);

  } catch (err) {
    console.error("AUTH ME ERROR:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================
// SALES (PROTECTED)
// ==============================
app.get('/api/sales', auth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM sales WHERE user_id = $1 ORDER BY date DESC',
    [req.user.id]
  );
  res.json(result.rows);
});

app.post('/api/sales', auth, async (req, res) => {
  const { amount, date, notes } = req.body;

  const result = await pool.query(
    'INSERT INTO sales (amount, date, notes, user_id) VALUES ($1,$2,$3,$4) RETURNING *',
    [amount, date || new Date(), notes, req.user.id]
  );

  res.json(result.rows[0]);
});

app.delete('/api/sales/:id', auth, async (req, res) => {
  await pool.query(
    'DELETE FROM sales WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  res.json({ message: 'Deleted' });
});

// ==============================
// EXPENSES (PROTECTED)
// ==============================
app.get('/api/expenses', auth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
    [req.user.id]
  );
  res.json(result.rows);
});

app.post('/api/expenses', auth, async (req, res) => {
  const { amount, category, date } = req.body;

  const result = await pool.query(
    'INSERT INTO expenses (amount, category, date, user_id) VALUES ($1,$2,$3,$4) RETURNING *',
    [amount, category, date || new Date(), req.user.id]
  );

  res.json(result.rows[0]);
});

app.delete('/api/expenses/:id', auth, async (req, res) => {
  await pool.query(
    'DELETE FROM expenses WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  res.json({ message: 'Deleted' });
});

// ==============================
// CUSTOMERS (PROTECTED)
// ==============================
app.get('/api/customers', auth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM customers WHERE user_id = $1 ORDER BY name ASC',
    [req.user.id]
  );
  res.json(result.rows);
});

app.post('/api/customers', auth, async (req, res) => {
  const { name, phone, purchase } = req.body;

  const result = await pool.query(
    'INSERT INTO customers (name, phone, purchase, user_id) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, phone, purchase, req.user.id]
  );

  res.json(result.rows[0]);
});

app.delete('/api/customers/:id', auth, async (req, res) => {
  await pool.query(
    'DELETE FROM customers WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  res.json({ message: 'Deleted' });
});

// ==============================
// TEST
// ==============================
app.get('/', (req, res) => {
  res.send('API Running');
});

// ==============================
// START SERVER
// ==============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});