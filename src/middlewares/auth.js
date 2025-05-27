const jwt = require('jsonwebtoken');
const { Usuario, Rol } = require('../models');

/**
 * Middleware to authenticate token
 * Validates JWT token and attaches user to request object
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await Usuario.findByPk(decoded.id, {
      include: [
        {
          model: Rol,
          as: 'rolUsuario',
          attributes: ['nombre']
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Attach user to request
    req.user = {
      id: user.id_user,
      nombre: user.nombre,
      rol: user.rolUsuario.nombre
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Middleware to authorize roles
 * @param {Array} roles - Array of allowed roles
 */
const authorizeRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }
    
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have the required permissions.' 
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};