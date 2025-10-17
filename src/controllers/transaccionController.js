const {Transaccion, Cliente, EstadoTransaccion, Usuario} = require('../models');
const {sequelize} = require('../config/database');
const axios = require('axios');
const moment = require('moment');
const crypto = require('crypto');


const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY;          // ej: pub_test_xxx / pub_prod_xxx
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET; // ej: prod_integrity_xxx / test_integrity_xxx
const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';
const WOMPI_REDIRECT_URL = process.env.WOMPI_REDIRECT_URL;      // opcional (tu /pagos/respuesta)
const WOMPI_EVENT_SECRET = process.env.WOMPI_EVENT_SECRET;

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
      // Puedes añadir shipping / taxes si aplica
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
      checkoutUrl // por si quieres redirigir directo desde el front
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
 * Consultar estado de transacción con FastTrack
 * @route POST /transacciones/consultar-estado
 */

const consultarEstadoTransaccion = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const {referencia} = req.body;

    if (!referencia) {
      return res.status(400).json({message: 'La referencia es obligatoria.'});
    }

    const user_app = process.env.PAYMENT_GATEWAY_USER;
    const password_app = process.env.PAYMENT_GATEWAY_PASSWORD;
    const consultaUrl = process.env.PAYMENT_GATEWAY_STATUS_URL;

    if (!user_app || !password_app || !consultaUrl) {
      return res.status(500).json({message: 'Error en la construcción de petición Payment'});
    }

    const payload = {
      user_app,
      password_app,
      commerce_id: "2662",
      transaction_id: referencia,
      product_id: "1238"
    };

    const response = await axios.post(consultaUrl, payload, {
      headers: {'Content-Type': 'application/json'}
    });

    const data = response.data;

    if (!data || !data.response_description) {
      return res.status(500).json({message: 'Respuesta inválida de la pasarela', raw: data});
    }

    const nombre_estado_nuevo = data.state_description;

    const transaccion = await Transaccion.findOne({where: {referencia}});
    if (!transaccion) {
      return res.status(404).json({message: 'Transacción no encontrada en la base de datos'});
    }

    const estadoActual = await EstadoTransaccion.findByPk(transaccion.ultimo_estado);

    const ESTADOS_FINALES = ['APROBADO', 'RECHAZADO', 'FALLIDO'];

    // 🔐 Validar si ya está en estado final
    if (estadoActual && ESTADOS_FINALES.includes(estadoActual.nombre_estado.toUpperCase())) {
      return res.status(200).json({
        message: `La transacción ya se encuentra en estado final: ${estadoActual.nombre_estado}.`,
        estado: estadoActual.nombre_estado,
        valor_de_pago: data.transactionInformation.transaction_total
      });
    }

    // Si el estado no ha cambiado, no se actualiza
    if (estadoActual && estadoActual.nombre_estado === nombre_estado_nuevo) {
      return res.status(200).json({
        message: 'Estado consultado correctamente. No hay cambios.',
        estado: nombre_estado_nuevo,
        valor_de_pago: data.transactionInformation.transaction_total
      });
    }

    const nuevoEstado = await EstadoTransaccion.create({
      id_transaccion: transaccion.id_transaccion,
      nombre_estado: nombre_estado_nuevo,
      fecha_hora_estado: new Date(),
      payload_json: JSON.stringify(data)
    }, {transaction: t});

    await transaccion.update({
      ultimo_estado: nuevoEstado.id_estado
    }, {transaction: t});

    if (nombre_estado_nuevo.toUpperCase() === 'APROBADO') {
      await OrdenPago.update(
          {estado: 'PAGADO'},
          {where: {order_id: transaccion.id_orden_pago}, transaction: t}
      );
    }

    await t.commit();

    return res.status(200).json({
      message: 'Estado actualizado correctamente.',
      nuevo_estado: nombre_estado_nuevo,
      valor_de_pago: data.transactionInformation.transaction_total
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al consultar y actualizar estado:', error.message);
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

  // 2️⃣ Extraer info relevante
  const tx = req.body?.data?.transaction || {};
  const reference = tx?.reference;
  const wompiStatus = tx?.status;
  const amountInCents = tx?.amount_in_cents;

  if (!reference) {
    return res.status(400).json({ message: 'Referencia no encontrada en el evento' });
  }

  const t = await sequelize.transaction();
  try {
    // 3️⃣ Buscar transacción local
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

    // 4️⃣ Evitar reprocesar finales
    if (estadoActual && ESTADOS_FINALES.includes(String(estadoActual.nombre_estado).toUpperCase())) {
      await t.commit();
      return res.status(200).json({
        message: `Transacción ya finalizada: ${estadoActual.nombre_estado}`
      });
    }

    // 5️⃣ Evitar duplicados del mismo estado
    if (estadoActual && estadoActual.nombre_estado.toUpperCase() === nuevoEstadoNombre.toUpperCase()) {
      await t.commit();
      return res.status(200).json({ message: 'Estado repetido, sin cambios' });
    }

    // 6️⃣ Crear nuevo estado
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