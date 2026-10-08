const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

// Get all products
router.get('/', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a single product
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create product
router.post('/', (req, res) => {
  const { product_name, sku, category, description, price, cost_price, initial_stock, low_stock_threshold } = req.body || {};
  if (
    typeof product_name !== 'string' || !product_name.trim() ||
    typeof sku !== 'string' || !sku.trim() ||
    typeof category !== 'string' || !category.trim()
  ) {
    return res.status(400).json({ success: false, message: 'Product name, SKU, and category are required.' });
  }

  if (product_name.trim().length > 200 || sku.trim().length > 100 || category.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'Product name, SKU, or category exceeds the maximum length.' });
  }

  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number.' });
  }
  if (typeof cost_price !== 'number' || !Number.isFinite(cost_price) || cost_price < 0) {
    return res.status(400).json({ success: false, message: 'Cost price must be a valid non-negative number.' });
  }
  if (!Number.isSafeInteger(initial_stock) || initial_stock < 0) {
    return res.status(400).json({ success: false, message: 'Stock must be a non-negative whole number.' });
  }
  if (!Number.isSafeInteger(low_stock_threshold) || low_stock_threshold < 0) {
    return res.status(400).json({ success: false, message: 'Low-stock threshold must be a non-negative whole number.' });
  }

  const normalizedName = product_name.trim();
  const normalizedSku = sku.trim();
  const normalizedCategory = category.trim();
  const normalizedDescription = typeof description === 'string' ? description.trim() : '';
  const current_stock = initial_stock;
  let stock_status = 'IN STOCK';
  if (current_stock === 0) stock_status = 'OUT OF STOCK';
  else if (current_stock <= low_stock_threshold) stock_status = 'LOW STOCK';

  try {
    const stmt = db.prepare(`
      INSERT INTO products (product_name, sku, category, description, price, cost_price, initial_stock, current_stock, low_stock_threshold, stock_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(normalizedName, normalizedSku, normalizedCategory, normalizedDescription, price, cost_price, initial_stock, current_stock, low_stock_threshold, stock_status);
    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ success: false, message: 'A product with this SKU already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update product
router.put('/:id', (req, res) => {
  const { product_name, sku, category, description, price, cost_price, current_stock, low_stock_threshold } = req.body;
  const id = req.params.id;
  
  let stock_status = 'IN STOCK';
  if (current_stock === 0) stock_status = 'OUT OF STOCK';
  else if (current_stock <= low_stock_threshold) stock_status = 'LOW STOCK';

  try {
    const stmt = db.prepare(`
      UPDATE products 
      SET product_name = ?, sku = ?, category = ?, description = ?, price = ?, cost_price = ?, current_stock = ?, low_stock_threshold = ?, stock_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(product_name, sku, category, description, price, cost_price, current_stock, low_stock_threshold, stock_status, id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete product
router.delete('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const orderItems = db.prepare('SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?').get(product.id).count;
    const inventoryTransactions = db.prepare('SELECT COUNT(*) AS count FROM inventory_transactions WHERE product_id = ?').get(product.id).count;
    if (orderItems > 0 || inventoryTransactions > 0) {
      return res.status(409).json({
        success: false,
        message: 'This product has order or inventory history and cannot be deleted without losing historical records.'
      });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(product.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return res.status(409).json({ success: false, message: 'This product is referenced by existing records and cannot be deleted.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
