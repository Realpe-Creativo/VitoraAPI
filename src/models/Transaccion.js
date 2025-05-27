const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaccion = sequelize.define('Transaccion', {
  ID_transacción: {
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
  id_orden_pago: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ordenes_pago',
      key: 'order_id'
    }
  }
}, {
  tableName: 'transacciones',
  timestamps: false
});

module.exports = Transaccion;