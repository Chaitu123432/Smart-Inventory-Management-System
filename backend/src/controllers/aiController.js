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
      where: {
        productId,
        type: 'sale',
        transactionDate: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 365))
        },
        status: 'completed'
      },
      attributes: ['id', 'transactionDate', 'quantity']
    });
    
    if (transactions.length < 10) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Insufficient transaction data for forecasting',
        required: 10,
        available: transactions.length
      });
    }
    
    const salesData = transactions.map(t => ({
      date: t.transactionDate.toISOString().split('T')[0],
      quantity: t.quantity
    }));

    let forecast;

    // Choose between HuggingFace or Python ML models
    if (useHuggingFace && HuggingFaceService.isConfigured()) {
      try {
        logger.info(`Using HuggingFace model for product ${productId}`);
        forecast = await HuggingFaceService.forecastDemand(salesData, parseInt(period));
        // Format to match Python module response structure
        forecast = {
          ...forecast,
          product_id: productId,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + parseInt(period) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          confidence_level: 95,
          daily_forecast: forecast.predictions ? forecast.predictions.map((demand, index) => ({
            date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            demand: Math.max(0, Math.round(demand))
          })) : [],
          model: 'huggingface-forecast-t5'
        };
      } catch (hfError) {
        logger.warn('HuggingFace forecast failed, falling back to Python ML:', hfError);
        // Fallback to Python ML
        forecast = await aiModule.generateForecast(productId, salesData, { 
          period: parseInt(period), 
          model: modelType 
        });
      }
    } else {
      // Use Python ML models (default)
      logger.info(`Using Python ML model (${modelType}) for product ${productId}`);
      forecast = await aiModule.generateForecast(productId, salesData, { 
        period: parseInt(period), 
        model: modelType 
      });
    }
    
    res.status(200).json(forecast);
  } catch (error) {
    logger.error('Generate forecast error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate forecast', detail: error.message });
  }
}

async function detectAnomalies(req, res) {
  try {
    const { productId, threshold = 3, days = 90 } = req.body;
    
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    
    const transactions = await Transaction.findAll({
      where: {
        productId,
        type: 'sale',
        transactionDate: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - days))
        }
      },
      attributes: ['id', 'transactionDate', 'quantity']
    });
    
    if (transactions.length < 10) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Insufficient transaction data for anomaly detection',
        required: 10,
        available: transactions.length
      });
    }
    
    const transactionData = transactions.map(t => ({
      date: t.transactionDate.toISOString().split('T')[0],
      quantity: t.quantity
    }));
    
    const anomalies = await aiModule.detectAnomalies(transactionData, threshold);
    
    res.status(200).json(anomalies);
  } catch (error) {
    logger.error('Detect anomalies error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to detect anomalies' });
  }
}

async function optimizeInventory(req, res) {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Product IDs array is required' });
    }
    
    const products = await Product.findAll({
      where: {
        id: {
          [Op.in]: productIds
        }
      }
    });
    
    if (products.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No products found' });
    }
    
    const productsData = products.map(p => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      minStockLevel: p.minStockLevel
    }));
    
    const forecastPromises = productsData.map(async (product) => {
      const transactions = await Transaction.findAll({
        where: {
          productId: product.id,
          type: 'sale',
          transactionDate: {
            [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 90))
          },
          status: 'completed'
        },
        attributes: ['id', 'transactionDate', 'quantity']
      });
      
      if (transactions.length < 10) {
        return {
          product_id: product.id,
          average_daily_demand: 0,
          status: 'error',
          message: 'Insufficient data'
        };
      }
      
      const salesData = transactions.map(t => ({
        date: t.transactionDate.toISOString().split('T')[0],
        quantity: t.quantity
      }));
      
      const forecast = await aiModule.generateForecast(product.id, salesData, { period: 30 });
      return {
        product_id: product.id,
        average_daily_demand: forecast.average_daily_demand || 0
      };
    });
    
    const forecastResults = await Promise.all(forecastPromises);
    const recommendations = await aiModule.optimizeInventory(productsData, forecastResults);
    
    res.status(200).json(recommendations);
  } catch (error) {
    logger.error('Optimize inventory error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to optimize inventory' });
  }
}

async function trainModel(req, res) {
  try {
    const { productId } = req.body;
    
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    
    const transactions = await Transaction.findAll({
      where: {
        productId,
        type: 'sale',
        transactionDate: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 365))
        },
        status: 'completed'
      },
      attributes: ['id', 'transactionDate', 'quantity']
    });
    
    if (transactions.length < 30) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Insufficient transaction data for training',
        required: 30,
        available: transactions.length
      });
    }
    
    const salesData = transactions.map(t => ({
      date: t.transactionDate.toISOString().split('T')[0],
      quantity: t.quantity
    }));
    
    const result = await aiModule.trainModel(productId, salesData);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Train model error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to train model' });
  }
}

// New functions for HuggingFace features
async function categorizeProduct(req, res) {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ status: 'error', message: 'Product description is required' });
    }

    if (!HuggingFaceService.isConfigured()) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'HuggingFace API key not configured. Set HUGGING_FACE_API_KEY in .env file' 
      });
    }

    const result = await HuggingFaceService.categorizeProduct(description);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Categorize product error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to categorize product', detail: error.message });
  }
}

async function analyzeSentiment(req, res) {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ status: 'error', message: 'Text is required for sentiment analysis' });
    }

    if (!HuggingFaceService.isConfigured()) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'HuggingFace API key not configured. Set HUGGING_FACE_API_KEY in .env file' 
      });
    }

    const result = await HuggingFaceService.analyzeSentiment(text);
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