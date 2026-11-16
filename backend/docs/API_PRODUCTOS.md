# API de productos — endpoints validados (T15)

> **Tarea:** T15 — Validar y documentar endpoints · **Responsable:** Andres Lozano
> **Qué es:** la descripción de las 6 rutas de `/api/productos` tal como están implementadas y probadas.
> **Qué no es:** el acuerdo del equipo. Ese es `CONTRATO_API.md` (§5.5); si este documento y el contrato no coinciden, manda el contrato y se corrige el código.

Los ejemplos de respuesta son respuestas reales de la API con los datos de `backend/sql/seed.sql`. Los `id` y las fechas cambian en cada base de datos.

## 1. Resumen

| Método | URL | Qué hace | Éxito | Errores |
|---|---|---|---|---|
| GET | `/api/productos` | Lista, busca, filtra, ordena y pagina | 200 | 400, 401 |
| GET | `/api/productos/:id` | Devuelve un producto | 200 | 400, 401, 404 |
| POST | `/api/productos` | Crea un producto | 201 | 400, 401, 409 |
| PUT | `/api/productos/:id` | Reemplaza los 4 campos de un producto | 200 | 400, 401, 404, 409 |
| PATCH | `/api/productos/:id/stock` | Suma o resta stock | 200 | 400, 401, 404, 409 |
| DELETE | `/api/productos/:id` | Elimina un producto | 204 | 400, 401, 404 |

Archivos: `routes/productos.js` (rutas), `controllers/productos.js` (validación y respuestas), `services/productos.js` (SQL).

## 2. Reglas comunes

### 2.1 Sesión

Las 6 rutas exigen sesión. El navegador envía sola la cookie `ferro_token` que entrega `POST /api/auth/login`. Sin cookie, o con un token inválido o vencido, cualquier ruta responde:

```http
401 Unauthorized
```

```json
{ "error": { "codigo": "NO_AUTENTICADO", "mensaje": "No se encontró una sesión activa" } }
```

Con un token inválido o vencido el `mensaje` es `"Token inválido o expirado"`.

### 2.2 Formato

- Las peticiones con cuerpo llevan `Content-Type: application/json`.
- Éxito: `{ "data": ... }`, y en la lista además `{ "meta": ... }`.
- Error: siempre `{ "error": { "codigo", "mensaje", "detalles" } }`. `detalles` solo viene en los errores de validación y trae una entrada por cada campo con problema.
- Un cuerpo que no es JSON válido responde `400 VALIDACION` con el mensaje `"El cuerpo de la petición no es un JSON válido"`.

### 2.3 Objeto Producto

```json
{
  "id": 1,
  "nombre": "Martillo de uña 16 oz",
  "categoria": { "id": 1, "nombre": "Herramientas manuales" },
  "precio": 28500,
  "stock": 12,
  "creadoEn": "2026-11-16T00:22:01.429Z",
  "actualizadoEn": "2026-11-16T00:22:01.429Z"
}
```

- `precio` es un número JSON (`28500` o `35000.5`), no un texto.
- `categoria` puede ser `null` si la categoría del producto fue eliminada de la base de datos.
- Las fechas van en ISO 8601, en UTC.

### 2.4 Campos del cuerpo (POST y PUT)

| Campo | Tipo | Regla | Mensajes de error |
|---|---|---|---|
| `nombre` | texto | Obligatorio, 2 a 120 caracteres después de quitar espacios. Único sin distinguir mayúsculas | `El nombre es obligatorio` · `Debe ser un texto` · `Debe tener entre 2 y 120 caracteres` |
| `categoriaId` | entero | Obligatorio, positivo, debe existir en `categorias` | `La categoría es obligatoria` · `Debe ser un número entero positivo` · `La categoría no existe` |
| `precio` | número | Obligatorio, mayor o igual a 0, máximo 2 decimales | `El precio es obligatorio` · `Debe ser un número mayor o igual a 0` · `Debe tener máximo 2 decimales` |
| `stock` | entero | Obligatorio, mayor o igual a 0 | `El stock es obligatorio` · `Debe ser un número entero mayor o igual a 0` |

- Los tipos son estrictos: `"2"` (texto) no vale como `categoriaId`, ni `"100"` como `precio`. El frontend convierte con `Number()` antes de enviar.
- `id`, `creadoEn` y `actualizadoEn` se ignoran si vienen en el cuerpo: los pone el servidor.

### 2.5 El `:id` de la URL

Debe ser un entero positivo. `abc`, `0`, `-1`, `1.5` o un número mayor que 2147483647 responden, sin consultar la base de datos:

```http
400 Bad Request
```

```json
{
  "error": {
    "codigo": "VALIDACION",
    "mensaje": "Hay campos con errores",
    "detalles": [{ "campo": "id", "mensaje": "Debe ser un número entero positivo" }]
  }
}
```

### 2.6 Cómo repetir los ejemplos con curl

Los ejemplos usan `-b cookies.txt`, un archivo con la cookie de sesión. Con el servidor encendido en el puerto 3000, se obtiene iniciando sesión (el login pide resolver antes el CAPTCHA de `GET /api/auth/captcha`):

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"tu@correo.com","password":"TuClave123","captchaId":"<id del captcha>","captchaRespuesta":11}'
```

## 3. `GET /api/productos`

Lista los productos. Todos los parámetros son opcionales y van en la URL.

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `buscar` | texto, máximo 100 caracteres | — | Coincidencia parcial en el nombre, sin distinguir mayúsculas |
| `categoriaId` | entero positivo | — | Solo productos de esa categoría |
| `pagina` | entero, mínimo 1 | `1` | Página pedida |
| `limite` | entero, de 1 a 100 | `20` | Productos por página |
| `orden` | `nombre`, `precio`, `stock` o `creadoEn` | `nombre` | Columna de ordenamiento |
| `direccion` | `asc` o `desc` | `asc` | Sentido del ordenamiento |

Sin cuerpo.

### Éxito: 200

```bash
curl -b cookies.txt "http://localhost:3000/api/productos?buscar=mart&categoriaId=1&pagina=1&limite=20"
```

```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Martillo de uña 16 oz",
      "categoria": { "id": 1, "nombre": "Herramientas manuales" },
      "precio": 28500,
      "stock": 12,
      "creadoEn": "2026-11-16T00:22:01.429Z",
      "actualizadoEn": "2026-11-16T00:22:01.429Z"
    }
  ],
  "meta": { "total": 1, "pagina": 1, "limite": 20, "totalPaginas": 1 }
}
```

`meta.total` cuenta todos los productos que cumplen los filtros, no solo los de la página. Con `?orden=precio&direccion=desc&limite=2` y el seed, `meta` es `{ "total": 6, "pagina": 1, "limite": 2, "totalPaginas": 3 }`.

### Éxito sin resultados: 200 (no es un 404)

```bash
curl -b cookies.txt "http://localhost:3000/api/productos?buscar=zzz"
```

```json
{ "data": [], "meta": { "total": 0, "pagina": 1, "limite": 20, "totalPaginas": 0 } }
```

### Error: 400, parámetros inválidos

```bash
curl -b cookies.txt "http://localhost:3000/api/productos?pagina=0&orden=color"
```

```json
{
  "error": {
    "codigo": "VALIDACION",
    "mensaje": "Hay campos con errores",
    "detalles": [
      { "campo": "pagina", "mensaje": "Debe ser un número entero mayor o igual a 1" },
      { "campo": "orden", "mensaje": "Debe ser uno de: nombre, precio, stock, creadoEn" }
    ]
  }
}
```

### SQL

Son dos consultas: una cuenta el total y la otra trae la página. Las condiciones del `WHERE` solo se agregan si el parámetro viene.

```sql
SELECT COUNT(*)::int AS total
FROM productos p
WHERE p.nombre ILIKE $1 ESCAPE '\' AND p.categoria_id = $2;
```

```sql
SELECT p.id, p.nombre, p.precio, p.stock, p.creado_en, p.actualizado_en,
       c.id AS categoria_id, c.nombre AS categoria_nombre
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
WHERE p.nombre ILIKE $1 ESCAPE '\' AND p.categoria_id = $2
ORDER BY lower(p.nombre) ASC, p.id ASC
LIMIT $3 OFFSET $4;
```

| Parámetro SQL | Valor |
|---|---|
| `$1` | `%texto%`, con `%`, `_` y `\` del usuario escapados para que se busquen como texto |
| `$2` | `categoriaId` |
| `$3` | `limite` |
| `$4` | `(pagina - 1) * limite` |

`ORDER BY` es la única parte que no puede ir como parámetro, porque PostgreSQL no acepta un nombre de columna en `$1`. Por eso `orden` y `direccion` nunca se copian al SQL: se comparan con una lista fija y de ahí sale el texto.

| `orden` | Texto que va al SQL |
|---|---|
| `nombre` | `lower(p.nombre)` |
| `precio` | `p.precio` |
| `stock` | `p.stock` |
| `creadoEn` | `p.creado_en` |

La búsqueda usa el índice trigram `idx_productos_nombre_trgm` (T14).

## 4. `GET /api/productos/:id`

Devuelve un producto. Sin parámetros de consulta ni cuerpo.

### Éxito: 200

```bash
curl -b cookies.txt http://localhost:3000/api/productos/1
```

```json
{
  "data": {
    "id": 1,
    "nombre": "Martillo de uña 16 oz",
    "categoria": { "id": 1, "nombre": "Herramientas manuales" },
    "precio": 28500,
    "stock": 12,
    "creadoEn": "2026-11-16T00:22:01.429Z",
    "actualizadoEn": "2026-11-16T00:22:01.429Z"
  }
}
```

### Error: 404, el producto no existe

```bash
curl -b cookies.txt http://localhost:3000/api/productos/999
```

```json
{ "error": { "codigo": "NO_ENCONTRADO", "mensaje": "El producto no existe" } }
```

### Error: 400, id inválido

`GET /api/productos/abc` responde el error de §2.5.

### SQL

```sql
SELECT p.id, p.nombre, p.precio, p.stock, p.creado_en, p.actualizado_en,
       c.id AS categoria_id, c.nombre AS categoria_nombre
FROM productos p
LEFT JOIN categorias c ON c.id = p.categoria_id
WHERE p.id = $1;
```

`$1` = `id`.

## 5. `POST /api/productos`

Crea un producto. Sin parámetros en la URL.

Cuerpo: los 4 campos de §2.4, todos obligatorios.

### Éxito: 201

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/productos -H "Content-Type: application/json" -d '{"nombre":"Serrucho 20 pulgadas","categoriaId":1,"precio":32000,"stock":8}'
```

```json
{
  "data": {
    "id": 7,
    "nombre": "Serrucho 20 pulgadas",
    "categoria": { "id": 1, "nombre": "Herramientas manuales" },
    "precio": 32000,
    "stock": 8,
    "creadoEn": "2026-11-16T00:22:12.901Z",
    "actualizadoEn": "2026-11-16T00:22:12.901Z"
  }
}
```

### Error: 400, campos inválidos

Cuerpo enviado: `{"nombre":"S","categoriaId":1,"precio":-5,"stock":2.5}`

```json
{
  "error": {
    "codigo": "VALIDACION",
    "mensaje": "Hay campos con errores",
    "detalles": [
      { "campo": "nombre", "mensaje": "Debe tener entre 2 y 120 caracteres" },
      { "campo": "precio", "mensaje": "Debe ser un número mayor o igual a 0" },
      { "campo": "stock", "mensaje": "Debe ser un número entero mayor o igual a 0" }
    ]
  }
}
```

Un cuerpo vacío (`{}`) responde 400 con los 4 campos en `detalles`.

### Error: 400, la categoría no existe

Cuerpo enviado: `{"nombre":"Lima plana","categoriaId":99,"precio":9000,"stock":4}`

```json
{
  "error": {
    "codigo": "VALIDACION",
    "mensaje": "Hay campos con errores",
    "detalles": [{ "campo": "categoriaId", "mensaje": "La categoría no existe" }]
  }
}
```

### Error: 409, nombre repetido

Cuerpo enviado: `{"nombre":"SERRUCHO 20 PULGADAS","categoriaId":1,"precio":1,"stock":1}`, cuando ya existe "Serrucho 20 pulgadas".

```json
{ "error": { "codigo": "CONFLICTO", "mensaje": "Ya existe un producto con ese nombre" } }
```

### SQL

Una sola consulta inserta y devuelve el producto ya con su categoría.

```sql
WITH p AS (
  INSERT INTO productos (nombre, categoria_id, precio, stock)
  VALUES ($1, $2, $3, $4)
  RETURNING *
)
SELECT p.id, p.nombre, p.precio, p.stock, p.creado_en, p.actualizado_en,
       c.id AS categoria_id, c.nombre AS categoria_nombre
FROM p
LEFT JOIN categorias c ON c.id = p.categoria_id;
```

`$1` = `nombre`, `$2` = `categoriaId`, `$3` = `precio`, `$4` = `stock`.

La base de datos es la que detecta dos de los errores, y el servicio los traduce:

| Error de PostgreSQL | Causa | Respuesta |
|---|---|---|
| `23505` | Índice único `idx_productos_nombre_lower` | 409 `CONFLICTO` |
| `23503` | Llave foránea `categoria_id` | 400 `VALIDACION` en `categoriaId` |

## 6. `PUT /api/productos/:id`

Reemplaza los 4 campos de un producto. No sirve para cambiar un solo campo: si falta alguno, responde 400.

Cuerpo: los 4 campos de §2.4, todos obligatorios.

### Éxito: 200

```bash
curl -b cookies.txt -X PUT http://localhost:3000/api/productos/7 -H "Content-Type: application/json" -d '{"nombre":"Serrucho 22 pulgadas","categoriaId":1,"precio":35000.5,"stock":10}'
```

```json
{
  "data": {
    "id": 7,
    "nombre": "Serrucho 22 pulgadas",
    "categoria": { "id": 1, "nombre": "Herramientas manuales" },
    "precio": 35000.5,
    "stock": 10,
    "creadoEn": "2026-11-16T00:22:12.901Z",
    "actualizadoEn": "2026-11-16T00:22:14.145Z"
  }
}
```

`creadoEn` no cambia; `actualizadoEn` se renueva.

### Error: 400, faltan campos

Cuerpo enviado: `{"nombre":"Serrucho 22 pulgadas"}`

```json
{
  "error": {
    "codigo": "VALIDACION",
    "mensaje": "Hay campos con errores",
    "detalles": [
      { "campo": "categoriaId", "mensaje": "La categoría es obligatoria" },
      { "campo": "precio", "mensaje": "El precio es obligatorio" },
      { "campo": "stock", "mensaje": "El stock es obligatorio" }
    ]
  }
}
```

### Error: 404, el producto no existe

`PUT /api/productos/999` con un cuerpo válido:

```json
{ "error": { "codigo": "NO_ENCONTRADO", "mensaje": "El producto no existe" } }
```

### Error: 409, el nombre ya lo usa otro producto

Cuerpo enviado: `{"nombre":"Llave ajustable","categoriaId":1,"precio":1,"stock":1}`

```json
{ "error": { "codigo": "CONFLICTO", "mensaje": "Ya existe un producto con ese nombre" } }
```

Guardar un producto con su mismo nombre no es conflicto.

### SQL

```sql
WITH p AS (
  UPDATE productos
  SET nombre = $1, categoria_id = $2, precio = $3, stock = $4, actualizado_en = now()
  WHERE id = $5
  RETURNING *
)
SELECT p.id, p.nombre, p.precio, p.stock, p.creado_en, p.actualizado_en,
       c.id AS categoria_id, c.nombre AS categoria_nombre
FROM p
LEFT JOIN categorias c ON c.id = p.categoria_id;
```

`$1` a `$4` = los 4 campos, `$5` = `id`. Si no devuelve filas, el producto no existe (404).

## 7. `PATCH /api/productos/:id/stock`

Registra una entrada o una salida de mercancía sin tocar el resto del producto.

Cuerpo:

| Campo | Tipo | Regla |
|---|---|---|
| `cantidad` | entero | Obligatorio, distinto de 0. Positivo suma, negativo resta |

### Éxito: 200

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/productos/7/stock -H "Content-Type: application/json" -d '{"cantidad":-3}'
```

```json
{
  "data": {
    "id": 7,
    "nombre": "Serrucho 22 pulgadas",
    "categoria": { "id": 1, "nombre": "Herramientas manuales" },
    "precio": 35000.5,
    "stock": 7,
    "creadoEn": "2026-11-16T00:22:12.901Z",
    "actualizadoEn": "2026-11-16T00:22:14.249Z"
  }
}
```

### Error: 409, no hay stock suficiente

Cuerpo enviado: `{"cantidad":-50}`, con stock 7. El stock no cambia.

```json
{
  "error": {
    "codigo": "STOCK_INSUFICIENTE",
    "mensaje": "No hay stock suficiente para registrar esa salida"
  }
}
```

### Error: 400, cantidad inválida

Cuerpo enviado: `{"cantidad":0}`. Lo mismo con `1.5`, `"3"` (texto), `null` o sin cuerpo.

```json
{
  "error": {
    "codigo": "VALIDACION",
    "mensaje": "Hay campos con errores",
    "detalles": [{ "campo": "cantidad", "mensaje": "Debe ser un número entero distinto de 0" }]
  }
}
```

### Error: 404, el producto no existe

`PATCH /api/productos/999/stock` responde `NO_ENCONTRADO`, igual que en §4.

### SQL

```sql
WITH p AS (
  UPDATE productos
  SET stock = stock + $1, actualizado_en = now()
  WHERE id = $2 AND stock + $1 >= 0
  RETURNING *
)
SELECT p.id, p.nombre, p.precio, p.stock, p.creado_en, p.actualizado_en,
       c.id AS categoria_id, c.nombre AS categoria_nombre
FROM p
LEFT JOIN categorias c ON c.id = p.categoria_id;
```

`$1` = `cantidad`, `$2` = `id`.

La condición `stock + $1 >= 0` va dentro del `UPDATE`: la base de datos comprueba y actualiza en un solo paso. Si dos personas venden la última unidad a la vez, solo una actualización pasa.

Si no devuelve filas, una segunda consulta averigua por qué:

```sql
SELECT 1 FROM productos WHERE id = $1;
```

Sin filas: 404. Con filas: 409 `STOCK_INSUFICIENTE`.

## 8. `DELETE /api/productos/:id`

Elimina un producto. Sin parámetros de consulta ni cuerpo.

### Éxito: 204, sin cuerpo

```bash
curl -b cookies.txt -X DELETE http://localhost:3000/api/productos/7 -i
```

```http
HTTP/1.1 204 No Content
```

### Error: 404, el producto no existe

Eliminar dos veces el mismo producto responde 404 la segunda vez:

```json
{ "error": { "codigo": "NO_ENCONTRADO", "mensaje": "El producto no existe" } }
```

### Error: 400, id inválido

`DELETE /api/productos/abc` responde el error de §2.5.

### SQL

```sql
DELETE FROM productos WHERE id = $1;
```

`$1` = `id`. Si no elimina ninguna fila, responde 404.

## 9. Consultas parametrizadas

Ninguna consulta de `services/productos.js` pega texto del usuario dentro del SQL.

| Dato del usuario | Cómo llega a la consulta |
|---|---|
| `nombre`, `precio`, `stock`, `categoriaId`, `cantidad` | Como parámetros `$1`, `$2`, … |
| `:id` de la URL | Se valida como entero en el controlador y luego va como parámetro |
| `buscar` | Como parámetro, con `%`, `_` y `\` escapados |
| `pagina`, `limite` | Se validan como enteros y van como parámetros de `LIMIT` y `OFFSET` |
| `orden`, `direccion` | No llegan al SQL: se eligen de una lista fija (§3) |

Lo único que se arma con texto es la estructura de la consulta (qué condiciones lleva el `WHERE` y los números `$1`, `$2`), nunca los valores.

## 10. Cómo se validó

Las pruebas automáticas están en `backend/tests/` y se ejecutan desde `backend/` con:

```bash
npm test
```

Necesitan `backend/.env` con `DATABASE_URL` y la base creada con `sql/setup.sql` y `sql/seed.sql`.

| Archivo | Pruebas | Qué cubre |
|---|---|---|
| `tests/productos.test.js` | 72 | Las 6 rutas por HTTP: sesión, éxito, cada error de este documento, paginación, orden, concurrencia del stock e intentos de inyección SQL |
| `tests/busqueda.test.js` | 16 | La búsqueda por nombre (T14) y el índice trigram |

- `productos.test.js` crea productos cuyo nombre empieza por `T15 prueba` y los elimina al terminar.
- `busqueda.test.js` solo lee, y espera exactamente los 6 productos del seed.
- Los dos archivos se ejecutan uno después del otro (`--test-concurrency=1`) para que los productos de prueba no alteren los conteos de la búsqueda.

Prueba de concurrencia: con stock 3 se lanzan 10 salidas de 1 unidad al mismo tiempo. Pasan exactamente 3, se rechazan 7 con 409 y el stock queda en 0.

## 11. Diferencias conocidas con el contrato

| Tema | Contrato | Implementación |
|---|---|---|
| Columna `descripcion` | No existe | Está en `setup.sql`, pero la API no la lee ni la devuelve |
| Tabla `movimientos_inventario` | No existe | Está en `setup.sql`, pero el ajuste de stock no escribe en ella |
| `categoria` del producto | Siempre un objeto | Puede ser `null`: la base permite `categoria_id` nulo (`ON DELETE SET NULL`) |
| Nombre único con tildes | "Sin distinguir mayúsculas" | Depende del locale de la base: con locale `C`, `lower()` no convierte `É` en `é` |
