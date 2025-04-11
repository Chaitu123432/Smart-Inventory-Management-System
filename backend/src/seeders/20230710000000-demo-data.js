'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create admin user
    const adminUser = await queryInterface.bulkInsert('Users', [{
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });

    // Create demo user
    const demoUser = await queryInterface.bulkInsert('Users', [{
      username: 'demo',
      email: 'demo@example.com',
      password: await bcrypt.hash('demo123', 10),
      firstName: 'Demo',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });

    // Create manager user
    const managerUser = await queryInterface.bulkInsert('Users', [{
      username: 'manager',
      email: 'manager@example.com',
      password: await bcrypt.hash('manager123', 10),
      firstName: 'Store',
      lastName: 'Manager',
      role: 'manager',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });

    // Create regular user
    const regularUser = await queryInterface.bulkInsert('Users', [{
      username: 'user',
      email: 'user@example.com',
      password: await bcrypt.hash('user123', 10),
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });

    // Create product categories
    const categories = [
      'Electronics',
      'Clothing',
      'Home & Kitchen',
      'Office Supplies',
      'Food & Beverages',
      'Health & Beauty'
    ];

    // Create demo products
    const products = [];
    
    // Electronics
    products.push({
      name: 'Smartphone Pro',
      sku: `ELEC-${uuidv4().substring(0, 8)}`,
      description: 'Latest smartphone with advanced features',
      category: 'Electronics',
      price: 899.99,
      quantity: 50,
      minStockLevel: 10,
      status: 'In Stock',
      location: 'Warehouse A, Section E1',
      supplier: 'TechDistributors Inc.',
      barcode: `SM${Math.floor(Math.random() * 10000000)}`,
      imageUrl: 'https://example.com/images/smartphone.jpg',
      createdBy: adminUser[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    products.push({
      name: 'Wireless Headphones',
      sku: `ELEC-${uuidv4().substring(0, 8)}`,
      description: 'Noise-cancelling wireless headphones with 24-hour battery life',
      category: 'Electronics',
      price: 149.99,
      quantity: 75,
      minStockLevel: 15,
      status: 'In Stock',
      location: 'Warehouse A, Section E2',
      supplier: 'AudioTech Ltd.',
      barcode: `WH${Math.floor(Math.random() * 10000000)}`,
      imageUrl: 'https://example.com/images/headphones.jpg',
      createdBy: managerUser[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    products.push({
      name: 'Smart Watch',
      sku: `ELEC-${uuidv4().substring(0, 8)}`,
      description: 'Fitness and health tracking smartwatch',
      category: 'Electronics',
      price: 199.99,
      quantity: 30,
      minStockLevel: 8,
      status: 'In Stock',
      location: 'Warehouse A, Section E3',
      supplier: 'TechDistributors Inc.',
      barcode: `SW${Math.floor(Math.random() * 10000000)}`,
      imageUrl: 'https://example.com/images/smartwatch.jpg',
      createdBy: adminUser[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Clothing
    products.push({
      name: 'Premium Jeans',
      sku: `CLTH-${uuidv4().substring(0, 8)}`,
      description: 'Comfortable and stylish jeans for everyday wear',
      category: 'Clothing',
      price: 59.99,
      quantity: 100,
      minStockLevel: 20,
      status: 'In Stock',
      location: 'Warehouse B, Section C1',
      supplier: 'Fashion Wholesalers',
      barcode: `PJ${Math.floor(Math.random() * 10000000)}`,
      imageUrl: 'https://example.com/images/jeans.jpg',
      createdBy: managerUser[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    products.push({
      name: 'Cotton T-Shirt',
      sku: `CLTH-${uuidv4().substring(0, 8)}`,
      description: '100% organic cotton t-shirt, eco-friendly and comfortable',
      category: 'Clothing',
      price: 24.99,
      quantity: 200,
      minStockLevel: 40,
      status: 'In Stock',
      location: 'Warehouse B, Section C2',
      supplier: 'EcoApparel Co.',
      barcode: `TS${Math.floor(Math.random() * 10000000)}`,
      imageUrl: 'https://example.com/images/tshirt.jpg',
      createdBy: regularUser[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Home & Kitchen
    products.push({
      name: 'Coffee Maker',
      sku: `HOME-${uuidv4().substring(0, 8)}`,
      description: 'Programmable coffee maker with thermal carafe',
      category: 'Home & Kitchen',
      price: 79.99,
      quantity: 40,
      minStockLevel: 8,
      status: 'In Stock',
      location: 'Warehouse C, Section H1',
      supplier: 'HomeGoods Supply',
      barcode: `CM${Math.floor(Math.random() * 10000000)}`,
      imageUrl: 'https://example.com/images/coffeemaker.jpg',
      createdBy: adminUser[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    products.push({
      name: 'Non-Stick Cookware Set',
      sku: `HOME-${uuidv4().substring(0, 8)}`,
      description: '10-piece non-stick cookware set with glass lids',
      category: 'Home & Kitchen',
      price: 129.99,
      quantity: 25,
      minStockLevel: 5,
      status: 'In Stock',
      location: 'Warehouse C, Section H2',
      supplier: 'KitchenPro Distributors',
      barcode: `CS${Math.floor(Math.random() * 10000000)}`,
      imageUrl: 'https://example.com/images/cookwareset.jpg',
      createdBy: managerUser[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Office Supplies
    products.push({
      name: 'Laser Printer',
      sku: `OFFC-${uuidv4().substring(0, 8)}`,
      description: 'High-speed wireless laser printer',
      category: 'Office Supplies',
      price: 299.99,
      quantity: 15,
      minStockLevel: 3,
      status: 'In Stock',
      location: 'Warehouse D, Section O1',
      supplier: 'Office Solutions Inc.',
      barcode: `LP${Math.floor(Math.random() * 10000000)}`,
      imageUrl: 'https://example.com/images/printer.jpg',
      createdBy: adminUser[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    products.push({
      name: 'Ergonomic Office Chair',
      sku: `OFFC-${uuidv4().substring(0, 8)}`,
      description: 'Adjustable office chair with lumbar support',
      category: 'Office Supplies',
      price: 189.99,
      quantity: 20,
      minStockLevel: 4,
      status: 'In Stock',
      location: 'Warehouse D, Section O2',
      supplier: 'Ergonomics Plus',
      barcode: `OC${Math.floor(Math.random() * 10000000)}`,
      imageUrl: 'https://example.com/images/officechair.jpg',
      createdBy: managerUser[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Insert products
    const createdProducts = await queryInterface.bulkInsert('Products', products, { returning: true });

    // Create some demo transactions
    const transactions = [];
    const transactionTypes = ['sale', 'purchase', 'adjustment'];
    const transactionStatuses = ['completed', 'completed', 'completed', 'completed', 'voided'];
    const paymentMethods = ['Credit Card', 'Cash', 'Bank Transfer', 'PayPal'];
    const users = [adminUser[0].id, managerUser[0].id, regularUser[0].id];
    
    // Generate 50 random transactions
    for (let i = 0; i < 50; i++) {
      const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      const randomType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const randomQuantity = Math.floor(Math.random() * 10) + 1;
      const pricePerUnit = parseFloat(randomProduct.price);
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomStatus = transactionStatuses[Math.floor(Math.random() * transactionStatuses.length)];
      const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      // Generate a random date between 90 days ago and now
      const now = new Date();
      const past90Days = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      const randomDate = new Date(past90Days.getTime() + Math.random() * (now.getTime() - past90Days.getTime()));
      
      transactions.push({
        type: randomType,
        productId: randomProduct.id,
        quantity: randomQuantity,
        pricePerUnit: pricePerUnit,
        totalAmount: pricePerUnit * randomQuantity,
        status: randomStatus,
        notes: `Demo ${randomType} transaction for ${randomProduct.name}`,
        transactionDate: randomDate,
        customerInfo: randomType === 'sale' ? {
          name: 'Demo Customer',
          email: 'customer@example.com',
          phone: '123-456-7890'
        } : null,
        supplierInfo: randomType === 'purchase' ? {
          name: randomProduct.supplier,
          contactPerson: 'Supplier Rep',
          email: 'supplier@example.com'
        } : null,
        reference: `REF-${Math.floor(Math.random() * 1000000)}`,
        paymentMethod: randomType === 'sale' || randomType === 'purchase' ? randomPaymentMethod : null,
        createdBy: randomUser,
        createdAt: randomDate,
        updatedAt: randomDate
      });
    }
    
    // Insert transactions
    await queryInterface.bulkInsert('Transactions', transactions);
    
    // Create sample forecasts
    const forecasts = [];
    const forecastModels = ['arima', 'lstm', 'prophet', 'ensemble'];
    
    // Generate 10 random forecasts
    for (let i = 0; i < 10; i++) {
      const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      const randomModel = forecastModels[Math.floor(Math.random() * forecastModels.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const period = Math.floor(Math.random() * 30) + 30; // 30-60 days
      
      // Start date between today and 15 days ago
      const now = new Date();
      const past15Days = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
      const randomStartDate = new Date(past15Days.getTime() + Math.random() * (now.getTime() - past15Days.getTime()));
      
      // End date is start date + period days
      const randomEndDate = new Date(randomStartDate);
      randomEndDate.setDate(randomStartDate.getDate() + period);
      
      // Generate random demand between 50 and 500
      const totalDemand = Math.floor(Math.random() * 450) + 50;
      const averageDailyDemand = totalDemand / period;
      
      // Calculate bounds with 95% confidence level
      const lowerBound = Math.floor(totalDemand * 0.8);
      const upperBound = Math.floor(totalDemand * 1.2);
      
      // Generate daily forecast data
      const dailyForecastData = [];
      let currentDate = new Date(randomStartDate);
      
      while (currentDate < randomEndDate) {
        // Add random variation to daily forecast
        const dailyVariation = (Math.random() * 0.4) - 0.2; // -20% to +20%
        const dailyDemand = Math.max(0, Math.round(averageDailyDemand * (1 + dailyVariation)));
        
        dailyForecastData.push({
          date: currentDate.toISOString().split('T')[0],
          demand: dailyDemand
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      forecasts.push({
        productId: randomProduct.id,
        period: period,
        startDate: randomStartDate,
        endDate: randomEndDate,
        totalDemand: totalDemand,
        confidenceLevel: 95.00,
        lowerBound: lowerBound,
        upperBound: upperBound,
        averageDailyDemand: averageDailyDemand,
        model: randomModel,
        accuracy: 85 + (Math.random() * 10), // 85-95% accuracy
        dailyForecastData: dailyForecastData,
        metadata: {
          dataPoints: Math.floor(Math.random() * 100) + 50,
          algorithm: randomModel,
          parameters: {
            confidenceLevel: 95,
            periodLength: period
          }
        },
        createdBy: randomUser,
        createdAt: randomStartDate,
        updatedAt: randomStartDate
      });
    }
    
    // Insert forecasts
    await queryInterface.bulkInsert('Forecasts', forecasts);
  },

  async down(queryInterface, Sequelize) {
    // Delete data in reverse order
    await queryInterface.bulkDelete('Forecasts', null, {});
    await queryInterface.bulkDelete('Transactions', null, {});
    await queryInterface.bulkDelete('Products', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
}; 