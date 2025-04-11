module.exports = (sequelize, DataTypes) => {
  const Forecast = sequelize.define('Forecast', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    period: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'Period must be an integer'
        },
        min: {
          args: [1],
          msg: 'Period must be at least 1 day'
        },
        max: {
          args: [365],
          msg: 'Period cannot exceed 365 days'
        }
      }
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    totalDemand: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'Total demand must be an integer'
        },
        min: {
          args: [0],
          msg: 'Total demand must be greater than or equal to 0'
        }
      }
    },
    confidenceLevel: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 95.00,
      validate: {
        isDecimal: {
          msg: 'Confidence level must be a decimal'
        },
        min: {
          args: [0],
          msg: 'Confidence level must be greater than or equal to 0'
        },
        max: {
          args: [100],
          msg: 'Confidence level cannot exceed 100'
        }
      }
    },
    lowerBound: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'Lower bound must be an integer'
        },
        min: {
          args: [0],
          msg: 'Lower bound must be greater than or equal to 0'
        }
      }
    },
    upperBound: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'Upper bound must be an integer'
        },
        min: {
          args: [0],
          msg: 'Upper bound must be greater than or equal to 0'
        }
      }
    },
    averageDailyDemand: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Average daily demand must be a decimal'
        },
        min: {
          args: [0],
          msg: 'Average daily demand must be greater than or equal to 0'
        }
      }
    },
    model: {
      type: DataTypes.ENUM('lstm', 'arima', 'prophet', 'ensemble'),
      allowNull: false,
      defaultValue: 'ensemble'
    },
    accuracy: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        isDecimal: {
          msg: 'Accuracy must be a decimal'
        },
        min: {
          args: [0],
          msg: 'Accuracy must be greater than or equal to 0'
        },
        max: {
          args: [100],
          msg: 'Accuracy cannot exceed 100'
        }
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    dailyForecastData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of daily forecast values for the period'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata about the forecast'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: false,
        fields: ['productId', 'startDate']
      }
    ]
  });

  // Set up associations
  Forecast.associate = (models) => {
    // A forecast belongs to a product
    Forecast.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
    
    // A forecast belongs to a user (who created it)
    Forecast.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return Forecast;
}; 