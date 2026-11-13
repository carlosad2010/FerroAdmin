# 📑 Contrato de API y Arquitectura — FerroAdmin

> **Tarea:** T01 — Definir arquitectura y contrato de API
> **Versión:** 1.0 (borrador para revisión) · **Autor:** Carlos Adrian Zapata · **Fecha:** 2026-11-06
> **Estado:** 🟡 En revisión. Ver [§10 Revisión del equipo](#10-revisión-del-equipo)

Este documento es el acuerdo entre frontend y backend. Si el código no coincide con el contrato, se corrige el código o se actualiza el contrato mediante un PR, pero nunca uno solo de los dos.

---

## 1. Arquitectura general

```text
Navegador (SPA)  ──fetch /api/*──▶  Vite :5173  ──proxy──▶  Express :3000  ──pg──▶  PostgreSQL
                 ◀── JSON + cookie HttpOnly ──
```

- En desarrollo el navegador solo habla con Vite (`localhost:5173`), que reenvía `/api` al backend. Como frontend y API comparten origen, **la cookie de sesión se envía sola** y no hace falta CORS.
- En producción Express sirve el frontend compilado y la API desde el mismo origen (ver §1.3).

### 1.1 Backend (Express, ES Modules)

Recorrido de una petición: `routes → middlewares → controllers → services → config/db`

| Carpeta | Responsabilidad | Archivos previstos |
|---|---|---|
| `routes/` | Declarar rutas y encadenar middlewares. Sin lógica. | `auth.js`, `productos.js`, `categorias.js` |
| `middlewares/` | Autenticación y manejo de errores. | `auth.js` (`verificarToken`), `errores.js` (404 de API + manejador global) |
| `controllers/` | Leer `req`, llamar al servicio y responder con el formato del §3. | `auth.js`, `productos.js`, `categorias.js` |
| `services/` | Lógica de negocio y SQL. No conoce `req` ni `res`. | `auth.js`, `captcha.js`, `productos.js`, `categorias.js` |
| `config/` | Conexión a la BD (`pg.Pool`). | `db.js` |

Reglas:

- Todo SQL usa parámetros (`$1`, `$2`, …). Nunca se concatena texto que venga del usuario.
- Las columnas de la BD van en `snake_case` (`categoria_id`, `creado_en`) y los campos JSON en `camelCase` (`categoriaId`, `creadoEn`). La conversión se hace en `services/`.
- `pg` devuelve las columnas `NUMERIC` como texto: hay que convertir `precio` a `Number` antes de responder.

Dependencias que hay que agregar: `jsonwebtoken`, `bcrypt` (o `bcryptjs` si falla la compilación en Windows), `cookie-parser`, `express-rate-limit`.

Variables de entorno (`backend/.env.example`):

```dotenv
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ferroadmin
JWT_SECRET=cambia-esto-por-un-valor-largo-y-aleatorio
JWT_EXPIRA=8h
NODE_ENV=development
```

### 1.2 Frontend (SPA, Vanilla JS)

Una sola página (`index.html`) con un enrutador propio basado en History API (`history.pushState` + evento `popstate`) en `main.js`.

| Ruta | Vista | Acceso |
|---|---|---|
| `/` | Redirige a `/inventario` (con sesión) o a `/login` (sin sesión) | — |
| `/login` | Formulario de login + CAPTCHA | Pública (con sesión activa redirige a `/inventario`) |
| `/registro` | Formulario de registro + CAPTCHA | Pública |
| `/inventario` | Tabla, búsqueda y CRUD de productos | Requiere sesión |
| Cualquier otra | **Página 404** con enlace para volver al inicio | — |

| Archivo | Responsabilidad |
|---|---|
| `js/main.js` | Enrutador, comprobación inicial de sesión (`GET /api/auth/me`) y vista 404 |
| `js/app.js` *(nuevo)* | Función única para llamar a la API: envía y recibe JSON, interpreta los errores del §3.2 y redirige a `/login` ante un 401 en rutas protegidas |
| `js/auth.js` | Vistas de login, registro y cierre de sesión |
| `js/captcha.js` | Pedir y mostrar el desafío (`GET /api/auth/captcha`) |
| `js/inventario.js` | Tabla, búsqueda en tiempo real y formularios de crear, editar y eliminar |

- El JavaScript **no puede leer la cookie** (es `HttpOnly`). Para saber si hay sesión se llama a `GET /api/auth/me`.
- Búsqueda en tiempo real: esperar unos 300 ms después de la última tecla (debounce) antes de llamar a la API.
- La página 404 la muestra el frontend. El 404 de la API es JSON (§3.2). En desarrollo, Vite ya devuelve `index.html` para cualquier ruta desconocida, así que el enrutador decide.

### 1.3 Producción

`vite build` genera el frontend. Express lo sirve con `express.static` y, **después** de las rutas `/api`, devuelve `index.html` para cualquier otra ruta `GET`, para que el enrutador del frontend decida qué mostrar (incluida la 404).

### 1.4 Paleta de colores

Todos los colores del frontend salen de estas variables CSS, declaradas una sola vez en el bloque `:root` de `frontend/src/css/tokens.css`. Las hojas de estilo no usan códigos hexadecimales sueltos.

| Variable | Color | Hex | Uso |
|---|---|---|---|
| `--color-primario` | Azul oscuro | `#172B4D` | Barra superior, botones principales, títulos y texto principal |
| `--color-acento` | Ámbar | `#F59E0B` | Elemento activo o seleccionado, resaltados y acción destacada (por ejemplo, "Nuevo producto") |
| `--color-fondo` | Fondo | `#F8FAFC` | Fondo general de la página |
| `--color-tarjeta` | Tarjetas | `#FFFFFF` | Tarjetas, tabla de productos, formularios y ventanas modales |
| `--color-exito` | Éxito | `#16A34A` | Confirmaciones: producto creado o actualizado, registro exitoso |
| `--color-error` | Error | `#DC2626` | Mensajes de error (incluidos los `#error-<campo>` del §3.2) y botón Eliminar |

```css
:root {
  --color-primario: #172B4D;
  --color-acento: #F59E0B;
  --color-fondo: #F8FAFC;
  --color-tarjeta: #FFFFFF;
  --color-exito: #16A34A;
  --color-error: #DC2626;
}
```

Contraste (WCAG AA pide 4.5:1 para texto normal y 3:1 para texto grande, es decir 24 px, o 19 px en negrita):

| Combinación | Contraste | Uso |
|---|---|---|
| Azul oscuro sobre tarjeta, o blanco sobre azul oscuro | 14.1:1 | Cualquier texto |
| Azul oscuro sobre fondo | 13.5:1 | Cualquier texto |
| Azul oscuro sobre ámbar | 6.6:1 | Texto de botones y etiquetas ámbar |
| Blanco sobre ámbar | 2.2:1 | ❌ No usar: el texto sobre ámbar va en azul oscuro |
| Blanco sobre error, o error sobre tarjeta | 4.8:1 | Cualquier texto |
| Blanco sobre éxito, o éxito sobre tarjeta | 3.3:1 | Solo texto grande o en negrita, o acompañado de un ícono. Para texto normal usar `--color-exito-texto` |

La paleta no incluye ningún gris. El texto secundario, los bordes, los estados hover y las versiones oscuras para texto (`--color-texto-suave`, `--color-borde`, `--color-exito-texto`, `--color-error-texto`, etc.) se **derivan** de estos 6 colores con `color-mix()` en `frontend/src/css/tokens.css`. Todos los detalles, componentes y reglas están en `GUIA_VISUAL.md`.

---

## 2. Convenciones generales

- Prefijo de todas las rutas: `/api`. Cuerpos en JSON (`Content-Type: application/json`), UTF-8.
- Campos en `camelCase` y en español, salvo `email` y `password`, que ya usa el formulario de login.
- IDs: enteros positivos autoincrementales.
- Fechas: ISO 8601 en UTC, por ejemplo `"2026-11-06T15:30:00.000Z"`.
- Dinero: `precio` es un número con hasta 2 decimales (`28500` o `28500.5`).
- Textos: el backend aplica `trim()` antes de validar.

---

## 3. Formato de respuestas

### 3.1 Éxito

Un recurso:

```json
{ "data": { "id": 15, "nombre": "Martillo de uña 16 oz" } }
```

Una lista:

```json
{
  "data": [],
  "meta": { "total": 42, "pagina": 1, "limite": 20, "totalPaginas": 3 }
}
```

`204 No Content` no lleva cuerpo.

### 3.2 Error (siempre con esta forma)

```json
{
  "error": {
    "codigo": "VALIDACION",
    "mensaje": "Hay campos con errores",
    "detalles": [
      { "campo": "precio", "mensaje": "Debe ser un número mayor o igual a 0" }
    ]
  }
}
```

- `codigo`: constante con la que el frontend decide qué hacer.
- `mensaje`: texto en español que se puede mostrar al usuario.
- `detalles`: solo en errores de validación. `campo` coincide con el `name` del input, así que el frontend puede mostrarlo en `#error-<campo>` (como ya hace el login con `#error-email` y `#error-password`).
- Nunca se envían trazas (stack) ni mensajes internos de PostgreSQL.

### 3.3 Códigos HTTP y de error

| HTTP | `codigo` | Cuándo |
|---|---|---|
| 200 OK | — | Lectura o actualización correcta |
| 201 Created | — | Recurso creado |
| 204 No Content | — | Eliminación o logout |
| 400 Bad Request | `VALIDACION` | Campos faltantes o inválidos, JSON mal formado, id no numérico, parámetros de búsqueda inválidos |
| 400 Bad Request | `CAPTCHA_INVALIDO` | Respuesta incorrecta, CAPTCHA expirado o ya usado |
| 401 Unauthorized | `NO_AUTENTICADO` | Sin cookie, o token inválido o expirado |
| 401 Unauthorized | `CREDENCIALES_INVALIDAS` | Correo o clave incorrectos (mismo mensaje en ambos casos) |
| 404 Not Found | `NO_ENCONTRADO` | El recurso o la ruta de API no existen |
| 409 Conflict | `CONFLICTO` | Correo ya registrado o nombre de producto repetido |
| 409 Conflict | `STOCK_INSUFICIENTE` | Un ajuste dejaría el stock en negativo |
| 429 Too Many Requests | `DEMASIADOS_INTENTOS` | Límite de intentos de login superado (con cabecera `Retry-After`) |
| 500 Internal Server Error | `ERROR_INTERNO` | Error no controlado |

---

## 4. Autenticación

### 4.1 Mecanismo

- JWT firmado con `JWT_SECRET` (HS256), con duración `JWT_EXPIRA` (8 h, una jornada). Payload: `{ "sub": 7 }` (id del usuario) más `iat` y `exp`.
- El token se entrega en una cookie, nunca en el cuerpo de la respuesta:

  ```http
  Set-Cookie: ferro_token=<jwt>; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800
  ```

  En producción se agrega `Secure`.
- `HttpOnly` impide que un script malicioso robe el token (XSS). `SameSite=Strict` impide que otro sitio haga peticiones con la cookie del usuario (CSRF).
- Contraseñas: `bcrypt` con costo 10. Solo se guarda el hash.
- No hay refresh token. Cuando el token expira, la API responde 401 y el frontend lleva a `/login`.

### 4.2 Flujo

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as API (Express)
    participant BD as PostgreSQL
    F->>A: GET /api/auth/captcha
    A-->>F: 200 { captchaId, pregunta }
    F->>A: POST /api/auth/login { email, password, captchaId, captchaRespuesta }
    A->>A: Verifica el CAPTCHA y lo invalida
    A->>BD: Busca el usuario por email
    A->>A: bcrypt.compare(password, hash)
    A-->>F: 200 { usuario } + Set-Cookie: ferro_token
    F->>A: GET /api/productos (la cookie viaja sola)
    A->>A: verificarToken
    A->>BD: SELECT ...
    A-->>F: 200 { data, meta }
    F->>A: POST /api/auth/logout
    A-->>F: 204 + cookie borrada
```

Orden de verificación en el login: (1) validar campos, (2) CAPTCHA, (3) credenciales. Así, un bot que no resuelve el CAPTCHA no llega a probar contraseñas.

### 4.3 Middleware de protección

- `verificarToken`: lee `req.cookies.ferro_token`, verifica el JWT y deja `req.usuario = { id }`. Si falla responde 401 `NO_AUTENTICADO`.
- No hay roles: cualquier usuario con sesión puede hacer todas las operaciones del inventario.

### 4.4 CAPTCHA (desafío matemático, tarea T07)

- El servidor genera la operación (por ejemplo `7 + 4`) y guarda la respuesta en memoria asociada a un `captchaId`, con expiración de 5 minutos.
- Cada CAPTCHA **sirve una sola vez**: se borra al verificarlo, sea correcto o no. Después de cualquier intento fallido, el frontend pide uno nuevo.
- La respuesta nunca viaja al frontend. Validar el CAPTCHA en el navegador no protege de nada.

---

## 5. Endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/health` | Pública | Estado del servidor |
| GET | `/api/auth/captcha` | Pública | Nuevo desafío anti-bot |
| POST | `/api/auth/registro` | Pública | Crear cuenta |
| POST | `/api/auth/login` | Pública | Iniciar sesión |
| POST | `/api/auth/logout` | Pública* | Cerrar sesión |
| GET | `/api/auth/me` | Sesión | Usuario de la sesión actual |
| GET | `/api/categorias` | Sesión | Listar categorías |
| GET | `/api/productos` | Sesión | Listar, buscar y filtrar |
| GET | `/api/productos/:id` | Sesión | Detalle de un producto |
| POST | `/api/productos` | Sesión | Crear producto |
| PUT | `/api/productos/:id` | Sesión | Actualizar producto (completo) |
| PATCH | `/api/productos/:id/stock` | Sesión | Sumar o restar stock |
| DELETE | `/api/productos/:id` | Sesión | Eliminar producto |

\* El logout responde 204 aunque no haya sesión, para que siempre pueda limpiar la cookie.

### 5.1 Objetos de salida

**Usuario** (nunca incluye la contraseña ni su hash)

```json
{
  "id": 7,
  "nombre": "Ana Gómez",
  "email": "ana@ejemplo.com",
  "creadoEn": "2026-11-06T15:30:00.000Z"
}
```

**Categoría**

```json
{ "id": 2, "nombre": "Herramientas manuales" }
```

**Producto**

```json
{
  "id": 15,
  "nombre": "Martillo de uña 16 oz",
  "categoria": { "id": 2, "nombre": "Herramientas manuales" },
  "precio": 28500,
  "stock": 12,
  "creadoEn": "2026-11-06T15:30:00.000Z",
  "actualizadoEn": "2026-11-06T15:30:00.000Z"
}
```

### 5.2 Reglas de validación de entrada

| Campo | Tipo | Reglas |
|---|---|---|
| `nombre` (usuario) | string | Obligatorio, 2 a 100 caracteres |
| `email` | string | Obligatorio, formato de correo, máximo 150 caracteres, se guarda en minúsculas, único |
| `password` | string | Registro: 8 a 72 caracteres (72 es el límite de bcrypt). Login: solo que no esté vacío |
| `captchaId` | string | Obligatorio |
| `captchaRespuesta` | integer | Obligatorio (el frontend lo convierte con `Number()` antes de enviarlo) |
| `nombre` (producto) | string | Obligatorio, 2 a 120 caracteres, único sin distinguir mayúsculas |
| `categoriaId` | integer | Obligatorio, debe existir en `categorias` |
| `precio` | number | Obligatorio, mayor o igual a 0, máximo 2 decimales |
| `stock` | integer | Obligatorio, mayor o igual a 0 |
| `cantidad` (ajuste de stock) | integer | Obligatorio, distinto de 0 (positivo suma, negativo resta) |

Los campos que genera el servidor (`id`, `creadoEn`, `actualizadoEn`) se ignoran si vienen en el cuerpo.

### 5.3 Autenticación

#### `GET /api/auth/captcha`

`200 OK`

```json
{
  "data": {
    "captchaId": "b3f1c2e4-9a7d-4c1e-8f2a-1d2e3f4a5b6c",
    "pregunta": "¿Cuánto es 7 + 4?",
    "expiraEnSegundos": 300
  }
}
```

#### `POST /api/auth/registro`

Entrada:

```json
{
  "nombre": "Ana Gómez",
  "email": "ana@ejemplo.com",
  "password": "Clave1234",
  "captchaId": "b3f1c2e4-9a7d-4c1e-8f2a-1d2e3f4a5b6c",
  "captchaRespuesta": 11
}
```

`201 Created`: `{ "data": <Usuario> }`. El registro **no** inicia sesión; el frontend redirige a `/login` con un mensaje de éxito.

Errores: `400 VALIDACION`, `400 CAPTCHA_INVALIDO`, `409 CONFLICTO` (correo ya registrado).

#### `POST /api/auth/login`

Entrada:

```json
{
  "email": "ana@ejemplo.com",
  "password": "Clave1234",
  "captchaId": "b3f1c2e4-9a7d-4c1e-8f2a-1d2e3f4a5b6c",
  "captchaRespuesta": 11
}
```

`200 OK`: `{ "data": <Usuario> }` + cabecera `Set-Cookie` (§4.1).

Errores: `400 VALIDACION`, `400 CAPTCHA_INVALIDO`, `401 CREDENCIALES_INVALIDAS` (mensaje: "Correo o clave incorrectos"), `429 DEMASIADOS_INTENTOS` (5 intentos fallidos por IP en 15 minutos).

#### `POST /api/auth/logout`

Sin cuerpo. `204 No Content` + `Set-Cookie: ferro_token=; Path=/; Max-Age=0`.

#### `GET /api/auth/me`

`200 OK`: `{ "data": <Usuario> }`

Errores: `401 NO_AUTENTICADO` (también si el usuario del token ya no existe).

### 5.4 Categorías

#### `GET /api/categorias`

`200 OK`, ordenadas por nombre y sin paginación (es una lista corta que llena el `<select>` del formulario y el filtro):

```json
{
  "data": [
    { "id": 1, "nombre": "Eléctricos" },
    { "id": 2, "nombre": "Herramientas manuales" },
    { "id": 3, "nombre": "Plomería" }
  ]
}
```

Las categorías se cargan con el script de semilla. En esta versión no hay CRUD de categorías.

### 5.5 Productos

#### `GET /api/productos`

Parámetros de consulta (todos opcionales):

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `buscar` | string | — | Coincidencia parcial en `nombre`, sin distinguir mayúsculas. Máximo 100 caracteres |
| `categoriaId` | integer | — | Filtrar por categoría |
| `pagina` | integer ≥ 1 | `1` | Página solicitada |
| `limite` | integer 1–100 | `20` | Productos por página |
| `orden` | `nombre` \| `precio` \| `stock` \| `creadoEn` | `nombre` | Campo de ordenamiento |
| `direccion` | `asc` \| `desc` | `asc` | Sentido del ordenamiento |

Ejemplo: `GET /api/productos?buscar=mart&categoriaId=2&pagina=1&limite=20`

`200 OK`

```json
{
  "data": [
    {
      "id": 15,
      "nombre": "Martillo de uña 16 oz",
      "categoria": { "id": 2, "nombre": "Herramientas manuales" },
      "precio": 28500,
      "stock": 12,
      "creadoEn": "2026-11-06T15:30:00.000Z",
      "actualizadoEn": "2026-11-06T15:30:00.000Z"
    }
  ],
  "meta": { "total": 1, "pagina": 1, "limite": 20, "totalPaginas": 1 }
}
```

Si no hay resultados se responde `200` con `"data": []` y `"total": 0` (no es un 404).

Errores: `400 VALIDACION` (parámetro inválido), `401 NO_AUTENTICADO`.

Notas para el backend:

- `orden` se valida contra una lista fija de columnas, porque los nombres de columna no se pueden pasar como parámetro `$1`.
- Escapar `%` y `_` en el texto de `buscar` antes de usarlo en `ILIKE`.
- Para que la búsqueda sea eficiente se recomienda un índice trigram: `CREATE EXTENSION pg_trgm;` y `CREATE INDEX idx_productos_nombre_trgm ON productos USING gin (nombre gin_trgm_ops);`.

#### `GET /api/productos/:id`

`200 OK`: `{ "data": <Producto> }`

Errores: `400 VALIDACION` (id no válido), `401`, `404 NO_ENCONTRADO`.

#### `POST /api/productos`

Entrada:

```json
{ "nombre": "Martillo de uña 16 oz", "categoriaId": 2, "precio": 28500, "stock": 12 }
```

`201 Created`: `{ "data": <Producto> }`

Errores: `400 VALIDACION`, `401`, `409 CONFLICTO` (ya existe un producto con ese nombre).

#### `PUT /api/productos/:id`

Entrada: los mismos 4 campos de `POST`, todos obligatorios (reemplazo completo).

`200 OK`: `{ "data": <Producto> }` con `actualizadoEn` renovado.

Errores: `400 VALIDACION`, `401`, `404 NO_ENCONTRADO`, `409 CONFLICTO`.

#### `PATCH /api/productos/:id/stock`

Registra entradas y salidas de mercancía sin editar el resto del producto.

Entrada:

```json
{ "cantidad": -3 }
```

`200 OK`: `{ "data": <Producto> }` con el stock actualizado.

Errores: `400 VALIDACION`, `401`, `404 NO_ENCONTRADO`, `409 STOCK_INSUFICIENTE`.

Se resuelve en una sola consulta atómica, para que dos usuarios que venden la última unidad al mismo tiempo no dejen el stock en negativo:

```sql
UPDATE productos
SET stock = stock + $1, actualizado_en = now()
WHERE id = $2 AND stock + $1 >= 0
RETURNING *;
```

Si no se actualiza ninguna fila, se comprueba si el producto existe para responder `404` o `409`.

#### `DELETE /api/productos/:id`

`204 No Content`

Errores: `400 VALIDACION`, `401`, `404 NO_ENCONTRADO`.

### 5.6 Health

`GET /api/health` responde `200 { "status": "ok" }`. Se usa para comprobar que el servidor responde (por ejemplo con `curl`); es la única respuesta que no va dentro de `data`.

---

## 6. Modelo de datos de referencia

| Tabla | Columnas |
|---|---|
| `usuarios` | `id SERIAL PK`, `nombre VARCHAR(100)`, `email VARCHAR(150) UNIQUE`, `password_hash TEXT`, `creado_en TIMESTAMPTZ DEFAULT now()` |
| `categorias` | `id SERIAL PK`, `nombre VARCHAR(60) UNIQUE` |
| `productos` | `id SERIAL PK`, `nombre VARCHAR(120)`, `categoria_id INT REFERENCES categorias`, `precio NUMERIC(12,2) CHECK (precio >= 0)`, `stock INT CHECK (stock >= 0)`, `creado_en TIMESTAMPTZ DEFAULT now()`, `actualizado_en TIMESTAMPTZ DEFAULT now()`. Índice único sobre `lower(nombre)` |

---

## 7. Ajustes necesarios en el código actual

| # | Archivo | Situación | Ajuste |
|---|---|---|---|
| 1 | `backend/config/db.js` | Usa `require('sequelize')`. Fallará en cuanto se importe: el proyecto es ES Modules (`"type": "module"`), Sequelize no está instalado y la especificación pide `pg` nativo | Reemplazar por `import pg from "pg"` y exportar un `Pool` que use `DATABASE_URL` |
| 2 | `backend/server.js` | El 404 responde `{ "error": "API route not found" }` | Usar el formato del §3.2 (`NO_ENCONTRADO`) y agregar el manejador global de errores |
| 3 | `backend/server.js` | `cors()` acepta cualquier origen | Con el proxy de Vite no hace falta: quitarlo, o limitarlo a un origen conocido con `credentials: true` |
| 4 | `frontend/src/index.html` | El enlace de registro apunta a `/registro.html` | Cambiarlo a `/registro` (ruta de la SPA) |
| 5 | `frontend/vite.config.js` | Con `root: src`, el build sale en `frontend/src/dist/`, que hoy está versionado (el `.gitignore` solo excluye `frontend/dist/`) | Agregar `build: { outDir: "../dist", emptyOutDir: true }` y sacar `frontend/src/dist/` del repositorio |
| 6 | `backend/.env.example` | Faltan variables | Agregar `JWT_SECRET`, `JWT_EXPIRA` y `NODE_ENV` (§1.1) |
| 7 | `frontend/src/css/main.css` e `index.html` | Usaban colores que no son de la paleta (`#a5c0e7`, `#f5f6f8`, `#1f2937`, `#475569`) | ✅ Hecho: las variables están en `css/tokens.css` y ningún CSS usa colores sueltos. El `<meta name="theme-color">` no admite variables CSS: ahí va `#F8FAFC` |

---

## 8. Decisiones para confirmar en la revisión

Ya están incluidas en el contrato. Si alguien no está de acuerdo, se discute en el PR:

1. **`PATCH /api/productos/:id/stock`.** Es la interpretación de "autosuma" en la especificación: entradas y salidas de mercancía sin editar el producto completo.
2. **CAPTCHA también en el registro.** La especificación solo lo pide en el login; se reutiliza el mismo componente.
3. **Desafío matemático propio en lugar de reCAPTCHA.** No requiere claves ni conexión a Google. Si el equipo prefiere reCAPTCHA, solo cambian `captchaId` y `captchaRespuesta` por un único `captchaToken`.
4. **Nombre de producto único.** Evita duplicados como "Martillo" y "martillo".
5. **El registro no inicia sesión.** Después de registrarse, el usuario va al login.

**Fuera de alcance:** roles y permisos. Como es un ejercicio académico, todos los usuarios con sesión tienen los mismos permisos.

---

## 9. Cómo se cambia este contrato

- Todo cambio se hace con un PR que modifique este archivo, antes o junto con el código.
- Un cambio que rompe compatibilidad (renombrar o quitar campos, cambiar códigos) sube la versión mayor (2.0). Agregar campos opcionales sube la menor (1.1).

---

## 10. Revisión del equipo

Cada integrante revisa el PR de este documento y lo aprueba o deja comentarios. Quien trabaje en frontend revisa sobre todo los campos, los formatos de error y las rutas de la SPA; quien trabaje en backend revisa que los endpoints, validaciones y consultas sean viables.

- [x] Carlos Adrian Zapata (autor)
- [ ] Rafaela Martinez Jimenez
- [ ] Aaron Medina
- [ ] Andres Lozano
