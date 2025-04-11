const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/forecast', authenticate, authorize(['admin', 'manager']), aiController.generateForecast);
router.post('/anomalies', authenticate, authorize(['admin', 'manager']), aiController.detectAnomalies);
router.post('/optimize', authenticate, authorize(['admin', 'manager']), aiController.optimizeInventory);
router.post('/train', authenticate, authorize(['admin']), aiController.trainModel);

module.exports = router; 