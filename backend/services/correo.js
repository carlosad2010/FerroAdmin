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

export { nodemailer };