const express = require('express');
const router = express.Router();
const { db } = require('../database/database');

const formatNumber = (value) => Number(value || 0);

// Get Analytics Overview
router.get('/overview', (req, res) => {
  try {
    const totals = db.prepare(`
      SELECT
        SUM(CASE WHEN order_status != 'Cancelled' THEN total_amount ELSE 0 END) AS total_revenue,
        COUNT(*) AS total_orders,
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COUNT(*) FROM customers WHERE is_active = 1) AS total_customers,
        (SELECT SUM(quantity) FROM order_items) AS units_sold
      FROM orders
    `).get();

    const inventory = db.prepare(`
      SELECT
        SUM(CASE WHEN stock_status = 'LOW STOCK' THEN 1 ELSE 0 END) AS low_stock,
        SUM(CASE WHEN stock_status = 'OUT OF STOCK' THEN 1 ELSE 0 END) AS out_of_stock,
        SUM(CASE WHEN stock_status = 'IN STOCK' THEN 1 ELSE 0 END) AS in_stock
      FROM products
    `).get();

    const salesOverTime = db.prepare(`
      SELECT
        strftime('%Y-%m', order_date) AS name,
        ROUND(SUM(total_amount), 2) AS sales
      FROM orders
      WHERE order_status != 'Cancelled'
      GROUP BY strftime('%Y-%m', order_date)
      ORDER BY name ASC
    `).all().map((row) => ({
      name: row.name,
      sales: formatNumber(row.sales)
    }));

    const orderStatusBreakdown = db.prepare(`
      SELECT order_status AS name, COUNT(*) AS value
      FROM orders
      GROUP BY order_status
      ORDER BY value DESC
    `).all();

    const inventoryStatusBreakdown = db.prepare(`
      SELECT stock_status AS name, COUNT(*) AS value
      FROM products
      GROUP BY stock_status
      ORDER BY CASE stock_status
        WHEN 'IN STOCK' THEN 1
        WHEN 'LOW STOCK' THEN 2
        WHEN 'OUT OF STOCK' THEN 3
        ELSE 4
      END
    `).all();

    const missingProductFields = db.prepare(`
      SELECT COUNT(*) AS count FROM products
      WHERE TRIM(COALESCE(product_name, '')) = '' OR TRIM(COALESCE(sku, '')) = ''
    `).get().count;

    const duplicateSkuCount = db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT sku FROM products WHERE sku IS NOT NULL GROUP BY sku HAVING COUNT(*) > 1
      )
    `).get().count;

    const missingCustomerEmail = db.prepare(`
      SELECT COUNT(*) AS count FROM customers
      WHERE is_active = 1 AND TRIM(COALESCE(email, '')) = ''
    `).get().count;

    const orphanedOrderItems = db.prepare(`
      SELECT COUNT(*) AS count
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.quantity <= 0 OR p.id IS NULL
    `).get().count;

    const inventoryTransactionCount = db.prepare('SELECT COUNT(*) AS count FROM inventory_transactions').get().count;

    const checks = [
      { label: 'Products with valid names and SKUs', passed: missingProductFields === 0 },
      { label: 'Duplicate product SKUs', passed: duplicateSkuCount === 0 },
      { label: 'Customer email coverage', passed: missingCustomerEmail <= 1 },
      { label: 'Order items reference valid products', passed: orphanedOrderItems === 0 },
      { label: 'Inventory transaction audit trail', passed: inventoryTransactionCount > 0 }
    ];

    const passedCount = checks.filter((check) => check.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);
    const issues = [
      missingProductFields > 0 ? `${missingProductFields} products are missing a product name or SKU.` : null,
      duplicateSkuCount > 0 ? `${duplicateSkuCount} duplicate SKUs detected.` : null,
      missingCustomerEmail > 0 ? `${missingCustomerEmail} customers are missing an email.` : null,
      orphanedOrderItems > 0 ? `${orphanedOrderItems} invalid order-item rows found.` : null,
      inventoryTransactionCount === 0 ? 'No inventory transactions were recorded yet.' : null
    ].filter(Boolean);

    const totalRevenue = formatNumber(totals.total_revenue);
    const totalOrders = formatNumber(totals.total_orders);
    const totalProducts = formatNumber(totals.total_products);
    const totalCustomers = formatNumber(totals.total_customers);
    const unitsSold = formatNumber(totals.units_sold);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        lowStock: formatNumber(inventory.low_stock),
        outOfStock: formatNumber(inventory.out_of_stock),
        inStock: formatNumber(inventory.in_stock),
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        unitsSold,
        salesOverTime,
        orderStatusBreakdown,
        inventoryStatusBreakdown,
        dataQuality: {
          score,
          checks,
          issues,
          passedCount,
          totalChecks: checks.length
        }
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Category Performance
router.get('/categories', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT p.category, SUM(oi.total_price) as revenue, SUM(oi.quantity) as units
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_status != 'Cancelled'
      GROUP BY p.category
      ORDER BY revenue DESC
    `).all();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
