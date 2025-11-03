require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { seedDataIfNeeded } = require('./utils/seedAndLoadData');

// Create Express app
const app = express();

// ========================
// Middleware Setup
// ========================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// ========================
// Rate Limiting
// ========================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ========================
// Routes
// ========================
app.use('/api', routes);

// Default Route
app.get('/', (req, res) => {
  res.send('🚀 Smart Inventory Management System API is running');
});

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// ========================
// Database + Server Start
// ========================
const startServer = async () => {
  try {
    logger.info('🧠 Connecting to PostgreSQL database...');
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');

    // Sync database models
    await sequelize.sync({ alter: true });
    logger.info('🔁 Database models synchronized.');

    // Seed dataset from CSV files if needed
    logger.info('🌱 Checking for initial dataset...');
    await seedDataIfNeeded();

    // Start Express Server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running successfully on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`❌ Failed to start server or connect to DB: ${error.message}`);
    process.exit(1);
  }
};

// Start server
startServer();

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`⚠️ Unhandled Promise Rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`💥 Uncaught Exception: ${error.message}`);
  process.exit(1);
});
