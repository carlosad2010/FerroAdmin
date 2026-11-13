import { pool } from '../config/db.js';

// Lógica de negocio y SQL de productos (CONTRATO_API.md §5.5).
// Este archivo no conoce req ni res: recibe datos ya validados y devuelve
// objetos con la forma del contrato (camelCase), o lanza un ErrorApi.

// Error con el formato del §3.2. El controlador lo convierte en la respuesta HTTP.
export class ErrorApi extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

const COLUMNAS = `
  p.id,
  p.nombre,
  p.precio,
  p.stock,
  p.creado_en,
  p.actualizado_en,
  c.id AS categoria_id,
  c.nombre AS categoria_nombre
`;

const JOIN_CATEGORIA = 'LEFT JOIN categorias c ON c.id = p.categoria_id';

// Lista fija de columnas ordenables: un nombre de columna no puede ir como $1.
const COLUMNAS_ORDEN = {
  nombre: 'lower(p.nombre)',
  precio: 'p.precio',
  stock: 'p.stock',
  creadoEn: 'p.creado_en',
};

// Fila de la BD (snake_case) -> objeto Producto del contrato (§5.1).
// pg entrega NUMERIC como texto: precio se convierte a Number.
const aProducto = (fila) => ({
  id: fila.id,
  nombre: fila.nombre,
  categoria:
    fila.categoria_id === null
      ? null
      : { id: fila.categoria_id, nombre: fila.categoria_nombre },
  precio: Number(fila.precio),
  stock: fila.stock,
  creadoEn: fila.creado_en,
  actualizadoEn: fila.actualizado_en,
});

// Escapa los comodines de LIKE para que "50%" busque el texto literal.
const escaparLike = (texto) => texto.replace(/[\\%_]/g, '\\$&');

const noEncontrado = () =>
  new ErrorApi(404, 'NO_ENCONTRADO', 'El producto no existe');

// Traduce los errores de PostgreSQL de crear y actualizar a errores del contrato.
// Cualquier otro error se relanza y termina como 500 en el manejador global.
const traducirErrorEscritura = (error) => {
  if (error.code === '23505') {
    return new ErrorApi(409, 'CONFLICTO', 'Ya existe un producto con ese nombre');
  }
  if (error.code === '23503') {
    return new ErrorApi(400, 'VALIDACION', 'Hay campos con errores', [
      { campo: 'categoriaId', mensaje: 'La categoría no existe' },
    ]);
  }
  return error;
};

export const listarProductos = async ({
  buscar,
  categoriaId,
  pagina,
  limite,
  orden,
  direccion,
}) => {
  const condiciones = [];
  const valores = [];

  if (buscar) {
    valores.push(`%${escaparLike(buscar)}%`);
    condiciones.push(`p.nombre ILIKE $${valores.length} ESCAPE '\\'`);
  }
  if (categoriaId !== undefined) {
    valores.push(categoriaId);
    condiciones.push(`p.categoria_id = $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const sentido = direccion === 'desc' ? 'DESC' : 'ASC';
  const columnaOrden = COLUMNAS_ORDEN[orden] ?? COLUMNAS_ORDEN.nombre;

  const conteo = await pool.query(
    `SELECT COUNT(*)::int AS total FROM productos p ${where}`,
    valores
  );
  const total = conteo.rows[0].total;

  // p.id desempata para que la paginación sea estable.
  const resultado = await pool.query(
    `SELECT ${COLUMNAS}
     FROM productos p
     ${JOIN_CATEGORIA}
     ${where}
     ORDER BY ${columnaOrden} ${sentido}, p.id ASC
     LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, limite, (pagina - 1) * limite]
  );

  return {
    data: resultado.rows.map(aProducto),
    meta: {
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    },
  };
};

export const obtenerProducto = async (id) => {
  const resultado = await pool.query(
    `SELECT ${COLUMNAS}
     FROM productos p
     ${JOIN_CATEGORIA}
     WHERE p.id = $1`,
    [id]
  );

  if (resultado.rows.length === 0) throw noEncontrado();
  return aProducto(resultado.rows[0]);
};

export const crearProducto = async ({ nombre, categoriaId, precio, stock }) => {
  try {
    const resultado = await pool.query(
      `WITH p AS (
         INSERT INTO productos (nombre, categoria_id, precio, stock)
         VALUES ($1, $2, $3, $4)
         RETURNING *
       )
       SELECT ${COLUMNAS}
       FROM p
       ${JOIN_CATEGORIA}`,
      [nombre, categoriaId, precio, stock]
    );
    return aProducto(resultado.rows[0]);
  } catch (error) {
    throw traducirErrorEscritura(error);
  }
};

export const actualizarProducto = async (
  id,
  { nombre, categoriaId, precio, stock }
) => {
  let resultado;
  try {
    resultado = await pool.query(
      `WITH p AS (
         UPDATE productos
         SET nombre = $1,
             categoria_id = $2,
             precio = $3,
             stock = $4,
             actualizado_en = now()
         WHERE id = $5
         RETURNING *
       )
       SELECT ${COLUMNAS}
       FROM p
       ${JOIN_CATEGORIA}`,
      [nombre, categoriaId, precio, stock, id]
    );
  } catch (error) {
    throw traducirErrorEscritura(error);
  }

  if (resultado.rows.length === 0) throw noEncontrado();
  return aProducto(resultado.rows[0]);
};

// Suma o resta stock en una sola consulta atómica (§5.5): si dos usuarios
// venden la última unidad a la vez, solo una de las dos actualizaciones pasa.
export const ajustarStock = async (id, cantidad) => {
  let resultado;
  try {
    resultado = await pool.query(
      `WITH p AS (
         UPDATE productos
         SET stock = stock + $1, actualizado_en = now()
         WHERE id = $2 AND stock + $1 >= 0
         RETURNING *
       )
       SELECT ${COLUMNAS}
       FROM p
       ${JOIN_CATEGORIA}`,
      [cantidad, id]
    );
  } catch (error) {
    // 22003: el resultado no cabe en un INT.
    if (error.code === '22003') {
      throw new ErrorApi(400, 'VALIDACION', 'Hay campos con errores', [
        { campo: 'cantidad', mensaje: 'El stock resultante es demasiado grande' },
      ]);
    }
    throw error;
  }

  if (resultado.rows.length > 0) return aProducto(resultado.rows[0]);

  // No se actualizó ninguna fila: o el producto no existe, o no alcanza el stock.
  const existe = await pool.query('SELECT 1 FROM productos WHERE id = $1', [id]);
  if (existe.rows.length === 0) throw noEncontrado();

  throw new ErrorApi(
    409,
    'STOCK_INSUFICIENTE',
    'No hay stock suficiente para registrar esa salida'
  );
};

export const eliminarProducto = async (id) => {
  const resultado = await pool.query('DELETE FROM productos WHERE id = $1', [id]);
  if (resultado.rowCount === 0) throw noEncontrado();
};
