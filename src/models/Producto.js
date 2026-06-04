const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nombre_corto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  precio: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  descuento: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  moneda: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'COP'
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imagenes: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '{ main, hover, gallery[], miniBanner, url_img }'
  },
  beneficios: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Array plano de strings. Exclusivo con grupos_beneficios.'
  },
  grupos_beneficios: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Array de { title, items[] }. Exclusivo con beneficios.'
  },
  iconos: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Array de { icon, description }'
  },
  ids_relacionados: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Array de IDs de productos relacionados'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'productos',
  timestamps: false
});

module.exports = Producto;
