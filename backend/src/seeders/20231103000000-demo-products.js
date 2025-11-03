'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create demo products
    const products = [
      {
        id: uuidv4(),
        name: 'Laptop Computer',
        sku: 'LAP001',
        category: 'Electronics',
        price: 999.99,
        quantity: 50,
        min_stock_level: 10,
        reorder_point: 15,
        safety_stock: 20,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Wireless Mouse',
        sku: 'MOU001',
        category: 'Accessories',
        price: 29.99,
        quantity: 100,
        min_stock_level: 20,
        reorder_point: 30,
        safety_stock: 25,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'USB-C Cable',
        sku: 'USB001',
        category: 'Accessories',
        price: 19.99,
        quantity: 200,
        min_stock_level: 50,
        reorder_point: 75,
        safety_stock: 60,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('products', products, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
  }
};