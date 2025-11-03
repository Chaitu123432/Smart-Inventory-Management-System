module.exports = (sequelize, DataTypes) => {
    const Store = sequelize.define('Store', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: DataTypes.STRING,
      location: DataTypes.STRING,
      state: DataTypes.STRING,
      pincode: DataTypes.STRING,  // Changed from INTEGER to STRING
      manager_name: DataTypes.STRING,
      contact_number: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    }, {
      tableName: 'stores',
      timestamps: false,
    });
  
    Store.associate = (models) => {
      if (models.Customer) {
        Store.hasMany(models.Customer, { foreignKey: 'store_id', as: 'customers' });
      }
      if (models.Order) {
        Store.hasMany(models.Order, { foreignKey: 'store_id', as: 'orders' });
      }
    };
  
    return Store;
  };
  