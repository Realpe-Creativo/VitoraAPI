const { Cliente } = require('../models');

/**
 * Get all clientes
 * @route GET /clientes
 */
const getAllClientes = async (req, res, next) => {
  try {
    const clientes = await Cliente.findAll();
    res.json(clientes);
  } catch (error) {
    next(error);
  }
};

/**
 * Get cliente by ID
 * @route GET /clientes/:id
 */
const getClienteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente not found' });
    }
    
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new cliente
 * @route POST /clientes
 */
const createCliente = async (req, res, next) => {
  try {
    const { identificacion, tipo_identificacion, nombre_cliente } = req.body;
    
    // Check if cliente already exists with the same identificacion
    const existingCliente = await Cliente.findOne({ where: { identificacion } });
    if (existingCliente) {
      return res.status(400).json({ 
        message: 'A cliente with this identification already exists' 
      });
    }
    
    const cliente = await Cliente.create({
      identificacion,
      tipo_identificacion,
      nombre_cliente
    });
    
    res.status(201).json(cliente);
  } catch (error) {
    next(error);
  }
};

/**
 * Update cliente
 * @route PUT /clientes/:id
 */
const updateCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { identificacion, tipo_identificacion, nombre_cliente } = req.body;
    
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente not found' });
    }
    
    // If identificacion is changing, check for duplicates
    if (identificacion && identificacion !== cliente.identificacion) {
      const existingCliente = await Cliente.findOne({ where: { identificacion } });
      if (existingCliente) {
        return res.status(400).json({ 
          message: 'A cliente with this identification already exists' 
        });
      }
    }
    
    // Update cliente
    await cliente.update({
      identificacion: identificacion || cliente.identificacion,
      tipo_identificacion: tipo_identificacion || cliente.tipo_identificacion,
      nombre_cliente: nombre_cliente || cliente.nombre_cliente
    });
    
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete cliente
 * @route DELETE /clientes/:id
 */
const deleteCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente not found' });
    }
    
    await cliente.destroy();
    
    res.json({ message: 'Cliente deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente
};