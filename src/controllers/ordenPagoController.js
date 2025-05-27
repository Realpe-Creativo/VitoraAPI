const { OrdenPago, Cliente, Usuario, OrdenCargue } = require('../models');

/**
 * Get all ordenes de pago
 * @route GET /ordenes-pago
 */
const getAllOrdenesPago = async (req, res, next) => {
  try {
    const ordenesPago = await OrdenPago.findAll({
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuarioCreador' },
        { model: OrdenCargue, as: 'ordenCargue' }
      ]
    });
    res.json(ordenesPago);
  } catch (error) {
    next(error);
  }
};

/**
 * Get orden de pago by ID
 * @route GET /ordenes-pago/:id
 */
const getOrdenPagoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const ordenPago = await OrdenPago.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuarioCreador' },
        { model: OrdenCargue, as: 'ordenCargue' }
      ]
    });
    
    if (!ordenPago) {
      return res.status(404).json({ message: 'Orden de pago not found' });
    }
    
    res.json(ordenPago);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new orden de pago
 * @route POST /ordenes-pago
 */
const createOrdenPago = async (req, res, next) => {
  try {
    const { 
      cliente_id, 
      fecha_creacion,
      ultimo_intento_pago,
      forma_cargue,
      orden_cargue_archivo,
      valor_a_pagar 
    } = req.body;
    
    // Check if cliente exists
    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) {
      return res.status(400).json({ message: 'Cliente not found' });
    }
    
    // If forma_cargue is 'archivo', check if orden_cargue_archivo exists
    if (forma_cargue === 'archivo' && orden_cargue_archivo) {
      const ordenCargue = await OrdenCargue.findByPk(orden_cargue_archivo);
      if (!ordenCargue) {
        return res.status(400).json({ message: 'Orden de cargue not found' });
      }
    }
    
    // Set usuario_crea_manual based on authenticated user if forma_cargue is 'manual'
    let usuario_crea_manual = null;
    if (forma_cargue === 'manual') {
      usuario_crea_manual = req.user.id;
    }
    
    const ordenPago = await OrdenPago.create({
      cliente_id,
      fecha_creacion: fecha_creacion || new Date(),
      ultimo_intento_pago,
      forma_cargue,
      usuario_crea_manual,
      orden_cargue_archivo: forma_cargue === 'archivo' ? orden_cargue_archivo : null,
      valor_a_pagar
    });
    
    res.status(201).json(ordenPago);
  } catch (error) {
    next(error);
  }
};

/**
 * Update orden de pago
 * @route PUT /ordenes-pago/:id
 */
const updateOrdenPago = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      cliente_id, 
      ultimo_intento_pago,
      valor_a_pagar 
    } = req.body;
    
    const ordenPago = await OrdenPago.findByPk(id);
    if (!ordenPago) {
      return res.status(404).json({ message: 'Orden de pago not found' });
    }
    
    // Check if cliente exists if cliente_id is provided
    if (cliente_id) {
      const cliente = await Cliente.findByPk(cliente_id);
      if (!cliente) {
        return res.status(400).json({ message: 'Cliente not found' });
      }
    }
    
    // Update ordenPago
    await ordenPago.update({
      cliente_id: cliente_id || ordenPago.cliente_id,
      ultimo_intento_pago: ultimo_intento_pago || ordenPago.ultimo_intento_pago,
      valor_a_pagar: valor_a_pagar || ordenPago.valor_a_pagar
    });
    
    res.json(ordenPago);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete orden de pago
 * @route DELETE /ordenes-pago/:id
 */
const deleteOrdenPago = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const ordenPago = await OrdenPago.findByPk(id);
    if (!ordenPago) {
      return res.status(404).json({ message: 'Orden de pago not found' });
    }
    
    await ordenPago.destroy();
    
    res.json({ message: 'Orden de pago deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrdenesPago,
  getOrdenPagoById,
  createOrdenPago,
  updateOrdenPago,
  deleteOrdenPago
};