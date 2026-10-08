const express = require('express');
const cors = require('cors');
const { db, initDb } = require('./database/database');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database schema
initDb();

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const customersRouter = require('./routes/customers');
const analyticsRouter = require('./routes/analytics');
const aiRouter = require('./routes/ai');

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
