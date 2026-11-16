// Pruebas de la documentación Swagger (docs/openapi.js).
// Comprueban que la documentación y las rutas de Express digan lo mismo:
// si alguien agrega un endpoint y no lo documenta (o al revés), fallan.
//
// Cómo ejecutarlas, desde backend/:   npm test
// Necesitan backend/.env con DATABASE_URL (las rutas importan la conexión),
// pero no leen ni escriben datos.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../config/db.js';
import { openapi } from '../docs/openapi.js';
import authRoutes from '../routes/auth.js';
import categoriasRoutes from '../routes/categorias.js';
import productosRoutes from '../routes/productos.js';

after(() => pool.end());

// Los mismos prefijos con los que server.js monta cada grupo de rutas.
const MONTAJE = {
  '/api/auth': authRoutes,
  '/api/categorias': categoriasRoutes,
  '/api/productos': productosRoutes,
};

const METODOS = ['get', 'post', 'put', 'patch', 'delete'];

// "GET /api/productos/{id}" por cada ruta registrada en Express.
function rutasDeExpress() {
  const rutas = ['GET /api/health']; // server.js la declara directamente

  for (const [prefijo, router] of Object.entries(MONTAJE)) {
    for (const capa of router.stack) {
      if (!capa.route) continue; // middlewares como verificarToken
      const camino = (prefijo + capa.route.path).replace(/\/$/, '').replace(/:(\w+)/g, '{$1}');
      for (const metodo of Object.keys(capa.route.methods)) {
        rutas.push(`${metodo.toUpperCase()} ${camino}`);
      }
    }
  }
  return rutas.sort();
}

// "GET /api/productos/{id}" por cada operación documentada.
function rutasDocumentadas() {
  const rutas = [];
  for (const [camino, operaciones] of Object.entries(openapi.paths)) {
    for (const metodo of METODOS) {
      if (operaciones[metodo]) rutas.push(`${metodo.toUpperCase()} ${camino}`);
    }
  }
  return rutas.sort();
}

const operaciones = () =>
  Object.entries(openapi.paths).flatMap(([camino, ops]) =>
    METODOS.filter((m) => ops[m]).map((m) => ({ nombre: `${m.toUpperCase()} ${camino}`, op: ops[m] }))
  );

test('cada ruta de Express está documentada, y no hay documentadas de más', () => {
  assert.deepEqual(rutasDocumentadas(), rutasDeExpress());
});

test('cada operación tiene etiqueta, resumen y al menos una respuesta', () => {
  const etiquetas = openapi.tags.map((t) => t.name);

  for (const { nombre, op } of operaciones()) {
    assert.ok(op.summary, `${nombre}: falta summary`);
    assert.ok(op.tags?.length === 1 && etiquetas.includes(op.tags[0]), `${nombre}: etiqueta desconocida`);
    assert.ok(Object.keys(op.responses).length > 0, `${nombre}: sin respuestas`);
  }
});

test('las rutas con sesión documentan el 401, y solo ellas', () => {
  const publicas = [
    'GET /api/health',
    'GET /api/auth/captcha',
    'POST /api/auth/registro',
    'POST /api/auth/login',
    'POST /api/auth/logout',
  ];

  for (const { nombre, op } of operaciones()) {
    if (publicas.includes(nombre)) {
      assert.equal(op.security, undefined, `${nombre}: es pública, no debe pedir sesión`);
    } else {
      assert.deepEqual(op.security, [{ cookieSesion: [] }], `${nombre}: debe pedir sesión`);
      assert.ok(op.responses[401], `${nombre}: falta documentar el 401`);
    }
  }
});

test('las rutas con {id} documentan el parámetro, el 400 y el 404', () => {
  for (const { nombre, op } of operaciones()) {
    if (!nombre.includes('{id}')) continue;
    assert.ok(op.parameters?.some((p) => p.name === 'id' && p.in === 'path'), `${nombre}: falta el parámetro id`);
    assert.ok(op.responses[400], `${nombre}: falta el 400`);
    assert.ok(op.responses[404], `${nombre}: falta el 404`);
  }
});

test('todas las referencias $ref apuntan a un esquema que existe', () => {
  const esquemas = Object.keys(openapi.components.schemas);
  const referencias = JSON.stringify(openapi).match(/#\/components\/schemas\/\w+/g) ?? [];

  for (const referencia of new Set(referencias)) {
    assert.ok(esquemas.includes(referencia.split('/').pop()), `No existe ${referencia}`);
  }
});

test('los ejemplos de error tienen la forma del contrato y un código conocido', () => {
  const codigos = openapi.components.schemas.Error.properties.error.properties.codigo.enum;

  for (const { nombre, op } of operaciones()) {
    for (const [estado, respuesta] of Object.entries(op.responses)) {
      if (Number(estado) < 400) continue;
      const ejemplos = Object.values(respuesta.content['application/json'].examples);
      assert.ok(ejemplos.length > 0, `${nombre} ${estado}: sin ejemplo`);

      for (const { value } of ejemplos) {
        assert.ok(codigos.includes(value.error.codigo), `${nombre} ${estado}: código ${value.error.codigo}`);
        assert.equal(typeof value.error.mensaje, 'string');
      }
    }
  }
});
