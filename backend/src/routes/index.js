const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth');
const userRoutes = require('./users');
const productRoutes = require('./products');
const transactionRoutes = require('./transactions');
const forecastRoutes = require('./forecasts');
const aiRoutes = require('./ai');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/transactions', transactionRoutes);
router.use('/forecasts', forecastRoutes);
router.use('/ai', aiRoutes);

// Basic health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is operational',
    timestamp: new Date().toISOString()
  });
});

// Catch-all for undefined routes
router.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot find ${req.originalUrl} on this server!`
  });
});

module.exports = router; 