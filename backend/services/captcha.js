import { randomUUID } from 'node:crypto';
import { pool } from '../config/db.js';

// CAPTCHA (CONTRATO_API.md §4.4). Se guarda en la tabla captchas y no en memoria,
// porque en Vercel cada petición puede atenderla una copia distinta de la función (§11.1).
const EXPIRA_SEGUNDOS = 5 * 60; // 5 minutos
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Crea una suma sencilla. La respuesta se queda en el servidor.
export async function crearCaptcha() {
  // De paso se limpian los retos vencidos para que la tabla no crezca.
  await pool.query('DELETE FROM captchas WHERE vence <= now()');

  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const captchaId = randomUUID();
  await pool.query(
    `INSERT INTO captchas (id, respuesta, vence) VALUES ($1, $2, now() + ($3 || ' seconds')::interval)`,
    [captchaId, a + b, String(EXPIRA_SEGUNDOS)]
  );
  return { captchaId, pregunta: `${a} + ${b}`, expiraEnSegundos: EXPIRA_SEGUNDOS };
}

// Sirve una sola vez: se borra al verificarlo, acierte o no.
// El DELETE ... RETURNING lo hace en un solo paso, así dos peticiones no pueden usar el mismo reto.
export async function verificarCaptcha(captchaId, respuesta) {
  if (typeof captchaId !== 'string' || !FORMATO_UUID.test(captchaId)) return false;

  const { rows } = await pool.query(
    'DELETE FROM captchas WHERE id = $1 RETURNING respuesta, vence > now() AS vigente',
    [captchaId]
  );
  const desafio = rows[0];
  if (!desafio || !desafio.vigente) return false;
  return Number.isInteger(respuesta) && respuesta === desafio.respuesta;
}
