import sqlite3
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import pickle
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend', 'database', 'smartstock.db'))
MODEL_DIR = os.path.join(BASE_DIR, 'models')

CATEGORY_MAP = {
    'Electronics': 1,
    'Accessories': 2,
    'Fashion': 3,
    'Home & Kitchen': 4,
    'Personal Care': 5,
}

FEATURE_COLUMNS = [
    'category_val',
    'price',
    'current_stock',
    'low_stock_threshold',
    'avg_order_qty',
    'order_count'
]

with sqlite3.connect(DB_PATH) as conn:
    query = """
        SELECT
            p.id AS product_id,
            p.category,
            p.price,
            p.current_stock,
            p.low_stock_threshold,
            COALESCE(SUM(CASE WHEN o.order_status != 'Cancelled' THEN oi.quantity ELSE 0 END), 0) AS total_sold,
            COALESCE(AVG(CASE WHEN o.order_status != 'Cancelled' THEN oi.quantity END), 0) AS avg_order_qty,
            COUNT(DISTINCT CASE WHEN o.order_status != 'Cancelled' THEN o.id END) AS order_count
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o ON o.id = oi.order_id
        GROUP BY p.id, p.category, p.price, p.current_stock, p.low_stock_threshold
        ORDER BY p.id
    """
    df = pd.read_sql_query(query, conn)

ml_df = df.fillna(0).copy()
ml_df['category_val'] = ml_df['category'].map(CATEGORY_MAP).fillna(0).astype(int)
ml_df['future_demand'] = ml_df['total_sold'].clip(lower=0).round().astype(int)
ml_df['avg_order_qty'] = ml_df['avg_order_qty'].astype(float)
ml_df['order_count'] = ml_df['order_count'].astype(int)

X = ml_df[FEATURE_COLUMNS]
y = ml_df['future_demand']

if len(X) < 2:
    raise ValueError('Not enough product history to train the demand model.')

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=200, random_state=42, min_samples_leaf=1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print('Model Evaluation Metrics:')
print(f'MAE: {mae:.2f}')
print(f'RMSE: {rmse:.2f}')
print(f'R2: {r2:.2f}')

os.makedirs(MODEL_DIR, exist_ok=True)
with open(os.path.join(MODEL_DIR, 'rf_model.pkl'), 'wb') as f:
    pickle.dump(model, f)

with open(os.path.join(MODEL_DIR, 'metrics.json'), 'w', encoding='utf-8') as f:
    json.dump({'MAE': float(mae), 'RMSE': float(rmse), 'R2': float(r2)}, f)

print(f'Model saved to {os.path.join(MODEL_DIR, "rf_model.pkl")}')