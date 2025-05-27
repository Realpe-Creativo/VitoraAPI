const { Usuario, Rol } = require('../models');

/**
 * Get all usuarios
 * @route GET /usuarios
 */
const getAllUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [{ model: Rol, as: 'rolUsuario', attributes: ['id_rol', 'nombre'] }],
      attributes: { exclude: ['password'] }
    });
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

/**
 * Get usuario by ID
 * @route GET /usuarios/:id
 */
const getUsuarioById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id, {
      include: [{ model: Rol, as: 'rolUsuario', attributes: ['id_rol', 'nombre'] }],
      attributes: { exclude: ['password'] }
    });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario not found' });
    }
    
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new usuario
 * @route POST /usuarios
 */
const createUsuario = async (req, res, next) => {
  try {
    const { nombre, rol, password } = req.body;
    
    // Check if usuario already exists
    const existingUsuario = await Usuario.findOne({ where: { nombre } });
    if (existingUsuario) {
      return res.status(400).json({ message: 'Usuario already exists' });
    }
    
    // Check if rol exists
    const existingRol = await Rol.findByPk(rol);
    if (!existingRol) {
      return res.status(400).json({ message: 'Rol not found' });
    }
    
    const usuario = await Usuario.create({
      nombre,
      rol,
      password
    });
    
    // Return usuario without password
    const { password: _, ...usuarioWithoutPassword } = usuario.toJSON();
    
    res.status(201).json(usuarioWithoutPassword);
  } catch (error) {
    next(error);
  }
};

/**
 * Update usuario
 * @route PUT /usuarios/:id
 */
const updateUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, rol, password } = req.body;
    
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario not found' });
    }
    
    // Check if nombre already exists if it's changing
    if (nombre && nombre !== usuario.nombre) {
      const existingUsuario = await Usuario.findOne({ where: { nombre } });
      if (existingUsuario) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    
    // Check if rol exists if it's changing
    if (rol) {
      const existingRol = await Rol.findByPk(rol);
      if (!existingRol) {
        return res.status(400).json({ message: 'Rol not found' });
      }
    }
    
    // Update fields
    await usuario.update({
      nombre: nombre || usuario.nombre,
      rol: rol || usuario.rol,
      ...(password && { password })
    });
    
    // Return usuario without password
    const updatedUsuario = await Usuario.findByPk(id, {
      include: [{ model: Rol, as: 'rolUsuario', attributes: ['id_rol', 'nombre'] }],
      attributes: { exclude: ['password'] }
    });
    
    res.json(updatedUsuario);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete usuario
 * @route DELETE /usuarios/:id
 */
const deleteUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario not found' });
    }
    
    await usuario.destroy();
    
    res.json({ message: 'Usuario deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario
};