// utils/mailer.js
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const fs = require('fs');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  RESEND_API_KEY,
  EMAIL_PROVIDER, // opcional, para forzar proveedor: 'resend' | 'smtp'
} = process.env;

const EMAIL_TIMEOUT_MS = 15000; // 15 segundos

// --------- Helper de timeout ---------- //
function withTimeout(promise, ms, label = 'operación') {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`Timeout: ${label} tardó más de ${ms / 1000} segundos`);
      reject(err);
    }, ms);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}

// --------- Config SMTP (para local / entornos donde funcione) ---------- //
let transporter = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: Number(SMTP_PORT) === 465, // true para 465, false para 587, etc.
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn('[mailer] Faltan variables SMTP_*; SMTP no estará disponible.');
}

// --------- Config Resend ---------- //
let resend = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  console.warn('[mailer] RESEND_API_KEY no definido; Resend no estará disponible.');
}

// Provider por defecto: si hay RESEND_API_KEY usamos Resend, si no SMTP
const EFFECTIVE_PROVIDER = EMAIL_PROVIDER || (RESEND_API_KEY ? 'resend' : 'smtp');

// --------- API pública: sendMail ---------- //
async function sendMail({ to, subject, html, text, cc, bcc, replyTo, attachments = [] }) {
  const from = SMTP_FROM || SMTP_USER;

  if (!to) {
    throw new Error('[mailer] Campo "to" es obligatorio');
  }

  // ---------- RUTA RESEND ---------- //
  if (EFFECTIVE_PROVIDER === 'resend' && resend) {
    // Adaptar adjuntos para Resend
    const resendAttachments = (attachments || []).map((att) => {
      // 1) Si ya viene con content, lo respetamos
      if (att.content) {
        return {
          filename: att.filename,
          content: Buffer.isBuffer(att.content)
              ? att.content.toString('base64')
              : att.content,
          content_id: att.cid || att.content_id, // para inline cid
        };
      }

      // 2) Si path es URL http/https -> usar path directamente
      if (att.path && /^https?:\/\//.test(att.path)) {
        return {
          filename: att.filename || att.path.split('/').pop(),
          path: att.path,
          content_id: att.cid || att.content_id,
        };
      }

      // 3) Si path es local -> leer archivo y mandarlo como content base64
      if (att.path) {
        try {
          const fileBuf = fs.readFileSync(att.path);
          return {
            filename: att.filename || path.basename(att.path),
            content: fileBuf.toString('base64'),
            content_id: att.cid || att.content_id,
          };
        } catch (e) {
          console.error('[mailer][Resend] No se pudo leer el archivo local de attachment:', {
            path: att.path,
            error: e?.message || e,
          });
          // Lo omitimos para no tumbar todo el envío
          return null;
        }
      }

      // 4) Fallback: devolver tal cual si por alguna razón no encaja en nada
      return att;
    }).filter(Boolean); // quitamos nulos

    const mailPromise = (async () => {
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
        cc,
        bcc,
        reply_to: replyTo,
        attachments: resendAttachments.length ? resendAttachments : undefined,
      });

      if (error) {
        const err = new Error(error.message || 'Error enviando correo con Resend');
        err.cause = error;
        throw err;
      }

      return data;
    })();

    return withTimeout(mailPromise, EMAIL_TIMEOUT_MS, `envío de correo (Resend) a ${to}`);
  }

  // ---------- RUTA SMTP (Nodemailer) ---------- //
  if (transporter) {
    const mailPromise = transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      replyTo,
      attachments,
    });

    return withTimeout(mailPromise, EMAIL_TIMEOUT_MS, `envío de correo (SMTP) a ${to}`);
  }

  throw new Error('[mailer] No hay proveedor de correo configurado (Resend ni SMTP)');
}

module.exports = { sendMail };
