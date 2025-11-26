from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import traceback

from forecast import (
    predict_sales,
    train_model,
    detect_anomalies,
    optimize_inventory
)

app = Flask(__name__)
CORS(app)

def safe(fn, *args):
    try:
        result = fn(*args)
        return result if isinstance(result, dict) else {"status": "success", "result": result}
    except Exception as e:
        return {"status": "error", "message": str(e), "trace": traceback.format_exc()}

@app.get('/health')
def health():
    return jsonify({"status": "ok"})

@app.post('/predict-sales')
def route_predict_sales():
    data = request.json or {}
    return jsonify(safe(
        predict_sales,
        data.get("product_id"),
        data.get("sales_data", []),
        data.get("days", 30)
    ))

@app.post('/optimize-inventory')
def route_optimize_inventory():
    data = request.json or {}
    return jsonify(safe(
        optimize_inventory,
        data.get("product_data"),
        data.get("forecast_data"),
        data.get("days", 30)
    ))

@app.post('/detect-anomalies')
def route_detect_anomalies():
    data = request.json or {}
    return jsonify(safe(
        detect_anomalies,
        data.get("transaction_data", []),
        data.get("threshold", 3)
    ))

@app.post('/train-model')
def route_train_model():
    data = request.json or {}
    return jsonify(safe(
        train_model,
        data.get("product_id"),
        data.get("sales_data", []),
        data.get("model_type", "rf"),
        data.get("options", {})
    ))

if __name__ == '__main__':
    host = os.environ.get('AI_HOST', '127.0.0.1')
    port = int(os.environ.get('AI_PORT', 5001))
    app.run(host=host, port=port)
