import { randomUUID } from 'node:crypto';

const EXPIRA_MS = 5 * 60 * 1000; // 5 minutos (CONTRATO_API.md §4.4)
const desafios = new Map(); // captchaId -> { respuesta, vence }

function limpiarVencidos() {
  const ahora = Date.now();
  for (const [id, desafio] of desafios) {
    if (desafio.vence <= ahora) desafios.delete(id);
  }
}

// Crea una suma sencilla. La respuesta se queda en el servidor.
export function crearCaptcha() {
  limpiarVencidos();
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const captchaId = randomUUID();
  desafios.set(captchaId, { respuesta: a + b, vence: Date.now() + EXPIRA_MS });
  return { captchaId, pregunta: `${a} + ${b}`, expiraEnSegundos: EXPIRA_MS / 1000 };
}

// Sirve una sola vez: se borra al verificarlo, acierte o no.
export function verificarCaptcha(captchaId, respuesta) {
  const desafio = desafios.get(captchaId);
  desafios.delete(captchaId);
  if (!desafio || desafio.vence <= Date.now()) return false;
  return Number.isInteger(respuesta) && respuesta === desafio.respuesta;
}