const { User, Transaction, Product } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

/**
 * Get all users with filtering
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized access' } });
    }

    // Extract query parameters for filtering
    const {
      role,
      status,
      search,
      sortBy = 'username',
      sortOrder = 'asc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter conditions
    const whereClause = {};

    if (role) {
      whereClause.role = role;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get users with pagination
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit: parseInt(limit),
      attributes: { exclude: ['password'] }
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      users,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve users' } });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is requesting their own profile or has admin role
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized access' } });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve user' } });
  }
};

/**
 * Create a new user (admin only)
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized access' } });
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role = 'user',
      status = 'active'
    } = req.body;

    // Check for required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: { message: 'Username, email and password are required' } });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: { message: 'Username or email already exists' } });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password, // Model hooks will handle password hashing
      firstName,
      lastName,
      role,
      status
    });

    // Return user without password
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ error: { message: 'Failed to create user' } });
  }
};

/**
 * Update a user
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      role,
      status
    } = req.body;

    // Check if user is updating their own profile or has admin role
    const isOwnProfile = req.user.id === parseInt(id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ error: { message: 'Unauthorized access' } });
    }

    // Find user by ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Prepare update data
    const updateData = {};

    // Regular users can only update their own profile information
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    // Only admins can update these fields
    if (isAdmin) {
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (status) updateData.status = status;
    }

    // Update user
    await user.update(updateData);

    // Get updated user without password
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: { message: 'Failed to update user' } });
  }
};

/**
 * Update user password
 * PUT /api/users/:id/password
 */
const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Check if user is updating their own password
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: { message: 'Unauthorized access' } });
    }

    // Find user by ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Verify current password
    const isPasswordValid = await user.validPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ error: { message: 'Current password is incorrect' } });
    }

    // Update password
    user.password = newPassword; // Model hooks will handle hashing
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Update password error:', error);
    res.status(500).json({ error: { message: 'Failed to update password' } });
  }
};

/**
 * Deactivate/reactivate a user (admin only)
 * PATCH /api/users/:id/status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized access' } });
    }

    // Prevent deactivating self
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: { message: 'Cannot change your own status' } });
    }

    // Find user by ID
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Update user status
    await user.update({ status });

    res.status(200).json({
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        username: user.username,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({ error: { message: 'Failed to update user status' } });
  }
};

/**
 * Get user activity
 * GET /api/users/:id/activity
 */
const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;

    // Check if user is requesting their own activity or has admin role
    const isOwnActivity = req.user.id === parseInt(id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwnActivity && !isAdmin) {
      return res.status(403).json({ error: { message: 'Unauthorized access' } });
    }

    // Find user first to check if exists
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'firstName', 'lastName']
    });

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Get recent transactions
    const transactions = await Transaction.findAll({
      where: { createdBy: id },
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'sku', 'category']
      }]
    });

    res.status(200).json({
      user,
      activity: {
        transactions
      }
    });
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve user activity' } });
  }
};

/**
 * Get user roles
 * GET /api/users/roles
 */
const getUserRoles = async (req, res) => {
  try {
    // Only admins can access roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Unauthorized access' } });
    }

    // Return available roles
    const roles = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access'
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Can manage products, transactions, and view forecasts'
      },
      {
        id: 'user',
        name: 'User',
        description: 'Can view products and create transactions'
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to system data'
      }
    ];

    res.status(200).json({ roles });
  } catch (error) {
    logger.error('Get user roles error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve user roles' } });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updatePassword,
  updateUserStatus,
  getUserActivity,
  getUserRoles
}; 