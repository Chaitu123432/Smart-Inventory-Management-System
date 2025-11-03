module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define('OrderItem', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'order_items',
      timestamps: false,
    });
  
    OrderItem.associate = (models) => {
      if (models.Order) {
        OrderItem.belongsTo(models.Order, { foreignKey: 'order_id' });
      }
      if (models.Product) {
        OrderItem.belongsTo(models.Product, { foreignKey: 'product_id' });
      }
    };
  
    return OrderItem;
  };
  