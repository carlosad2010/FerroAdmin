import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

// Recuperacion de clave (T21). El codigo viaja por correo; en la base solo vive su hash.
const MINUTOS_VIGENCIA = 30;

const hashear = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Crea un codigo para el correo dado. Devuelve { usuario, token }, o null si el correo
// no existe (el controlador responde igual en ambos casos para no revelar quien tiene cuenta).
export async function solicitarRecuperacion(email) {
  const resultado = await pool.query(
    'SELECT id, nombre, email FROM usuarios WHERE email = $1',
    [email.toLowerCase()]
  );
  const usuario = resultado.rows[0];
  if (!usuario) return null;

  const token = crypto.randomBytes(32).toString('hex');

  // Un codigo nuevo anula los anteriores de ese usuario.
  await pool.query('UPDATE tokens_recuperacion SET usado = true WHERE usuario_id = $1 AND usado = false', [usuario.id]);
  await pool.query(
    `INSERT INTO tokens_recuperacion (usuario_id, token_hash, vence_en)
     VALUES ($1, $2, now() + ($3 || ' minutes')::interval)`,
    [usuario.id, hashear(token), String(MINUTOS_VIGENCIA)]
  );

  return { usuario, token };
}

// Cambia la clave si el codigo es valido, no vencio y no se uso. Lanza TOKEN_INVALIDO si no.
export async function restablecerClave(token, passwordNueva) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const fila = await cliente.query(
      `SELECT id, usuario_id FROM tokens_recuperacion
       WHERE token_hash = $1 AND usado = false AND vence_en > now()
       FOR UPDATE`,
      [hashear(token)]
    );
    if (fila.rows.length === 0) {
      const error = new Error('El enlace no es valido o ya venció');
      error.codigo = 'TOKEN_INVALIDO';
      throw error;
    }

    const { id, usuario_id } = fila.rows[0];
    const passwordHash = await bcrypt.hash(passwordNueva, 10);
    await cliente.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [passwordHash, usuario_id]);
    await cliente.query('UPDATE tokens_recuperacion SET usado = true WHERE id = $1', [id]);

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}