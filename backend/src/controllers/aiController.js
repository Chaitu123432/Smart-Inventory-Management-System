const { Transaction, Product } = require('../models');
const aiModule = require('../ai-module');
const HuggingFaceService = require('../services/huggingFaceService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

async function generateForecast(req, res) {
  try {
    const { productId, period = 30, modelType = 'ensemble', useHuggingFace = false } = req.body;
    
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    
    const transactions = await Transaction.findAll({
      where: { productId },
      order: [['transactionDate', 'ASC']],
      limit: 10000
    });

    // convert to the expected salesData format
    const salesData = transactions.map(t => ({
      date: t.transactionDate.toISOString().split('T')[0],
      quantity: t.quantity
    }));

    // Optionally use HuggingFace model first
    let forecast;
    if (useHuggingFace) {
      try {
        forecast = await HuggingFaceService.forecast(productId, salesData, { period, model: modelType });
      } catch (hfError) {
        logger.warn('HuggingFace forecast failed, falling back to Python ML:', hfError);
        // Fallback to Python ML
        forecast = await aiModule.generateForecast({
          product_id: productId,
          sales_data: salesData,
          days: parseInt(period, 10),
          model: modelType
        });
      }
    } else {
      forecast = await aiModule.generateForecast({
        product_id: productId,
        sales_data: salesData,
        days: parseInt(period, 10),
        model: modelType
      });
    }

    // If forecast returned an error-like object, propagate it
    if (forecast && forecast.status === 'error') {
      return res.status(500).json(forecast);
    }

    res.status(200).json({ status: 'success', forecast });
  } catch (error) {
    logger.error('Generate forecast error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate forecast', detail: error.message });
  }
}

async function detectAnomalies(req, res) {
  try {
    const { productId, threshold = 3 } = req.body;
    const transactions = await Transaction.findAll({
      where: { productId },
      order: [['transactionDate', 'ASC']],
      limit: 10000
    });

    const transactionData = transactions.map(t => ({
      date: t.transactionDate.toISOString().split('T')[0],
      quantity: t.quantity
    }));

    const result = await aiModule.detectAnomalies({
      transaction_data: transactionData,
      threshold
    });

    if (result && result.status === 'error') {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Detect anomalies error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to detect anomalies', detail: error.message });
  }
}

async function optimizeInventory(req, res) {
  try {
    const { productId, days = 30 } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const transactions = await Transaction.findAll({
      where: { productId },
      order: [['transactionDate', 'ASC']],
      limit: 10000
    });

    const salesData = transactions.map(t => ({
      date: t.transactionDate.toISOString().split('T')[0],
      quantity: t.quantity
    }));

    const result = await aiModule.optimizeInventory({
      product_data: {
        product_id: productId,
        current_stock: product.stock || 0,
        lead_time_days: product.leadTimeDays || 7,
        safety_stock: product.safetyStock || 0
      },
      forecast_data: { sales_history: salesData },
      days: parseInt(days, 10)
    });

    if (result && result.status === 'error') {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Optimize inventory error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to optimize inventory', detail: error.message });
  }
}
// Model training
async function trainModel(req, res) {
  try {
    const { productId, modelType = 'rf' } = req.body;
    const transactions = await Transaction.findAll({
      where: { productId },
      order: [['transactionDate', 'ASC']],
      limit: 10000
    });

    const salesData = transactions.map(t => ({
      date: t.transactionDate.toISOString().split('T')[0],
      quantity: t.quantity
    }));

    const result = await aiModule.trainModel({
      product_id: productId,
      sales_data: salesData,
      model_type: modelType,
      options: {}
    });

    if (result && result.status === 'error') {
      return res.status(500).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Train model error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to train model', detail: error.message });
  }
}

async function categorizeProduct(req, res) {
  try {
    // existing categorizeProduct logic (unchanged)
    const { name } = req.body;
    // naive demo categorization
    const category = (name || '').toLowerCase().includes('fruit') ? 'produce' : 'general';
    res.status(200).json({ status: 'success', category });
  } catch (error) {
    logger.error('Categorize product error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to categorize product' });
  }
}

async function analyzeSentiment(req, res) {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ status: 'error', message: 'No text provided' });
    }
    const result = await HuggingFaceService.analyze(text);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Analyze sentiment error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to analyze sentiment', detail: error.message });
  }
}

module.exports = {
  generateForecast,
  detectAnomalies,
  optimizeInventory,
  trainModel,
  categorizeProduct,
  analyzeSentiment
};
