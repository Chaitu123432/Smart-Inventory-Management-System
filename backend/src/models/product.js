module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
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
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
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
    min_stock_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10,
      field: 'min_stock_level'
    },
    reorder_point: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reorder_point'
    },
    safety_stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'safety_stock'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'products',
    timestamps: false
  });

  // Set up associations
  Product.associate = (models) => {
    if (models.OrderItem) {
      Product.hasMany(models.OrderItem, {
        foreignKey: 'product_id',
        as: 'orderItems'
      });
    }
    if (models.Forecast) {
      Product.hasMany(models.Forecast, {
        foreignKey: 'product_id',
        as: 'forecasts'
      });
    }
  };

  return Product;
}; 