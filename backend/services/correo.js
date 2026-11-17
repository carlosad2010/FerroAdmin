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

const DIRECCION_LOCAL = 'http://localhost:5173';
const esDireccionLocal = (url) => /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url);

// Dirección pública de la aplicación, para los enlaces de los correos.
// Funciona sin configurar nada, en local y en Vercel:
//   - En tu computador: FRONTEND_URL si existe; si no, http://localhost:5173.
//   - En Vercel (que define VERCEL): FRONTEND_URL solo si NO es de localhost (por ejemplo un
//     dominio propio); si no, el dominio del proyecto, que Vercel crea solo.
// No se arma con la cabecera Host de la petición: un atacante podría falsificarla y hacer
// que el correo de otra persona traiga un enlace a su propio sitio.
// Se devuelve sin "/" al final.
export function direccionDelFrontend() {
  const definida = process.env.FRONTEND_URL?.trim() || '';
  let base;

  if (process.env.VERCEL) {
    const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    base = definida && !esDireccionLocal(definida) ? definida : dominio ? `https://${dominio.trim()}` : definida;
  } else {
    base = definida;
  }

  return (base || DIRECCION_LOCAL).replace(/\/+$/, '');
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