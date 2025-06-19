const { EstadoTransaccion, Transaccion } = require('../models');

/**
 * Get all estados de transacciones
 * @route GET /estados-transacciones
 */
const getAllEstadosTransacciones = async (req, res, next) => {
  try {
    const estadosTransacciones = await EstadoTransaccion.findAll({
      include: [{ model: Transaccion, as: 'transaccion' }]
    });
    res.json(estadosTransacciones);
  } catch (error) {
    next(error);
  }
};

/**
 * Get estado de transaccion by ID
 * @route GET /estados-transacciones/:id
 */
const getEstadoTransaccionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const estadoTransaccion = await EstadoTransaccion.findByPk(id, {
      include: [{ model: Transaccion, as: 'transaccion' }]
    });
    
    if (!estadoTransaccion) {
      return res.status(404).json({ message: 'Estado de transacción not found' });
    }
    
    res.json(estadoTransaccion);
  } catch (error) {
    next(error);
  }
};

/**
 * Get estados by transaccion ID
 * @route GET /transacciones/:id/estados
 */
const getEstadosByTransaccionId = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const transaccion = await Transaccion.findByPk(id);
    if (!transaccion) {
      return res.status(404).json({ message: 'Transacción not found' });
    }
    
    const estados = await EstadoTransaccion.findAll({
      where: { id_transaccion: id },
      order: [['fecha_hora_estado', 'DESC']]
    });
    
    res.json(estados);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEstadosTransacciones,
  getEstadoTransaccionById,
  getEstadosByTransaccionId
};