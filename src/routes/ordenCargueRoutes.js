const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validator');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const ordenCargueController = require('../controllers/ordenCargueController');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route GET /ordenes-cargue
 * @desc Get all ordenes de cargue
 * @access Private
 */
router.get('/', authorizeRole(['ADMIN', 'USER']), ordenCargueController.getAllOrdenesCargue);

/**
 * @route GET /ordenes-cargue/:id
 * @desc Get orden de cargue by ID
 * @access Private
 */
router.get('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN', 'USER']), ordenCargueController.getOrdenCargueById);

/**
 * @route POST /ordenes-cargue
 * @desc Create a new orden de cargue
 * @access Private
 */
router.post('/', [
  body('archivo_cargado').notEmpty().withMessage('Archivo cargado is required'),
  body('cantidad_registros').isInt({ min: 1 }).withMessage('Cantidad de registros must be a positive integer'),
  validate
], authorizeRole(['ADMIN', 'USER']), ordenCargueController.createOrdenCargue);

/**
 * @route PUT /ordenes-cargue/:id
 * @desc Update a orden de cargue
 * @access Private
 */
router.put('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('archivo_cargado').optional().notEmpty().withMessage('Archivo cargado cannot be empty'),
  body('cantidad_registros').optional().isInt({ min: 1 }).withMessage('Cantidad de registros must be a positive integer'),
  validate
], authorizeRole(['ADMIN']), ordenCargueController.updateOrdenCargue);

/**
 * @route DELETE /ordenes-cargue/:id
 * @desc Delete a orden de cargue
 * @access Private
 */
router.delete('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN']), ordenCargueController.deleteOrdenCargue);

module.exports = router;