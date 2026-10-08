const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

// Get all customers
router.get('/', (req, res) => {
  try {
    const isActive = req.query.status === 'archived' ? 0 : 1;
    const customers = db.prepare(`
      SELECT c.*, COUNT(o.id) AS order_count
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.is_active = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all(isActive);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create customer
router.post('/', (req, res) => {
  const { name, email, phone, city } = req.body || {};
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Customer name is required.' });
  }
  if (name.trim().length > 200) {
    return res.status(400).json({ success: false, message: 'Customer name must be 200 characters or fewer.' });
  }

  const normalizedEmail = typeof email === 'string' ? email.trim() : '';
  if (email != null && typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email must be text.' });
  }
  if (normalizedEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  }

  const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
  if (phone != null && typeof phone !== 'string') {
    return res.status(400).json({ success: false, message: 'Phone must be text.' });
  }
  if (normalizedPhone && (
    !/^\+?[\d\s().-]+$/.test(normalizedPhone) ||
    normalizedPhone.replace(/\D/g, '').length < 7 ||
    normalizedPhone.replace(/\D/g, '').length > 15
  )) {
    return res.status(400).json({ success: false, message: 'Enter a valid phone number.' });
  }
  if (city != null && typeof city !== 'string') {
    return res.status(400).json({ success: false, message: 'City must be text.' });
  }

  try {
    const stmt = db.prepare(`INSERT INTO customers (name, email, phone, city) VALUES (?, ?, ?, ?)`);
    const result = stmt.run(name.trim(), normalizedEmail || null, normalizedPhone || null, city?.trim() || null);
    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Preserve customers referenced by orders by archiving them instead of deleting them.
router.delete('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT id, is_active FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const orderCount = db.prepare('SELECT COUNT(*) AS count FROM orders WHERE customer_id = ?').get(customer.id).count;
    if (orderCount > 0) {
      db.prepare('UPDATE customers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(customer.id);
      return res.json({
        success: true,
        message: 'Customer archived. Historical orders have been preserved.',
        data: { action: 'archived' }
      });
    }

    db.prepare('DELETE FROM customers WHERE id = ?').run(customer.id);
    res.json({ success: true, message: 'Customer deleted', data: { action: 'deleted' } });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(409).json({ success: false, message: 'This customer is referenced by existing orders and cannot be deleted.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/restore', (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE customers
      SET is_active = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer restored', data: { action: 'restored' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
