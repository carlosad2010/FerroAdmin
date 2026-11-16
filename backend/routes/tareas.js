import { Router } from 'express';
import { validarStockBajo } from '../services/stockBajo.js';

// Tareas programadas (CONTRATO_API.md §11.3). En Vercel no corre node-cron:
// Vercel Cron llama a estas rutas con la cabecera "Authorization: Bearer <CRON_SECRET>".
// En local la validación la sigue programando server.js con node-cron.
const router = Router();

// Solo deja pasar a quien envía el secreto. Sin CRON_SECRET configurado, nadie pasa.
const verificarCron = (req, res, next) => {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.get('authorization') !== `Bearer ${secreto}`) {
    return res.status(401).json({
      error: { codigo: 'NO_AUTENTICADO', mensaje: 'Esta ruta solo la puede llamar la tarea programada' },
    });
  }
  next();
};

// GET /api/tareas/stock-bajo
router.get('/stock-bajo', verificarCron, async (req, res) => {
  try {
    const productos = await validarStockBajo();
    res.status(200).json({ data: { stockBajo: productos.length } });
  } catch (error) {
    console.error(`[Stock bajo] Falló la validación programada: ${error.message}`);
    res.status(500).json({
      error: { codigo: 'ERROR_INTERNO', mensaje: 'No se pudo revisar el stock bajo' },
    });
  }
});

export default router;
