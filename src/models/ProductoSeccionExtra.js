const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductoSeccionExtra = sequelize.define('ProductoSeccionExtra', {
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
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'producto_secciones_extra',
  timestamps: false
});

module.exports = ProductoSeccionExtra;
