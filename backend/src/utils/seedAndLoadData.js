const { Product, Customer, Store, Order, OrderItem } = require('../models');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const logger = require('./logger');

async function seedDataIfNeeded() {
  try {
    // Check if any data already exists
    const productsCount = await Product.count();
    if (productsCount > 0) {
      logger.info('✅ Data already exists, skipping seeding.');
      return;
    }

    const dataDir = path.join(__dirname, '../../data');

    // Helper function to load a CSV file
    const loadCSV = async (fileName) => {
      const rows = [];
      const filePath = path.join(dataDir, fileName);

      if (!fs.existsSync(filePath)) {
        throw new Error(`❌ Missing CSV file: ${filePath}`);
      }

      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', () => resolve(rows))
          .on('error', reject);
      });
    };

    logger.info('📦 Reading CSV files...');

    // Load all CSVs in parallel
    const [products, customers, stores, orders, orderItems] = await Promise.all([
      loadCSV('products.csv'),
      loadCSV('customers.csv'),
      loadCSV('stores.csv'),
      loadCSV('orders.csv'),
      loadCSV('order_items.csv'),
    ]);

    logger.info('🌱 CSV files loaded successfully.');

    // Remove string IDs if Sequelize auto-generates UUIDs
    const clean = (arr) =>
      arr.map(({ id, ...rest }) => {
        // Convert numeric or string values properly
        Object.keys(rest).forEach((key) => {
          if (rest[key] === '') rest[key] = null;
          // Convert numeric-like strings to numbers
          else if (!isNaN(rest[key])) rest[key] = Number(rest[key]);
        });
        return rest;
      });

    // Insert data in dependency-safe order
    await Store.bulkCreate(clean(stores));
    await Customer.bulkCreate(clean(customers));
    await Product.bulkCreate(clean(products));
    await Order.bulkCreate(clean(orders));
    await OrderItem.bulkCreate(clean(orderItems));

    logger.info('✅ Data seeded successfully.');
  } catch (error) {
    logger.error(`❌ Seeding failed: ${error.message}`, { error });
  }
}

module.exports = { seedDataIfNeeded };
