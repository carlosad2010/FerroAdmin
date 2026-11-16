import cron from 'node-cron';
import { pool } from '../config/db.js';

const EXPRESION = '0 8,16 * * *';
const ZONA_HORARIA = 'America/Bogota';

export const validarStockBajo = async () => {
  const { rows } = await pool.query(
    `SELECT id, nombre, stock
     FROM productos
     WHERE stock BETWEEN 1 AND 5
     ORDER BY stock ASC, lower(nombre) ASC`
  );
  const fecha = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: ZONA_HORARIA,
  }).format(new Date());

  if (rows.length === 0) {
    console.info(`[Stock bajo] ${fecha}: no hay productos con stock entre 1 y 5 unidades.`);
    return rows;
  }

  console.warn(`[Stock bajo] ${fecha}: ${rows.length} producto(s) requieren reposición.`);
  for (const producto of rows) {
    console.warn(
      `[Stock bajo] ID ${producto.id} | ${producto.nombre} | ${producto.stock} unidad(es)`
    );
  }
  return rows;
};

export const programarValidacionStockBajo = () => {
  const tarea = cron.schedule(
    EXPRESION,
    async () => {
      try {
        await validarStockBajo();
      } catch (error) {
        console.error(`[Stock bajo] Falló la validación programada: ${error.message}`);
      }
    },
    { timezone: ZONA_HORARIA }
  );

  console.info(
    '[Stock bajo] Validación programada diariamente a las 08:00 y 16:00 (America/Bogota).'
  );
  return tarea;
};
