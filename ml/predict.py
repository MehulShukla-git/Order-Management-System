import sqlite3
import pandas as pd
import numpy as np
import pickle
import os
import json
import sys
import warnings
warnings.filterwarnings('ignore')

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


def predict():
    try:
        model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models', 'rf_model.pkl'))
        with open(model_path, 'rb') as f:
            model = pickle.load(f)

        db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'database', 'smartstock.db'))
        with sqlite3.connect(db_path) as conn:
            query = """
                SELECT
                    p.id,
                    p.product_name,
                    p.category,
                    p.price,
                    p.current_stock,
                    p.low_stock_threshold,
                    COALESCE(AVG(CASE WHEN o.order_status != 'Cancelled' THEN oi.quantity END), 0) AS avg_order_qty,
                    COUNT(DISTINCT CASE WHEN o.order_status != 'Cancelled' THEN o.id END) AS order_count
                FROM products p
                LEFT JOIN order_items oi ON oi.product_id = p.id
                LEFT JOIN orders o ON o.id = oi.order_id
                GROUP BY p.id, p.product_name, p.category, p.price, p.current_stock, p.low_stock_threshold
                ORDER BY p.id
            """
            df = pd.read_sql_query(query, conn)

        results = []
        for _, product in df.fillna(0).iterrows():
            features = pd.DataFrame([{
                'category_val': CATEGORY_MAP.get(product['category'], 0),
                'price': float(product['price']),
                'current_stock': int(product['current_stock']),
                'low_stock_threshold': int(product['low_stock_threshold']),
                'avg_order_qty': float(product['avg_order_qty']),
                'order_count': int(product['order_count'])
            }])[FEATURE_COLUMNS]

            pred = model.predict(features)[0]
            predicted_demand = max(0, int(round(float(pred))))
            safety_stock = max(2, int(product['low_stock_threshold']))
            recommended_stock = predicted_demand + safety_stock
            restock_quantity = max(0, recommended_stock - int(product['current_stock']))

            risk = 'LOW'
            if restock_quantity > 0:
                risk = 'MEDIUM'
            if int(product['current_stock']) <= int(product['low_stock_threshold']):
                risk = 'HIGH' if int(product['current_stock']) == 0 else 'MEDIUM'

            results.append({
                'product_id': int(product['id']),
                'product_name': product['product_name'],
                'current_stock': int(product['current_stock']),
                'predicted_demand': predicted_demand,
                'recommended_stock': recommended_stock,
                'restock_quantity': restock_quantity,
                'risk': risk
            })

        results.sort(key=lambda x: x['restock_quantity'], reverse=True)
        print(json.dumps(results[:20]))

    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    predict()