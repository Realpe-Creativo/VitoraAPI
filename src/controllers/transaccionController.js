const { Transaccion, OrdenPago, EstadoTransaccion } = require('../models');
const { sequelize } = require('../config/database');

/**
 * Get all transacciones
 * @route GET /transacciones
 */
const getAllTransacciones = async (req, res, next) => {
  try {
    const transacciones = await Transaccion.findAll({
      include: [
        { model: OrdenPago, as: 'ordenPago' },
        { model: EstadoTransaccion, as: 'estadoActual' }
      ]
    });
    res.json(transacciones);
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaccion by ID
 * @route GET /transacciones/:id
 */
const getTransaccionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const transaccion = await Transaccion.findByPk(id, {
      include: [
        { model: OrdenPago, as: 'ordenPago' },
        { model: EstadoTransaccion, as: 'estadoActual' },
        { 
          model: EstadoTransaccion, 
          as: 'estados',
          order: [['fecha_hora_estado', 'DESC']]
        }
      ]
    });
    
    if (!transaccion) {
      return res.status(404).json({ message: 'Transacción not found' });
    }
    
    res.json(transaccion);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new transaccion
 * @route POST /transacciones
 */
const createTransaccion = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { valor_de_pago, id_orden_pago, estado_inicial } = req.body;
    
    // Check if orden de pago exists
    const ordenPago = await OrdenPago.findByPk(id_orden_pago);
    if (!ordenPago) {
      await t.rollback();
      return res.status(400).json({ message: 'Orden de pago not found' });
    }
    
    // Create transaccion
    const transaccion = await Transaccion.create({
      valor_de_pago,
      id_orden_pago
    }, { transaction: t });
    
    // Create initial estado
    const estadoTransaccion = await EstadoTransaccion.create({
      id_transacción: transaccion.ID_transacción,
      nombre_estado: estado_inicial || 'PENDIENTE',
      fecha_hora_estado: new Date()
    }, { transaction: t });
    
    // Update transaccion with initial estado
    await transaccion.update({
      ultimo_estado: estadoTransaccion.id_estado
    }, { transaction: t });
    
    await t.commit();
    
    // Fetch complete transaccion with associations
    const completeTransaccion = await Transaccion.findByPk(transaccion.ID_transacción, {
      include: [
        { model: OrdenPago, as: 'ordenPago' },
        { model: EstadoTransaccion, as: 'estadoActual' }
      ]
    });
    
    res.status(201).json(completeTransaccion);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Update transaccion state
 * @route PUT /transacciones/:id/estado
 */
const updateTransaccionEstado = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nombre_estado } = req.body;
    
    const transaccion = await Transaccion.findByPk(id);
    if (!transaccion) {
      await t.rollback();
      return res.status(404).json({ message: 'Transacción not found' });
    }
    
    // Create new estado
    const estadoTransaccion = await EstadoTransaccion.create({
      id_transacción: transaccion.ID_transacción,
      nombre_estado,
      fecha_hora_estado: new Date()
    }, { transaction: t });
    
    // Update transaccion with new estado
    await transaccion.update({
      ultimo_estado: estadoTransaccion.id_estado
    }, { transaction: t });
    
    await t.commit();
    
    // Fetch complete transaccion with associations
    const completeTransaccion = await Transaccion.findByPk(transaccion.ID_transacción, {
      include: [
        { model: OrdenPago, as: 'ordenPago' },
        { model: EstadoTransaccion, as: 'estadoActual' }
      ]
    });
    
    res.json(completeTransaccion);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Delete transaccion
 * @route DELETE /transacciones/:id
 */
const deleteTransaccion = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const transaccion = await Transaccion.findByPk(id);
    if (!transaccion) {
      await t.rollback();
      return res.status(404).json({ message: 'Transacción not found' });
    }
    
    // Delete all related estados
    await EstadoTransaccion.destroy({
      where: { id_transacción: transaccion.ID_transacción },
      transaction: t
    });
    
    // Delete transaccion
    await transaccion.destroy({ transaction: t });
    
    await t.commit();
    
    res.json({ message: 'Transacción deleted successfully' });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = {
  getAllTransacciones,
  getTransaccionById,
  createTransaccion,
  updateTransaccionEstado,
  deleteTransaccion
};