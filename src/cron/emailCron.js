const { Op } = require('sequelize');
const { Pedidos, Transaccion, Cliente } = require('../models'); // 👈 sin PedidoItem
const { sendOrderApprovedEmails } = require('../utils/orderEmails');
const { sequelize } = require('../config/database');

const ESTADOS_VALIDOS = ['PAGADO'];

async function processPendingEmailOrders(limit = 50) {
  console.log('[cron:emails] Buscando pedidos pendientes de envío de correo...');

  const pedidos = await Pedidos.findAll({
    where: {
      envio_correo: false,
      estado: {
        [Op.in]: ESTADOS_VALIDOS,
      },
    },
    include: [
      { model: Cliente, as: 'cliente' },
      { model: Transaccion, as: 'transaccion' },
    ],
    order: [['creado_en', 'ASC']],
    limit,
  });

  if (!pedidos.length) {
    console.log('[cron:emails] No hay pedidos pendientes de correo');
    return;
  }

  console.log(`[cron:emails] Encontrados ${pedidos.length} pedidos pendientes`);

  for (const pedido of pedidos) {
    const cliente = pedido.cliente;
    const transaccion = pedido.transaccion;

    // 👇 Items salen del JSON `productos`
    const items = Array.isArray(pedido.productos) ? pedido.productos : [];

    const adminEmail = process.env.ADMIN_EMAIL;

    console.log(`[cron:emails] Procesando pedido #${pedido.id} (estado: ${pedido.estado})`);

    const t = await sequelize.transaction();
    try {
      await sendOrderApprovedEmails({
        pedido,
        transaccion,
        cliente,
        items,
        adminEmail,
      });

      await pedido.update(
          { envio_correo: true },
          { transaction: t }
      );

      await t.commit();
      console.log(`[cron:emails] ✅ Correos enviados y marcado envio_correo=true para pedido #${pedido.id}`);
    } catch (e) {
      await t.rollback();
      console.error(
          `[cron:emails] ❌ Error enviando correos para pedido #${pedido.id}:`,
          e?.message || e
      );
      // No marcamos envio_correo, se reintentará en el próximo cron
    }
  }
}

module.exports = {
  processPendingEmailOrders,
};
