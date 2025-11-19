const {Transaccion, Cliente, EstadoTransaccion, Usuario, Pedidos} = require('../models');
const {sequelize} = require('../config/database');
const axios = require('axios');
const moment = require('moment');
const crypto = require('crypto');
const {sendOrderApprovedEmails} = require('../utils/orderEmails');


const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY;
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET;
const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';
const WOMPI_REDIRECT_URL = process.env.WOMPI_REDIRECT_URL;
const WOMPI_EVENT_SECRET = process.env.WOMPI_EVENT_SECRET;
const WOMPI_API_BASE = process.env.WOMPI_API_BASE
const WOMPI_API_TIMEOUT_MS = Number(process.env.WOMPI_API_TIMEOUT_MS || 10000);

const buildIntegritySignature = ({reference, amountInCents, currency, expirationTime}) => {
  // Cadena: "<Referencia><Monto><Moneda>[<FechaExpiracion>]<SecretoIntegridad>"
  const base = `${reference}${amountInCents}${currency}${expirationTime ? expirationTime : ''}${WOMPI_INTEGRITY_SECRET}`;
  return crypto.createHash('sha256').update(base).digest('hex');
};

// Mapea el estado de Wompi al dominio de Transaccion
const mapEstadoTransaccion = (s) => {
  const S = String(s || '').toUpperCase();
  if (S === 'APPROVED') return 'APROBADO';
  if (S === 'DECLINED') return 'RECHAZADO';
  if (S === 'VOIDED' || S === 'ANNULLED') return 'ANULADO';
  if (S === 'PENDING') return 'EN PROCESO';
  return 'EN PROCESO';
};

// Mapea el estado de Wompi al dominio de Pedido
const mapEstadoPedido = (s) => {
  const S = String(s || '').toUpperCase();
  if (S === 'APPROVED') return 'PAGADO';
  if (S === 'DECLINED' || S === 'VOIDED' || S === 'ANNULLED') return 'CANCELADO';
  if (S === 'PENDING') return 'PAGO_PENDIENTE';
  return 'PAGO_PENDIENTE';
};

// Estados finales para Transaccion y Pedido
const ESTADOS_FINALES_TX = ['APROBADO', 'RECHAZADO', 'ANULADO'];
const ESTADOS_FINALES_PED = ['PAGADO'];

// Verificación de firma de evento (checksum)
function verifyWompiEvent(body) {
  if (!WOMPI_EVENT_SECRET) return false;
  console.log("SACA EL EVENT SECRET ", WOMPI_EVENT_SECRET)
  const sig = body?.signature;
  console.log("OBTIENE EL SIGNATURE ", JSON.stringify(sig, null, 2));
  if (!sig || !Array.isArray(sig.properties) || !body.timestamp || !sig.checksum) return false;

  console.log("PASA DE LA VALIDACIÓN DE DATOS");

  const valuesConcat = sig.properties.map((path) => {
    const parts = path.split('.');
    let cur = body?.data;
    for (const p of parts) cur = cur?.[p];
    return cur === undefined || cur === null ? '' : String(cur);
  }).join('');

  const strToHash = `${valuesConcat}${body.timestamp}${WOMPI_EVENT_SECRET}`;
  const computed = crypto.createHash('sha256').update(strToHash).digest('hex');

  return computed.toLowerCase() === String(sig.checksum).toLowerCase();
}

/**
 * Get all transacciones
 * @route GET /transacciones
 */
const getAllTransacciones = async (req, res, next) => {
  try {
    // Query params
    const {
      limit = 20,
      offset = 0,
      orderBy = 'id_transaccion',
      orderDir = 'DESC',
      referencia,              // opcional: filtrar por referencia exacta o parcial
      id_wompi,                // opcional: filtrar por id_wompi exacto
      estado                   // opcional: filtrar por estado actual (APROBADO/RECHAZADO/EN PROCESO/ANULADO)
    } = req.query;

    // Filtros
    const where = {};
    if (referencia) {
      // si viene numérica exacta: igual; si no, LIKE
      if (/^\d+$/.test(String(referencia))) {
        where.referencia = String(referencia);
      } else {
        where.referencia = {[Op.like]: `%${referencia}%`};
      }
    }
    if (id_wompi) {
      where.id_wompi = String(id_wompi);
    }

    // Filtro por estado (sobre el include)
    const whereEstado =
        estado ? {nombre_estado: String(estado).toUpperCase()} : undefined;

    // Orden
    // Permitimos:
    // - id_transaccion | referencia | valor_de_pago (columnas locales)
    // - creado_en/actualizado_en -> los mapeamos a fecha_hora_estado del estadoActual (si es lo que buscas)
    let order = [];
    const dir = String(orderDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    switch (orderBy) {
      case 'referencia':
        order = [['referencia', dir]];
        break;
      case 'valor_de_pago':
        order = [['valor_de_pago', dir]];
        break;
      case 'creado_en':
      case 'actualizado_en':
        // No hay timestamps en Transaccion (timestamps:false),
        // ordenamos por la fecha del último estado (estadoActual)
        order = [[{model: EstadoTransaccion, as: 'estadoActual'}, 'fecha_hora_estado', dir]];
        break;
      case 'id_transaccion':
      default:
        order = [['id_transaccion', dir]];
        break;
    }

    const result = await Transaccion.findAndCountAll({
      where,
      include: [
        {
          model: EstadoTransaccion,
          as: 'estadoActual',
          required: false,
          where: whereEstado
        }
      ],
      order,
      limit: Number(limit),
      offset: Number(offset),
      distinct: true // para que count sea correcto con includes
    });

    return res.json({
      rows: result.rows,
      count: result.count
    });
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
 * Create new transaccion + Pedido (PAGO_PENDIENTE)
 * @route POST /transacciones
 */
const createTransaccion = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      // datos para la transacción / cliente
      valor_de_pago,
      estado_inicial,
      document_type,
      document_number,
      name1,
      last_name1,
      email,
      phone,
      productos,
      departamento,
      ciudad,
      direccion_envio,
      notas,
    } = req.body;

    if (!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET) {
      await t.rollback();
      return res.status(500).json({message: 'WOMPI_PUBLIC_KEY o WOMPI_INTEGRITY_SECRET no configurados'});
    }

    // 1) Siguiente referencia única
    const last = await Transaccion.max('referencia');
    const nextRef = last ? (Number(last) + 1) : 10000000000;

    // 2) Asegura Cliente (idempotente simple por identificación)
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

    // 3) Crea Transacción local
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

    // 4) 🔥 Crea el Pedido en estado PAGO_PENDIENTE
    //    productos puede venir como objeto/array o string JSON: lo normalizamos
    let productosJSON = productos;
    if (typeof productosJSON === 'string') {
      try {
        productosJSON = JSON.parse(productosJSON);
      } catch (e) {
        await t.rollback();
        return res.status(400).json({message: 'El campo "productos" debe ser JSON válido.'});
      }
    }
    if (productosJSON == null || (typeof productosJSON !== 'object')) {
      await t.rollback();
      return res.status(400).json({message: 'El campo "productos" es requerido y debe ser objeto/arreglo JSON.'});
    }

    console.log("cliente_id", cliente.id);
    console.log("transaccion_id", transaccion.id_transaccion);
    console.log("productos", JSON.stringify(productosJSON));
    console.log("departamento", departamento);
    console.log("ciudad", ciudad);
    console.log("direccion_envio", direccion_envio);
    console.log("notas", notas);

    await Pedidos.create({
      cliente_id: cliente.id,
      transaccion_id: transaccion.id_transaccion,
      productos: productosJSON,
      estado: 'PAGO_PENDIENTE',
      departamento: departamento || null,
      ciudad: ciudad || null,
      direccion_envio: direccion_envio || null,
      notas: notas || null,
      creado_en: new Date(),
      actualizado_en: new Date()
    }, {transaction: t});

    // ===========================
    // 5) Parámetros Wompi Checkout
    // ===========================
    const currency = 'COP';
    const amountInCents = Math.round(Number(valor_de_pago) * 100); // Wompi exige centavos
    const reference = String(nextRef);

    // (Opcional) fecha de expiración ISO -> si la usas, inclúyela en la firma
    const expirationTime = null;

    const signatureHex = buildIntegritySignature({
      reference,
      amountInCents,
      currency,
      expirationTime
    });

    const params = {
      'public-key': WOMPI_PUBLIC_KEY,
      'currency': currency,
      'amount-in-cents': amountInCents,
      'reference': reference,
      'signature:integrity': signatureHex,
      ...(WOMPI_REDIRECT_URL ? {'redirect-url': WOMPI_REDIRECT_URL} : {}),
      ...(expirationTime ? {'expiration-time': expirationTime} : {}),
      ...(email ? {'customer-data:email': email} : {}),
      ...(name1 || last_name1 ? {'customer-data:full-name': [name1, last_name1].filter(Boolean).join(' ')} : {}),
      ...(phone ? {'customer-data:phone-number': phone} : {}),
      ...(document_number ? {'customer-data:legal-id': document_number} : {}),
      ...(document_type ? {'customer-data:legal-id-type': document_type} : {})
    };

    await t.commit();

    // 6) Respuesta: URL lista para redirigir
    const query = new URLSearchParams(params).toString();
    const checkoutUrl = `${process.env.WOMPI_CHECKOUT_URL || WOMPI_CHECKOUT_URL}?${query}`;

    return res.status(201).json({
      referencia: reference,
      wompi: {
        action: process.env.WOMPI_CHECKOUT_URL || WOMPI_CHECKOUT_URL,
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
 * Consultar estado de transacción en Wompi por referencia
 * @route POST /transacciones/consultar-estado
 * body: { referencia: "100000123" }
 */
const consultarEstadoTransaccion = async (req, res, next) => {
      const t = await sequelize.transaction();
      try {
        const {referencia} = req.body;

        if (!referencia) {
          await t.rollback();
          return res.status(400).json({message: 'La referencia es obligatoria.'});
        }

        if (!WOMPI_API_BASE || !WOMPI_PUBLIC_KEY) {
          await t.rollback();
          return res.status(500).json({message: 'Faltan variables WOMPI_API_BASE o WOMPI_PUBLIC_KEY.'});
        }

        const looksLikeId = String(referencia).includes('-');
        const url = looksLikeId
            ? `${WOMPI_API_BASE}/v1/transactions/${encodeURIComponent(referencia)}`
            : `${WOMPI_API_BASE}/v1/transactions?reference=${encodeURIComponent(referencia)}`;

        const wompiResp = await axios.get(url, {
          timeout: WOMPI_API_TIMEOUT_MS,
          headers: {
            Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        const raw = wompiResp?.data;
        const rawData = raw?.data;
        const txList = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);

        if (txList.length === 0) {
          await t.rollback();
          return res.status(404).json({
            message: 'Wompi no encontró transacciones con ese identificador/referencia.',
            wompi_raw: raw,
            endpoint: url,
          });
        }

        // tomar la más reciente
        const byUpdated = [...txList].sort((a, b) => {
          const ua = new Date(a.updated_at || a.finalized_at || a.created_at || 0).getTime();
          const ub = new Date(b.updated_at || b.finalized_at || b.created_at || 0).getTime();
          return ub - ua;
        });
        const tx = byUpdated[0];

        // usar SIEMPRE la reference del objeto elegido
        const referenciaPropia = tx.reference;
        const wompiStatus = String(tx.status || '').toUpperCase();
        const nuevoEstadoNombre = mapEstadoTransaccion(wompiStatus);
        const nuevoEstadoPedido = mapEstadoPedido(wompiStatus);

        // buscar transacción local por tu referencia (comercio)
        const transaccion = await Transaccion.findOne({where: {referencia: referenciaPropia}, transaction: t});

        if (!transaccion) {
          await t.commit();
          return res.status(200).json({
            message: 'Referencia no encontrada en BD local. Se retorna estado desde Wompi.',
            wompi: tx,
            wompi_list: byUpdated,
          });
        }

        const estadoActual = transaccion.ultimo_estado
            ? await EstadoTransaccion.findByPk(transaccion.ultimo_estado, {transaction: t})
            : null;

        // si transacción ya final, no tocar (pero igual intentaremos reflejar pedido si no está final)
        const txYaFinal = estadoActual && ESTADOS_FINALES_TX.includes(String(estadoActual.nombre_estado).toUpperCase());

        if (!txYaFinal) {
          // crear nuevo estado si cambió
          if (!estadoActual || String(estadoActual.nombre_estado).toUpperCase() !== nuevoEstadoNombre.toUpperCase()) {
            const nuevoEstado = await EstadoTransaccion.create({
              id_transaccion: transaccion.id_transaccion,
              nombre_estado: nuevoEstadoNombre,
              fecha_hora_estado: new Date(),
              payload_json: JSON.stringify(tx),
              valor_reportado_centavos: tx.amount_in_cents ?? null,
            }, {transaction: t});

            await transaccion.update({
              ultimo_estado: nuevoEstado.id_estado,
              id_wompi: tx.id,
            }, {transaction: t});
          }
        }

        // === Actualizar Pedido ligado a esta transacción ===
        const pedido = await Pedidos.findOne({
          where: {transaccion_id: transaccion.id_transaccion},
          transaction: t
        });

        if (pedido) {
          const pedidoFinal = ESTADOS_FINALES_PED.includes(String(pedido.estado).toUpperCase());
          if (!pedidoFinal) {

            const antes = pedido.estado;
            const despues = nuevoEstadoPedido;
            // solo actualizamos si cambia
            if (antes !== despues) {
              await pedido.update({
                estado: nuevoEstadoPedido,
                actualizado_en: new Date()
              }, {transaction: t});
            }

            console.log('VA A ENVIAR LOS CORREOS?', despues, pedido.envio_correo);
            // === Disparo de correos SOLO cuando transiciona a PAGADO y no ha enviado el correo antes ===
            if (despues === 'PAGADO' && !pedido.envio_correo) {

              let cliente = null;
              let items = [];
              try {
                if (pedido.cliente_id && Cliente) {
                  cliente = await Cliente.findByPk(pedido.cliente_id, {transaction: t});
                }
                items = pedido.productos;
              } catch (e) {
                console.warn('[consultarEstadoTransaccion] No se pudo cargar cliente/ítems para email:', e?.message || e);
              }

              // Intenta enviar fuera de la transacción para no bloquear el commit por SMTP
              // (Aquí ya hiciste el update, pero aún no commit. Puedes mover el envío después del commit si prefieres.)
              console.log('VA A ENVIAR LOS CORREOS');
              try {
                await sendOrderApprovedEmails({
                  pedido,
                  transaccion,
                  cliente,
                  items,
                  adminEmail: process.env.ADMIN_EMAIL,
                  logoPath: './src/assets/logo_verde.png',
                });

                await pedido.update({
                  envio_correo: true
                }, {transaction: t});

              } catch (e) {
                console.error('[consultarEstadoTransaccion] Error enviando correos:', e?.message || e);
              }
            }
          }
        }

        await t.commit();

        return res.status(200).json({
          message: 'Estado actualizado correctamente.',
          nuevo_estado: nuevoEstadoNombre,
          pedido_estado: pedido ? pedido.estado : null,
          wompi: tx,
          wompi_list: byUpdated,
        });

      } catch
          (error) {
        await t.rollback();
        console.error('Error al consultar y actualizar estado (Wompi):', error?.response?.data || error.message);
        return res.status(500).json({
          message: 'Error al consultar o actualizar estado.',
          detail: error?.response?.data || error.message,
        });
      }
    }
;

/**
 * Webhook Wompi (eventos)
 * @route POST /transacciones/notificacion_pago
 */
const notificacion_pago = async (req, res) => {
  // Verificar firma del evento (tu función ya implementada)
  if (!verifyWompiEvent(req.body)) {
    return res.status(400).json({message: 'Firma inválida de evento Wompi'});
  }

  const eventType = req.body?.event;
  if (eventType !== 'transaction.updated') {
    return res.status(200).json({message: 'Evento ignorado', event: eventType});
  }

  const tx = req.body?.data?.transaction || {};
  const reference = tx?.reference;
  const id_wompi = tx?.id;
  const wompiStatus = tx?.status;
  const amountInCents = tx?.amount_in_cents;

  if (!reference) {
    return res.status(400).json({message: 'Referencia no encontrada en el evento'});
  }

  const t = await sequelize.transaction();
  try {
    const transaccion = await Transaccion.findOne({where: {referencia: reference}, transaction: t});
    if (!transaccion) {
      await t.commit();
      return res.status(200).json({message: 'Referencia no registrada localmente. Ignorada.', reference});
    }

    const estadoActual = transaccion.ultimo_estado
        ? await EstadoTransaccion.findByPk(transaccion.ultimo_estado, {transaction: t})
        : null;

    const nuevoEstadoNombre = mapEstadoTransaccion(wompiStatus);
    const nuevoEstadoPedido = mapEstadoPedido(wompiStatus);

    const txFinal = estadoActual && ESTADOS_FINALES_TX.includes(String(estadoActual.nombre_estado).toUpperCase());

    if (!txFinal) {
      if (!estadoActual || estadoActual.nombre_estado.toUpperCase() !== nuevoEstadoNombre.toUpperCase()) {
        const nuevoEstado = await EstadoTransaccion.create({
          id_transaccion: transaccion.id_transaccion,
          nombre_estado: nuevoEstadoNombre,
          fecha_hora_estado: new Date(),
          payload_json: JSON.stringify(req.body), // guardamos evento completo
          valor_reportado_centavos: amountInCents ?? null
        }, {transaction: t});

        await transaccion.update({ultimo_estado: nuevoEstado.id_estado, id_wompi}, {transaction: t});
      }
    }

    // === Actualizar Pedido ligado ===
    const pedido = await Pedidos.findOne({
      where: {transaccion_id: transaccion.id_transaccion},
      transaction: t
    });

    if (pedido) {
      const pedidoFinal = ESTADOS_FINALES_PED.includes(String(pedido.estado).toUpperCase());
      if (!pedidoFinal) {

        const antes = pedido.estado;
        const despues = nuevoEstadoPedido;
        // solo actualizamos si cambia
        if (antes !== despues) {
          await pedido.update({
            estado: nuevoEstadoPedido,
            actualizado_en: new Date()
          }, {transaction: t});
        }

        if (despues === 'PAGADO' && !pedido.envio_correo) {

          let cliente = null;
          let items = [];
          try {
            if (pedido.cliente_id && Cliente) {
              cliente = await Cliente.findByPk(pedido.cliente_id, {transaction: t});
            }
            items = pedido.productos;
          } catch (e) {
            console.warn('[consultarEstadoTransaccion] No se pudo cargar cliente/ítems para email:', e?.message || e);
          }

          try {
            await sendOrderApprovedEmails({
              pedido,
              transaccion,
              cliente,
              items,
              adminEmail: process.env.ADMIN_EMAIL,
              logoPath: './src/assets/logo_verde.png',
            });

            await pedido.update({
              envio_correo: true
            }, {transaction: t});

          } catch (e) {
            console.error('[consultarEstadoTransaccion] Error enviando correos:', e?.message || e);
          }
        }
      }
    }

    await t.commit();
    return res.status(200).json({
      message: 'OK',
      state: nuevoEstadoNombre,
      pedido_estado: pedido ? pedido.estado : null
    });

  } catch (err) {
    await t.rollback();
    console.error('Error webhook Wompi:', err);
    return res.status(500).json({message: 'Error interno procesando webhook'});
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