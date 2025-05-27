const express = require('express');
const { param } = require('express-validator');
const { validate } = require('../middlewares/validator');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const estadoTransaccionController = require('../controllers/estadoTransaccionController');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route GET /estados-transacciones
 * @desc Get all estados transacciones
 * @access Private
 */
router.get('/', authorizeRole(['ADMIN', 'USER']), estadoTransaccionController.getAllEstadosTransacciones);

/**
 * @route GET /estados-transacciones/:id
 * @desc Get estado transaccion by ID
 * @access Private
 */
router.get('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN', 'USER']), estadoTransaccionController.getEstadoTransaccionById);

module.exports = router;