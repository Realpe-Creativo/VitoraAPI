const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validator');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const rolController = require('../controllers/rolController');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route GET /roles
 * @desc Get all roles
 * @access Private (Admin only)
 */
router.get('/', authorizeRole(['ADMIN']), rolController.getAllRoles);

/**
 * @route GET /roles/:id
 * @desc Get rol by ID
 * @access Private (Admin only)
 */
router.get('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN']), rolController.getRolById);

/**
 * @route POST /roles
 * @desc Create a new rol
 * @access Private (Admin only)
 */
router.post('/', [
  body('nombre').notEmpty().withMessage('Nombre is required'),
  validate
], authorizeRole(['ADMIN']), rolController.createRol);

/**
 * @route PUT /roles/:id
 * @desc Update a rol
 * @access Private (Admin only)
 */
router.put('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  body('nombre').notEmpty().withMessage('Nombre is required'),
  validate
], authorizeRole(['ADMIN']), rolController.updateRol);

/**
 * @route DELETE /roles/:id
 * @desc Delete a rol
 * @access Private (Admin only)
 */
router.delete('/:id', [
  param('id').isInt().withMessage('ID must be an integer'),
  validate
], authorizeRole(['ADMIN']), rolController.deleteRol);

module.exports = router;