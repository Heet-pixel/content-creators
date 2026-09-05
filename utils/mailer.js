const nodemailer = require('nodemailer');

/**
 * Builds a transporter from env vars. Returns null if SMTP isn't
 * configured yet, so the rest of the app can run in "demo mode"
 * (logs the email to the console instead of sending it) until real
 * SMTP credentials are added.
 */
function buildTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

async function sendMail({ to, subject, html, text }) {
  const transporter = buildTransporter();
  const from = process.env.SMTP_FROM || 'Content Crafters <no-reply@contentcrafters.local>';

  if (!transporter) {
    console.log('--- [DEMO MODE] Email not actually sent — SMTP is not configured yet ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log((text || html || '').toString().replace(/<[^>]+>/g, ' ').slice(0, 400));
    console.log('--- Add real SMTP_HOST / SMTP_USER / SMTP_PASS to .env to enable real delivery ---');
    return { demo: true };
  }

  try {
    return await transporter.sendMail({ from, to, subject, html, text });
  } catch (err) {
    console.error('[Mailer] Send failed:', err.message);
    return { error: err.message };
  }
}

module.exports = { sendMail };
