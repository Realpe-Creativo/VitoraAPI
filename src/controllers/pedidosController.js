// controllers/pedidoController.js
const { Op } = require('sequelize');
const { sequelize } = require('../config/database'); // ajusta la ruta
const Pedido = require('../models/Pedidos');          // ajusta la ruta
// Opcional: si quieres incluirlos en las respuestas
let Cliente, Transaccion, EstadoTransaccion;
try {
  Cliente = require('../models/Cliente');            // ajusta la ruta si lo usas
} catch {}
try {
  Transaccion = require('../models/Transaccion');    // ajusta la ruta si lo usas
} catch {}
try {
  EstadoTransaccion = require('../models/EstadoTransaccion');    // ajusta la ruta si lo usas
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

// Incluye cliente y transacción con su estadoActual
const buildIncludes = () => ([
  {
    model: Cliente,
    as: 'cliente',
    attributes: ['id','nombre_cliente','identificacion','tipo_identificacion','email','phone']
  },
  {
    model: Transaccion,
    as: 'transaccion',
    include: [
      {
        model: EstadoTransaccion,
        as: 'estadoActual',
        attributes: ['id_estado','nombre_estado','fecha_hora_estado']
      }
    ]
  }
]);

/**
 * GET /pedidos
 * Query params:
 *  - cliente_id?: number
 *  - transaccion_id?: number
 *  - limit?: number (default 50, max 100)
 *  - offset?: number (default 0)
 *  - orderBy?: 'creado_en' | 'actualizado_en' | 'id_pedido'
 *  - orderDir?: 'ASC' | 'DESC'
 */
const getAllPedidos = async (req, res, next) => {
  try {
    const {
      cliente_id,
      transaccion_id,
      limit = 50,
      offset = 0,
      orderBy = 'creado_en',
      orderDir = 'DESC'
    } = req.query;

    // Filtros
    const where = {};
    if (cliente_id) where.cliente_id = Number(cliente_id);
    if (transaccion_id) where.transaccion_id = Number(transaccion_id);

    // Paginación segura
    const _limit = Math.min(Number(limit) || 50, 100);
    const _offset = Number(offset) || 0;

    // Ordenamiento seguro
    const ALLOWED_ORDER_BY = new Set(['creado_en', 'actualizado_en', 'id_pedido']);
    const orderField = ALLOWED_ORDER_BY.has(String(orderBy)) ? orderBy : 'creado_en';
    const orderDirection = String(orderDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Usa findAndCountAll para devolver total + filas
    const result = await Pedido.findAndCountAll({
      where,
      include: buildIncludes(),
      order: [[orderField, orderDirection]],
      limit: _limit,
      offset: _offset
    });

    // Respuesta con metadatos (útil para DataTable)
    return res.json({
      count: result.count,
      rows: result.rows,
      limit: _limit,
      offset: _offset
    });
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
