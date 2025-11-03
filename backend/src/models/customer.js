module.exports = (sequelize, DataTypes) => {
    const Customer = sequelize.define('Customer', {
      id: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true 
      },
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      address: DataTypes.STRING,
      city: DataTypes.STRING,
      state: DataTypes.STRING,
      pincode: DataTypes.STRING,  // Changed from INTEGER to STRING
      store_id: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    }, {
      tableName: 'customers',
      timestamps: false,
    });
  
    Customer.associate = (models) => {
      if (models.Store) {
        Customer.belongsTo(models.Store, { foreignKey: 'store_id' });
      }
      if (models.Order) {
        Customer.hasMany(models.Order, { foreignKey: 'customer_id' });
      }
    };
  
    return Customer;
  };
  