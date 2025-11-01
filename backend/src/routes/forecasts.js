const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/forecasts
 * @desc    Get all forecasts with filtering
 * @access  Admin/Manager
 */
router.get('/', authenticate, forecastController.getAllForecasts);

/**
 * @route   GET /api/forecasts/models
 * @desc    Get available forecasting models
 * @access  Admin/Manager
 */
router.get('/models', authenticate, forecastController.getForecastModels);

/**
 * @route   GET /api/forecasts/:id
 * @desc    Get forecast by ID
 * @access  Admin/Manager
 */
router.get('/:id', authenticate, forecastController.getForecastById);

/**
 * @route   GET /api/forecasts/:id/accuracy
 * @desc    Get forecast accuracy assessment
 * @access  Admin/Manager
 */
router.get('/:id/accuracy', authenticate, authorize(['admin', 'manager']), forecastController.getForecastAccuracy);

/**
 * @route   POST /api/forecasts
 * @desc    Create a new forecast
 * @access  Admin/Manager
 */
router.post('/', authenticate, authorize(['admin', 'manager']), forecastController.createForecast);

/**
 * @route   POST /api/forecasts/generate
 * @desc    Generate a new forecast
 * @access  Admin/Manager
 */
router.post('/generate', authenticate, authorize(['admin', 'manager']), forecastController.generateForecast);

/**
 * @route   PUT /api/forecasts/:id
 * @desc    Update forecast
 * @access  Admin/Manager
 */
router.put('/:id', authenticate, authorize(['admin', 'manager']), forecastController.updateForecast);

/**
 * @route   DELETE /api/forecasts/:id
 * @desc    Delete forecast
 * @access  Admin
 */
router.delete('/:id', authenticate, authorize(['admin']), forecastController.deleteForecast);

module.exports = router; 