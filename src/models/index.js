const {sequelize} = require('../config/database');
const Cliente = require('./Cliente');
const Transaccion = require('./Transaccion');
const EstadoTransaccion = require('./EstadoTransaccion');
const Usuario = require('./Usuario');
const Rol = require('./Rol');

// Define associations between models
const setupAssociations = () => {
    // EstadoTransaccion belongs to Transaccion
    EstadoTransaccion.belongsTo(Transaccion, {
        foreignKey: 'id_transaccion',
        as: 'transaccion'
    });
    Transaccion.hasMany(EstadoTransaccion, {
        foreignKey: 'id_transaccion',
        as: 'estados'
    });
    Transaccion.hasOne(Usuario, {
        foreignKey: 'id_usuario',
        as: 'usuario'
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
        await sequelize.sync({alter: true});
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Error synchronizing models:', error);
        process.exit(1);
    }
};

module.exports = {
    sequelize,
    Cliente,
    Transaccion,
    EstadoTransaccion,
    Usuario,
    Rol,
    syncModels
};