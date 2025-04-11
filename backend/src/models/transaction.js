module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('purchase', 'sale', 'adjustment', 'return', 'transfer'),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Transaction type cannot be empty'
        }
      }
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Quantity cannot be empty'
        }
      }
    },
    pricePerUnit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Price per unit cannot be empty'
        }
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Total amount cannot be empty'
        }
      }
    },
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'completed'
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    relatedTransactionId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Transactions',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    hooks: {
      afterCreate: async (transaction, options) => {
        // Update product quantity based on transaction type
        if (transaction.status === 'completed') {
          const product = await sequelize.models.Product.findByPk(transaction.productId, { transaction: options.transaction });
          
          if (product) {
            let newQuantity = product.quantity;
            
            switch (transaction.type) {
              case 'purchase':
                newQuantity += transaction.quantity;
                break;
              case 'sale':
                newQuantity -= transaction.quantity;
                break;
              case 'adjustment':
                // For adjustments, the quantity is the absolute value (not a delta)
                newQuantity = transaction.quantity;
                break;
              case 'return':
                // For returns of purchases, subtract; for returns of sales, add
                if (transaction.relatedTransactionId) {
                  const relatedTransaction = await sequelize.models.Transaction.findByPk(transaction.relatedTransactionId, { transaction: options.transaction });
                  if (relatedTransaction && relatedTransaction.type === 'sale') {
                    newQuantity += transaction.quantity;
                  } else if (relatedTransaction && relatedTransaction.type === 'purchase') {
                    newQuantity -= transaction.quantity;
                  }
                }
                break;
              default:
                break;
            }
            
            // Ensure quantity never goes below 0
            product.quantity = Math.max(0, newQuantity);
            await product.save({ transaction: options.transaction });
          }
        }
      },
      beforeCreate: async (transaction) => {
        // Calculate total amount automatically if not provided
        if (!transaction.totalAmount) {
          transaction.totalAmount = parseFloat(transaction.quantity) * parseFloat(transaction.pricePerUnit);
        }
      }
    }
  });

  // Set up associations
  Transaction.associate = (models) => {
    // A transaction belongs to a product
    Transaction.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
    
    // A transaction belongs to a user (who created it)
    Transaction.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    // A transaction can be related to another transaction (e.g., returns)
    Transaction.belongsTo(models.Transaction, {
      foreignKey: 'relatedTransactionId',
      as: 'relatedTransaction'
    });
    
    Transaction.hasMany(models.Transaction, {
      foreignKey: 'relatedTransactionId',
      as: 'relatedTransactions'
    });
  };

  return Transaction;
}; 