import { waitUntil } from '@vercel/functions';
import { cambiarClave as cambiarClaveService } from '../services/cuenta.js';
import { enviarCorreo } from '../services/correo.js';

// PATCH /api/auth/password (CONTRATO_API.md §11.5).
// El servidor vuelve a validar todo aunque el navegador ya lo haya hecho (§5.2).

function validar(claveActual, claveNueva) {
  const detalles = [];

  if (typeof claveActual !== 'string' || claveActual === '') {
    detalles.push({ campo: 'claveActual', mensaje: 'Escribe tu contraseña actual.' });
  }

  if (typeof claveNueva !== 'string' || claveNueva === '') {
    detalles.push({ campo: 'claveNueva', mensaje: 'Escribe la contraseña nueva.' });
  } else if (claveNueva.length < 8 || claveNueva.length > 72) {
    detalles.push({ campo: 'claveNueva', mensaje: 'La contraseña nueva debe tener entre 8 y 72 caracteres.' });
  } else if (claveNueva === claveActual) {
    detalles.push({ campo: 'claveNueva', mensaje: 'La contraseña nueva debe ser distinta de la actual.' });
  }

  return detalles;
}

// Aviso por correo: si no fue la persona quien cambió la clave, se entera.
// Igual que los otros correos: sin esperar la respuesta, y con waitUntil para que Vercel no lo corte.
function avisarCambio({ nombre, email }) {
  waitUntil(
    enviarCorreo({
      para: email,
      asunto: 'Tu contraseña de FerroAdmin cambió',
      texto: `Hola ${nombre}, la contraseña de tu cuenta en FerroAdmin acaba de cambiar. Si no fuiste tú, usa la opción de recuperar clave en el inicio de sesión.`,
    }).catch((error) =>
      console.error('No se pudo enviar el aviso de cambio de contraseña:', error.code, error.message || error)
    )
  );
}

export const actualizarClave = async (req, res) => {
  const { claveActual, claveNueva } = req.body ?? {};

  const detalles = validar(claveActual, claveNueva);
  if (detalles.length > 0) {
    return res.status(400).json({
      error: { codigo: 'VALIDACION', mensaje: 'Revisa los campos marcados.', detalles },
    });
  }

  try {
    const usuario = await cambiarClaveService(req.usuario.id, claveActual, claveNueva);

    // El token es válido pero el usuario ya no existe.
    if (!usuario) {
      return res.status(401).json({
        error: { codigo: 'NO_AUTENTICADO', mensaje: 'Tu sesión ya no es válida. Inicia sesión de nuevo.' },
      });
    }

    avisarCambio(usuario);

    // La sesión sigue abierta: no se toca la cookie.
    return res.status(200).json({ data: usuario });
  } catch (error) {
    // 400 y no 401, para que el frontend no lo confunda con una sesión vencida (§11.5).
    if (error.codigo === 'CLAVE_ACTUAL_INCORRECTA') {
      return res.status(400).json({
        error: {
          codigo: 'VALIDACION',
          mensaje: 'Revisa los campos marcados.',
          detalles: [{ campo: 'claveActual', mensaje: 'La contraseña actual no es correcta.' }],
        },
      });
    }

    console.error('Error al cambiar la contraseña:', error);
    return res.status(500).json({
      error: { codigo: 'ERROR_INTERNO', mensaje: 'No se pudo cambiar la contraseña. Inténtalo de nuevo.' },
    });
  }
};
