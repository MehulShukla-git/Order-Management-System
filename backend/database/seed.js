const { db, initDb } = require('./database');

// Ensure tables exist
initDb();

const products = [
  { name: 'Wireless Mouse', sku: 'ELEC-001', category: 'Electronics', desc: 'Ergonomic wireless mouse', price: 29.99, cost: 10.0, initial: 100, current: 85, threshold: 20 },
  { name: 'Mechanical Keyboard', sku: 'ELEC-002', category: 'Electronics', desc: 'RGB mechanical keyboard', price: 89.99, cost: 40.0, initial: 50, current: 15, threshold: 10 },
  { name: 'Bluetooth Headphones', sku: 'ELEC-003', category: 'Electronics', desc: 'Noise cancelling headphones', price: 199.99, cost: 90.0, initial: 80, current: 5, threshold: 10 }, // Low Stock
  { name: 'Smart Watch', sku: 'ELEC-004', category: 'Electronics', desc: 'Fitness tracker and smartwatch', price: 149.99, cost: 70.0, initial: 120, current: 0, threshold: 15 }, // Out of Stock
  { name: 'USB-C Cable', sku: 'ACC-001', category: 'Accessories', desc: 'Braided USB-C to USB-C cable', price: 14.99, cost: 3.0, initial: 500, current: 300, threshold: 50 },
  { name: 'Power Bank', sku: 'ACC-002', category: 'Accessories', desc: '10000mAh portable charger', price: 39.99, cost: 15.0, initial: 200, current: 150, threshold: 30 },
  { name: 'Laptop Stand', sku: 'ACC-003', category: 'Accessories', desc: 'Adjustable aluminum stand', price: 45.99, cost: 20.0, initial: 100, current: 60, threshold: 15 },
  { name: 'Webcam', sku: 'ELEC-005', category: 'Electronics', desc: '1080p HD webcam', price: 59.99, cost: 25.0, initial: 150, current: 12, threshold: 20 }, // Low Stock
  { name: 'Phone Charger', sku: 'ACC-004', category: 'Accessories', desc: 'Fast charging wall adapter', price: 19.99, cost: 5.0, initial: 300, current: 280, threshold: 50 },
  { name: 'Travel Backpack', sku: 'FASH-001', category: 'Fashion', desc: 'Water-resistant tech backpack', price: 79.99, cost: 30.0, initial: 80, current: 40, threshold: 10 },
  // 10 items, creating more programmatically
];

const categories = ['Home & Kitchen', 'Personal Care', 'Electronics', 'Accessories', 'Fashion'];
for (let i = 11; i <= 35; i++) {
  const stock = Math.floor(Math.random() * 100);
  products.push({
    name: `Product ${i} Generic`, // Using slightly generic but functional names to fill up to 35
    sku: `PROD-${i.toString().padStart(3, '0')}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    desc: `Description for Product ${i}`,
    price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
    cost: parseFloat((Math.random() * 5 + 5).toFixed(2)),
    initial: 100,
    current: stock,
    threshold: 15
  });
}

const getStatus = (current, threshold) => {
  if (current === 0) return 'OUT OF STOCK';
  if (current <= threshold) return 'LOW STOCK';
  return 'IN STOCK';
};

console.log('Seeding products...');
const insertProduct = db.prepare(`
  INSERT INTO products (product_name, sku, category, description, price, cost_price, initial_stock, current_stock, low_stock_threshold, stock_status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

products.forEach(p => {
  insertProduct.run(
    p.name, p.sku, p.category, p.desc, p.price, p.cost, p.initial, p.current, p.threshold, getStatus(p.current, p.threshold)
  );
});

console.log('Products seeded.');

// Add some customers
const insertCustomer = db.prepare(`INSERT INTO customers (name, email, city) VALUES (?, ?, ?)`);
const customerNames = [
  'Alice Smith', 'Bob Johnson', 'Charlie Brown', 'Diana Prince', 'Evan Wright',
  'Fiona Gallagher', 'George Costanza', 'Hannah Abbott', 'Ian Malcolm', 'Julia Roberts',
  'Kevin Malone', 'Luna Lovegood', 'Michael Scott', 'Nancy Wheeler', 'Oscar Martinez',
  'Pam Beesly', 'Quincy Jones', 'Rachel Green', 'Steve Harrington', 'Tina Belcher',
  'Uma Thurman', 'Victor Frankenstein', 'Walter White', 'Xena Warrior', 'Yoshi Mario',
  'Zelda Fitzgerald'
];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const customerIds = [];
customerNames.forEach((name, idx) => {
  const city = cities[idx % cities.length];
  const result = insertCustomer.run(name, name.replace(' ', '.').toLowerCase() + '@example.com', city);
  customerIds.push(result.lastInsertRowid);
});

console.log('Customers seeded.');

// Create Orders
console.log('Seeding orders...');
const insertOrder = db.prepare(`
  INSERT INTO orders (order_number, customer_id, subtotal, tax, total_amount, payment_status, order_status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertOrderItem = db.prepare(`
  INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
  VALUES (?, ?, ?, ?, ?)
`);

for (let i = 1; i <= 60; i++) {
  const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
  const productId = Math.floor(Math.random() * products.length) + 1; // SQLite ids are 1-indexed
  const product = products[productId - 1];
  
  const quantity = Math.floor(Math.random() * 3) + 1;
  const unitPrice = product.price;
  const totalPrice = quantity * unitPrice;
  const tax = totalPrice * 0.1;
  const finalTotal = totalPrice + tax;
  
  const orderResult = insertOrder.run(
    `ORD-${i.toString().padStart(4, '0')}`,
    customerId,
    totalPrice,
    tax,
    finalTotal,
    'Paid',
    'Delivered'
  );
  
  insertOrderItem.run(
    orderResult.lastInsertRowid,
    productId,
    quantity,
    unitPrice,
    totalPrice
  );
}

console.log('Orders seeded.');
console.log('Seeding complete.');
