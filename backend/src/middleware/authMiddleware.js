const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Verifies the JWT token from the Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    // For development demo mode - if demo user, allow access
    const isDemoMode = process.env.NODE_ENV === 'development';
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (isDemoMode) {
        // In demo mode, create a demo user
        logger.info('Using demo user in development mode');
        req.user = {
          id: 'demo-id',
          username: 'demo',
          email: 'demo@example.com',
          role: 'admin',
          isActive: true
        };
        return next();
      }
      return res.status(401).json({ error: { message: 'Access denied. No token provided.' } });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id
      let user = await User.findByPk(decoded.id);
      
      // If user not found but in development mode, create a demo user
      if (!user && isDemoMode) {
        logger.info('Using demo user data from token in development mode');
        req.user = {
          id: decoded.id || 'demo-id',
          username: decoded.username || 'demo',
          email: decoded.email || 'demo@example.com',
          role: decoded.role || 'admin',
          isActive: true
        };
        return next();
      }
      
      // Check if user exists and is active
      if (!user || !user.isActive) {
        return res.status(401).json({ error: { message: 'Invalid token or user inactive.' } });
      }
      
      // Add user to request object
      req.user = user;
      
      // Continue to next middleware/route handler
      next();
    } catch (tokenError) {
      // If token verification fails and in demo mode, allow access with demo user
      if (isDemoMode) {
        logger.info('Token verification failed, using demo user in development mode');
        req.user = {
          id: 'demo-id',
          username: 'demo',
          email: 'demo@example.com',
          role: 'admin',
          isActive: true
        };
        return next();
      }
      
      // In production, handle token errors normally
      throw tokenError;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { message: 'Token expired.' } });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: { message: 'Invalid token.' } });
    }
    
    res.status(500).json({ error: { message: 'Authentication error.' } });
  }
};

/**
 * Authorization middleware
 * Checks if the authenticated user has the required role
 * @param {string[]} roles - Array of allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'User not authenticated.' } });
    }
    
    // If roles is a string, convert to array
    if (typeof roles === 'string') {
      roles = [roles];
    }
    
    // If roles is empty, allow all roles
    if (roles.length === 0) {
      return next();
    }
    
    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: { message: 'Access denied. Insufficient permissions.' } 
      });
    }
    
    // User has required role, continue
    next();
  };
};

module.exports = {
  authenticate,
  authorize
}; 