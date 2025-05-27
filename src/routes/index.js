const express = require('express');
const authRoutes = require('./authRoutes');
const clienteRoutes = require('./clienteRoutes');
const ordenPagoRoutes = require('./ordenPagoRoutes');
const ordenCargueRoutes = require('./ordenCargueRoutes');
const transaccionRoutes = require('./transaccionRoutes');
const estadoTransaccionRoutes = require('./estadoTransaccionRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const rolRoutes = require('./rolRoutes');

const router = express.Router();

// Define API routes
router.use('/auth', authRoutes);
router.use('/clientes', clienteRoutes);
router.use('/ordenes-pago', ordenPagoRoutes);
router.use('/ordenes-cargue', ordenCargueRoutes);
router.use('/transacciones', transaccionRoutes);
router.use('/estados-transacciones', estadoTransaccionRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/roles', rolRoutes);

module.exports = router;