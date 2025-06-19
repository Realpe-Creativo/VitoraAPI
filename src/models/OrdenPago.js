const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrdenPago = sequelize.define('OrdenPago', {
  order_id: {
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
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ultimo_intento_pago: {
    type: DataTypes.DATE,
    allowNull: true
  },
  forma_cargue: {
    type: DataTypes.ENUM('manual', 'archivo'),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('CARGADO', 'PAGADO', 'PENDIENTE'),
    allowNull: false
  },
  usuario_crea_manual: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id_user'
    }
  },
  orden_cargue_archivo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ordenes_cargue',
      key: 'id'
    }
  },
  valor_a_pagar: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  valor_parcial: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  fecha_vencimiento: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
}, {
  tableName: 'ordenes_pago',
  timestamps: false,
  hooks: {
    beforeValidate: (ordenPago) => {
      // Set usuario_crea_manual to null if forma_cargue is 'archivo'
      if (ordenPago.forma_cargue === 'archivo') {
        ordenPago.usuario_crea_manual = null;
      }
      
      // Set orden_cargue_archivo to null if forma_cargue is 'manual'
      if (ordenPago.forma_cargue === 'manual') {
        ordenPago.orden_cargue_archivo = null;
      }
    }
  }
});

module.exports = OrdenPago;