// utils/mailer.js
const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_PORT || !SMTP_PASS) {
  // No lanzamos excepción para no romper el server al bootear, pero lo avisamos
  // El envío fallará y se registrará claramente si intentan enviar sin configurar.
  // eslint-disable-next-line no-console
  console.warn('[mailer] Faltan variables SMTP_* para enviar correos.');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 465),
  secure: String(SMTP_PORT || '465') === '465', // true para 465 (SSL), false para 587 (STARTTLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function sendMail({ to, subject, html, text, cc, bcc, replyTo, attachments }) {
  const from = SMTP_FROM || SMTP_USER;
  return transporter.sendMail({
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
}

module.exports = { sendMail };