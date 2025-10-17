const {Transaccion, Cliente, EstadoTransaccion, Usuario} = require('../models');
const {sequelize} = require('../config/database');
const axios = require('axios');
const moment = require('moment');
const crypto = require('crypto');


const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY;          // ej: pub_test_xxx / pub_prod_xxx
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET; // ej: prod_integrity_xxx / test_integrity_xxx
const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';
const WOMPI_REDIRECT_URL = process.env.WOMPI_REDIRECT_URL;      // opcional (tu /pagos/respuesta)
const WOMPI_EVENT_SECRET = process.env.WOMPI_EVENT_SECRET;
const WOMPI_API_BASE = process.env.WOMPI_API_BASE
const WOMPI_API_TIMEOUT_MS = Number(process.env.WOMPI_API_TIMEOUT_MS || 10000);

const buildIntegritySignature = ({reference, amountInCents, currency, expirationTime}) => {
  // Cadena: "<Referencia><Monto><Moneda>[<FechaExpiracion>]<SecretoIntegridad>"
  const base = `${reference}${amountInCents}${currency}${expirationTime ? expirationTime : ''}${WOMPI_INTEGRITY_SECRET}`;
  return crypto.createHash('sha256').update(base).digest('hex');
};

// Mapea estados Wompi vs estados BD
const mapEstado = (wompiStatus) => {
  const s = String(wompiStatus || '').toUpperCase();
  if (s === 'APPROVED') return 'APROBADO';
  if (s === 'DECLINED' || s === 'ERROR') return 'RECHAZADO';
  if (s === 'VOIDED') return 'ANULADO';
  if (s === 'PENDING') return 'EN PROCESO';
  return s || 'EN PROCESO';
};

// Verificación de firma de evento (checksum)
function verifyWompiEvent(body) {
  if (!WOMPI_EVENT_SECRET) return false;
  console.log("SACA EL EVENT SECRET ", WOMPI_EVENT_SECRET)
  const sig = body?.signature;
  console.log("OBTIENE EL SIGNATURE ", JSON.stringify(sig, null, 2));
  if (!sig || !Array.isArray(sig.properties) || !body.timestamp || !sig.checksum) return false;

  console.log("PASA DE LA VALIDACIÓN DE DATOS");

  // 1️⃣ concatenar valores de las propiedades en orden
  const valuesConcat = sig.properties.map((path) => {
    const parts = path.split('.');
    let cur = body?.data;
    for (const p of parts) cur = cur?.[p];
    return cur === undefined || cur === null ? '' : String(cur);
  }).join('');

  // 2️⃣ agregar timestamp y el secreto de evento
  const strToHash = `${valuesConcat}${body.timestamp}${WOMPI_EVENT_SECRET}`;

  // 3️⃣ calcular SHA256
  const computed = crypto.createHash('sha256').update(strToHash).digest('hex');

  // 4️⃣ comparar con el checksum del body (case-insensitive)
  return computed.toLowerCase() === String(sig.checksum).toLowerCase();
}

/**
 * Get all transacciones
 * @route GET /transacciones
 */
const getAllTransacciones = async (req, res, next) => {
  try {
    const transacciones = await Transaccion.findAll({
      include: [
        {model: OrdenPago, as: 'ordenPago'},
        {model: EstadoTransaccion, as: 'estadoActual'}
      ]
    });
    res.json(transacciones);
  } catch (error) {
    /*next(error);*/
  }
};

/**
 * Get transaccion by ID
 * @route GET /transacciones/:id
 */
const getTransaccionById = async (req, res, next) => {
  try {
    const {id} = req.params;

    const transaccion = await Transaccion.findByPk(id, {
      include: [
        {model: OrdenPago, as: 'ordenPago'},
        {model: EstadoTransaccion, as: 'estadoActual'},
        {
          model: EstadoTransaccion,
          as: 'estados',
          order: [['fecha_hora_estado', 'DESC']]
        }
      ]
    });

    if (!transaccion) {
      return res.status(404).json({message: 'Transacción not found'});
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
    const {
      valor_de_pago,
      estado_inicial,
      document_type,
      document_number,
      name1,
      last_name1,
      email,
      phone
    } = req.body;

    if (!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET) {
      await t.rollback();
      return res.status(500).json({message: 'WOMPI_PUBLIC_KEY o WOMPI_INTEGRITY_SECRET no configurados'});
    }

    // Siguiente referencia única
    const last = await Transaccion.max('referencia');
    const nextRef = last ? last + 1 : 100000000;

    // Asegura Cliente (idempotente simple por identificación)
    let cliente = await Cliente.findOne({where: {identificacion: document_number}, transaction: t});
    if (!cliente) {
      cliente = await Cliente.create({
        identificacion: document_number,
        tipo_identificacion: document_type,
        nombre_cliente: [name1, last_name1].filter(Boolean).join(' ') || 'N/A',
        email,
        phone
      }, {transaction: t});
    }

    // Crea Transacción local
    const transaccion = await Transaccion.create({
      referencia: nextRef,
      valor_de_pago
    }, {transaction: t});

    const estadoTransaccion = await EstadoTransaccion.create({
      id_transaccion: transaccion.id_transaccion,
      nombre_estado: estado_inicial || 'EN PROCESO',
      fecha_hora_estado: new Date()
    }, {transaction: t});

    await transaccion.update({ultimo_estado: estadoTransaccion.id_estado}, {transaction: t});

    // ===========================
    // Parámetros Wompi Checkout
    // ===========================
    const currency = 'COP';
    const amountInCents = Math.round(Number(valor_de_pago) * 100); // Wompi exige centavos
    const reference = String(nextRef);

    // Opcional: fecha de expiración ISO (si la usas, agrégala en la firma)
    const expirationTime = null; // p.ej.: new Date(Date.now() + 60*60*1000).toISOString();

    const signatureHex = buildIntegritySignature({reference, amountInCents, currency, expirationTime});

    // Respuesta para que el front haga GET a https://checkout.wompi.co/p/
    const params = {
      'public-key': WOMPI_PUBLIC_KEY,
      'currency': currency,
      'amount-in-cents': amountInCents,
      'reference': reference,
      'signature:integrity': signatureHex,
      // opcionales
      ...(WOMPI_REDIRECT_URL ? {'redirect-url': WOMPI_REDIRECT_URL} : {}),
      ...(expirationTime ? {'expiration-time': expirationTime} : {}),
      ...(email ? {'customer-data:email': email} : {}),
      ...(name1 || last_name1 ? {'customer-data:full-name': [name1, last_name1].filter(Boolean).join(' ')} : {}),
      ...(phone ? {'customer-data:phone-number': phone} : {}),
      ...(document_number ? {'customer-data:legal-id': document_number} : {}),
      ...(document_type ? {'customer-data:legal-id-type': document_type} : {}),
    };

    await t.commit();

    // Opción A: Devolver acción y params para armar <form> y auto-submit
    // Opción B: También te devuelvo una URL con querystring lista para redirect inmediato
    const query = new URLSearchParams(params).toString();
    const checkoutUrl = `${WOMPI_CHECKOUT_URL}?${query}`;

    return res.status(201).json({
      referencia: reference,
      wompi: {
        action: WOMPI_CHECKOUT_URL,
        method: 'GET',
        params
      },
      checkoutUrl
    });
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
    const {id} = req.params;
    const {nombre_estado} = req.body;

    const transaccion = await Transaccion.findByPk(id);
    if (!transaccion) {
      await t.rollback();
      return res.status(404).json({message: 'Transacción not found'});
    }

    // Create new estado
    const estadoTransaccion = await EstadoTransaccion.create({
      id_transacción: transaccion.ID_transacción,
      nombre_estado,
      fecha_hora_estado: new Date()
    }, {transaction: t});

    // Update transaccion with new estado
    await transaccion.update({
      ultimo_estado: estadoTransaccion.id_estado
    }, {transaction: t});

    await t.commit();

    // Fetch complete transaccion with associations
    const completeTransaccion = await Transaccion.findByPk(transaccion.ID_transacción, {
      include: [
        {model: OrdenPago, as: 'ordenPago'},
        {model: EstadoTransaccion, as: 'estadoActual'}
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
    const {id} = req.params;

    const transaccion = await Transaccion.findByPk(id);
    if (!transaccion) {
      await t.rollback();
      return res.status(404).json({message: 'Transacción not found'});
    }

    // Delete all related estados
    await EstadoTransaccion.destroy({
      where: {id_transacción: transaccion.ID_transacción},
      transaction: t
    });

    // Delete transaccion
    await transaccion.destroy({transaction: t});

    await t.commit();

    res.json({message: 'Transacción deleted successfully'});
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Consultar estado de transacción en Wompi por referencia
 * @route POST /transacciones/consultar-estado
 * body: { referencia: "100000123" }
 */
const consultarEstadoTransaccion = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { referencia } = req.body;

    if (!referencia) {
      await t.rollback();
      return res.status(400).json({ message: 'La referencia es obligatoria.' });
    }

    if (!WOMPI_PRIVATE_KEY) {
      await t.rollback();
      return res.status(500).json({ message: 'Falta WOMPI_PRIVATE_KEY en las variables de entorno.' });
    }

    // Llamada a la API de Wompi con la Public Key
    const url = `${WOMPI_API_BASE}/v1/transactions`;
    const wompiResp = await axios.get(url, {
      params: { reference: referencia },
      timeout: WOMPI_API_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = wompiResp?.data;
    const lista = data?.data || [];

    if (!Array.isArray(lista) || lista.length === 0) {
      await t.rollback();
      return res.status(404).json({
        message: 'Wompi no encontró transacciones con esa referencia.',
        wompi_raw: data
      });
    }

    // Si hay varias, tomamos la más reciente según updated_at (o la primera)
    const byUpdated = [...lista].sort((a, b) => {
      const ua = new Date(a.updated_at || a.created_at || 0).getTime();
      const ub = new Date(b.updated_at || b.created_at || 0).getTime();
      return ub - ua;
    });
    const tx = byUpdated[0];

    const wompiStatus = tx.status;               // APPROVED | DECLINED | PENDING | ...
    const amountInCents = tx.amount_in_cents;
    const nuevoEstadoNombre = mapEstado(wompiStatus);

    // 2) Buscar tu transacción local
    const transaccion = await Transaccion.findOne({ where: { referencia }, transaction: t });
    if (!transaccion) {
      await t.commit();
      // No existe localmente: devolvemos la info de Wompi sin actualizar nada
      return res.status(200).json({
        message: 'Referencia no encontrada en BD local. Se retorna estado desde Wompi.',
        wompi: tx,
        wompi_list: lista
      });
    }

    const estadoActual = transaccion.ultimo_estado
        ? await EstadoTransaccion.findByPk(transaccion.ultimo_estado, { transaction: t })
        : null;

    const ESTADOS_FINALES = ['APROBADO', 'RECHAZADO', 'ANULADO'];

    // 3) Si ya está final, no tocar
    if (estadoActual && ESTADOS_FINALES.includes(String(estadoActual.nombre_estado).toUpperCase())) {
      await t.commit();
      return res.status(200).json({
        message: `La transacción ya está en estado final: ${estadoActual.nombre_estado}.`,
        estado: estadoActual.nombre_estado,
        wompi: tx
      });
    }

    // 4) Si no cambió el estado, sólo devolver
    if (estadoActual && estadoActual.nombre_estado.toUpperCase() === nuevoEstadoNombre.toUpperCase()) {
      await t.commit();
      return res.status(200).json({
        message: 'Estado consultado correctamente. No hay cambios.',
        estado: nuevoEstadoNombre,
        wompi: tx
      });
    }

    // 5) Registrar nuevo estado con payload completo de Wompi
    const nuevoEstado = await EstadoTransaccion.create({
      id_transaccion: transaccion.id_transaccion,
      nombre_estado: nuevoEstadoNombre,
      fecha_hora_estado: new Date(),
      payload_json: JSON.stringify(tx), // Guardamos sólo el objeto de la transacción más reciente
      valor_reportado_centavos: amountInCents ?? null
    }, { transaction: t });

    await transaccion.update({ ultimo_estado: nuevoEstado.id_estado }, { transaction: t });

    // 6) Si quedó aprobado, marcar la orden como pagada
    if (nuevoEstadoNombre.toUpperCase() === 'APROBADO') {
      await OrdenPago.update(
          { estado: 'PAGADO' },
          { where: { order_id: transaccion.id_orden_pago }, transaction: t }
      );
    }

    await t.commit();

    // 7) Devolver también TODO lo que envió Wompi para inspección
    return res.status(200).json({
      message: 'Estado actualizado correctamente.',
      nuevo_estado: nuevoEstadoNombre,
      wompi: tx,          // transacción más reciente
      wompi_list: lista   // lista completa por si la quieres ver
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al consultar y actualizar estado (Wompi):', error.message);
    res.status(500).json({
      message: 'Error al consultar o actualizar estado.',
      detail: error.message
    });
  }
};

/**
 * Consultar transacciones por ID de orden de pago (POST)
 * @route POST /transacciones/por-orden
 */
const consultarTransaccionByOrden = async (req, res, next) => {
  try {
    const {order_id} = req.body;

    console.log("OBTIENE EL BODY:", req.body);

    if (!order_id) {
      return res.status(400).json({message: 'El ID de la orden es obligatorio.'});
    }

    const transacciones = await Transaccion.findAll({
      where: {id_orden_pago: order_id},
      include: [
        {model: EstadoTransaccion, as: 'estadoActual'},
        {
          model: EstadoTransaccion,
          as: 'estados',
          separate: true,
          order: [['fecha_hora_estado', 'DESC']]
        }
      ]
    });

    if (!transacciones || transacciones.length === 0) {
      return res.status(404).json({message: 'No se encontraron transacciones para esta orden.'});
    }

    return res.json(transacciones);
  } catch (error) {
    next(error);
  }
};

/**
 * Webhook Wompi (eventos)
 * @route POST /transacciones/notificacion_pago
 */
const notificacion_pago = async (req, res) => {
  // Verificar firma
  if (!verifyWompiEvent(req.body)) {
    return res.status(400).json({ message: 'Firma inválida de evento Wompi' });
  }

  const eventType = req.body?.event;
  if (eventType !== 'transaction.updated') {
    // ignorar otros eventos
    return res.status(200).json({ message: 'Evento ignorado', event: eventType });
  }

  // Extraer info relevante
  const tx = req.body?.data?.transaction || {};
  const reference = tx?.reference;
  const wompiStatus = tx?.status;
  const amountInCents = tx?.amount_in_cents;

  if (!reference) {
    return res.status(400).json({ message: 'Referencia no encontrada en el evento' });
  }

  const t = await sequelize.transaction();
  try {
    // Buscar transacción local
    const transaccion = await Transaccion.findOne({ where: { referencia: reference }, transaction: t });
    if (!transaccion) {
      await t.commit();
      return res.status(200).json({ message: 'Referencia no registrada localmente. Ignorada.', reference });
    }

    const estadoActual = transaccion.ultimo_estado
        ? await EstadoTransaccion.findByPk(transaccion.ultimo_estado, { transaction: t })
        : null;

    const nuevoEstadoNombre = mapEstado(wompiStatus);
    const ESTADOS_FINALES = ['APROBADO', 'RECHAZADO', 'ANULADO'];

    // Evitar reprocesar finales
    if (estadoActual && ESTADOS_FINALES.includes(String(estadoActual.nombre_estado).toUpperCase())) {
      await t.commit();
      return res.status(200).json({
        message: `Transacción ya finalizada: ${estadoActual.nombre_estado}`
      });
    }

    // Evitar duplicados del mismo estado
    if (estadoActual && estadoActual.nombre_estado.toUpperCase() === nuevoEstadoNombre.toUpperCase()) {
      await t.commit();
      return res.status(200).json({ message: 'Estado repetido, sin cambios' });
    }

    // Crear nuevo estado
    const nuevoEstado = await EstadoTransaccion.create({
      id_transaccion: transaccion.id_transaccion,
      nombre_estado: nuevoEstadoNombre,
      fecha_hora_estado: new Date(),
      payload_json: JSON.stringify(req.body),
      valor_reportado_centavos: amountInCents ?? null
    }, { transaction: t });

    await transaccion.update({ ultimo_estado: nuevoEstado.id_estado }, { transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'OK', state: nuevoEstadoNombre });
  } catch (err) {
    await t.rollback();
    console.error('Error webhook Wompi:', err);
    return res.status(500).json({ message: 'Error interno procesando webhook' });
  }
};

module.exports = {
  getAllTransacciones,
  getTransaccionById,
  createTransaccion,
  updateTransaccionEstado,
  deleteTransaccion,
  consultarEstadoTransaccion,
  consultarTransaccionByOrden,
  notificacion_pago
};