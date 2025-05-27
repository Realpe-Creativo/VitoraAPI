const { Rol, Usuario } = require('../models');

/**
 * Get all roles
 * @route GET /roles
 */
const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Rol.findAll();
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

/**
 * Get rol by ID
 * @route GET /roles/:id
 */
const getRolById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const rol = await Rol.findByPk(id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol not found' });
    }
    
    res.json(rol);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new rol
 * @route POST /roles
 */
const createRol = async (req, res, next) => {
  try {
    const { nombre } = req.body;
    
    // Check if rol already exists
    const existingRol = await Rol.findOne({ where: { nombre } });
    if (existingRol) {
      return res.status(400).json({ message: 'Rol already exists' });
    }
    
    const rol = await Rol.create({ nombre });
    
    res.status(201).json(rol);
  } catch (error) {
    next(error);
  }
};

/**
 * Update rol
 * @route PUT /roles/:id
 */
const updateRol = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    
    const rol = await Rol.findByPk(id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol not found' });
    }
    
    // Check if nombre already exists if it's changing
    if (nombre && nombre !== rol.nombre) {
      const existingRol = await Rol.findOne({ where: { nombre } });
      if (existingRol) {
        return res.status(400).json({ message: 'Rol name already exists' });
      }
    }
    
    await rol.update({ nombre });
    
    res.json(rol);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete rol
 * @route DELETE /roles/:id
 */
const deleteRol = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if rol exists
    const rol = await Rol.findByPk(id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol not found' });
    }
    
    // Check if there are usuarios with this rol
    const usuariosWithRol = await Usuario.count({ where: { rol: id } });
    if (usuariosWithRol > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete rol because it is associated with users'
      });
    }
    
    await rol.destroy();
    
    res.json({ message: 'Rol deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol
};