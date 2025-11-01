require('dotenv').config();
const { sequelize } = require('../models');

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    // Use sequelize.query() instead of pool.query()
    // or use sequelize.sync() to auto-create tables
    await sequelize.sync({ force: false });
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    process.exit(); // Exit once the task is done
  }
}

initializeDatabase();
