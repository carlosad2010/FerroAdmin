import 'dotenv/config';
import nodemailer from 'nodemailer';

// Servicio de correo (T21). Las credenciales viven en backend/.env (SMTP_*),
// nunca en el código. En desarrollo se usa una cuenta de Ethereal, que captura
// los mensajes sin entregarlos a nadie.
const transporte = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Remitente que verá quien reciba el correo.
const REMITENTE = '"FerroAdmin" <no-responder@ferroadmin.local>';

// Envía un correo. Devuelve la respuesta de nodemailer; en Ethereal sirve
// para sacar el enlace con nodemailer.getTestMessageUrl(info).
export async function enviarCorreo({ para, asunto, texto, html }) {
  return transporte.sendMail({ from: REMITENTE, to: para, subject: asunto, text: texto, html });
}

// Escapa el texto del usuario antes de ponerlo dentro del HTML del correo.
const escaparHtml = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Correo de confirmación que se envía al crear una cuenta (T21).
export async function enviarCorreoBienvenida({ nombre, email }) {
  return enviarCorreo({
    para: email,
    asunto: 'Bienvenido a FerroAdmin',
    texto: `Hola ${nombre}, tu cuenta en FerroAdmin fue creada. Ya puedes iniciar sesión.`,
    html: `<p>Hola <strong>${escaparHtml(nombre)}</strong>,</p>
           <p>Tu cuenta en <strong>FerroAdmin</strong> fue creada correctamente. Ya puedes iniciar sesión.</p>`,
  });
}

// Dirección pública de la aplicación, para los enlaces de los correos. Se busca en este orden:
//   1. FRONTEND_URL (si se define, manda siempre).
//   2. En Vercel, el dominio de producción del proyecto (variable que Vercel crea sola).
//   3. En local, http://localhost:5173.
// Se devuelve sin "/" al final.
export function direccionDelFrontend() {
  const definida = process.env.FRONTEND_URL?.trim();
  const dominioVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const base = definida || (dominioVercel ? `https://${dominioVercel}` : 'http://localhost:5173');
  return base.replace(/\/+$/, '');
}

// Correo con el enlace para crear una clave nueva (T21). El enlace vence en 30 minutos.
export async function enviarCorreoRecuperacion({ nombre, email, token }) {
  const enlace = `${direccionDelFrontend()}/#/restablecer?token=${token}`;
  return enviarCorreo({
    para: email,
    asunto: 'Recupera tu clave de FerroAdmin',
    texto: `Hola ${nombre}, usa este enlace para crear una clave nueva (vence en 30 minutos): ${enlace}\nSi no lo pediste tú, ignora este correo.`,
    html: `<p>Hola <strong>${escaparHtml(nombre)}</strong>,</p>
           <p>Para crear una clave nueva haz clic aquí (el enlace vence en 30 minutos):</p>
           <p><a href="${enlace}">Crear clave nueva</a></p>
           <p>Si no lo pediste tú, ignora este correo.</p>`,
  });
}

export { nodemailer };