const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pedido = sequelize.define('Pedido', {
  id_pedido: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
  cliente_id: { type: DataTypes.INTEGER, allowNull: false },
  transaccion_id: { type: DataTypes.INTEGER, allowNull: true },
  productos: { type: DataTypes.JSONB, allowNull: false },
  estado: {
    type: DataTypes.ENUM('INICIADO','PAGO_PENDIENTE','PAGADO','EN_PREPARACION','ENVIADO','CANCELADO'),
    allowNull: false,
    defaultValue: 'INICIADO'
  },
  departamento: { type: DataTypes.STRING, allowNull: true },
  ciudad: { type: DataTypes.STRING, allowNull: true },
  direccion_envio: { type: DataTypes.STRING, allowNull: true },
  notas: { type: DataTypes.TEXT, allowNull: true },
  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  envio_correo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false  },
}, {
  tableName: 'pedidos',
  timestamps: false
});

module.exports = Pedido;
