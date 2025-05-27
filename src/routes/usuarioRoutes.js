const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validator');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const usuarioController = require('../controllers/usuarioController');

const router = express.Router();

// Protect all routes except for user creation (registration)
router.use('/:id', authenticateToken);
router.use('/', (req, res, next) => {
  if (req.method === 'POST') {
    return next();
  }
  authenticateToken(req, res, next);
});

/**
 * @route GET /usuarios
 * @desc Get all usuarios
 * @access Private (Admin only)
 */
router.get('/', authorizeRole(['ADMIN']), usuarioController.getAllUsuarios);

/**
 * @route GET /usuarios/:id
 * @desc Get usuario by ID
 * @access Private (Admin or self)
 */
router.get('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], (req, res, next) => {
  // Allow admins or the user themselves to access
  if (req.user.rol === 'ADMIN' || req.user.id === parseInt(req.params.id)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied' });
}, usuarioController.getUsuarioById);

/**
 * @route POST /usuarios
 * @desc Create a new usuario (register)
 * @access Public
 */
router.post('/', [
  body('nombre').notEmpty().withMessage('Nombre is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('rol').isInt().withMessage('Rol must be an integer'),
  validate
], usuarioController.createUsuario);

/**
 * @route PUT /usuarios/:id
 * @desc Update a usuario
 * @access Private (Admin or self)
 */
router.put('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], (req, res, next) => {
  // Allow admins or the user themselves to update
  // Only admins can change roles
  if (req.user.rol !== 'ADMIN' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  if (req.user.rol !== 'ADMIN' && req.body.rol) {
    return res.status(403).json({ message: 'Only admins can change roles' });
  }
  
  next();
}, usuarioController.updateUsuario);

/**
 * @route DELETE /usuarios/:id
 * @desc Delete a usuario
 * @access Private (Admin only)
 */
router.delete('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN']), usuarioController.deleteUsuario);

module.exports = router;