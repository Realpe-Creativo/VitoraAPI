const express = require('express');
const { body, param, query } = require('express-validator');
const { validate } = require('../middlewares/validator');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const ordenPagoController = require('../controllers/ordenPagoController');
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const { procesarBulkOrdenes } = require('../services/ordenPagoService');
const fs = require('fs');

const router = express.Router();

/**
 * Ruta PÚBLICA: busca órdenes por tipo_identificacion + identificacion
 */
router.post(
  '/search',
  [
    body('tipo_identificacion')
      .isString().notEmpty().withMessage('Tipo de identificación es obligatorio'),
    body('identificacion')
      .isString().notEmpty().withMessage('Identificación es obligatoria'),
    validate
  ],
  ordenPagoController.getOrdenesPagoByCliente
);

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

// Configuración de multer: guarda en /tmp
const upload = multer({
  dest: path.join(__dirname, '../tmp'),
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Solo archivos .xlsx son permitidos'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // máximo 5MB
});

/**
 * POST /ordenes-pago/bulk
 * Recibe un .xlsx con columnas: cliente_id, forma_cargue, valor_a_pagar
 */
router.post(
  '/bulk',
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Archivo no enviado' });
      }

      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const resultado = await procesarBulkOrdenes({
        rows,
        archivoCargado: req.file.filename,
        usuarioId: req.user.id
      });

      // 3) Borro el temp y devuelvo resultado
      fs.unlinkSync(req.file.path);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;