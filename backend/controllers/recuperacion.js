import { waitUntil } from '@vercel/functions';
import { verificarCaptcha } from '../services/captcha.js';
import { solicitarRecuperacion, restablecerClave } from '../services/recuperacion.js';
import { enviarCorreoRecuperacion } from '../services/correo.js';

const RESPUESTA_GENERICA = {
  data: { mensaje: 'Si el correo está registrado, te enviamos un enlace para crear una clave nueva.' },
};

// POST /api/auth/recuperar
export const pedirRecuperacion = async (req, res) => {
  try {
    const { email, captchaId, captchaRespuesta } = req.body;

    if (!email) {
      return res.status(400).json({ error: { codigo: 'VALIDACION', mensaje: 'El correo es obligatorio' } });
    }
    if (!(await verificarCaptcha(captchaId, captchaRespuesta))) {
      return res.status(400).json({
        error: { codigo: 'CAPTCHA_INVALIDO', mensaje: 'La verificación es incorrecta o venció. Resuelve el nuevo reto.' },
      });
    }

    const resultado = await solicitarRecuperacion(email);
    if (resultado) {
      // Sin await: la respuesta tarda igual exista o no el correo, y un fallo de envio no rompe nada.
      // waitUntil (Vercel) mantiene viva la función hasta que el correo termine de enviarse:
      // sin él, Vercel la congela al responder y el correo nunca sale. Fuera de Vercel no hace nada.
      waitUntil(
        enviarCorreoRecuperacion({ nombre: resultado.usuario.nombre, email: resultado.usuario.email, token: resultado.token })
          .catch((error) => console.error('No se pudo enviar el correo de recuperación:', error.code, error.message || error))
      );
    }

    return res.status(200).json(RESPUESTA_GENERICA);
  } catch (error) {
    console.error('Error al pedir recuperación:', error);
    return res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Error interno al procesar la solicitud' } });
  }
};

// POST /api/auth/restablecer
export const cambiarClave = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: { codigo: 'VALIDACION', mensaje: 'Faltan campos obligatorios' } });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: { codigo: 'VALIDACION', mensaje: 'La clave debe tener entre 8 y 72 caracteres' } });
    }

    await restablecerClave(token, password);
    return res.status(200).json({ data: { mensaje: 'Tu clave fue cambiada. Ya puedes iniciar sesión.' } });
  } catch (error) {
    if (error.codigo === 'TOKEN_INVALIDO') {
      return res.status(400).json({
        error: { codigo: 'TOKEN_INVALIDO', mensaje: 'El enlace no es válido o ya venció. Pide uno nuevo.' },
      });
    }
    console.error('Error al restablecer la clave:', error);
    return res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Error interno al cambiar la clave' } });
  }
};