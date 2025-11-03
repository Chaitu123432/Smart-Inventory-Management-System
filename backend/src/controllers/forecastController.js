const { Forecast, Product, User, Transaction } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

/**
 * Get all forecasts
 * GET /api/forecasts
 */
const getAllForecasts = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const {
      productId,
      model,
      startDate,
      endDate,
      minAccuracy,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter conditions
    const whereClause = {};

    if (productId) {
      whereClause.productId = productId;
    }

    if (model) {
      whereClause.model = model;
    }

    if (minAccuracy) {
      whereClause.accuracy = {
        [Op.gte]: parseFloat(minAccuracy)
      };
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.startDate = {};

      if (startDate) {
        whereClause.startDate[Op.gte] = new Date(startDate);
      }

      if (endDate) {
        whereClause.endDate[Op.lte] = new Date(endDate);
      }
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get forecasts with pagination
    const { count, rows: forecasts } = await Forecast.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit: parseInt(limit),
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'category']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // Transform forecasts to match frontend format
    const formattedForecasts = forecasts.map(forecast => {
      try {
        const dailyForecastData = forecast.dailyForecastData || [];
        const totalDemand = forecast.totalDemand || 1; // Prevent division by zero
        
        return {
          id: forecast.id,
          productId: forecast.productId,
          productName: forecast.product?.name || 'Unknown Product',
          historicalData: [], // Will be populated on individual forecast fetch
          forecastedData: dailyForecastData.map(day => {
            const demand = day?.demand || 0;
            return {
              date: day?.date || new Date().toISOString(),
              forecast: demand,
              lowerBound: Math.max(0, Math.round(demand * ((forecast.lowerBound || 0) / totalDemand))),
              upperBound: Math.round(demand * ((forecast.upperBound || demand) / totalDemand))
            };
          })
        };
      } catch (error) {
        logger.error(`Error formatting forecast ${forecast.id}:`, error);
        return {
          id: forecast.id,
          productId: forecast.productId,
          productName: 'Error loading forecast',
          historicalData: [],
          forecastedData: []
        };
      }
    });

    res.status(200).json({
      forecasts: formattedForecasts,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get all forecasts error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve forecasts' } });
  }
};

/**
 * Get forecast by ID
 * GET /api/forecasts/:id
 */
const getForecastById = async (req, res) => {
  try {
    const { id } = req.params;

    const forecast = await Forecast.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          include: [{
            model: Transaction,
            as: 'transactions',
            attributes: ['id', 'type', 'quantity', 'totalAmount', 'transactionDate'],
            where: {
              type: 'sale',
              transactionDate: {
                [Op.gte]: sequelize.literal('NOW() - INTERVAL \'90 DAY\'')
              }
            },
            required: false,
            limit: 90,
            order: [['transactionDate', 'ASC']]
          }]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    if (!forecast) {
      return res.status(404).json({ error: { message: 'Forecast not found' } });
    }

    // Extract historical sales data for comparison
    const historicalData = [];
    const actualSalesByDate = {};

    if (forecast.product && forecast.product.transactions) {
      forecast.product.transactions.forEach(transaction => {
        const date = transaction.transactionDate.toISOString().split('T')[0];
        if (!actualSalesByDate[date]) {
          actualSalesByDate[date] = 0;
        }
        actualSalesByDate[date] += transaction.quantity;
      });

      // Convert to array and sort by date
      Object.entries(actualSalesByDate).forEach(([date, quantity]) => {
        historicalData.push({ date, quantity });
      });
      historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Add historical data to the response
    const forecastWithHistory = {
      ...forecast.toJSON(),
      historicalData
    };

    res.status(200).json({ forecast: forecastWithHistory });
  } catch (error) {
    logger.error('Get forecast by ID error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve forecast' } });
  }
};

/**
 * Create a new forecast
 * POST /api/forecasts
 */
const createForecast = async (req, res) => {
  try {
    const {
      productId,
      period,
      startDate,
      endDate,
      totalDemand,
      confidenceLevel,
      lowerBound,
      upperBound,
      averageDailyDemand,
      model,
      accuracy,
      dailyForecastData,
      metadata
    } = req.body;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    // Create new forecast
    const forecast = await Forecast.create({
      productId,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDemand,
      confidenceLevel,
      lowerBound,
      upperBound,
      averageDailyDemand,
      model,
      accuracy,
      dailyForecastData,
      metadata,
      createdBy: req.user.id
    });

    // Fetch full forecast with associations
    const fullForecast = await Forecast.findByPk(forecast.id, {
      include: [
        {
          model: Product,
          as: 'product'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      message: 'Forecast created successfully',
      forecast: fullForecast
    });
  } catch (error) {
    logger.error('Create forecast error:', error);
    res.status(500).json({ error: { message: 'Failed to create forecast' } });
  }
};

/**
 * Update a forecast
 * PUT /api/forecasts/:id
 */
const updateForecast = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      confidenceLevel,
      lowerBound,
      upperBound,
      accuracy,
      metadata
    } = req.body;

    // Find forecast by ID
    const forecast = await Forecast.findByPk(id);

    if (!forecast) {
      return res.status(404).json({ error: { message: 'Forecast not found' } });
    }

    // Only allow updates to certain fields, not the core forecast data
    await forecast.update({
      confidenceLevel,
      lowerBound,
      upperBound,
      accuracy,
      metadata
    });

    // Fetch updated forecast with associations
    const updatedForecast = await Forecast.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    res.status(200).json({
      message: 'Forecast updated successfully',
      forecast: updatedForecast
    });
  } catch (error) {
    logger.error('Update forecast error:', error);
    res.status(500).json({ error: { message: 'Failed to update forecast' } });
  }
};

/**
 * Delete a forecast
 * DELETE /api/forecasts/:id
 */
const deleteForecast = async (req, res) => {
  try {
    const { id } = req.params;

    // Find forecast by ID
    const forecast = await Forecast.findByPk(id);

    if (!forecast) {
      return res.status(404).json({ error: { message: 'Forecast not found' } });
    }

    // Delete the forecast
    await forecast.destroy();

    res.status(200).json({ message: 'Forecast deleted successfully' });
  } catch (error) {
    logger.error('Delete forecast error:', error);
    res.status(500).json({ error: { message: 'Failed to delete forecast' } });
  }
};

/**
 * Generate a new forecast based on historical data
 * POST /api/forecasts/generate
 */
const generateForecast = async (req, res) => {
  try {
    logger.info('Starting forecast generation with request:', JSON.stringify(req.body));
    
    const {
      productId,
      period = 30,
      startDate = new Date(),
      model = 'arima',
      confidenceLevel = 95
    } = req.body;

    if (!productId) {
      logger.warn('Attempt to generate forecast without productId');
      return res.status(400).json({ 
        error: { message: 'productId is required' }
      });
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      logger.warn(`Product not found for ID: ${productId}`);
      return res.status(404).json({ 
        error: { message: 'Product not found' }
      });
    }

    logger.info(`Found product ${product.name} (${product.id}), fetching historical sales...`);

    // Get historical sales data
    const historicalSales = await Transaction.findAll({
      where: {
        productId,
        type: 'sale',
        transactionDate: {
          [Op.gte]: sequelize.literal('NOW() - INTERVAL \'365 DAY\'')
        }
      },
      attributes: [
        'transactionDate',
        'quantity'
      ],
      order: [['transactionDate', 'ASC']]
    });

    // Validate sufficient data
    if (historicalSales.length < 30) {
      return res.status(400).json({
        error: {
          message: 'Insufficient historical data for forecast',
          required: 30,
          available: historicalSales.length
        }
      });
    }

    // In a real implementation, this would call an ML service or use a statistical library
    // For this example, we'll use a simple moving average approach
    
    // Aggregate daily sales
    const dailySales = {};
    historicalSales.forEach(sale => {
      const date = sale.transactionDate.toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = 0;
      }
      dailySales[date] += sale.quantity;
    });
    
    // Convert to array and calculate moving average
    const salesData = Object.entries(dailySales).map(([date, quantity]) => ({ date, quantity }));
    salesData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate average daily demand
    const lastMonth = salesData.slice(-30);
    const averageDailyDemand = lastMonth.reduce((sum, day) => sum + day.quantity, 0) / lastMonth.length;
    
    // Calculate forecast for the requested period
    const totalDemand = Math.round(averageDailyDemand * period);
    
    // Calculate confidence bounds (in a real implementation this would be statistical)
    const variance = lastMonth.reduce((sum, day) => {
      return sum + Math.pow(day.quantity - averageDailyDemand, 2);
    }, 0) / lastMonth.length;
    
    const stdDev = Math.sqrt(variance);
    const zScore = confidenceLevel === 95 ? 1.96 : confidenceLevel === 90 ? 1.645 : 2.576; // For 95%, 90%, 99%
    
    const marginOfError = zScore * (stdDev / Math.sqrt(period));
    const lowerBound = Math.max(0, Math.round(totalDemand - marginOfError));
    const upperBound = Math.round(totalDemand + marginOfError);
    
    // Generate daily forecast data
    const dailyForecastData = [];
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + period);
    
    let currentDate = new Date(startDate);
    while (currentDate < endDate) {
      // Add random variation to daily forecast (+/- 20%)
      const dailyVariation = (Math.random() * 0.4) - 0.2; // -20% to +20%
      const dailyDemand = Math.max(0, Math.round(averageDailyDemand * (1 + dailyVariation)));
      
      dailyForecastData.push({
        date: currentDate.toISOString().split('T')[0],
        forecast: dailyDemand,
        lowerBound: Math.max(0, Math.round(dailyDemand * (lowerBound / totalDemand))),
        upperBound: Math.round(dailyDemand * (upperBound / totalDemand))
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Create accuracy estimate (in a real implementation, this would come from model validation)
    const accuracy = 85 + (Math.random() * 10); // 85-95% accuracy
    
    // Create forecast
    const forecast = await Forecast.create({
      productId,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDemand,
      confidenceLevel,
      lowerBound,
      upperBound,
      averageDailyDemand,
      model,
      accuracy,
      dailyForecastData,
      metadata: {
        dataPoints: historicalSales.length,
        algorithm: model,
        parameters: {
          confidenceLevel,
          periodLength: period
        }
      },
      createdBy: req.user.id
    });
    
    // Fetch full forecast with associations
    const fullForecast = await Forecast.findByPk(forecast.id, {
      include: [
        {
          model: Product,
          as: 'product'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });
    
    // Format response to match frontend expectations
    const formattedForecast = {
      id: fullForecast.id,
      productId: fullForecast.productId,
      productName: fullForecast.product?.name || 'Unknown Product',
      historicalData: historicalSales.map(sale => ({
        date: sale.transactionDate.toISOString().split('T')[0],
        sales: sale.quantity
      })),
      forecastedData: dailyForecastData
    };

    res.status(201).json({
      message: 'Forecast generated successfully',
      forecast: formattedForecast
    });
  } catch (error) {
    logger.error('Generate forecast error:', error);
    res.status(500).json({ error: { message: 'Failed to generate forecast' } });
  }
};

/**
 * Get forecasting models
 * GET /api/forecasts/models
 */
const getForecastModels = async (req, res) => {
  try {
    // Return available forecasting models
    const models = [
      {
        id: 'arima',
        name: 'ARIMA',
        description: 'AutoRegressive Integrated Moving Average - Traditional statistical forecasting method',
        bestFor: 'Time series with strong seasonality and trends',
        complexity: 'Medium'
      },
      {
        id: 'lstm',
        name: 'LSTM Neural Network',
        description: 'Long Short-Term Memory neural network - Deep learning forecasting method',
        bestFor: 'Complex patterns and non-linear relationships',
        complexity: 'High'
      },
      {
        id: 'prophet',
        name: 'Prophet',
        description: 'Facebook\'s Prophet forecasting tool - Handles holidays and seasonality well',
        bestFor: 'Business time series with seasonal effects and holiday impacts',
        complexity: 'Low'
      },
      {
        id: 'ensemble',
        name: 'Ensemble Model',
        description: 'Combines multiple forecasting models for improved accuracy',
        bestFor: 'Critical forecasts where accuracy is paramount',
        complexity: 'High'
      }
    ];
    
    res.status(200).json({ models });
  } catch (error) {
    logger.error('Get forecast models error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve forecast models' } });
  }
};

/**
 * Get forecast accuracy assessment
 * GET /api/forecasts/:id/accuracy
 */
const getForecastAccuracy = async (req, res) => {
  try {
    const { id } = req.params;

    // Find forecast by ID
    const forecast = await Forecast.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product',
          include: [{
            model: Transaction,
            as: 'transactions',
            attributes: ['id', 'type', 'quantity', 'transactionDate'],
            where: {
              type: 'sale',
              transactionDate: {
                [Op.between]: [
                  sequelize.col('Forecast.startDate'),
                  sequelize.col('Forecast.endDate')
                ]
              }
            },
            required: false
          }]
        }
      ]
    });

    if (!forecast) {
      return res.status(404).json({ error: { message: 'Forecast not found' } });
    }

    // Check if forecast period has passed
    const now = new Date();
    if (now < new Date(forecast.endDate)) {
      return res.status(400).json({
        error: {
          message: 'Forecast period has not completed yet',
          forecastEndDate: forecast.endDate,
          currentDate: now
        }
      });
    }

    // Calculate actual sales during the forecast period
    const actualSales = forecast.product.transactions.reduce((sum, t) => sum + t.quantity, 0);
    
    // Calculate accuracy metrics
    const forecastError = Math.abs(actualSales - forecast.totalDemand);
    const percentageError = (forecastError / forecast.totalDemand) * 100;
    const accuracy = 100 - percentageError;
    
    // Check if sales fall within confidence interval
    const withinConfidenceInterval = 
      actualSales >= forecast.lowerBound && 
      actualSales <= forecast.upperBound;
    
    // Daily accuracy
    const actualSalesByDate = {};
    forecast.product.transactions.forEach(transaction => {
      const date = transaction.transactionDate.toISOString().split('T')[0];
      if (!actualSalesByDate[date]) {
        actualSalesByDate[date] = 0;
      }
      actualSalesByDate[date] += transaction.quantity;
    });
    
    // Compare daily forecast vs actual
    const dailyComparison = forecast.dailyForecastData.map(forecastDay => {
      const date = forecastDay.date;
      const forecastDemand = forecastDay.demand;
      const actualDemand = actualSalesByDate[date] || 0;
      
      return {
        date,
        forecastDemand,
        actualDemand,
        difference: actualDemand - forecastDemand,
        percentageError: forecastDemand ? (Math.abs(actualDemand - forecastDemand) / forecastDemand) * 100 : 0
      };
    });
    
    // Update forecast accuracy
    await forecast.update({
      accuracy: Math.max(0, Math.min(100, accuracy.toFixed(2))),
      metadata: {
        ...forecast.metadata,
        accuracyAssessment: {
          forecastError,
          percentageError,
          withinConfidenceInterval,
          assessmentDate: new Date()
        }
      }
    });
    
    res.status(200).json({
      forecastId: forecast.id,
      product: {
        id: forecast.product.id,
        name: forecast.product.name
      },
      period: {
        start: forecast.startDate,
        end: forecast.endDate,
        days: forecast.period
      },
      forecast: {
        totalDemand: forecast.totalDemand,
        lowerBound: forecast.lowerBound,
        upperBound: forecast.upperBound,
        averageDailyDemand: forecast.averageDailyDemand
      },
      actual: {
        totalSales: actualSales,
        averageDailySales: actualSales / forecast.period
      },
      accuracy: {
        error: forecastError,
        percentageError: percentageError.toFixed(2),
        accuracy: accuracy.toFixed(2),
        withinConfidenceInterval
      },
      dailyComparison
    });
  } catch (error) {
    logger.error('Get forecast accuracy error:', error);
    res.status(500).json({ error: { message: 'Failed to assess forecast accuracy' } });
  }
};

module.exports = {
  getAllForecasts,
  getForecastById,
  createForecast,
  updateForecast,
  deleteForecast,
  generateForecast,
  getForecastModels,
  getForecastAccuracy
}; 