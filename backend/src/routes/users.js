const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering
 * @access  Admin
 */
router.get('/', authenticate, authorize(['admin']), userController.getAllUsers);

/**
 * @route   GET /api/users/roles
 * @desc    Get available user roles
 * @access  Admin
 */
router.get('/roles', authenticate, authorize(['admin']), userController.getUserRoles);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin or Own User
 */
router.get('/:id', authenticate, authorize(['admin']), userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Admin
 */
router.post('/', authenticate, authorize(['admin']), userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin or Own User
 */
router.put('/:id', authenticate, authorize(['admin']), userController.updateUser);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Update user password
 * @access  Own User Only
 */
router.put('/:id/password', authenticate, userController.updatePassword);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Admin
 */
router.patch('/:id/status', authenticate, authorize(['admin']), userController.updateUserStatus);

/**
 * @route   GET /api/users/:id/activity
 * @desc    Get user activity
 * @access  Admin or Own User
 */
router.get('/:id/activity', authenticate, authorize(['admin']), userController.getUserActivity);

module.exports = router; 