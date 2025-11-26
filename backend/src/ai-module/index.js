const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
const client = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

async function call(path, body = {}) {
  try {
    const res = await client.post(path, body);
    return res.data;
  } catch (err) {
    return {
      status: 'error',
      message: err?.response?.data || err?.message || 'Unknown error'
    };
  }
}

async function predictSales({ product_id, sales_data, days = 30 }) {
  return await call('/predict-sales', { product_id, sales_data, days });
}

async function generateForecast({ product_id, sales_data, days = 30 }) {
  return await predictSales({ product_id, sales_data, days });
}

async function optimizeInventory({ product_data, forecast_data, days = 30 }) {
  return await call('/optimize-inventory', { product_data, forecast_data, days });
}

async function detectAnomalies({ transaction_data, threshold = 3 }) {
  return await call('/detect-anomalies', { transaction_data, threshold });
}

async function trainModel({ product_id, sales_data, model_type = 'rf', options = {} }) {
  return await call('/train-model', { product_id, sales_data, model_type, options });
}

module.exports = {
  predictSales,
  generateForecast,
  optimizeInventory,
  detectAnomalies,
  trainModel
};
