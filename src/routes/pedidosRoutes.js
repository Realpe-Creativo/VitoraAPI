const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middlewares/validator');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const pedidoController = require('../controllers/pedidosController');

const router = express.Router();

/**
 * @route POST /pedidos
 * @desc Crear un nuevo pedido
 * @access Public (si quieres, cambia a Private abajo)
 */
router.post('/',
    [
      (req, res, next) => { console.log('Body recibido (pedido):', req.body); next(); },

      body('cliente_id')
          .isInt({ min: 1 }).withMessage('cliente_id debe ser entero positivo'),

      body('transaccion_id')
          .optional({ nullable: true })
          .isInt({ min: 1 }).withMessage('transaccion_id debe ser entero positivo'),

      // productos debe ser JSON (arreglo u objeto); si llega string lo intentamos parsear en el controller
      body('productos')
          .custom(v => typeof v === 'object' && v !== null)
          .withMessage('productos debe ser un JSON válido (objeto o arreglo)'),

      body('estado')
          .optional()
          .isIn(['INICIADO', 'PAGO_PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'CANCELADO'])
          .withMessage('estado inválido'),

      body('departamento').optional({ nullable: true }).isString().trim(),
      body('ciudad').optional({ nullable: true }).isString().trim(),
      body('direccion_envio').optional({ nullable: true }).isString().trim(),
      body('notas').optional({ nullable: true }).isString(),

      validate
    ],
    pedidoController.createPedido
);

/**
 * A partir de aquí protegemos rutas
 */
router.use(authenticateToken);

/**
 * @route GET /pedidos
 * @desc Listar pedidos (con filtros opcionales por cliente_id y/o transaccion_id)
 * @access Private
 */
router.get('/',
    [
      query('cliente_id').optional().isInt({ min: 1 }).withMessage('cliente_id debe ser entero'),
      query('transaccion_id').optional().isInt({ min: 1 }).withMessage('transaccion_id debe ser entero'),
      validate
    ],
    authorizeRole(['ADMIN', 'USER']),
    pedidoController.getAllPedidos
);

/**
 * @route GET /pedidos/:id
 * @desc Obtener pedido por ID
 * @access Private
 */
router.get('/:id',
    [
      param('id').isInt({ min: 1 }).withMessage('ID debe ser un entero'),
      validate
    ],
    authorizeRole(['ADMIN', 'USER']),
    pedidoController.getPedidoById
);

/**
 * @route GET /pedidos/por-cliente/:cliente_id
 * @desc Listar pedidos por cliente
 * @access Private
 */
router.get('/por-cliente/:cliente_id',
    [
      param('cliente_id').isInt({ min: 1 }).withMessage('cliente_id debe ser un entero'),
      validate
    ],
    authorizeRole(['ADMIN', 'USER']),
    pedidoController.getPedidosByCliente
);

/**
 * @route GET /pedidos/por-transaccion/:transaccion_id
 * @desc Listar pedidos por transaccion
 * @access Private
 */
router.get('/por-transaccion/:transaccion_id',
    [
      param('transaccion_id').isInt({ min: 1 }).withMessage('transaccion_id debe ser un entero'),
      validate
    ],
    authorizeRole(['ADMIN', 'USER']),
    pedidoController.getPedidosByTransaccion
);

/**
 * @route PUT /pedidos/:id
 * @desc Actualizar datos generales de un pedido
 * @access Private
 */
router.put('/:id',
    [
      param('id').isInt({ min: 1 }).withMessage('ID debe ser un entero'),

      body('cliente_id').optional().isInt({ min: 1 }).withMessage('cliente_id debe ser entero'),
      body('transaccion_id').optional({ nullable: true }).isInt({ min: 1 })
          .withMessage('transaccion_id debe ser entero'),
      body('productos').optional().custom(v => typeof v === 'object' && v !== null)
          .withMessage('productos debe ser un JSON válido'),

      body('estado').optional()
          .isIn(['INICIADO', 'PAGO_PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'CANCELADO'])
          .withMessage('estado inválido'),

      body('departamento').optional({ nullable: true }).isString().trim(),
      body('ciudad').optional({ nullable: true }).isString().trim(),
      body('direccion_envio').optional({ nullable: true }).isString().trim(),
      body('notas').optional({ nullable: true }).isString(),

      validate
    ],
    authorizeRole(['ADMIN', 'USER']),
    pedidoController.updatePedido
);

/**
 * @route PUT /pedidos/:id/estado
 * @desc Actualizar solo el estado del pedido
 * @access Private
 */
router.put('/:id/estado',
    [
      param('id').isInt({ min: 1 }).withMessage('ID debe ser un entero'),
      body('estado')
          .isIn(['INICIADO', 'PAGO_PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'ENVIADO', 'CANCELADO'])
          .withMessage('estado inválido'),
      validate
    ],
    authorizeRole(['ADMIN', 'USER']),
    pedidoController.updateEstadoPedido
);

/**
 * @route DELETE /pedidos/:id
 * @desc Eliminar un pedido
 * @access Private (solo ADMIN)
 */
router.delete('/:id',
    [
      param('id').isInt({ min: 1 }).withMessage('ID debe ser un entero'),
      validate
    ],
    authorizeRole(['ADMIN']),
    pedidoController.deletePedido
);

module.exports = router;
