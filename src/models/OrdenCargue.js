const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrdenCargue = sequelize.define('OrdenCargue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  usuario_que_cargo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id_user'
    }
  },
  archivo_cargado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  cantidad_registros: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'ordenes_cargue',
  timestamps: false
});

module.exports = OrdenCargue;