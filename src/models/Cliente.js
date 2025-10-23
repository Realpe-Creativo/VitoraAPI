const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  identificacion: { type: DataTypes.STRING, unique: true },
  tipo_identificacion: { type: DataTypes.STRING },
  nombre_cliente: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING }
}, {
  tableName: 'clientes',
  timestamps: false
});

module.exports = Cliente;
