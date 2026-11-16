// Pruebas de las rutas de productos (T15): GET, POST, PUT, PATCH y DELETE de /api/productos.
// Llaman a las rutas reales por HTTP y comparan cada respuesta con CONTRATO_API.md §5.5.
// La documentación con ejemplos está en backend/docs/API_PRODUCTOS.md.
//
// Cómo ejecutarlas, desde backend/:   npm test
//
// Requisitos:
//   - backend/.env con DATABASE_URL.
//   - La base creada con sql/setup.sql (necesita al menos una categoría: sql/seed.sql).
// Crean productos cuyo nombre empieza por "T15 prueba" y los eliminan al terminar.

import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import productosRoutes from '../routes/productos.js';

// El middleware verifica el token con JWT_SECRET. Si el .env no lo trae,
// se usa uno solo para estas pruebas (no se guarda en ningún archivo).
process.env.JWT_SECRET ||= 'secreto-solo-para-pruebas';

const PREFIJO = 'T15 prueba';
const CAMPOS_PRODUCTO = ['id', 'nombre', 'categoria', 'precio', 'stock', 'creadoEn', 'actualizadoEn'];

let servidor;
let base;
let cookie;
let categoriaId;
let contador = 0;

// Nombre único para que las pruebas no choquen entre sí ni con datos reales.
const nombreUnico = (texto = 'producto') => `${PREFIJO} ${texto} ${Date.now()}-${++contador}`;

// Hace una petición a /api/productos. Devuelve el estado y el cuerpo JSON (null si viene vacío).
async function pedir(metodo, ruta = '', { cuerpo, crudo, sesion = true } = {}) {
  const headers = {};
  if (sesion) headers.Cookie = typeof sesion === 'string' ? sesion : cookie;
  if (cuerpo !== undefined || crudo !== undefined) headers['Content-Type'] = 'application/json';

  const respuesta = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers,
    body: crudo ?? (cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined),
  });
  const texto = await respuesta.text();
  return { status: respuesta.status, json: texto ? JSON.parse(texto) : null };
}

// Crea un producto válido y devuelve el objeto Producto de la respuesta.
async function crear(extra = {}) {
  const r = await pedir('POST', '', {
    cuerpo: { nombre: nombreUnico(), categoriaId, precio: 1000, stock: 10, ...extra },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  return r.json.data;
}

// Comprueba que la respuesta sea un error con la forma del contrato §3.2.
function esError(r, status, codigo) {
  assert.equal(r.status, status, JSON.stringify(r.json));
  assert.equal(r.json.error.codigo, codigo);
  assert.equal(typeof r.json.error.mensaje, 'string');
}

const camposConError = (r) => r.json.error.detalles.map((d) => d.campo);

before(async () => {
  // Misma configuración que server.js, pero solo con las rutas de productos
  // y en un puerto libre, para no depender de que el servidor esté encendido.
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/productos', productosRoutes);
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: { codigo: 'VALIDACION', mensaje: 'El cuerpo de la petición no es un JSON válido' },
      });
    }
    return res.status(500).json({
      error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error interno en el servidor' },
    });
  });

  await new Promise((listo) => {
    servidor = app.listen(0, listo);
  });
  base = `http://localhost:${servidor.address().port}/api/productos`;
  cookie = `ferro_token=${jwt.sign({ sub: 1 }, process.env.JWT_SECRET, { expiresIn: '5m' })}`;

  const categorias = await pool.query('SELECT id FROM categorias ORDER BY id LIMIT 1');
  assert.equal(categorias.rows.length, 1, 'No hay categorías: ejecuta sql/seed.sql');
  categoriaId = categorias.rows[0].id;
});

after(async () => {
  await pool.query('DELETE FROM productos WHERE nombre LIKE $1', [`${PREFIJO}%`]);
  await new Promise((listo) => servidor.close(listo));
  await pool.end();
});

// ---------- Sesión ----------

describe('sesión', () => {
  const rutas = [
    ['GET', ''],
    ['GET', '/1'],
    ['POST', ''],
    ['PUT', '/1'],
    ['PATCH', '/1/stock'],
    ['DELETE', '/1'],
  ];

  for (const [metodo, ruta] of rutas) {
    test(`${metodo} /api/productos${ruta} sin cookie responde 401`, async () => {
      const r = await pedir(metodo, ruta, { sesion: false });
      esError(r, 401, 'NO_AUTENTICADO');
    });
  }

  test('un token inválido responde 401', async () => {
    const r = await pedir('GET', '', { sesion: 'ferro_token=esto.no.es.un.token' });
    esError(r, 401, 'NO_AUTENTICADO');
  });

  test('un token firmado con otra clave responde 401', async () => {
    const falso = jwt.sign({ sub: 1 }, 'otra-clave');
    const r = await pedir('GET', '', { sesion: `ferro_token=${falso}` });
    esError(r, 401, 'NO_AUTENTICADO');
  });
});

// ---------- GET /api/productos ----------

describe('GET /api/productos', () => {
  test('responde 200 con data y meta', async () => {
    await crear();
    const r = await pedir('GET');

    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.data));
    assert.deepEqual(Object.keys(r.json.meta), ['total', 'pagina', 'limite', 'totalPaginas']);
    assert.equal(r.json.meta.pagina, 1);
    assert.equal(r.json.meta.limite, 20);
  });

  test('cada producto tiene la forma del contrato', async () => {
    const creado = await crear({ precio: 28500.5 });
    const r = await pedir('GET', `?buscar=${encodeURIComponent(creado.nombre)}`);
    const producto = r.json.data[0];

    assert.deepEqual(Object.keys(producto), CAMPOS_PRODUCTO);
    assert.equal(typeof producto.precio, 'number'); // no "28500.50" como texto
    assert.equal(producto.precio, 28500.5);
    assert.deepEqual(Object.keys(producto.categoria), ['id', 'nombre']);
    assert.match(producto.creadoEn, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('limite y pagina reparten los resultados', async () => {
    const marca = nombreUnico('paginado');
    await crear({ nombre: `${marca} A` });
    await crear({ nombre: `${marca} B` });
    await crear({ nombre: `${marca} C` });
    const filtro = `buscar=${encodeURIComponent(marca)}`;

    const p1 = await pedir('GET', `?${filtro}&limite=2&pagina=1`);
    const p2 = await pedir('GET', `?${filtro}&limite=2&pagina=2`);

    assert.deepEqual(p1.json.data.map((p) => p.nombre), [`${marca} A`, `${marca} B`]);
    assert.deepEqual(p2.json.data.map((p) => p.nombre), [`${marca} C`]);
    assert.deepEqual(p1.json.meta, { total: 3, pagina: 1, limite: 2, totalPaginas: 2 });
  });

  test('orden y direccion ordenan por la columna pedida', async () => {
    const marca = nombreUnico('orden');
    await crear({ nombre: `${marca} A`, precio: 300, stock: 1 });
    await crear({ nombre: `${marca} B`, precio: 100, stock: 3 });
    await crear({ nombre: `${marca} C`, precio: 200, stock: 2 });
    const filtro = `buscar=${encodeURIComponent(marca)}`;

    const porPrecio = await pedir('GET', `?${filtro}&orden=precio`);
    const porStock = await pedir('GET', `?${filtro}&orden=stock&direccion=desc`);
    const porNombre = await pedir('GET', `?${filtro}&orden=nombre&direccion=desc`);

    assert.deepEqual(porPrecio.json.data.map((p) => p.precio), [100, 200, 300]);
    assert.deepEqual(porStock.json.data.map((p) => p.stock), [3, 2, 1]);
    assert.deepEqual(porNombre.json.data.map((p) => p.nombre), [`${marca} C`, `${marca} B`, `${marca} A`]);
  });

  test('categoriaId filtra por categoría', async () => {
    await crear();
    const r = await pedir('GET', `?categoriaId=${categoriaId}&limite=100`);

    assert.equal(r.status, 200);
    assert.ok(r.json.data.length > 0);
    assert.ok(r.json.data.every((p) => p.categoria.id === categoriaId));
  });

  test('sin resultados responde 200 con lista vacía (no 404)', async () => {
    const r = await pedir('GET', `?buscar=${encodeURIComponent(nombreUnico('inexistente'))}`);

    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, []);
    assert.equal(r.json.meta.total, 0);
  });

  const invalidos = [
    ['pagina=0', 'pagina'],
    ['pagina=abc', 'pagina'],
    ['limite=0', 'limite'],
    ['limite=101', 'limite'],
    ['orden=id', 'orden'],
    ['direccion=arriba', 'direccion'],
    ['categoriaId=abc', 'categoriaId'],
    [`buscar=${'a'.repeat(101)}`, 'buscar'],
  ];

  for (const [consulta, campo] of invalidos) {
    test(`?${consulta.slice(0, 24)} responde 400 en el campo ${campo}`, async () => {
      const r = await pedir('GET', `?${consulta}`);
      esError(r, 400, 'VALIDACION');
      assert.deepEqual(camposConError(r), [campo]);
    });
  }

  test('varios parámetros inválidos se informan todos a la vez', async () => {
    const r = await pedir('GET', '?pagina=0&limite=500&orden=nada');
    esError(r, 400, 'VALIDACION');
    assert.deepEqual(camposConError(r), ['pagina', 'limite', 'orden']);
  });
});

// ---------- GET /api/productos/:id ----------

describe('GET /api/productos/:id', () => {
  test('responde 200 con el producto', async () => {
    const creado = await crear();
    const r = await pedir('GET', `/${creado.id}`);

    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, creado);
  });

  test('un id que no existe responde 404', async () => {
    const r = await pedir('GET', '/2147483647');
    esError(r, 404, 'NO_ENCONTRADO');
  });

  for (const id of ['abc', '0', '-1', '1.5', '99999999999']) {
    test(`el id "${id}" responde 400`, async () => {
      const r = await pedir('GET', `/${id}`);
      esError(r, 400, 'VALIDACION');
      assert.deepEqual(camposConError(r), ['id']);
    });
  }
});

// ---------- POST /api/productos ----------

describe('POST /api/productos', () => {
  test('responde 201 con el producto creado', async () => {
    const nombre = nombreUnico('nuevo');
    const r = await pedir('POST', '', { cuerpo: { nombre, categoriaId, precio: 28500, stock: 12 } });

    assert.equal(r.status, 201);
    assert.deepEqual(Object.keys(r.json.data), CAMPOS_PRODUCTO);
    assert.equal(r.json.data.nombre, nombre);
    assert.equal(r.json.data.categoria.id, categoriaId);
    assert.equal(r.json.data.precio, 28500);
    assert.equal(r.json.data.stock, 12);
    assert.equal(r.json.data.creadoEn, r.json.data.actualizadoEn);
  });

  test('quita los espacios sobrantes del nombre', async () => {
    const nombre = nombreUnico('espacios');
    const creado = await crear({ nombre: `   ${nombre}   ` });
    assert.equal(creado.nombre, nombre);
  });

  test('ignora id, creadoEn y actualizadoEn si vienen en el cuerpo', async () => {
    const creado = await crear({ id: 1, creadoEn: '2000-01-01T00:00:00.000Z', actualizadoEn: 'x' });
    assert.notEqual(creado.id, 1);
    assert.notEqual(creado.creadoEn, '2000-01-01T00:00:00.000Z');
  });

  test('acepta precio 0, stock 0 y precio con 2 decimales', async () => {
    const creado = await crear({ precio: 0.07, stock: 0 });
    assert.equal(creado.precio, 0.07);
    assert.equal(creado.stock, 0);

    const gratis = await crear({ precio: 0 });
    assert.equal(gratis.precio, 0);
  });

  test('un cuerpo vacío responde 400 con los 4 campos', async () => {
    const r = await pedir('POST', '', { cuerpo: {} });
    esError(r, 400, 'VALIDACION');
    assert.deepEqual(camposConError(r), ['nombre', 'categoriaId', 'precio', 'stock']);
  });

  const invalidos = [
    ['nombre de 1 carácter', { nombre: 'a' }, 'nombre'],
    ['nombre de 121 caracteres', { nombre: 'a'.repeat(121) }, 'nombre'],
    ['nombre que no es texto', { nombre: 123 }, 'nombre'],
    ['categoriaId como texto', { categoriaId: '2' }, 'categoriaId'],
    ['categoriaId decimal', { categoriaId: 1.5 }, 'categoriaId'],
    ['precio negativo', { precio: -1 }, 'precio'],
    ['precio con 3 decimales', { precio: 1.234 }, 'precio'],
    ['precio como texto', { precio: '100' }, 'precio'],
    ['stock negativo', { stock: -1 }, 'stock'],
    ['stock decimal', { stock: 2.5 }, 'stock'],
  ];

  for (const [caso, cambio, campo] of invalidos) {
    test(`${caso} responde 400 en el campo ${campo}`, async () => {
      const r = await pedir('POST', '', {
        cuerpo: { nombre: nombreUnico(), categoriaId, precio: 1000, stock: 1, ...cambio },
      });
      esError(r, 400, 'VALIDACION');
      assert.deepEqual(camposConError(r), [campo]);
    });
  }

  test('una categoría que no existe responde 400 en categoriaId', async () => {
    const r = await pedir('POST', '', {
      cuerpo: { nombre: nombreUnico(), categoriaId: 2147483647, precio: 1, stock: 1 },
    });
    esError(r, 400, 'VALIDACION');
    assert.deepEqual(camposConError(r), ['categoriaId']);
  });

  test('un nombre repetido responde 409, sin distinguir mayúsculas', async () => {
    const creado = await crear();
    const r = await pedir('POST', '', {
      cuerpo: { nombre: creado.nombre.toUpperCase(), categoriaId, precio: 1, stock: 1 },
    });
    esError(r, 409, 'CONFLICTO');
  });

  test('un JSON mal formado responde 400', async () => {
    const r = await pedir('POST', '', { crudo: '{"nombre": ' });
    esError(r, 400, 'VALIDACION');
  });
});

// ---------- PUT /api/productos/:id ----------

describe('PUT /api/productos/:id', () => {
  test('responde 200, reemplaza los 4 campos y renueva actualizadoEn', async () => {
    const creado = await crear();
    const nombre = nombreUnico('editado');
    const r = await pedir('PUT', `/${creado.id}`, {
      cuerpo: { nombre, categoriaId, precio: 35000.5, stock: 3 },
    });

    assert.equal(r.status, 200);
    assert.equal(r.json.data.id, creado.id);
    assert.equal(r.json.data.nombre, nombre);
    assert.equal(r.json.data.precio, 35000.5);
    assert.equal(r.json.data.stock, 3);
    assert.equal(r.json.data.creadoEn, creado.creadoEn);
    assert.ok(r.json.data.actualizadoEn >= creado.actualizadoEn);
  });

  test('guardar un producto con su mismo nombre no es conflicto', async () => {
    const creado = await crear();
    const r = await pedir('PUT', `/${creado.id}`, {
      cuerpo: { nombre: creado.nombre, categoriaId, precio: 5, stock: 5 },
    });
    assert.equal(r.status, 200);
  });

  test('si faltan campos responde 400 (el reemplazo es completo)', async () => {
    const creado = await crear();
    const r = await pedir('PUT', `/${creado.id}`, { cuerpo: { nombre: nombreUnico() } });
    esError(r, 400, 'VALIDACION');
    assert.deepEqual(camposConError(r), ['categoriaId', 'precio', 'stock']);
  });

  test('un id que no existe responde 404', async () => {
    const r = await pedir('PUT', '/2147483647', {
      cuerpo: { nombre: nombreUnico(), categoriaId, precio: 1, stock: 1 },
    });
    esError(r, 404, 'NO_ENCONTRADO');
  });

  test('usar el nombre de otro producto responde 409', async () => {
    const uno = await crear();
    const otro = await crear();
    const r = await pedir('PUT', `/${otro.id}`, {
      cuerpo: { nombre: uno.nombre, categoriaId, precio: 1, stock: 1 },
    });
    esError(r, 409, 'CONFLICTO');
  });

  test('un id que no es número responde 400', async () => {
    const r = await pedir('PUT', '/abc', {
      cuerpo: { nombre: nombreUnico(), categoriaId, precio: 1, stock: 1 },
    });
    esError(r, 400, 'VALIDACION');
  });
});

// ---------- PATCH /api/productos/:id/stock ----------

describe('PATCH /api/productos/:id/stock', () => {
  test('una cantidad positiva suma y una negativa resta', async () => {
    const creado = await crear({ stock: 10 });

    const entrada = await pedir('PATCH', `/${creado.id}/stock`, { cuerpo: { cantidad: 5 } });
    assert.equal(entrada.status, 200);
    assert.equal(entrada.json.data.stock, 15);
    assert.deepEqual(Object.keys(entrada.json.data), CAMPOS_PRODUCTO);

    const salida = await pedir('PATCH', `/${creado.id}/stock`, { cuerpo: { cantidad: -15 } });
    assert.equal(salida.status, 200);
    assert.equal(salida.json.data.stock, 0);
  });

  test('una salida mayor que el stock responde 409 y no cambia el stock', async () => {
    const creado = await crear({ stock: 2 });
    const r = await pedir('PATCH', `/${creado.id}/stock`, { cuerpo: { cantidad: -3 } });
    esError(r, 409, 'STOCK_INSUFICIENTE');

    const despues = await pedir('GET', `/${creado.id}`);
    assert.equal(despues.json.data.stock, 2);
  });

  for (const cantidad of [0, 1.5, '3', null]) {
    test(`la cantidad ${JSON.stringify(cantidad)} responde 400`, async () => {
      const creado = await crear();
      const r = await pedir('PATCH', `/${creado.id}/stock`, { cuerpo: { cantidad } });
      esError(r, 400, 'VALIDACION');
      assert.deepEqual(camposConError(r), ['cantidad']);
    });
  }

  test('sin cuerpo responde 400', async () => {
    const creado = await crear();
    const r = await pedir('PATCH', `/${creado.id}/stock`);
    esError(r, 400, 'VALIDACION');
  });

  test('un id que no existe responde 404', async () => {
    const r = await pedir('PATCH', '/2147483647/stock', { cuerpo: { cantidad: 1 } });
    esError(r, 404, 'NO_ENCONTRADO');
  });

  test('un stock que no cabe en un entero responde 400', async () => {
    const creado = await crear({ stock: 10 });
    const r = await pedir('PATCH', `/${creado.id}/stock`, { cuerpo: { cantidad: 2147483647 } });
    esError(r, 400, 'VALIDACION');
  });

  test('10 salidas simultáneas con stock 3: pasan 3 y el stock queda en 0', async () => {
    const creado = await crear({ stock: 3 });
    const respuestas = await Promise.all(
      Array.from({ length: 10 }, () =>
        pedir('PATCH', `/${creado.id}/stock`, { cuerpo: { cantidad: -1 } })
      )
    );

    assert.equal(respuestas.filter((r) => r.status === 200).length, 3);
    assert.equal(respuestas.filter((r) => r.status === 409).length, 7);

    const despues = await pedir('GET', `/${creado.id}`);
    assert.equal(despues.json.data.stock, 0);
  });
});

// ---------- DELETE /api/productos/:id ----------

describe('DELETE /api/productos/:id', () => {
  test('responde 204 sin cuerpo y el producto deja de existir', async () => {
    const creado = await crear();
    const r = await pedir('DELETE', `/${creado.id}`);

    assert.equal(r.status, 204);
    assert.equal(r.json, null);

    const despues = await pedir('GET', `/${creado.id}`);
    esError(despues, 404, 'NO_ENCONTRADO');
  });

  test('eliminar dos veces responde 404 la segunda', async () => {
    const creado = await crear();
    await pedir('DELETE', `/${creado.id}`);
    const r = await pedir('DELETE', `/${creado.id}`);
    esError(r, 404, 'NO_ENCONTRADO');
  });

  test('un id que no es número responde 400', async () => {
    const r = await pedir('DELETE', '/abc');
    esError(r, 400, 'VALIDACION');
  });
});

// ---------- Consultas SQL parametrizadas ----------

describe('consultas SQL parametrizadas', () => {
  const ATAQUE = "'); DROP TABLE productos; --";

  test('un nombre con SQL se guarda como texto, tal cual', async () => {
    const nombre = `${nombreUnico()} ${ATAQUE}`;
    const creado = await crear({ nombre });
    assert.equal(creado.nombre, nombre);

    const leido = await pedir('GET', `/${creado.id}`);
    assert.equal(leido.json.data.nombre, nombre);
  });

  test('SQL en el parámetro buscar no encuentra nada ni rompe la consulta', async () => {
    const r = await pedir('GET', `?buscar=${encodeURIComponent("' OR '1'='1")}`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, []);
  });

  test('SQL en el id de la URL se rechaza antes de llegar a la base de datos', async () => {
    for (const id of ['1 OR 1=1', '1;DROP TABLE productos']) {
      const r = await pedir('DELETE', `/${encodeURIComponent(id)}`);
      esError(r, 400, 'VALIDACION');
    }
  });

  test('SQL en orden y direccion se rechaza: solo valen los valores de la lista', async () => {
    const r = await pedir('GET', `?orden=${encodeURIComponent('nombre; DROP TABLE productos')}`);
    esError(r, 400, 'VALIDACION');
  });

  test('después de los intentos, la tabla productos sigue existiendo', async () => {
    const r = await pedir('GET');
    assert.equal(r.status, 200);
  });
});
