const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering
 * @access  Authenticated
 */
router.get('/', authenticate, productController.getAllProducts);

/**
 * @route   GET /api/products/categories
 * @desc    Get product categories
 * @access  Authenticated
 */
router.get('/categories', authenticate, productController.getCategories);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Authenticated
 */
router.get('/:id', authenticate, productController.getProductById);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin/Manager
 */
router.post('/', authenticate, authorize(['admin', 'manager']), productController.createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Admin/Manager
 */
router.put('/:id', authenticate, authorize(['admin', 'manager']), productController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Admin
 */
router.delete('/:id', authenticate, authorize(['admin']), productController.deleteProduct);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Admin/Manager/User
 */
router.patch('/:id/stock', authenticate, authorize(['admin', 'manager', 'user']), productController.updateStock);

module.exports = router; 