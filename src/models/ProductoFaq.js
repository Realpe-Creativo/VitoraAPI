const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductoFaq = sequelize.define('ProductoFaq', {
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
  pregunta: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  respuesta: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'producto_faqs',
  timestamps: false
});

module.exports = ProductoFaq;
