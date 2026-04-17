const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const db = require('../config/db');


// ==============================
// GET all expenses
// ==============================
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await db.query(
      `SELECT id, amount::numeric, category, date, created_at 
       FROM expenses 
       WHERE user_id = $1 
       ORDER BY date DESC, created_at DESC`,
      [req.user.id]
    );

    res.json(expenses.rows);
  } catch (err) {
    console.error("GET EXPENSES ERROR:", err.message);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});


// ==============================
// ADD expense
// ==============================
router.post('/', auth, async (req, res) => {
  const { amount, category, date } = req.body;

  if (!amount || !category || !date) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newExpense = await db.query(
      `INSERT INTO expenses (user_id, amount, category, date) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, amount::numeric, category, date, created_at`,
      [req.user.id, amount, category, date]
    );

    res.json(newExpense.rows[0]);
  } catch (err) {
    console.error("ADD EXPENSE ERROR:", err.message);
    res.status(500).json({ message: 'Error adding expense' });
  }
});


// ==============================
// DELETE expense
// ==============================
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error("DELETE EXPENSE ERROR:", err.message);
    res.status(500).json({ message: 'Error deleting expense' });
  }
});

module.exports = router;