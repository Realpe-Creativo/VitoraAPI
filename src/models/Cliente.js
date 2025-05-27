const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  identificacion: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  tipo_identificacion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nombre_cliente: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'clientes',
  timestamps: true
});

module.exports = Cliente;