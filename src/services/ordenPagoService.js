// services/ordenPagoService.js
const { OrdenPago, Cliente, OrdenCargue } = require('../models');

/**
 * Lógica de creación de UNA sola orden de pago,
 * recibiendo ya formateados todos los datos (incluyendo orden_cargue_archivo si hay).
 */
async function procesarOrdenPago(data, usuarioId = null) {
  const {
    cliente_id,
    tipo_documento,
    nombre,
    fecha_creacion,
    ultimo_intento_pago,
    forma_cargue,
    orden_cargue_archivo,
    valor_a_pagar,
    valor_parcial,
    fecha_vencimiento
  } = data;

  const forma = forma_cargue.toUpperCase().trim();
  let cliente;

  // Busco o creo cliente
  if (forma === 'ARCHIVO') {
    [cliente] = await Cliente.findOrCreate({
      where: { tipo_identificacion: tipo_documento, identificacion: cliente_id },
      defaults: { tipo_identificacion: tipo_documento, identificacion: cliente_id, nombre_cliente: nombre }
    });
  } else {
    cliente = await Cliente.findOne({ where: { identificacion: cliente_id } });
    if (!cliente) throw new Error('Cliente no encontrado');
  }

  const final_forma = forma_cargue.toLowerCase();

  // Creo la orden de pago
  return await OrdenPago.create({
    cliente_id: cliente.id,
    fecha_creacion: fecha_creacion || new Date(),
    ultimo_intento_pago,
    forma_cargue: final_forma,
    usuario_crea_manual: final_forma === 'manual' ? usuarioId : null,
    orden_cargue_archivo: final_forma === 'archivo' ? orden_cargue_archivo : null,
    valor_a_pagar,
    valor_parcial,
    fecha_vencimiento: fecha_vencimiento,
    estado: "CARGADO"
  });
}

/**
 * Procesa UN ARCHIVO completo:
 * 1) Crea la OrdenCargue
 * 2) Itera las filas y llama a `procesarOrdenPago` para cada una,
 *    asociando todas a la misma ordenCargue.id
 */
async function procesarBulkOrdenes({ rows, archivoCargado, usuarioId }) {
  // 1) Creo la orden de cargue del archivo
  const ordenCargue = await OrdenCargue.create({
    archivo_cargado: archivoCargado,
    cantidad_registros: rows.length,
    usuario_que_cargo: usuarioId
  });

  let created = 0;
  const errors = [];

  // 2) Itero cada fila
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.identificacion || !row.valor_a_pagar) {
        throw new Error('Faltan datos obligatorios');
      }

      const fecha = new Date(row.fecha_vencimiento);
      console.log(fecha); // ✅ "2025-07-31T00:00:00.000Z"

      // Preparo los datos para procesar la orden
      const data = {
        cliente_id: String(row.identificacion),
        tipo_documento: row.tipo_documento,
        nombre: row.nombre,
        fecha_creacion: row.fecha_creacion,
        ultimo_intento_pago: row.ultimo_intento_pago,
        forma_cargue: 'ARCHIVO',
        orden_cargue_archivo: ordenCargue.id,
        valor_a_pagar: Number(row.valor_a_pagar),
        valor_parcial: Number(row.valor_parcial),
        fecha_vencimiento: Date(row.fecha_vencimiento)
      };

      await procesarOrdenPago(data, usuarioId);
      created++;
    } catch (err) {
      errors.push(`Fila ${i + 2}: ${err.message}`);
    }
  }

  return { ordenCargueId: ordenCargue.id, created, errors };
}

module.exports = {
  procesarOrdenPago,
  procesarBulkOrdenes
};
