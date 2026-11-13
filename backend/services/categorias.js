import { pool } from '../config/db.js';

// Categorías (CONTRATO_API.md §5.4): lista corta, ordenada por nombre y sin paginación.
export const listarCategorias = async () => {
  const resultado = await pool.query(
    'SELECT id, nombre FROM categorias ORDER BY nombre ASC'
  );
  return resultado.rows;
};
