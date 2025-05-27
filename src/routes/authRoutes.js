const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validator');
const { authenticateToken } = require('../middlewares/auth');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * @route POST /auth/login
 * @desc Login user and get token
 * @access Public
 */
router.post('/login', [
  body('nombre').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], authController.login);

/**
 * @route GET /auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;