// Descripción de la API en formato OpenAPI 3 (lo que muestra Swagger en /api/docs).
// Es un módulo JavaScript, no un YAML, para poder definir una vez el objeto
// Producto y cada error, y reutilizarlos en todas las rutas.
//
// Si agregas o cambias un endpoint, actualiza este archivo: tests/openapi.test.js
// falla cuando una ruta de Express no está aquí, o al revés.
// El acuerdo del equipo sigue siendo CONTRATO_API.md; esto describe lo implementado.

// ---------- Ayudas para no repetir ----------

const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });

// Respuesta JSON con un solo ejemplo.
const json = (descripcion, esquema, ejemplo) => ({
  description: descripcion,
  content: { 'application/json': { schema: esquema, example: ejemplo } },
});

// Cuerpo de error del contrato §3.2.
const cuerpoError = (codigo, mensaje, detalles) => ({
  error: { codigo, mensaje, ...(detalles ? { detalles } : {}) },
});

// Respuesta de error con uno o varios ejemplos: { 'nombre del caso': cuerpo }.
const error = (descripcion, casos) => ({
  description: descripcion,
  content: {
    'application/json': {
      schema: ref('Error'),
      examples: Object.fromEntries(
        Object.entries(casos).map(([caso, valor]) => [caso, { value: valor }])
      ),
    },
  },
});

const validacion = (detalles) => cuerpoError('VALIDACION', 'Hay campos con errores', detalles);

// ---------- Ejemplos reutilizados ----------

const martillo = {
  id: 1,
  nombre: 'Martillo de uña 16 oz',
  categoria: { id: 1, nombre: 'Herramientas manuales' },
  precio: 28500,
  stock: 12,
  creadoEn: '2026-11-16T00:22:01.429Z',
  actualizadoEn: '2026-11-16T00:22:01.429Z',
};

const serrucho = {
  id: 7,
  nombre: 'Serrucho 20 pulgadas',
  categoria: { id: 1, nombre: 'Herramientas manuales' },
  precio: 32000,
  stock: 8,
  creadoEn: '2026-11-16T00:22:12.901Z',
  actualizadoEn: '2026-11-16T00:22:12.901Z',
};

const usuario = {
  id: 7,
  nombre: 'Ana Gómez',
  email: 'ana@ejemplo.com',
  creadoEn: '2026-11-06T15:30:00.000Z',
};

// ---------- Errores que se repiten ----------

const noAutenticado = error('Sin sesión, o token inválido o vencido', {
  'Sin cookie': cuerpoError('NO_AUTENTICADO', 'No se encontró una sesión activa'),
  'Token inválido o vencido': cuerpoError('NO_AUTENTICADO', 'Token inválido o expirado'),
});

const productoNoEncontrado = error('El producto no existe', {
  'No existe': cuerpoError('NO_ENCONTRADO', 'El producto no existe'),
});

const idInvalido = validacion([{ campo: 'id', mensaje: 'Debe ser un número entero positivo' }]);

const nombreRepetido = error('Ya existe otro producto con ese nombre (sin distinguir mayúsculas)', {
  'Nombre repetido': cuerpoError('CONFLICTO', 'Ya existe un producto con ese nombre'),
});

const captchaInvalido = cuerpoError(
  'CAPTCHA_INVALIDO',
  'La verificación es incorrecta o venció. Resuelve el nuevo reto.'
);

const parametroId = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Id del producto',
  schema: { type: 'integer', minimum: 1, maximum: 2147483647 },
  example: 1,
};

const conSesion = [{ cookieSesion: [] }];

// ---------- Documento ----------

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'FerroAdmin API',
    version: '1.0.0',
    description: [
      'API del sistema de inventario FerroAdmin. El acuerdo del equipo es `CONTRATO_API.md`; esta página describe lo que está implementado.',
      '',
      '**Cómo probar las rutas protegidas desde esta página**',
      '',
      '1. Ejecuta `GET /api/auth/captcha` y copia el `captchaId`. La `pregunta` es una suma.',
      '2. Ejecuta `POST /api/auth/login` con tu correo, tu clave, ese `captchaId` y el resultado de la suma en `captchaRespuesta`.',
      '3. El navegador guarda la cookie `ferro_token` y la envía sola: ya puedes ejecutar las rutas de categorías y productos.',
      '',
      'La cookie es `HttpOnly`, así que no se escribe en el botón **Authorize**: se obtiene iniciando sesión. Cada CAPTCHA sirve una sola vez y vence a los 5 minutos.',
      '',
      'Todos los errores tienen la misma forma: `{ "error": { "codigo", "mensaje", "detalles" } }`. `detalles` solo viene en los errores de validación de productos.',
    ].join('\n'),
  },
  servers: [{ url: '/', description: 'Este servidor' }],
  tags: [
    { name: 'Productos', description: 'CRUD del inventario (CONTRATO_API.md §5.5). Requieren sesión.' },
    { name: 'Categorías', description: 'Lista para el formulario y el filtro (§5.4). Requiere sesión.' },
    { name: 'Autenticación', description: 'CAPTCHA, registro, inicio y cierre de sesión (§5.3).' },
    { name: 'Estado', description: 'Comprobación de que el servidor responde (§5.6).' },
  ],

  paths: {
    // ----- Productos -----
    '/api/productos': {
      get: {
        tags: ['Productos'],
        summary: 'Listar, buscar, filtrar, ordenar y paginar',
        description:
          'Todos los parámetros son opcionales. Si no hay resultados responde 200 con `data: []` (no es un 404). `meta.total` cuenta todos los productos que cumplen los filtros, no solo los de la página.',
        security: conSesion,
        parameters: [
          {
            name: 'buscar',
            in: 'query',
            description: 'Coincidencia parcial en el nombre, sin distinguir mayúsculas',
            schema: { type: 'string', maxLength: 100 },
            example: 'mart',
          },
          {
            name: 'categoriaId',
            in: 'query',
            description: 'Solo productos de esa categoría',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'pagina',
            in: 'query',
            description: 'Página pedida',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limite',
            in: 'query',
            description: 'Productos por página',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'orden',
            in: 'query',
            description: 'Columna de ordenamiento',
            schema: { type: 'string', enum: ['nombre', 'precio', 'stock', 'creadoEn'], default: 'nombre' },
          },
          {
            name: 'direccion',
            in: 'query',
            description: 'Sentido del ordenamiento',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        ],
        responses: {
          200: json('Lista de productos', ref('ListaProductos'), {
            data: [martillo],
            meta: { total: 1, pagina: 1, limite: 20, totalPaginas: 1 },
          }),
          400: error('Algún parámetro es inválido', {
            'pagina y orden inválidos': validacion([
              { campo: 'pagina', mensaje: 'Debe ser un número entero mayor o igual a 1' },
              { campo: 'orden', mensaje: 'Debe ser uno de: nombre, precio, stock, creadoEn' },
            ]),
          }),
          401: noAutenticado,
        },
      },
      post: {
        tags: ['Productos'],
        summary: 'Crear un producto',
        description:
          'Los 4 campos son obligatorios y los tipos son estrictos: `"2"` (texto) no vale como `categoriaId`. `id`, `creadoEn` y `actualizadoEn` se ignoran si vienen en el cuerpo.',
        security: conSesion,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('ProductoEntrada'),
              example: { nombre: 'Serrucho 20 pulgadas', categoriaId: 1, precio: 32000, stock: 8 },
            },
          },
        },
        responses: {
          201: json('Producto creado', ref('RespuestaProducto'), { data: serrucho }),
          400: error('Campos faltantes o inválidos, categoría inexistente o JSON mal formado', {
            'Campos inválidos': validacion([
              { campo: 'nombre', mensaje: 'Debe tener entre 2 y 120 caracteres' },
              { campo: 'precio', mensaje: 'Debe ser un número mayor o igual a 0' },
              { campo: 'stock', mensaje: 'Debe ser un número entero mayor o igual a 0' },
            ]),
            'La categoría no existe': validacion([
              { campo: 'categoriaId', mensaje: 'La categoría no existe' },
            ]),
            'JSON mal formado': cuerpoError('VALIDACION', 'El cuerpo de la petición no es un JSON válido'),
          }),
          401: noAutenticado,
          409: nombreRepetido,
        },
      },
    },

    '/api/productos/{id}': {
      get: {
        tags: ['Productos'],
        summary: 'Detalle de un producto',
        security: conSesion,
        parameters: [parametroId],
        responses: {
          200: json('El producto', ref('RespuestaProducto'), { data: martillo }),
          400: error('El id no es un entero positivo', { 'Id inválido': idInvalido }),
          401: noAutenticado,
          404: productoNoEncontrado,
        },
      },
      put: {
        tags: ['Productos'],
        summary: 'Actualizar un producto (reemplazo completo)',
        description:
          'Reemplaza los 4 campos: si falta alguno responde 400. `creadoEn` no cambia y `actualizadoEn` se renueva. Guardar un producto con su mismo nombre no es conflicto.',
        security: conSesion,
        parameters: [parametroId],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('ProductoEntrada'),
              example: { nombre: 'Serrucho 22 pulgadas', categoriaId: 1, precio: 35000.5, stock: 10 },
            },
          },
        },
        responses: {
          200: json('Producto actualizado', ref('RespuestaProducto'), {
            data: {
              ...serrucho,
              nombre: 'Serrucho 22 pulgadas',
              precio: 35000.5,
              stock: 10,
              actualizadoEn: '2026-11-16T00:22:14.145Z',
            },
          }),
          400: error('Faltan campos, son inválidos o el id no es un entero positivo', {
            'Faltan campos': validacion([
              { campo: 'categoriaId', mensaje: 'La categoría es obligatoria' },
              { campo: 'precio', mensaje: 'El precio es obligatorio' },
              { campo: 'stock', mensaje: 'El stock es obligatorio' },
            ]),
            'Id inválido': idInvalido,
          }),
          401: noAutenticado,
          404: productoNoEncontrado,
          409: nombreRepetido,
        },
      },
      delete: {
        tags: ['Productos'],
        summary: 'Eliminar un producto',
        security: conSesion,
        parameters: [parametroId],
        responses: {
          204: { description: 'Eliminado. La respuesta no lleva cuerpo.' },
          400: error('El id no es un entero positivo', { 'Id inválido': idInvalido }),
          401: noAutenticado,
          404: productoNoEncontrado,
        },
      },
    },

    '/api/productos/{id}/stock': {
      patch: {
        tags: ['Productos'],
        summary: 'Sumar o restar stock',
        description:
          'Registra una entrada (cantidad positiva) o una salida (negativa) sin tocar el resto del producto. Se resuelve con un solo `UPDATE` atómico: si dos personas venden la última unidad a la vez, solo una pasa.',
        security: conSesion,
        parameters: [parametroId],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: ref('AjusteStock'), example: { cantidad: -3 } },
          },
        },
        responses: {
          200: json('Producto con el stock actualizado', ref('RespuestaProducto'), {
            data: { ...serrucho, stock: 5, actualizadoEn: '2026-11-16T00:22:14.249Z' },
          }),
          400: error('Cantidad inválida o id que no es un entero positivo', {
            'Cantidad inválida': validacion([
              { campo: 'cantidad', mensaje: 'Debe ser un número entero distinto de 0' },
            ]),
            'Id inválido': idInvalido,
          }),
          401: noAutenticado,
          404: productoNoEncontrado,
          409: error('La salida dejaría el stock en negativo. El stock no cambia.', {
            'Stock insuficiente': cuerpoError(
              'STOCK_INSUFICIENTE',
              'No hay stock suficiente para registrar esa salida'
            ),
          }),
        },
      },
    },

    // ----- Categorías -----
    '/api/categorias': {
      get: {
        tags: ['Categorías'],
        summary: 'Listar categorías',
        description: 'Ordenadas por nombre y sin paginación. Se cargan con `sql/seed.sql`; no hay CRUD de categorías.',
        security: conSesion,
        responses: {
          200: json(
            'Lista de categorías',
            { type: 'object', properties: { data: { type: 'array', items: ref('Categoria') } } },
            {
              data: [
                { id: 5, nombre: 'Electricidad' },
                { id: 3, nombre: 'Ferretería' },
                { id: 2, nombre: 'Herramientas eléctricas' },
                { id: 1, nombre: 'Herramientas manuales' },
                { id: 4, nombre: 'Pinturas' },
              ],
            }
          ),
          401: noAutenticado,
        },
      },
    },

    // ----- Autenticación -----
    '/api/auth/captcha': {
      get: {
        tags: ['Autenticación'],
        summary: 'Pedir un reto CAPTCHA',
        description:
          'Entrega una suma. La respuesta correcta nunca sale del servidor. Cada reto sirve una sola vez (se borra al verificarlo, acierte o no) y vence a los 5 minutos.',
        responses: {
          200: json('Reto nuevo', { type: 'object', properties: { data: ref('Captcha') } }, {
            data: {
              captchaId: 'b3f1c2e4-9a7d-4c1e-8f2a-1d2e3f4a5b6c',
              pregunta: '7 + 4',
              expiraEnSegundos: 300,
            },
          }),
        },
      },
    },

    '/api/auth/registro': {
      post: {
        tags: ['Autenticación'],
        summary: 'Crear una cuenta',
        description: 'El registro no inicia sesión: después hay que usar `POST /api/auth/login`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('RegistroEntrada'),
              example: {
                nombre: 'Ana Gómez',
                email: 'ana@ejemplo.com',
                password: 'Clave1234',
                captchaId: 'b3f1c2e4-9a7d-4c1e-8f2a-1d2e3f4a5b6c',
                captchaRespuesta: 11,
              },
            },
          },
        },
        responses: {
          201: json('Cuenta creada', { type: 'object', properties: { data: ref('Usuario') } }, { data: usuario }),
          400: error('Faltan campos, o el CAPTCHA es incorrecto, ya se usó o venció', {
            'Faltan campos': cuerpoError('VALIDACION', 'Faltan campos obligatorios'),
            'CAPTCHA incorrecto o vencido': captchaInvalido,
          }),
          409: error('El correo ya está registrado', {
            'Correo repetido': cuerpoError('CONFLICTO', 'El correo electrónico ya se encuentra registrado'),
          }),
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        description:
          'Si las credenciales son correctas, la respuesta trae la cabecera `Set-Cookie` con `ferro_token` (`HttpOnly`, `SameSite=Strict`, 8 horas). El token nunca viene en el cuerpo. Se verifica primero el CAPTCHA y después las credenciales.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('LoginEntrada'),
              example: {
                email: 'ana@ejemplo.com',
                password: 'Clave1234',
                captchaId: 'b3f1c2e4-9a7d-4c1e-8f2a-1d2e3f4a5b6c',
                captchaRespuesta: 11,
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Sesión iniciada',
            headers: {
              'Set-Cookie': {
                description: 'Cookie de sesión',
                schema: { type: 'string', example: 'ferro_token=<jwt>; Max-Age=28800; Path=/; HttpOnly; SameSite=Strict' },
              },
            },
            content: {
              'application/json': {
                schema: { type: 'object', properties: { data: ref('UsuarioSesion') } },
                example: { data: { id: 7, nombre: 'Ana Gómez', email: 'ana@ejemplo.com' } },
              },
            },
          },
          400: error('Faltan campos, o el CAPTCHA es incorrecto, ya se usó o venció', {
            'Faltan campos': cuerpoError('VALIDACION', 'Correo y contraseña son obligatorios'),
            'CAPTCHA incorrecto o vencido': captchaInvalido,
          }),
          401: error('El correo no existe o la clave no coincide (mismo mensaje en ambos casos)', {
            'Credenciales inválidas': cuerpoError('CREDENCIALES_INVALIDAS', 'Correo o clave incorrectos'),
          }),
        },
      },
    },

    '/api/auth/logout': {
      post: {
        tags: ['Autenticación'],
        summary: 'Cerrar sesión',
        description: 'Borra la cookie `ferro_token`. Responde 204 aunque no haya sesión.',
        responses: {
          204: { description: 'Sesión cerrada. La respuesta no lleva cuerpo.' },
        },
      },
    },

    '/api/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Usuario de la sesión actual',
        description: 'El frontend la usa para saber si hay sesión, porque JavaScript no puede leer la cookie.',
        security: conSesion,
        responses: {
          200: json('Usuario con sesión', { type: 'object', properties: { data: ref('Usuario') } }, { data: usuario }),
          401: noAutenticado,
        },
      },
    },

    // ----- Estado -----
    '/api/health': {
      get: {
        tags: ['Estado'],
        summary: 'Estado del servidor',
        description: 'Es la única respuesta que no va dentro de `data`.',
        responses: {
          200: json(
            'El servidor responde',
            { type: 'object', properties: { status: { type: 'string' } } },
            { status: 'ok' }
          ),
        },
      },
    },
  },

  components: {
    securitySchemes: {
      cookieSesion: {
        type: 'apiKey',
        in: 'cookie',
        name: 'ferro_token',
        description: 'JWT en una cookie HttpOnly. Se obtiene con POST /api/auth/login; el navegador la envía sola.',
      },
    },

    schemas: {
      Categoria: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Herramientas manuales' },
        },
      },

      Producto: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Martillo de uña 16 oz' },
          categoria: {
            allOf: [ref('Categoria')],
            nullable: true,
            description: 'Puede ser null si la categoría fue eliminada de la base de datos',
          },
          precio: { type: 'number', description: 'Número, no texto. Hasta 2 decimales', example: 28500 },
          stock: { type: 'integer', minimum: 0, example: 12 },
          creadoEn: { type: 'string', format: 'date-time' },
          actualizadoEn: { type: 'string', format: 'date-time' },
        },
      },

      ProductoEntrada: {
        type: 'object',
        required: ['nombre', 'categoriaId', 'precio', 'stock'],
        properties: {
          nombre: {
            type: 'string',
            minLength: 2,
            maxLength: 120,
            description: 'Se quitan los espacios sobrantes. Único sin distinguir mayúsculas',
          },
          categoriaId: { type: 'integer', minimum: 1, description: 'Debe existir en categorias' },
          precio: { type: 'number', minimum: 0, description: 'Máximo 2 decimales' },
          stock: { type: 'integer', minimum: 0 },
        },
      },

      AjusteStock: {
        type: 'object',
        required: ['cantidad'],
        properties: {
          cantidad: { type: 'integer', description: 'Distinto de 0. Positivo suma, negativo resta' },
        },
      },

      RespuestaProducto: {
        type: 'object',
        properties: { data: ref('Producto') },
      },

      ListaProductos: {
        type: 'object',
        properties: {
          data: { type: 'array', items: ref('Producto') },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'integer', description: 'Productos que cumplen los filtros' },
              pagina: { type: 'integer' },
              limite: { type: 'integer' },
              totalPaginas: { type: 'integer' },
            },
          },
        },
      },

      Captcha: {
        type: 'object',
        properties: {
          captchaId: { type: 'string', format: 'uuid' },
          pregunta: { type: 'string', example: '7 + 4' },
          expiraEnSegundos: { type: 'integer', example: 300 },
        },
      },

      RegistroEntrada: {
        type: 'object',
        required: ['nombre', 'email', 'password', 'captchaId', 'captchaRespuesta'],
        properties: {
          nombre: { type: 'string' },
          email: { type: 'string', format: 'email', description: 'Se guarda en minúsculas' },
          password: { type: 'string', format: 'password' },
          captchaId: { type: 'string', format: 'uuid', description: 'El de GET /api/auth/captcha' },
          captchaRespuesta: { type: 'integer', description: 'Resultado de la suma, como número' },
        },
      },

      LoginEntrada: {
        type: 'object',
        required: ['email', 'password', 'captchaId', 'captchaRespuesta'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          captchaId: { type: 'string', format: 'uuid', description: 'El de GET /api/auth/captcha' },
          captchaRespuesta: { type: 'integer', description: 'Resultado de la suma, como número' },
        },
      },

      Usuario: {
        type: 'object',
        description: 'Nunca incluye la contraseña ni su hash',
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          email: { type: 'string', format: 'email' },
          creadoEn: { type: 'string', format: 'date-time' },
        },
      },

      UsuarioSesion: {
        type: 'object',
        description: 'Lo que devuelve el login: el usuario sin creadoEn',
        properties: {
          id: { type: 'integer' },
          nombre: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },

      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            required: ['codigo', 'mensaje'],
            properties: {
              codigo: {
                type: 'string',
                description: 'Constante con la que el frontend decide qué hacer',
                enum: [
                  'VALIDACION',
                  'CAPTCHA_INVALIDO',
                  'NO_AUTENTICADO',
                  'CREDENCIALES_INVALIDAS',
                  'NO_ENCONTRADO',
                  'CONFLICTO',
                  'STOCK_INSUFICIENTE',
                  'ERROR_INTERNO',
                ],
              },
              mensaje: { type: 'string', description: 'Texto en español que se puede mostrar al usuario' },
              detalles: {
                type: 'array',
                description: 'Solo en errores de validación de productos: una entrada por campo',
                items: {
                  type: 'object',
                  properties: { campo: { type: 'string' }, mensaje: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  },
};
