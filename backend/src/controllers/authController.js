const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;
    
    // Check if user with email or username already exists
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [{ email }, { username }]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: { message: 'User with this email or username already exists' } 
      });
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role === 'admin' ? 'admin' : 'manager' // Ensure role is valid
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Send success response (without password)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: { message: 'Registration failed' } });
  }
};

/**
 * Login a user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Email and password are required' } });
    }
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    // Check if user exists and is active
    if (!user || !user.isActive) {
      return res.status(401).json({ error: { message: 'Invalid email or password' } });
    }
    
    // Check if password is correct
    const isPasswordValid = await user.validPassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: { message: 'Invalid email or password' } });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Send success response (without password)
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: { message: 'Login failed' } });
  }
};

/**
 * Get the current user
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    // User is available from auth middleware
    const user = req.user;
    
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ error: { message: 'Failed to get user information' } });
  }
};

/**
 * Change password
 * PUT /api/auth/password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // User is available from auth middleware
    const user = await User.findByPk(req.user.id);
    
    // Check if current password is correct
    const isPasswordValid = await user.validPassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: { message: 'Current password is incorrect' } });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: { message: 'Failed to change password' } });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  changePassword
}; 