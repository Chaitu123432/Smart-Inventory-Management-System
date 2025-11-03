'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Users table
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('admin', 'manager', 'user', 'viewer'),
        defaultValue: 'user'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create Products table
    await queryInterface.createTable('Products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      minStockLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('In Stock', 'Low Stock', 'Out of Stock'),
        defaultValue: 'In Stock'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      supplier: {
        type: Sequelize.STRING,
        allowNull: true
      },
      barcode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create Transactions table
    await queryInterface.createTable('Transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM('sale', 'purchase', 'adjustment', 'return', 'reversal'),
        allowNull: false
      },
      productId: {
        type: Sequelize.UUID,
        references: {
          model: 'Products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      pricePerUnit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'voided'),
        defaultValue: 'completed'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      transactionDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      customerInfo: {
        type: Sequelize.JSON,
        allowNull: true
      },
      supplierInfo: {
        type: Sequelize.JSON,
        allowNull: true
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      reversalOf: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create Forecasts table
    await queryInterface.createTable('Forecasts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      period: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 365
        }
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      totalDemand: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      confidenceLevel: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 95.00
      },
      lowerBound: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      upperBound: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      averageDailyDemand: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      model: {
        type: Sequelize.ENUM('arima', 'lstm', 'prophet', 'ensemble'),
        allowNull: false,
        defaultValue: 'arima'
      },
      accuracy: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      dailyForecastData: {
        type: Sequelize.JSON,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create indexes for better performance
    await queryInterface.addIndex('Users', ['username']);
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['role']);
    await queryInterface.addIndex('Products', ['sku']);
    await queryInterface.addIndex('Products', ['name']);
    await queryInterface.addIndex('Products', ['category']);
    await queryInterface.addIndex('Products', ['status']);
    await queryInterface.addIndex('Transactions', ['type']);
    await queryInterface.addIndex('Transactions', ['productId']);
    await queryInterface.addIndex('Transactions', ['transactionDate']);
    await queryInterface.addIndex('Transactions', ['createdBy']);
    await queryInterface.addIndex('Forecasts', ['productId']);
    await queryInterface.addIndex('Forecasts', ['startDate']);
    await queryInterface.addIndex('Forecasts', ['endDate']);
    await queryInterface.addIndex('Forecasts', ['model']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('Forecasts');
    await queryInterface.dropTable('Transactions');
    await queryInterface.dropTable('Products');
    await queryInterface.dropTable('Users');
  }
}; 