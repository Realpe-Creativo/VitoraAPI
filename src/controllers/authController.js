const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

/**
 * Login user and generate JWT token
 * @route POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { nombre, password } = req.body;
    
    // Find user by nombre
    const user = await Usuario.findOne({ 
      where: { nombre },
      include: [{ association: 'rolUsuario' }]
    });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    // Validate password
    const isValidPassword = await user.validPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id_user,
        nombre: user.nombre,
        rol: user.rolUsuario.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1d' }
    );
    
    res.json({
      user: {
        id: user.id_user,
        nombre: user.nombre,
        rol: user.rolUsuario.nombre
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /auth/profile
 */
const getProfile = async (req, res) => {
  // User is already attached to request by authenticateToken middleware
  res.json({ user: req.user });
};

module.exports = {
  login,
  getProfile
};