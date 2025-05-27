const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validator');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const clienteController = require('../controllers/clienteController');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route GET /clientes
 * @desc Get all clientes
 * @access Private
 */
router.get('/', authorizeRole(['ADMIN', 'USER']), clienteController.getAllClientes);

/**
 * @route GET /clientes/:id
 * @desc Get cliente by ID
 * @access Private
 */
router.get('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN', 'USER']), clienteController.getClienteById);

/**
 * @route POST /clientes
 * @desc Create a new cliente
 * @access Private
 */
router.post('/', [
  body('identificacion').notEmpty().withMessage('Identificación is required'),
  body('tipo_identificacion').notEmpty().withMessage('Tipo de identificación is required'),
  body('nombre_cliente').notEmpty().withMessage('Nombre de cliente is required'),
  validate
], authorizeRole(['ADMIN']), clienteController.createCliente);

/**
 * @route PUT /clientes/:id
 * @desc Update a cliente
 * @access Private
 */
router.put('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN']), clienteController.updateCliente);

/**
 * @route DELETE /clientes/:id
 * @desc Delete a cliente
 * @access Private
 */
router.delete('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN']), clienteController.deleteCliente);

module.exports = router;