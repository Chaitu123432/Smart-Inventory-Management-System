module.exports = (sequelize, DataTypes) => {
  const Forecast = sequelize.define('Forecast', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      },
      field: 'product_id'
    },
    forecast_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'forecast_date'
    },
    predicted_sales: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'predicted_sales'
    },
    confidence_interval_lower: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'confidence_interval_lower'
    },
    confidence_interval_upper: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'confidence_interval_upper'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'forecast_data',
    timestamps: false
  });

  // Set up associations
  Forecast.associate = (models) => {
    if (models.Product) {
      Forecast.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        field: 'product_id'
      });
    }
  };

  return Forecast;
}; 