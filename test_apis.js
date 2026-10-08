const http = require('http');

const request = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function runTests() {
  console.log('--- Starting API Tests ---');
  
  // 1. Products CRUD
  console.log('Testing Products GET...');
  let res = await request('GET', '/api/products');
  console.log(`GET /api/products: ${res.status}, Products count: ${res.body.data ? res.body.data.length : 0}`);

  console.log('Testing Product POST...');
  let newProduct = {
    product_name: 'Test API Product',
    sku: 'TEST-' + Date.now(),
    category: 'Electronics',
    description: 'A test product',
    price: 10.0,
    cost_price: 5.0,
    initial_stock: 10,
    low_stock_threshold: 2
  };
  res = await request('POST', '/api/products', newProduct);
  console.log(`POST /api/products: ${res.status}`);
  const productId = res.body.data ? res.body.data.id : null;

  // 2. Customers
  console.log('Testing Customers GET...');
  res = await request('GET', '/api/customers');
  console.log(`GET /api/customers: ${res.status}, Customers count: ${res.body.data ? res.body.data.length : 0}`);

  // 3. Order Creation & Stock Deduction
  console.log('Testing Order Creation...');
  let newOrder = {
    customer_id: 1,
    items: [
      { product_id: productId, quantity: 8, unit_price: 10.0 }
    ],
    payment_status: 'Pending'
  };
  res = await request('POST', '/api/orders', newOrder);
  console.log(`POST /api/orders: ${res.status}, Success: ${res.body.success}`);
  const orderId = res.body.data ? res.body.data.order_id : null;

  // Verify stock deduction (10 - 8 = 2) and LOW_STOCK
  res = await request('GET', `/api/products/${productId}`);
  console.log(`GET /api/products/${productId}: Stock = ${res.body.data.current_stock}, Status = ${res.body.data.stock_status}`);

  // 4. Insufficient-stock rejection
  console.log('Testing Insufficient Stock...');
  let badOrder = {
    customer_id: 1,
    items: [
      { product_id: productId, quantity: 5, unit_price: 10.0 }
    ],
    payment_status: 'Pending'
  };
  res = await request('POST', '/api/orders', badOrder);
  console.log(`POST /api/orders (Bad): ${res.status}, Message: ${res.body.message}`);

  // 5. OUT_OF_STOCK transition
  console.log('Testing OUT_OF_STOCK Transition...');
  let outOrder = {
    customer_id: 1,
    items: [
      { product_id: productId, quantity: 2, unit_price: 10.0 }
    ],
    payment_status: 'Pending'
  };
  res = await request('POST', '/api/orders', outOrder);
  console.log(`POST /api/orders (Out): ${res.status}`);
  res = await request('GET', `/api/products/${productId}`);
  console.log(`GET /api/products/${productId}: Stock = ${res.body.data.current_stock}, Status = ${res.body.data.stock_status}`);

  // 6. Order cancellation & Stock restoration
  console.log('Testing Order Cancellation...');
  res = await request('PUT', `/api/orders/${orderId}`, { order_status: 'Cancelled' });
  console.log(`PUT /api/orders/${orderId}: ${res.status}`);
  res = await request('GET', `/api/products/${productId}`);
  console.log(`GET /api/products/${productId}: Stock = ${res.body.data.current_stock}, Status = ${res.body.data.stock_status}`);

  // 7. Prevention of double stock restoration
  console.log('Testing Double Cancellation...');
  res = await request('PUT', `/api/orders/${orderId}`, { order_status: 'Cancelled' });
  console.log(`PUT /api/orders/${orderId} (2nd time): ${res.status}, Message: ${res.body.message}`);

  // 8. Analytics & AI Insights
  console.log('Testing Analytics...');
  res = await request('GET', '/api/analytics/overview');
  console.log(`GET /api/analytics/overview: ${res.status}`);

  console.log('Testing AI Insights...');
  res = await request('GET', '/api/ai/insights');
  console.log(`GET /api/ai/insights: ${res.status}, Metrics: ${JSON.stringify(res.body.data ? res.body.data.metrics : null)}`);

  console.log('--- API Tests Complete ---');
}

runTests();
