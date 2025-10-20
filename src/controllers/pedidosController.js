// controllers/pedidoController.js
const { Op } = require('sequelize');
const { sequelize } = require('../config/database'); // ajusta la ruta
const Pedido = require('../models/Pedido');          // ajusta la ruta
// Opcional: si quieres incluirlos en las respuestas
let Cliente, Transaccion;
try {
  Cliente = require('../models/Cliente');            // ajusta la ruta si lo usas
} catch {}
try {
  Transaccion = require('../models/Transaccion');    // ajusta la ruta si lo usas
} catch {}

const ESTADOS_VALIDOS = [
  'INICIADO',
  'PAGO_PENDIENTE',
  'PAGADO',
  'EN_PREPARACION',
  'ENVIADO',
  'CANCELADO'
];

// Helper: parse JSON seguro para `productos`
const parseProductos = (value) => {
  if (value == null) return value;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {}
  }
  throw new Error('El campo "productos" debe ser un JSON válido (objeto o arreglo).');
};

// Helper: include asociaciones si están disponibles
const buildIncludes = () => {
  const inc = [];
  if (Cliente) inc.push({ model: Cliente, as: 'cliente' });
  if (Transaccion) inc.push({ model: Transaccion, as: 'transaccion' });
  return inc;
};

const createPedido = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      cliente_id,
      transaccion_id = null,
      productos,
      estado = 'INICIADO',
      departamento = null,
      ciudad = null,
      direccion_envio = null,
      notas = null
    } = req.body;

    // parse/validar productos
    const productosJSON = parseProductos(productos);

    // Validar estado (ya lo haces en express-validator, esto es doble check)
    if (estado && !ESTADOS_VALIDOS.includes(String(estado))) {
      await t.rollback();
      return res.status(400).json({ message: 'Estado inválido.' });
    }

    // (Opcional) validar existencia de cliente/transacción si los modelos están disponibles
    if (Cliente) {
      const cli = await Cliente.findByPk(cliente_id, { transaction: t });
      if (!cli) {
        await t.rollback();
        return res.status(404).json({ message: 'Cliente no encontrado.' });
      }
    }
    if (transaccion_id && Transaccion) {
      const trx = await Transaccion.findByPk(transaccion_id, { transaction: t });
      if (!trx) {
        await t.rollback();
        return res.status(404).json({ message: 'Transacción no encontrada.' });
      }
    }

    const nuevo = await Pedido.create({
      cliente_id,
      transaccion_id,
      productos: productosJSON,
      estado,
      departamento,
      ciudad,
      direccion_envio,
      notas,
      creado_en: new Date(),
      actualizado_en: new Date()
    }, { transaction: t });

    await t.commit();

    const creado = await Pedido.findByPk(nuevo.id_pedido, {
      include: buildIncludes()
    });

    return res.status(201).json(creado);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const getAllPedidos = async (req, res, next) => {
  try {
    const { cliente_id, transaccion_id, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (cliente_id) where.cliente_id = cliente_id;
    if (transaccion_id) where.transaccion_id = transaccion_id;

    const pedidos = await Pedido.findAll({
      where,
      include: buildIncludes(),
      order: [['creado_en', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    });

    return res.json(pedidos);
  } catch (err) {
    next(err);
  }
};

const getPedidoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id, {
      include: buildIncludes()
    });

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    return res.json(pedido);
  } catch (err) {
    next(err);
  }
};

const getPedidosByCliente = async (req, res, next) => {
  try {
    const { cliente_id } = req.params;

    const pedidos = await Pedido.findAll({
      where: { cliente_id },
      include: buildIncludes(),
      order: [['creado_en', 'DESC']]
    });

    if (!pedidos || pedidos.length === 0) {
      return res.status(404).json({ message: 'No hay pedidos para este cliente.' });
    }

    return res.json(pedidos);
  } catch (err) {
    next(err);
  }
};

const getPedidosByTransaccion = async (req, res, next) => {
  try {
    const { transaccion_id } = req.params;

    const pedidos = await Pedido.findAll({
      where: { transaccion_id },
      include: buildIncludes(),
      order: [['creado_en', 'DESC']]
    });

    if (!pedidos || pedidos.length === 0) {
      return res.status(404).json({ message: 'No hay pedidos para esta transacción.' });
    }

    return res.json(pedidos);
  } catch (err) {
    next(err);
  }
};

const updatePedido = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      cliente_id,
      transaccion_id,
      productos,
      estado,
      departamento,
      ciudad,
      direccion_envio,
      notas
    } = req.body;

    const pedido = await Pedido.findByPk(id, { transaction: t });
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    const updateData = {};

    if (cliente_id !== undefined) updateData.cliente_id = cliente_id;
    if (transaccion_id !== undefined) updateData.transaccion_id = transaccion_id;

    if (productos !== undefined) {
      updateData.productos = parseProductos(productos);
    }

    if (estado !== undefined) {
      if (!ESTADOS_VALIDOS.includes(String(estado))) {
        await t.rollback();
        return res.status(400).json({ message: 'Estado inválido.' });
      }
      updateData.estado = estado;
    }

    if (departamento !== undefined) updateData.departamento = departamento;
    if (ciudad !== undefined) updateData.ciudad = ciudad;
    if (direccion_envio !== undefined) updateData.direccion_envio = direccion_envio;
    if (notas !== undefined) updateData.notas = notas;

    updateData.actualizado_en = new Date();

    await pedido.update(updateData, { transaction: t });
    await t.commit();

    const actualizado = await Pedido.findByPk(id, {
      include: buildIncludes()
    });

    return res.json(actualizado);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const updateEstadoPedido = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!ESTADOS_VALIDOS.includes(String(estado))) {
      await t.rollback();
      return res.status(400).json({ message: 'Estado inválido.' });
    }

    const pedido = await Pedido.findByPk(id, { transaction: t });
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    await pedido.update(
        { estado, actualizado_en: new Date() },
        { transaction: t }
    );

    await t.commit();

    const refreshed = await Pedido.findByPk(id, {
      include: buildIncludes()
    });

    return res.json(refreshed);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

const deletePedido = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id, { transaction: t });
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    await pedido.destroy({ transaction: t });
    await t.commit();

    return res.json({ message: 'Pedido eliminado correctamente.' });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

module.exports = {
  createPedido,
  getAllPedidos,
  getPedidoById,
  getPedidosByCliente,
  getPedidosByTransaccion,
  updatePedido,
  updateEstadoPedido,
  deletePedido
};
