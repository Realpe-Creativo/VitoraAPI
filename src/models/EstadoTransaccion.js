const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EstadoTransaccion = sequelize.define('EstadoTransaccion', {
  id_estado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_transacción: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'transacciones',
      key: 'ID_transacción'
    }
  },
  nombre_estado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_hora_estado: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'estados_transacciones',
  timestamps: false
});

module.exports = EstadoTransaccion;