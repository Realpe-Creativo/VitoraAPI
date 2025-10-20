const {DataTypes} = require('sequelize');
const {sequelize}  = require('../config/database'); // ajusta la ruta a tu instancia de Sequelize

const Pedido = sequelize.define('Pedido', {
  id_pedido: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clientes',
      key: 'id'
    }
  },
  transaccion_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'transacciones',
      key: 'id_transaccion'
    }
  },
  productos: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Arreglo JSON con los productos del pedido (id, sku, nombre, cantidad, precio, etc.)'
  },
  estado: {
    type: DataTypes.ENUM(
        'INICIADO',
        'PAGO_PENDIENTE',
        'PAGADO',
        'EN_PREPARACION',
        'ENVIADO',
        'CANCELADO'
    ),
    allowNull: false,
    defaultValue: 'INICIADO'
  },
  departamento: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ciudad: {
    type: DataTypes.STRING,
    allowNull: true
  },
  direccion_envio: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creado_en: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  actualizado_en: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pedidos',
  timestamps: false
});

module.exports = Pedido;
