const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const db = require('../config/db');


// ==============================
// GET customers
// ==============================
router.get('/', auth, async (req, res) => {
  try {
    const customers = await db.query(
      `SELECT id, name, phone, purchase 
       FROM customers 
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json(customers.rows);
  } catch (err) {
    console.error("GET CUSTOMERS ERROR:", err.message);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});


// ==============================
// ADD customer
// ==============================
router.post('/', auth, async (req, res) => {
  const { name, phone, purchase } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Customer name is required' });
  }

  try {
    const newCustomer = await db.query(
      `INSERT INTO customers (user_id, name, phone, purchase) 
      VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [req.user.id, name, phone || null, purchase || null]
    );

    res.json(newCustomer.rows[0]);
  } catch (err) {
    console.error("ADD CUSTOMER ERROR:", err.message);
    res.status(500).json({ message: 'Error adding customer' });
  }
});


// ==============================
// DELETE customer
// ==============================
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM customers WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error("DELETE CUSTOMER ERROR:", err.message);
    res.status(500).json({ message: 'Error deleting customer' });
  }
});

module.exports = router;