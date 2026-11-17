import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

// Cambio de contraseña del usuario con sesión (CONTRATO_API.md §11.5, T25).
// Mismo costo de bcrypt que el registro (§4.1).
const COSTO_BCRYPT = 10;

/**
 * Comprueba la contraseña actual y guarda la nueva cifrada.
 * Devuelve el usuario actualizado (sin la contraseña), undefined si el
 * usuario ya no existe, o lanza un error con codigo CLAVE_ACTUAL_INCORRECTA.
 */
export async function cambiarClave(id, claveActual, claveNueva) {
  const { rows } = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [id]);
  if (rows.length === 0) return undefined;

  const coincide = await bcrypt.compare(claveActual, rows[0].password_hash);
  if (!coincide) {
    const error = new Error('La contraseña actual no es correcta');
    error.codigo = 'CLAVE_ACTUAL_INCORRECTA';
    throw error;
  }

  const hash = await bcrypt.hash(claveNueva, COSTO_BCRYPT);
  const resultado = await pool.query(
    `UPDATE usuarios SET password_hash = $1 WHERE id = $2
     RETURNING id, nombre, email, creado_en AS "creadoEn"`,
    [hash, id]
  );
  return resultado.rows[0];
}
