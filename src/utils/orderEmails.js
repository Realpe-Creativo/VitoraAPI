// utils/orderEmails.js
const path = require('path');
const {sendMail} = require('./mailer');

const {
  ADMIN_EMAIL,
  WEBSITE_URL = 'https://vitoracolombia.com',
  BRAND_NAME = 'VITORA',
  LOGO_URL = 'https://res.cloudinary.com/dbwojwe12/image/upload/v1763654232/logo_verde_drnsfg.png',
} = process.env;

// --------- Utils ----------
const fmtCOP = (n) =>
    new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', maximumFractionDigits: 0})
        .format(Number(n || 0));

function normalizeItems(items = []) {
  return items.map(it => ({
    name: it?.nombre ?? it?.name ?? it?.sku ?? 'Ítem',
    units: Number(it?.cantidad ?? it?.units ?? it?.qty ?? 1),
    price: Number(it?.precio_unitario ?? it?.precio ?? it?.price ?? 0),
    img: it?.imagen ?? null,
  }));
}

function computeTotals({pedido, normItems}) {
  // Puedes ajustar según tu modelo real
  const shipping = Number(pedido?.costo_envio ?? pedido?.shipping ?? 0);
  const tax = Number(pedido?.impuestos ?? pedido?.tax ?? 0);

  const itemsSum = normItems.reduce((acc, it) => acc + (it.price * it.units), 0);
  // Si en tu BD el total ya viene, úsalo; si no, calcula:
  const total = (pedido?.total != null)
      ? Number(pedido.total)
      : itemsSum + shipping + tax;

  return {shipping, tax, total, itemsSum};
}

function buildOrderEmailHTML({pedido, transaccion, cliente, items}) {
  const orderId = transaccion.referencia;
  const normItems = normalizeItems(items);
  const {shipping, tax, total} = computeTotals({pedido, normItems});

  // filas de items
  const rows = normItems.map(({name, units, price, img}) => `
  <tr style="vertical-align: top">
    <td style="padding: 24px 8px 0 8px; width: 100%;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        ${img
      ? `<img src="${img}" alt="${name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />`
      : `<div style="width: 60px; height: 60px; background-color: #eee; border-radius: 4px;"></div>`}
        <div>
          <div style="font-size: 15px; font-weight: 500;">${name}</div>
          <div style="font-size: 14px; color: #888; padding-top: 4px;">
            Cantidad: ${units}
          </div>
        </div>
      </div>
    </td>
    <td style="padding: 24px 4px 0 0; white-space: nowrap; vertical-align: top;">
      <strong>${fmtCOP(price * units)}</strong>
    </td>
  </tr>
`).join('');

  return `
<div
  style="
    font-family: system-ui, sans-serif, Arial;
    font-size: 14px;
    color: #333;
    padding: 14px 8px;
    background-color: #f5f5f5;
  "
>
  <div style="max-width: 600px; margin: auto; background-color: #fff">
    <div style="border-top: 6px solid #458500; padding: 16px">
      <a
        style="text-decoration: none; outline: none; margin-right: 8px; vertical-align: middle"
        href="${WEBSITE_URL}"
        target="_blank"
      >
        <img
          style="height: 32px; vertical-align: middle"
          height="32px"
          src="${LOGO_URL}"
          alt="logo"
        />
      </a>
      <span
        style="
          font-size: 16px;
          vertical-align: middle;
          border-left: 1px solid #333;
          padding-left: 8px;
        "
      >
        <strong>¡Gracias por tu pedido!</strong>
      </span>
    </div>
    <div style="padding: 0 16px">
      <p>Te estaremos informando cuando tu pedido sea enviado.</p>
      <div
        style="
          text-align: left;
          font-size: 14px;
          padding-bottom: 4px;
          border-bottom: 2px solid #333;
        "
      >
        <strong>La referencia de tu pedido es: #${orderId}</strong>
      </div>

      <table style="width: 100%; border-collapse: collapse">
        ${rows}
      </table>

      <div style="padding: 24px 0">
        <div style="border-top: 2px solid #333"></div>
      </div>

      <table style="border-collapse: collapse; width: 100%; text-align: right">
        <tr>
          <td style="width: 60%"></td>
          <td>Envío</td>
          <td style="padding: 8px; white-space: nowrap">${fmtCOP(shipping)}</td>
        </tr>
        <tr>
          <td style="width: 60%"></td>
          <td style="border-top: 2px solid #333">
            <strong style="white-space: nowrap">Costo total</strong>
          </td>
          <td style="padding: 16px 8px; border-top: 2px solid #333; white-space: nowrap">
            <strong>${fmtCOP(total)}</strong>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding-top: 32px; border-top: 2px solid #333; margin-top: 24px; text-align: center;">
        <h3 style="font-size: 16px; margin-bottom: 8px">Datos de Envío</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; width: 40%"><strong>Nombre:</strong></td>
            <td style="padding: 4px 0;">${cliente?.nombre_cliente ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Identificación:</strong></td>
            <td style="padding: 4px 0;">${cliente.identificacion ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Teléfono:</strong></td>
            <td style="padding: 4px 0;">${cliente?.phone ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Email:</strong></td>
            <td style="padding: 4px 0;">${cliente?.email ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Dirección:</strong></td>
            <td style="padding: 4px 0;">${pedido?.direccion_envio ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Ciudad:</strong></td>
            <td style="padding: 4px 0;">${pedido?.ciudad ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Departamento:</strong></td>
            <td style="padding: 4px 0;">${pedido?.departamento ?? "—"}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0;"><strong>Notas de envío:</strong></td>
            <td style="padding: 4px 0;">${pedido?.notas ?? "—"}</td>
          </tr>
        </table>
      </div>
    </div>
    <div style="margin-top: 20px; width: 100%;">
      <img
        src="https://res.cloudinary.com/dbwojwe12/image/upload/v1763507708/BANNER_CORREO_kykwhg.png"
        alt="Banner"
        style="width: 100%; display: block; border-radius: 4px;"
      />
    </div>
  </div>
 </div>
  
  <div style="max-width: 600px; margin: auto">
    <p style="color: #999">
      Este correo fue enviado a ${cliente?.email ?? '—'}<br />
      Recibes este correo por tu compra en ${BRAND_NAME}.
    </p>
  </div>
</div>`;
}

function buildOrderEmailText({pedido, transaccion, cliente, items}) {
  const orderId =
      transaccion?.referencia ??
      pedido?.numero ??
      pedido?.id ??
      pedido?.id_pedido ??
      '—';

  const normItems = normalizeItems(items);
  const {shipping, tax, total, itemsSum} = computeTotals({pedido, normItems});

  const lines = [
    `¡Gracias por tu pedido en ${BRAND_NAME}!`,
    `Referencia de pedido: #${orderId}`,
    ``,
    `Artículos:`,
    ...normItems.map(it => `- ${it.units} x ${it.name}: ${fmtCOP(it.price * it.units)}`),
    ``,
    `Subtotal: ${fmtCOP(itemsSum)}`,
    `Envío: ${fmtCOP(shipping)}`,
    `Impuestos: ${fmtCOP(tax)}`,
    `Total: ${fmtCOP(total)}`,
    ``,
    `Datos de Envío`,
    `- Nombre: ${cliente?.nombre_cliente ?? '—'}`,
    `- Identificación: ${cliente?.identificacion ?? '—'}`,
    `- Teléfono: ${cliente?.phone ?? '—'}`,
    `- Email: ${cliente?.email ?? '—'}`,
    `- Dirección: ${pedido?.direccion_envio ?? '—'}`,
    `- Ciudad: ${pedido?.ciudad ?? '—'}`,
    `- Departamento: ${pedido?.departamento ?? '—'}`,
    `- Notas de envío: ${pedido?.notas ?? '—'}`,
    ``,
    `Te avisaremos cuando tu pedido sea despachado.`,
    `Visítanos: ${WEBSITE_URL}`,
  ];

  return lines.join('\n');
}

/**
 * Envía correos de confirmación de pedido APROBADO:
 * - al cliente (en "to")
 * - al admin en copia oculta (en "bcc")
 *
 * @param {Object} opts
 * @param {Object} opts.pedido
 * @param {Object} opts.transaccion
 * @param {Object} opts.cliente (debe incluir email)
 * @param {Array}  opts.items
 * @param {String} opts.adminEmail
 */
async function sendOrderApprovedEmails({ pedido, transaccion, cliente, items = [], adminEmail }) {
  const html = buildOrderEmailHTML({ pedido, transaccion, cliente, items });
  const text = buildOrderEmailText({ pedido, transaccion, cliente, items });
  const subject = `Pedido ${pedido?.numero || pedido?.id || ''} confirmado - Pago aprobado`;

  const toCliente = cliente?.email || null;
  const bccAdmin = adminEmail || ADMIN_EMAIL || null;

  let to = toCliente;

  // Si no hay email del cliente, se lo mandamos solo al admin
  if (!toCliente && bccAdmin) {
    to = bccAdmin;
  }

  if (!to) {
    throw new Error('[sendOrderApprovedEmails] No hay destinatarios válidos (cliente ni admin).');
  }

  try {
    await sendMail({
      to,
      subject,
      html,
      text,
      bcc: toCliente && bccAdmin ? bccAdmin : undefined,
    });
  } catch (e) {
    const errInfo = {
      to,
      bcc: toCliente && bccAdmin ? bccAdmin : undefined,
      message: e?.message || String(e),
    };
    console.error('[orderEmails] Error enviando correo de pedido aprobado:', errInfo);
    const error = new Error('Error enviando el correo de confirmación de la orden');
    // @ts-ignore si usas TS
    error.details = errInfo;
    throw error;
  }
}

module.exports = {
  sendOrderApprovedEmails,
  _buildOrderEmailHTML: buildOrderEmailHTML,
  _buildOrderEmailText: buildOrderEmailText,
  _normalizeItems: normalizeItems,
  _computeTotals: computeTotals,
};
