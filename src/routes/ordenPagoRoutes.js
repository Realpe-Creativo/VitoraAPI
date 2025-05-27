const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validator');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const ordenPagoController = require('../controllers/ordenPagoController');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route GET /ordenes-pago
 * @desc Get all ordenes de pago
 * @access Private
 */
router.get('/', authorizeRole(['ADMIN', 'USER']), ordenPagoController.getAllOrdenesPago);

/**
 * @route GET /ordenes-pago/:id
 * @desc Get orden de pago by ID
 * @access Private
 */
router.get('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN', 'USER']), ordenPagoController.getOrdenPagoById);

/**
 * @route POST /ordenes-pago
 * @desc Create a new orden de pago
 * @access Private
 */
router.post('/', [
  body('cliente_id').isInt().withMessage('Cliente ID must be an integer'),
  body('forma_cargue').isIn(['manual', 'archivo']).withMessage('Forma de cargue must be "manual" or "archivo"'),
  body('valor_a_pagar').isFloat({ min: 0 }).withMessage('Valor a pagar must be a positive number'),
  body('orden_cargue_archivo')
    .optional({ nullable: true })
    .isInt()
    .withMessage('Orden cargue archivo must be an integer')
    .custom((value, { req }) => {
      if (req.body.forma_cargue === 'archivo' && !value) {
        throw new Error('Orden cargue archivo is required when forma_cargue is "archivo"');
      }
      return true;
    }),
  validate
], authorizeRole(['ADMIN', 'USER']), ordenPagoController.createOrdenPago);

/**
 * @route PUT /ordenes-pago/:id
 * @desc Update a orden de pago
 * @access Private
 */
router.put('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('cliente_id').optional().isInt().withMessage('Cliente ID must be an integer'),
  body('valor_a_pagar').optional().isFloat({ min: 0 }).withMessage('Valor a pagar must be a positive number'),
  validate
], authorizeRole(['ADMIN']), ordenPagoController.updateOrdenPago);

/**
 * @route DELETE /ordenes-pago/:id
 * @desc Delete a orden de pago
 * @access Private
 */
router.delete('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN']), ordenPagoController.deleteOrdenPago);

module.exports = router;