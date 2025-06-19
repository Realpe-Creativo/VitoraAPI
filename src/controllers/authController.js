const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

/**
 * Login user and generate JWT token
 * @route POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    console.log("VA A BUSCAR A EL USUARIO ");
    // Find user by email
    const user = await Usuario.findOne({ 
      where: { email },
      include: [{ association: 'rolUsuario' }]
    });

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    console.log("VA POR AQUÍ 2 " +  user.email)
    
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
        email: user.email,
        rol: user.rolUsuario.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1d' }
    );
    
    res.json({
      user: {
        id: user.id_user,
        email: user.email,
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