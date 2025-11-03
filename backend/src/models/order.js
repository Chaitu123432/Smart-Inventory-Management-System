// models/orderItem.js
module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      store_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'stores',
          key: 'id'
        }
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'pending'
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
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
      tableName: 'orders',
      timestamps: false,
    });
  
    Order.associate = (models) => {
      if (models.Customer) {
        Order.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
      }
      if (models.Store) {
        Order.belongsTo(models.Store, { foreignKey: 'store_id', as: 'store' });
      }
      if (models.OrderItem) {
        Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
      }
    };
  
    return Order;
  };
  