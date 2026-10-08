const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

const getStockStatus = (currentStock, lowStockThreshold) => {
  if (currentStock === 0) return 'OUT OF STOCK';
  if (currentStock <= lowStockThreshold) return 'LOW STOCK';
  return 'IN STOCK';
};

const recordInventoryTransaction = (productId, orderId, transactionType, quantity, previousStock, newStock) => {
  db.prepare(`
    INSERT INTO inventory_transactions (product_id, order_id, transaction_type, quantity, previous_stock, new_stock)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(productId, orderId || null, transactionType, quantity, previousStock, newStock);
};

const markOrderCancelledIfNeeded = (orderId) => {
  const existing = db.prepare('SELECT order_status FROM orders WHERE id = ?').get(orderId);
  if (!existing) return false;
  if (existing.order_status === 'Cancelled') return true;
  return false;
};

// Generate unique order number
const generateOrderNumber = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  return `ORD-${(count + 1).toString().padStart(4, '0')}`;
};

// Get all orders
router.get('/', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, c.name as customer_name 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      ORDER BY o.order_date DESC
    `).all();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create an order
router.post('/', (req, res) => {
  const { customer_id, items } = req.body;
  if (!customer_id || !items || !items.length) {
    return res.status(400).json({ success: false, message: 'Missing customer or items' });
  }

  const createOrderTransaction = db.transaction((orderNum, custId, orderItems) => {
    let subtotal = 0;

    for (const item of orderItems) {
      if (!item.product_id || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) {
        throw new Error(`Invalid quantity for product ${item.product_id}`);
      }

      const product = db.prepare('SELECT id, current_stock, price, low_stock_threshold FROM products WHERE id = ?').get(item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (product.current_stock < Number(item.quantity)) {
        throw new Error(`Insufficient stock for product ${item.product_id}. Only ${product.current_stock} available.`);
      }

      item.quantity = Number(item.quantity);
      item.unit_price = Number(product.price);
      item.total_price = item.quantity * item.unit_price;
      subtotal += item.total_price;
    }

    const tax = subtotal * 0.1;
    const total_amount = subtotal + tax;

    const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, customer_id, subtotal, tax, total_amount, payment_status, order_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const orderRes = insertOrder.run(orderNum, custId, subtotal, tax, total_amount, 'Pending', 'Confirmed');
    const orderId = orderRes.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare(`
      UPDATE products
      SET current_stock = ?, stock_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    for (const item of orderItems) {
      const currentProduct = db.prepare('SELECT current_stock, low_stock_threshold FROM products WHERE id = ?').get(item.product_id);
      const nextStock = currentProduct.current_stock - item.quantity;
      const nextStatus = getStockStatus(nextStock, currentProduct.low_stock_threshold);

      insertItem.run(orderId, item.product_id, item.quantity, item.unit_price, item.total_price);
      updateStock.run(nextStock, nextStatus, item.product_id);
      recordInventoryTransaction(item.product_id, orderId, 'SALE', item.quantity, currentProduct.current_stock, nextStock);
    }

    return orderId;
  });

  try {
    const orderNum = generateOrderNumber();
    const newOrderId = createOrderTransaction(orderNum, customer_id, items);
    res.status(201).json({ success: true, data: { order_id: newOrderId, order_number: orderNum } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update order status (Cancel logic included)
router.put('/:id', (req, res) => {
  const { order_status } = req.body;
  const orderId = req.params.id;

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order_status === 'Cancelled') {
      if (order.order_status === 'Cancelled') {
        return res.status(200).json({
          success: true,
          message: 'Order is already cancelled. No stock changes were applied.',
          data: { order_id: orderId, order_status: order.order_status }
        });
      }

      if (order.order_status === 'Delivered') {
        return res.status(400).json({ success: false, message: 'Delivered orders cannot be cancelled.' });
      }

      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
      const transaction = db.transaction(() => {
        if (!items.length) {
          db.prepare('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(order_status, orderId);
          return;
        }

        const updateStock = db.prepare(`
          UPDATE products
          SET current_stock = ?, stock_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        for (const item of items) {
          const product = db.prepare('SELECT current_stock, low_stock_threshold FROM products WHERE id = ?').get(item.product_id);
          if (!product) continue;
          const restoredStock = product.current_stock + item.quantity;
          const restoredStatus = getStockStatus(restoredStock, product.low_stock_threshold);
          updateStock.run(restoredStock, restoredStatus, item.product_id);
          recordInventoryTransaction(item.product_id, orderId, 'CANCELLATION', item.quantity, product.current_stock, restoredStock);
        }

        db.prepare('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(order_status, orderId);
      });

      transaction();
      return res.json({ success: true, message: 'Order cancelled and stock restored.' });
    }

    if (order.order_status === 'Cancelled' && order_status !== 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled orders cannot be reopened through this endpoint.' });
    }

    db.prepare('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(order_status, orderId);
    res.json({ success: true, message: 'Order updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
