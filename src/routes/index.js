const express = require('express');
const authRoutes = require('./authRoutes');
const clienteRoutes = require('./clienteRoutes');
const transaccionRoutes = require('./transaccionRoutes');
const estadoTransaccionRoutes = require('./estadoTransaccionRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const rolRoutes = require('./rolRoutes');

const router = express.Router();

// Define API routes
router.use('/auth', authRoutes);
router.use('/clientes', clienteRoutes);
router.use('/transacciones', transaccionRoutes);
router.use('/estados-transacciones', estadoTransaccionRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/roles', rolRoutes);

module.exports = router;