import { crearCaptcha } from '../services/captcha.js';

// GET /api/auth/captcha (pública): entrega un reto nuevo.
// La respuesta correcta nunca sale del servidor (CONTRATO_API.md §4.4).
export const obtenerCaptcha = async (req, res) => {
  try {
    res.status(200).json({ data: await crearCaptcha() });
  } catch (error) {
    console.error('Error al crear el CAPTCHA:', error);
    res.status(500).json({
      error: { codigo: 'ERROR_INTERNO', mensaje: 'No se pudo crear la verificación. Inténtalo de nuevo.' },
    });
  }
};
