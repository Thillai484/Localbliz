const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const db = require('../config/db');


// ==============================
// @route   GET api/sales
// @desc    Get all user's sales
// @access  Private
// ==============================
router.get('/', auth, async (req, res) => {
  try {
    const sales = await db.query(
      `SELECT id, amount::numeric, date, notes, created_at 
       FROM sales 
       WHERE user_id = $1 
       ORDER BY date DESC, created_at DESC`,
      [req.user.id]
    );

    res.json(sales.rows);
  } catch (err) {
    console.error("GET SALES ERROR:", err.message);
    res.status(500).json({ message: 'Failed to fetch sales' }); // ✅ JSON error
  }
});


// ==============================
// @route   POST api/sales
// @desc    Add new sale
// @access  Private
// ==============================
router.post('/', auth, async (req, res) => {
  const { amount, date, notes } = req.body;

  // ✅ Basic validation
  if (!amount || !date) {
    return res.status(400).json({ message: 'Amount and date are required' });
  }

  try {
    const newSale = await db.query(
      `INSERT INTO sales (user_id, amount, date, notes) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, amount::numeric, date, notes, created_at`,
      [req.user.id, amount, date, notes || null]
    );

    res.json(newSale.rows[0]);
  } catch (err) {
    console.error("ADD SALE ERROR:", err.message);
    res.status(500).json({ message: 'Error adding sale' }); // ✅ FIXED
  }
});


// ==============================
// @route   DELETE api/sales/:id
// @desc    Delete a sale
// @access  Private
// ==============================
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM sales WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
  console.error("FULL ERROR:", err);  // 👈 ADD THIS
  res.status(500).json({ message: err.message });
}
});


module.exports = router;