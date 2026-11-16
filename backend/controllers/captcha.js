import { crearCaptcha } from '../services/captcha.js';

// GET /api/auth/captcha (pública): entrega un reto nuevo.
// La respuesta correcta nunca sale del servidor (CONTRATO_API.md §4.4).
export const obtenerCaptcha = (req, res) => {
  res.status(200).json({ data: crearCaptcha() });
};