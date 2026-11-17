# FerroAdmin

Sistema web para controlar el inventario de una ferretería: productos con imagen, categorías, búsqueda, existencias y alertas de stock bajo. Tiene inicio de sesión seguro con verificación anti-bot, recuperación de clave por correo y cambio de contraseña.

Es una aplicación de una sola página (SPA) hecha entre cuatro personas como proyecto académico.

- **Aplicación publicada:** `https://<tu-proyecto>.vercel.app` *(reemplazar por la dirección real)*
- **Contrato de la API:** [CONTRATO_API.md](CONTRATO_API.md). Es el acuerdo del equipo: si el código y el contrato no coinciden, se corrige uno de los dos con un PR.
- **Guía visual:** [GUIA_VISUAL.md](GUIA_VISUAL.md)
- **Especificaciones originales:** [ESPECIFICACIONES.md](ESPECIFICACIONES.md)

## Qué se puede hacer

- Crear una cuenta, iniciar y cerrar sesión. El login, el registro y la recuperación piden resolver una suma sencilla (CAPTCHA).
- Recuperar la clave con un enlace que llega por correo y vence a los 30 minutos.
- Cambiar la contraseña desde el nombre de usuario, arriba a la derecha.
- Ver el inventario en tabla (`#/inventario`) o como catálogo con imágenes (`#/productos`).
- Buscar productos por nombre mientras se escribe, filtrar por categoría y paginar.
- Crear, editar y eliminar productos, con imagen por URL o subida desde el computador.
- Sumar o restar existencias. Con **1 a 5 unidades** aparece "Stock bajo"; con 0, "Agotado".

## Tecnologías

| Parte | Con qué |
|---|---|
| Frontend | HTML, CSS y JavaScript nativo (sin frameworks), empaquetado con Vite |
| Backend | Node.js 20 o superior y Express |
| Base de datos | PostgreSQL, con el controlador `pg` |
| Seguridad | Contraseñas con `bcrypt`, sesión con JWT en una cookie `HttpOnly`, CAPTCHA propio |
| Nube | Vercel (aplicación), Supabase (base de datos e imágenes) |

## Estructura del proyecto

```text
sistema-inventario/
├── backend/                 API con Express
│   ├── app.js               Arma la aplicación (rutas, errores)
│   ├── server.js            La enciende en local
│   ├── routes/ controllers/ services/ middlewares/ config/
│   ├── sql/                 setup.sql, seed.sql y migraciones
│   ├── docs/                Documentación Swagger de la API
│   └── tests/               Pruebas automáticas
├── frontend/                Pantallas (Vite)
│   └── src/ (index.html, js/, css/, public/)
├── api/index.js             Entrada del backend en Vercel
├── vercel.json              Configuración de Vercel
└── CONTRATO_API.md
```

## Cómo ejecutarlo en tu computador

### Qué necesitas

- [Node.js](https://nodejs.org) 20 o superior.
- [PostgreSQL](https://www.postgresql.org/download/) y su herramienta `psql` en el PATH.
- Git.

Comprueba con `node --version` y `psql --version`.

### 1. Descargar el proyecto

```bash
git clone https://github.com/carlosad2010/FerroAdmin.git
cd FerroAdmin
```

### 2. Crear la base de datos

Crea una base vacía llamada `ferroadmin` y carga las tablas y los datos de ejemplo. Desde la carpeta `backend`:

```bash
psql -U postgres -c "CREATE DATABASE ferroadmin;"
cd backend
```

Después, según tu terminal:

**PowerShell (Windows).** Antes de cargar los archivos hay que fijar la codificación, o las tildes se guardan mal ("Ferretería" aparece como "FerreterÃ­a"):

```powershell
$env:PGCLIENTENCODING="UTF8"
psql -U postgres -d ferroadmin -f sql/setup.sql
psql -U postgres -d ferroadmin -f sql/seed.sql
```

**Mac, Linux o Git Bash:**

```bash
psql -U postgres -d ferroadmin -f sql/setup.sql
psql -U postgres -d ferroadmin -f sql/seed.sql
```

> `setup.sql` **borra y vuelve a crear todas las tablas**. Úsalo solo para empezar de cero. Si ya tienes datos y solo falta una tabla nueva, ejecuta el archivo correspondiente de `sql/migraciones/`.

El usuario de ejemplo del `seed.sql` tiene una clave de adorno y **no sirve para entrar**. Crea tu propia cuenta desde la pantalla de registro.

### 3. Configurar las variables de entorno

Dentro de `backend/`, copia la plantilla y edítala:

```bash
cp .env.example .env
```

En Windows puedes usar `copy .env.example .env`. El archivo `.env` **no se sube a GitHub**: ahí van tus claves.

Para que la aplicación arranque solo necesitas cambiar estas tres:

| Variable | Qué poner |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:TU_CLAVE@localhost:5432/ferroadmin` |
| `JWT_SECRET` | Un texto largo y aleatorio. Para generarlo: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `NODE_ENV` | `development` |

Las demás activan funciones opcionales. Sin ellas todo lo demás funciona, y esa función muestra un error:

| Variables | Función que activan |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Correos de bienvenida, recuperación y aviso de cambio de clave |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Subir imágenes desde el computador (la imagen por URL funciona sin esto) |
| `FRONTEND_URL` | Dirección que usan los enlaces de los correos. En local, `http://localhost:5173` |
| `DATABASE_SSL`, `CRON_SECRET` | Solo para Supabase y Vercel (ver más abajo) |

Para probar los correos sin enviar nada real puedes usar una cuenta gratuita de [Ethereal](https://ethereal.email) (`smtp.ethereal.email`, puerto 587). Con Gmail se necesita una contraseña de aplicación de 16 caracteres, no la clave normal de la cuenta.

### 4. Instalar y encender

Hacen falta **dos terminales**, una para el backend y otra para el frontend.

**Terminal 1: backend**

```bash
cd backend
npm install
npm run dev
```

Debe mostrar `Conexión a PostgreSQL OK` y `Servidor Express de FerroAdmin corriendo en http://localhost:3000`.

**Terminal 2: frontend**

```bash
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173** en el navegador. El frontend reenvía las llamadas de `/api` al backend, así que no hay que configurar nada más.

### 5. Comprobar que funciona

- `http://localhost:3000/api/health` debe responder `{"status":"ok"}`.
- `http://localhost:3000/api/docs` abre la documentación interactiva de la API (Swagger). Solo está disponible fuera de producción.

### Pruebas automáticas

Desde `backend/`:

```bash
npm test
```

Necesitan la base de datos creada con `setup.sql` y `seed.sql`. Solo leen datos o crean y borran los suyos. Una prueba falla si se agrega una ruta a la API sin documentarla en `backend/docs/openapi.js`.

## Recorrido de demostración

1. Abre la aplicación y pulsa **Registrar**. Crea una cuenta con tu nombre y apellido, un correo y una clave de 8 caracteres o más. Resuelve la suma.
2. Se vuelve al login con el mensaje de cuenta creada. Inicia sesión, resolviendo otra suma. Entras al **inventario**.
3. **Buscar:** escribe `mart` y la tabla se filtra sola. Usa el filtro de categorías y la paginación.
4. **Crear un producto:** botón *Nuevo producto*. Prueba con un nombre repetido para ver el error bajo el campo.
5. **Ajustar stock:** resta unidades hasta dejar un producto en 5 o menos y verás la insignia *Stock bajo*. Intenta restar más de las que hay: se rechaza.
6. **Catálogo:** entra a **Productos** en el menú lateral para ver las imágenes.
7. **Cambiar contraseña:** pulsa tu nombre arriba a la derecha y elige *Cambiar contraseña*. La actual incorrecta se marca bajo su campo.
8. **Cerrar sesión**, y en el login pulsa **¿Olvidaste tu clave?** para probar la recuperación por correo.
9. Escribe `#/ruta-que-no-existe` al final de la dirección para ver la página 404.

## Publicarlo en Vercel con Supabase

La aplicación completa (pantallas y API) se publica en un solo proyecto de Vercel, con la base de datos y las imágenes en Supabase. Está explicado en el contrato, secciones 11.1 y 11.4. Resumen:

### En Supabase

1. Crea un proyecto.
2. En **SQL Editor**, ejecuta `backend/sql/setup.sql` y después `backend/sql/seed.sql`.
3. En **Storage**, crea un bucket llamado `productos` y márcalo como **público**.
4. En **Connect**, copia la dirección del **Transaction pooler** (puerto 6543, con usuario `postgres.<código del proyecto>`). No uses la conexión directa: no funciona desde Vercel.

### En Vercel

1. Importa el repositorio. En *Application Preset* elige **Other** y deja *Root Directory* vacío. El resto lo toma de `vercel.json`.
2. Agrega las variables de entorno antes del primer despliegue:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | La del *Transaction pooler*, **sin** `?sslmode=...` |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET` | Un valor nuevo, largo y aleatorio |
| `JWT_EXPIRA` | `8h` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Tu servidor de correo |
| `SUPABASE_URL` | `https://<proyecto>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | La llave secreta de Supabase. **Solo en el servidor** |
| `SUPABASE_STORAGE_BUCKET` | `productos` |
| `CRON_SECRET` | Un valor largo y aleatorio |

   `FRONTEND_URL` no hace falta: en Vercel se usa el dominio del proyecto automáticamente.
3. Despliega. Si cambias una variable después, haz **Redeploy**: no se aplica sola.
4. Comprueba `https://<tu-proyecto>.vercel.app/api/health`.

Vercel también ejecuta dos veces al día (8:00 y 16:00, hora de Colombia) la revisión de stock bajo, según `vercel.json`.

> **Seguridad.** Las llaves de Supabase, la clave de la base de datos y la contraseña del correo no se suben nunca a GitHub ni se comparten por chat. Si una se expone, se genera una nueva y se cambia en Vercel.

## Problemas frecuentes

| Qué pasa | Por qué y qué hacer |
|---|---|
| `Falta DATABASE_URL en backend/.env` | No existe el `.env`. Cópialo de `.env.example` (paso 3) |
| `PostgreSQL rechazó el usuario o la clave` | La clave de `DATABASE_URL` no es la de tu PostgreSQL |
| `La base de datos ... no existe` | Falta `CREATE DATABASE ferroadmin;` (paso 2) |
| Las tildes se ven como `Ã©` | Cargaste los `.sql` sin `$env:PGCLIENTENCODING="UTF8"`. Vuelve a cargarlos con esa línea |
| El login dice que no se pudo cargar la verificación | Falta la tabla `captchas`. Ejecuta `sql/migraciones/002_captchas.sql` |
| `Cannot find package ...` al arrancar | Falta `npm install` en `backend/` o en `frontend/` |
| Los correos no llegan | Revisa las variables `SMTP_*` y el spam. El error exacto aparece en la consola del backend |
| Subir una imagen da error | Faltan las variables `SUPABASE_*` o el bucket `productos` no es público. Mientras tanto, usa una imagen por URL |
| En Vercel, `getaddrinfo ENOTFOUND db...supabase.co` | `DATABASE_URL` usa la conexión directa. Cambia a la del *Transaction pooler* |
| En Vercel, el enlace del correo dice `localhost` | `FRONTEND_URL` quedó con el valor local. Bórrala y haz *Redeploy* |

## El equipo

| Persona | Áreas principales |
|---|---|
| Carlos Adrian Zapata | Contrato de la API, guía visual, conexión a la base de datos, despliegue y cambio de contraseña |
| Andrés Lozano | CRUD y búsqueda de productos, inventario en el frontend, documentación de la API |
| Rafaela Martínez | Login, registro, validaciones, CAPTCHA, recuperación de clave y correos |
| Aaron | Servidor, autenticación y sesión, imágenes de productos y alertas de stock bajo |

El tablero de tareas está en Trello ("Sistema de Inventerio Sup henry").

## Pendiente

Lo que falta, con detalle en la sección 7 del contrato:

- Enviar el correo de stock bajo (hoy la revisión solo escribe en los registros del servidor).
- Validar en el servidor los datos del registro (hoy solo los valida el navegador).
- Limitar los intentos de inicio de sesión.
