module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Product name cannot be empty'
        }
      }
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'SKU cannot be empty'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Category cannot be empty'
        }
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Price must be a valid decimal number'
        },
        min: {
          args: [0],
          msg: 'Price must be greater than or equal to 0'
        }
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: 'Quantity must be an integer'
        },
        min: {
          args: [0],
          msg: 'Quantity must be greater than or equal to 0'
        }
      }
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        isInt: {
          msg: 'Minimum stock level must be an integer'
        },
        min: {
          args: [0],
          msg: 'Minimum stock level must be greater than or equal to 0'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('In Stock', 'Low Stock', 'Out of Stock'),
      allowNull: false,
      defaultValue: 'In Stock'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Image URL must be a valid URL'
        }
      }
    }
  }, {
    timestamps: true,
    paranoid: true, // Implements soft delete (deletedAt)
    hooks: {
      beforeSave: async (product) => {
        // Update product status based on quantity and minStockLevel
        if (product.quantity === 0) {
          product.status = 'Out of Stock';
        } else if (product.quantity <= product.minStockLevel) {
          product.status = 'Low Stock';
        } else {
          product.status = 'In Stock';
        }
      }
    }
  });

  // Set up associations
  Product.associate = (models) => {
    // A product belongs to a user (who created it)
    Product.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    // A product can be part of many transactions
    Product.hasMany(models.Transaction, {
      foreignKey: 'productId',
      as: 'transactions'
    });
    
    // A product can have many forecasts
    Product.hasMany(models.Forecast, {
      foreignKey: 'productId',
      as: 'forecasts'
    });
  };

  return Product;
}; 