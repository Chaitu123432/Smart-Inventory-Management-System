const { Product, Transaction } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Get all products
 * GET /api/products
 */
const getAllProducts = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { 
      category, 
      status, 
      search,
      minPrice, 
      maxPrice,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 10
    } = req.query;
    
    // Build filter conditions
    const whereClause = {};
    
    if (category) {
      whereClause.category = category;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (minPrice) {
      whereClause.price = {
        ...whereClause.price,
        [Op.gte]: parseFloat(minPrice)
      };
    }
    
    if (maxPrice) {
      whereClause.price = {
        ...whereClause.price,
        [Op.lte]: parseFloat(maxPrice)
      };
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Get products with pagination
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit: parseInt(limit),
      // REMOVED: Transaction include - causing error due to missing association
      // include: [
      //   {
      //     model: Transaction,
      //     as: 'transactions',
      //     required: false,
      //     attributes: ['id', 'type', 'quantity', 'transactionDate'],
      //     where: {
      //       type: 'sale',
      //       transactionDate: {
      //         [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30))
      //       }
      //     }
      //   }
      // ]
    });

    // Calculate total value of inventory
    const totalValue = products.reduce((sum, product) => {
      return sum + (parseFloat(product.price) * product.quantity);
    }, 0);
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      products,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        totalPages,
        limit: parseInt(limit)
      },
      summary: {
        totalValue,
        totalProducts: count,
        lowStockProducts: products.filter(p => p.status === 'Low Stock').length,
        outOfStockProducts: products.filter(p => p.status === 'Out of Stock').length
      }
    });
  } catch (error) {
    logger.error('Get all products error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve products' } });
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, {
      // REMOVED: Transaction include
      // include: [
      //   {
      //     model: Transaction,
      //     as: 'transactions',
      //     required: false,
      //     limit: 20,
      //     order: [['transactionDate', 'DESC']]
      //   }
      // ]
    });
    
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    
    res.status(200).json({ product });
  } catch (error) {
    logger.error('Get product by ID error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve product' } });
  }
};

/**
 * Create a new product
 * POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      sku, 
      description, 
      category, 
      price, 
      quantity, 
      minStockLevel,
      location,
      supplier,
      barcode,
      imageUrl
    } = req.body;
    
    // Check if product with this SKU already exists
    const existingProduct = await Product.findOne({ where: { sku } });
    
    if (existingProduct) {
      return res.status(400).json({ error: { message: 'A product with this SKU already exists' } });
    }
    
    // Get user ID or use demo ID in development mode
    const userId = req.user?.id || 'demo-id';
    logger.info(`Creating product with user ID: ${userId}`);
    
    // Create new product
    const product = await Product.create({
      name,
      sku,
      description,
      category,
      price,
      quantity,
      minStockLevel,
      location,
      supplier,
      barcode,
      imageUrl,
      createdBy: userId
    });
    
    res.status(201).json({ 
      message: 'Product created successfully', 
      product 
    });
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({ error: { message: 'Failed to create product', detail: error.message } });
  }
};

/**
 * Update a product
 * PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      category, 
      price, 
      quantity, 
      minStockLevel,
      location,
      supplier,
      barcode,
      imageUrl
    } = req.body;
    
    // Find product by ID
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    
    // Update product
    await product.update({
      name,
      description,
      category,
      price,
      quantity,
      minStockLevel,
      location,
      supplier,
      barcode,
      imageUrl
    });
    
    res.status(200).json({ 
      message: 'Product updated successfully', 
      product 
    });
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({ error: { message: 'Failed to update product' } });
  }
};

/**
 * Delete a product
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find product by ID
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    
    // Check if product has transactions
    const transactionCount = await Transaction.count({ where: { productId: id } });
    
    if (transactionCount > 0) {
      // Soft delete (set deletedAt) instead of hard delete
      await product.destroy();
    } else {
      // Hard delete
      await product.destroy({ force: true });
    }
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({ error: { message: 'Failed to delete product' } });
  }
};

/**
 * Get product categories
 * GET /api/products/categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Product.findAll({
      attributes: ['category'],
      group: ['category'],
      order: [['category', 'ASC']]
    });
    
    res.status(200).json({ 
      categories: categories.map(c => c.category) 
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve categories' } });
  }
};

/**
 * Update product stock
 * PATCH /api/products/:id/stock
 */
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, notes } = req.body;
    
    // Find product by ID
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    
    // Calculate stock difference
    const difference = quantity - product.quantity;
    
    // Get user ID or use demo ID in development mode
    const userId = req.user?.id || 'demo-id';
    
    // Create transaction for stock adjustment
    await Transaction.create({
      type: 'adjustment',
      productId: id,
      quantity,
      pricePerUnit: product.price,
      totalAmount: product.price * quantity,
      notes,
      createdBy: userId,
      transactionDate: new Date()
    });
    
    // Update product quantity
    product.quantity = quantity;
    await product.save();
    
    res.status(200).json({ 
      message: 'Stock updated successfully', 
      product 
    });
  } catch (error) {
    logger.error('Update stock error:', error);
    res.status(500).json({ error: { message: 'Failed to update stock', detail: error.message } });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateStock
}; 