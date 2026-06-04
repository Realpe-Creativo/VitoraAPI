const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductoVariante = sequelize.define('ProductoVariante', {
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
  sku: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  talla: {
    type: DataTypes.STRING,
    allowNull: true
  },
  precio_variante: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'producto_variantes',
  timestamps: false
});

module.exports = ProductoVariante;
