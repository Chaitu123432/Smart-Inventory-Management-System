require('dotenv').config();
const { sequelize } = require('../models');

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('⚠️  WARNING: This will DROP all existing tables!');
    // Change force to true to recreate tables
    await sequelize.sync({ force: true });
    console.log('✅ Database tables recreated successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    process.exit();
  }
}

initializeDatabase();
