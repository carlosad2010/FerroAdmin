// Pruebas de la búsqueda de inventario por nombre (T14).
// Comprueban los tres criterios de la tarea: coincidencias parciales,
// entradas parametrizadas y resultados verificables.
//
// Cómo ejecutarlas, desde backend/:   npm test
//
// Requisitos:
//   - backend/.env con DATABASE_URL.
//   - La base creada con sql/setup.sql y cargada con sql/seed.sql.
// Solo leen datos: no crean, modifican ni eliminan nada.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../config/db.js';
import { listarProductos } from '../services/productos.js';

// Valores por defecto de GET /api/productos (CONTRATO_API.md §5.5).
const POR_DEFECTO = { pagina: 1, limite: 20, orden: 'nombre', direccion: 'asc' };

// Devuelve los nombres que encuentra la búsqueda, ya ordenados por nombre.
const buscar = async (texto, extra = {}) => {
  const { data, meta } = await listarProductos({ ...POR_DEFECTO, buscar: texto, ...extra });
  return { nombres: data.map((p) => p.nombre), meta };
};

after(() => pool.end());

// ---------- Coincidencias parciales ----------

test('encuentra por el inicio del nombre', async () => {
  const { nombres } = await buscar('mart');
  assert.deepEqual(nombres, ['Martillo de uña 16 oz']);
});

test('encuentra por un trozo en medio del nombre', async () => {
  const { nombres } = await buscar('ajust');
  assert.deepEqual(nombres, ['Llave ajustable']);
});

test('encuentra por el final del nombre', async () => {
  const { nombres } = await buscar('2mm');
  assert.deepEqual(nombres, ['Cable eléctrico 2mm']);
});

test('no distingue mayúsculas de minúsculas', async () => {
  const { nombres } = await buscar('TALADRO');
  assert.deepEqual(nombres, ['Taladro eléctrico']);
});

test('un mismo texto puede coincidir con varios productos', async () => {
  const { nombres, meta } = await buscar('ta');
  assert.deepEqual(nombres, ['Llave ajustable', 'Taladro eléctrico']);
  assert.equal(meta.total, 2);
});

test('sin coincidencias devuelve lista vacía y total 0 (no es un error)', async () => {
  const { nombres, meta } = await buscar('no existe este producto');
  assert.deepEqual(nombres, []);
  assert.equal(meta.total, 0);
  assert.equal(meta.totalPaginas, 0);
});

test('sin texto de búsqueda devuelve todo el catálogo', async () => {
  const todos = await listarProductos(POR_DEFECTO);
  assert.equal(todos.meta.total, 6);
});

// ---------- Entradas parametrizadas ----------

test('el comodín % se busca como texto literal', async () => {
  // Sin escapar, '%' coincidiría con todos los productos.
  const { nombres } = await buscar('%');
  assert.deepEqual(nombres, []);
});

test('el comodín _ se busca como texto literal', async () => {
  // Sin escapar, '_' coincidiría con cualquier carácter.
  const { nombres } = await buscar('_');
  assert.deepEqual(nombres, []);
});

test('las comillas del nombre se buscan sin romper la consulta', async () => {
  const { nombres } = await buscar('3/4"');
  assert.deepEqual(nombres, ['Tornillos 3/4"']);
});

test('un intento de inyección SQL se trata como texto y no encuentra nada', async () => {
  const { nombres } = await buscar("' OR '1'='1");
  assert.deepEqual(nombres, []);

  const { nombres: otro } = await buscar("'; DROP TABLE productos; --");
  assert.deepEqual(otro, []);

  // La tabla sigue existiendo y con sus datos.
  const todos = await listarProductos(POR_DEFECTO);
  assert.equal(todos.meta.total, 6);
});

test('la barra invertida se busca como texto literal', async () => {
  const { nombres } = await buscar('\\');
  assert.deepEqual(nombres, []);
});

// ---------- La búsqueda se combina con el resto del listado ----------

test('la búsqueda se combina con el filtro por categoría', async () => {
  const categorias = await pool.query(
    "SELECT id FROM categorias WHERE nombre = 'Herramientas eléctricas'"
  );
  const categoriaId = categorias.rows[0].id;

  // "eléctrico" aparece en el taladro y en el cable, pero solo el taladro es de esa categoría.
  const { nombres } = await buscar('eléctrico', { categoriaId });
  assert.deepEqual(nombres, ['Taladro eléctrico']);
});

test('la búsqueda respeta la paginación y cuenta el total filtrado', async () => {
  const pagina1 = await buscar('ta', { limite: 1, pagina: 1 });
  const pagina2 = await buscar('ta', { limite: 1, pagina: 2 });

  assert.deepEqual(pagina1.nombres, ['Llave ajustable']);
  assert.deepEqual(pagina2.nombres, ['Taladro eléctrico']);
  assert.equal(pagina1.meta.total, 2);
  assert.equal(pagina1.meta.totalPaginas, 2);
});

// ---------- Consulta eficiente ----------

test('existe el índice trigram sobre productos.nombre', async () => {
  const indices = await pool.query(
    "SELECT indexdef FROM pg_indexes WHERE tablename = 'productos' AND indexname = 'idx_productos_nombre_trgm'"
  );
  assert.equal(indices.rows.length, 1, 'Falta el índice: vuelve a ejecutar sql/setup.sql');
  assert.match(indices.rows[0].indexdef, /gin_trgm_ops/);
});

test('PostgreSQL puede resolver la búsqueda con el índice trigram', async () => {
  // Con 6 productos el planificador prefiere leer la tabla entera (es más barato).
  // Se desactiva esa opción solo en esta transacción para comprobar que el
  // índice sirve para la misma consulta que usa el servicio.
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('SET LOCAL enable_seqscan = off');
    const plan = await cliente.query(
      "EXPLAIN SELECT id FROM productos p WHERE p.nombre ILIKE $1 ESCAPE '\\'",
      ['%mart%']
    );
    await cliente.query('ROLLBACK');

    const texto = plan.rows.map((fila) => fila['QUERY PLAN']).join('\n');
    assert.match(texto, /idx_productos_nombre_trgm/);
  } finally {
    cliente.release();
  }
});
