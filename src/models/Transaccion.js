const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaccion = sequelize.define('Transaccion', {
  id_transaccion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  ultimo_estado: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'estados_transacciones',
      key: 'id_estado'
    }
  },
  valor_de_pago: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  referencia: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'transacciones',
  timestamps: false
});

module.exports = Transaccion;