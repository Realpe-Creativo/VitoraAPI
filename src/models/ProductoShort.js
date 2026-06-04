const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductoShort = sequelize.define('ProductoShort', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  producto_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'producto_shorts',
  timestamps: false
});

module.exports = ProductoShort;
