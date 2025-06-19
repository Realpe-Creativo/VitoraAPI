const { sequelize } = require('../config/database');
const Cliente = require('./Cliente');
const OrdenPago = require('./OrdenPago');
const OrdenCargue = require('./OrdenCargue');
const Transaccion = require('./Transaccion');
const EstadoTransaccion = require('./EstadoTransaccion');
const Usuario = require('./Usuario');
const Rol = require('./Rol');

// Define associations between models
const setupAssociations = () => {
  // Cliente has many OrdenPago
  Cliente.hasMany(OrdenPago, {
    foreignKey: 'cliente_id',
    as: 'ordenesPago'
  });
  OrdenPago.belongsTo(Cliente, {
    foreignKey: 'cliente_id',
    as: 'cliente'
  });

  // Usuario has many OrdenPago (created manually)
  Usuario.hasMany(OrdenPago, {
    foreignKey: 'usuario_crea_manual',
    as: 'ordenesPagoCreadas'
  });
  OrdenPago.belongsTo(Usuario, {
    foreignKey: 'usuario_crea_manual',
    as: 'usuarioCreador'
  });

  // OrdenCargue has many OrdenPago
  OrdenCargue.hasMany(OrdenPago, {
    foreignKey: 'orden_cargue_archivo',
    as: 'ordenesPago'
  });
  OrdenPago.belongsTo(OrdenCargue, {
    foreignKey: 'orden_cargue_archivo',
    as: 'ordenCargue'
  });

  // Usuario has many OrdenCargue
  Usuario.hasMany(OrdenCargue, {
    foreignKey: 'usuario_que_cargo',
    as: 'ordenesCargue'
  });
  OrdenCargue.belongsTo(Usuario, {
    foreignKey: 'usuario_que_cargo',
    as: 'usuario'
  });

  // OrdenPago has many Transacciones
  OrdenPago.hasMany(Transaccion, {
    foreignKey: 'id_orden_pago',
    as: 'transacciones'
  });
  Transaccion.belongsTo(OrdenPago, {
    foreignKey: 'id_orden_pago',
    as: 'ordenPago'
  });

  // EstadoTransaccion belongs to Transaccion
  EstadoTransaccion.belongsTo(Transaccion, {
    foreignKey: 'id_transaccion',
    as: 'transaccion'
  });
  Transaccion.hasMany(EstadoTransaccion, {
    foreignKey: 'id_transaccion',
    as: 'estados'
  });

  // Transaccion has one (latest) EstadoTransaccion
  Transaccion.belongsTo(EstadoTransaccion, {
    foreignKey: 'ultimo_estado',
    as: 'estadoActual'
  });

  // Rol has many Usuarios
  Rol.hasMany(Usuario, {
    foreignKey: 'rol',
    as: 'usuarios'
  });
  Usuario.belongsTo(Rol, {
    foreignKey: 'rol',
    as: 'rolUsuario'
  });
};

// Function to sync all models with database
const syncModels = async () => {
  try {
    // Set up associations before sync
    setupAssociations();
    
    // Sync all models
    // In production, you might want to use { alter: true } instead of { force: true }
    // or use migrations for better control
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing models:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  Cliente,
  OrdenPago,
  OrdenCargue,
  Transaccion,
  EstadoTransaccion,
  Usuario,
  Rol,
  syncModels
};