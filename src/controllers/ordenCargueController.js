const { OrdenCargue, Usuario } = require('../models');

/**
 * Get all ordenes de cargue
 * @route GET /ordenes-cargue
 */
const getAllOrdenesCargue = async (req, res, next) => {
  try {
    const ordenesCargue = await OrdenCargue.findAll({
      include: [{ model: Usuario, as: 'usuario', attributes: ['id_user', 'nombre'] }]
    });
    res.json(ordenesCargue);
  } catch (error) {
    next(error);
  }
};

/**
 * Get orden de cargue by ID
 * @route GET /ordenes-cargue/:id
 */
const getOrdenCargueById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const ordenCargue = await OrdenCargue.findByPk(id, {
      include: [{ model: Usuario, as: 'usuario', attributes: ['id_user', 'nombre'] }]
    });
    
    if (!ordenCargue) {
      return res.status(404).json({ message: 'Orden de cargue not found' });
    }
    
    res.json(ordenCargue);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new orden de cargue
 * @route POST /ordenes-cargue
 */
const createOrdenCargue = async (req, res, next) => {
  try {
    const { archivo_cargado, cantidad_registros } = req.body;
    
    // Use authenticated user's ID
    const usuario_que_cargo = req.user.id;
    
    const ordenCargue = await OrdenCargue.create({
      usuario_que_cargo,
      archivo_cargado,
      fecha: new Date(),
      cantidad_registros
    });
    
    res.status(201).json(ordenCargue);
  } catch (error) {
    next(error);
  }
};

/**
 * Update orden de cargue
 * @route PUT /ordenes-cargue/:id
 */
const updateOrdenCargue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { archivo_cargado, cantidad_registros } = req.body;
    
    const ordenCargue = await OrdenCargue.findByPk(id);
    if (!ordenCargue) {
      return res.status(404).json({ message: 'Orden de cargue not found' });
    }
    
    // Update ordenCargue
    await ordenCargue.update({
      archivo_cargado: archivo_cargado || ordenCargue.archivo_cargado,
      cantidad_registros: cantidad_registros || ordenCargue.cantidad_registros
    });
    
    res.json(ordenCargue);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete orden de cargue
 * @route DELETE /ordenes-cargue/:id
 */
const deleteOrdenCargue = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const ordenCargue = await OrdenCargue.findByPk(id);
    if (!ordenCargue) {
      return res.status(404).json({ message: 'Orden de cargue not found' });
    }
    
    await ordenCargue.destroy();
    
    res.json({ message: 'Orden de cargue deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrdenesCargue,
  getOrdenCargueById,
  createOrdenCargue,
  updateOrdenCargue,
  deleteOrdenCargue
};