const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions with filtering
 * @access  Authenticated
 */
router.get('/', authenticate, transactionController.getAllTransactions);

/**
 * @route   GET /api/transactions/types
 * @desc    Get transaction types
 * @access  Authenticated
 */
router.get('/types', authenticate, transactionController.getTransactionTypes);

/**
 * @route   GET /api/transactions/stats
 * @desc    Get transaction statistics
 * @access  Admin/Manager
 */
router.get('/stats', authenticate, authorize(['admin', 'manager']), transactionController.getTransactionStats);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction by ID
 * @access  Authenticated
 */
router.get('/:id', authenticate, transactionController.getTransactionById);

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Authenticated
 */
router.post('/', authenticate, authorize(['admin', 'manager', 'user']), transactionController.createTransaction);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Admin/Manager
 */
router.put('/:id', authenticate, authorize(['admin', 'manager']), transactionController.updateTransaction);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Void/delete transaction
 * @access  Admin/Manager
 */
router.delete('/:id', authenticate, authorize(['admin']), transactionController.deleteTransaction);

/**
 * @route   PATCH /api/transactions/:id/status
 * @desc    Update transaction status
 * @access  Admin/Manager
 */
router.patch('/:id/status', authenticate, authorize(['admin', 'manager']), transactionController.updateTransactionStatus);

module.exports = router; 