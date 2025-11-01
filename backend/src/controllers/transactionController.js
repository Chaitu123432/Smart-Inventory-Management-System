const { Transaction, Product, User } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Get all transactions with filtering
 * GET /api/transactions
 */
const getAllTransactions = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const {
      type,
      productId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      status,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter conditions
    const whereClause = {};

    if (type) {
      whereClause.type = type;
    }

    if (productId) {
      whereClause.productId = productId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.transactionDate = {};
      
      if (startDate) {
        whereClause.transactionDate[Op.gte] = new Date(startDate);
      }
      
      if (endDate) {
        whereClause.transactionDate[Op.lte] = new Date(endDate);
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      whereClause.totalAmount = {};
      
      if (minAmount) {
        whereClause.totalAmount[Op.gte] = parseFloat(minAmount);
      }
      
      if (maxAmount) {
        whereClause.totalAmount[Op.lte] = parseFloat(maxAmount);
      }
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get transactions with pagination
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit: parseInt(limit),
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'category']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // Calculate transaction statistics
    const totalSales = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
      
    const totalPurchases = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);

    // Return transactions with pagination info
    res.status(200).json({
      transactions,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      },
      summary: {
        totalSales,
        totalPurchases,
        profit: totalSales - totalPurchases,
        totalTransactions: count
      }
    });
  } catch (error) {
    logger.error('Get all transactions error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve transactions' } });
  }
};

/**
 * Get transaction by ID
 * GET /api/transactions/:id
 */
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ error: { message: 'Transaction not found' } });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    logger.error('Get transaction by ID error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve transaction' } });
  }
};

/**
 * Create a new transaction
 * POST /api/transactions
 */
const createTransaction = async (req, res) => {
  try {
    const {
      type,
      productId,
      quantity,
      pricePerUnit,
      notes,
      customerInfo,
      supplierInfo,
      reference,
      paymentMethod,
      transactionDate = new Date()
    } = req.body;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    // Validate transaction type
    const validTypes = ['sale', 'purchase', 'adjustment', 'return'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: { message: 'Invalid transaction type' } });
    }

    // Calculate total amount
    const totalAmount = quantity * pricePerUnit;

    // Check if enough stock for sales
    if (type === 'sale' && product.quantity < quantity) {
      return res.status(400).json({ 
        error: { 
          message: 'Insufficient stock',
          availableQuantity: product.quantity
        } 
      });
    }

    // Create new transaction
    const transaction = await Transaction.create({
      type,
      productId,
      quantity,
      pricePerUnit,
      totalAmount,
      notes,
      customerInfo,
      supplierInfo,
      reference,
      paymentMethod,
      transactionDate,
      createdBy: req.user.id,
      status: 'completed'
    });

    // Transaction automatically updates product quantity via hooks

    // Fetch updated transaction with associated data
    const fullTransaction = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: Product,
          as: 'product'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: fullTransaction
    });
  } catch (error) {
    logger.error('Create transaction error:', error);
    res.status(500).json({ error: { message: 'Failed to create transaction' } });
  }
};

/**
 * Update a transaction
 * PUT /api/transactions/:id
 */
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      notes,
      customerInfo,
      supplierInfo,
      reference,
      paymentMethod,
      status
    } = req.body;

    // Find transaction by ID
    const transaction = await Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).json({ error: { message: 'Transaction not found' } });
    }

    // Only allow updates to certain fields, not the core transaction data
    await transaction.update({
      notes,
      customerInfo,
      supplierInfo,
      reference,
      paymentMethod,
      status
    });

    // Fetch updated transaction with associations
    const updatedTransaction = await Transaction.findByPk(id, {
      include: [
        {
          model: Product,
          as: 'product'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    res.status(200).json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction
    });
  } catch (error) {
    logger.error('Update transaction error:', error);
    res.status(500).json({ error: { message: 'Failed to update transaction' } });
  }
};

/**
 * Delete/void a transaction
 * DELETE /api/transactions/:id
 */
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Find transaction by ID
    const transaction = await Transaction.findByPk(id, {
      include: [{ model: Product, as: 'product' }]
    });

    if (!transaction) {
      return res.status(404).json({ error: { message: 'Transaction not found' } });
    }

    // Instead of deleting, mark as voided and reverse quantity changes
    await transaction.update({
      status: 'voided',
      notes: transaction.notes 
        ? `${transaction.notes} [VOIDED: ${new Date().toISOString()}]` 
        : `[VOIDED: ${new Date().toISOString()}]`
    });

    // Create a reversal transaction
    await Transaction.create({
      type: 'reversal',
      productId: transaction.productId,
      quantity: transaction.quantity,
      pricePerUnit: transaction.pricePerUnit,
      totalAmount: transaction.totalAmount,
      notes: `Reversal of transaction #${transaction.id}`,
      reference: `VOID-${transaction.id}`,
      transactionDate: new Date(),
      createdBy: req.user.id,
      status: 'completed',
      reversalOf: transaction.id
    });

    // Manual product quantity adjustment since we're not using the hooks for reversals
    const product = transaction.product;
    
    if (transaction.type === 'sale' || transaction.type === 'return') {
      // Reverse a sale or return
      const newQuantity = product.quantity + transaction.quantity;
      await product.update({ quantity: newQuantity });
    } else if (transaction.type === 'purchase') {
      // Reverse a purchase
      const newQuantity = product.quantity - transaction.quantity;
      await product.update({ quantity: Math.max(0, newQuantity) });
    }

    res.status(200).json({ message: 'Transaction voided successfully' });
  } catch (error) {
    logger.error('Delete transaction error:', error);
    res.status(500).json({ error: { message: 'Failed to void transaction' } });
  }
};

/**
 * Get transaction statistics
 * GET /api/transactions/stats
 */
const getTransactionStats = async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    let dateRange = {};
    const today = new Date();
    
    // Calculate date range based on period
    if (startDate && endDate) {
      dateRange = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (period === 'day') {
      dateRange = {
        [Op.gte]: new Date(today.setHours(0, 0, 0, 0))
      };
    } else if (period === 'week') {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      dateRange = {
        [Op.gte]: lastWeek
      };
    } else if (period === 'month') {
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      dateRange = {
        [Op.gte]: lastMonth
      };
    } else if (period === 'year') {
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);
      dateRange = {
        [Op.gte]: lastYear
      };
    }
    
    // Get transaction statistics
    const transactions = await Transaction.findAll({
      where: {
        transactionDate: dateRange,
        status: 'completed'
      },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'category']
      }]
    });
    
    // Calculate statistics
    const sales = transactions.filter(t => t.type === 'sale');
    const purchases = transactions.filter(t => t.type === 'purchase');
    const returns = transactions.filter(t => t.type === 'return');
    
    const totalSales = sales.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    const totalPurchases = purchases.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    const totalReturns = returns.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
    
    // Group by category
    const salesByCategory = {};
    sales.forEach(sale => {
      const category = sale.product.category;
      if (!salesByCategory[category]) {
        salesByCategory[category] = 0;
      }
      salesByCategory[category] += parseFloat(sale.totalAmount);
    });
    
    // Group by date for timeline
    const salesByDate = {};
    const purchasesByDate = {};
    
    transactions.forEach(transaction => {
      const date = transaction.transactionDate.toISOString().split('T')[0];
      
      if (transaction.type === 'sale') {
        if (!salesByDate[date]) {
          salesByDate[date] = 0;
        }
        salesByDate[date] += parseFloat(transaction.totalAmount);
      } else if (transaction.type === 'purchase') {
        if (!purchasesByDate[date]) {
          purchasesByDate[date] = 0;
        }
        purchasesByDate[date] += parseFloat(transaction.totalAmount);
      }
    });
    
    // Find top selling products
    const productSales = {};
    sales.forEach(sale => {
      const productId = sale.productId;
      if (!productSales[productId]) {
        productSales[productId] = {
          product: sale.product,
          quantity: 0,
          amount: 0
        };
      }
      productSales[productId].quantity += sale.quantity;
      productSales[productId].amount += parseFloat(sale.totalAmount);
    });
    
    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    res.status(200).json({
      summary: {
        totalSales,
        totalPurchases,
        totalReturns,
        profit: totalSales - totalPurchases + totalReturns,
        transactionCount: transactions.length,
        salesCount: sales.length,
        purchasesCount: purchases.length
      },
      salesByCategory,
      timeline: {
        sales: salesByDate,
        purchases: purchasesByDate
      },
      topSellingProducts
    });
  } catch (error) {
    logger.error('Get transaction stats error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve transaction statistics' } });
  }
};

/**
 * Get transaction types
 * GET /api/transactions/types
 */
const getTransactionTypes = async (req, res) => {
  try {
    // Return the valid transaction types
    const transactionTypes = ['sale', 'purchase', 'adjustment', 'return'];
    
    res.status(200).json({ 
      transactionTypes 
    });
  } catch (error) {
    logger.error('Get transaction types error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve transaction types' } });
  }
};

/**
 * Update transaction status
 * PATCH /api/transactions/:id/status
 */
const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'completed', 'cancelled', 'void'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: { message: 'Invalid status' } });
    }
    
    const transaction = await Transaction.findByPk(id);
    
    if (!transaction) {
      return res.status(404).json({ error: { message: 'Transaction not found' } });
    }
    
    // Update status
    transaction.status = status;
    await transaction.save();
    
    res.status(200).json({ 
      message: 'Transaction status updated successfully',
      transaction 
    });
  } catch (error) {
    logger.error('Update transaction status error:', error);
    res.status(500).json({ error: { message: 'Failed to update transaction status' } });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getTransactionTypes,
  updateTransactionStatus
}; 