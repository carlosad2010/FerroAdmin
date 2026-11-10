# 📦 Sistema de Gestión de Inventario con Autenticación

## 🎯 Objetivo del Proyecto
Desarrollar una aplicación web interactiva (SPA) full-stack para la gestión de productos e inventario, con control de acceso mediante login seguro y verificación de usuarios; el control de inventario será para una ferretería 

---



## 🛠️ Arquitectura y Stack Tecnológico

* **Frontend:** HTML5, CSS3 nativo, JavaScript nativo (Vanilla JS - Fetch API).
* **Backend:** Node.js, Express.js.
* **Base de Datos:** PostgreSQL con controlador nativo `pg`.
* **Autenticación:** JSON Web Tokens (JWT) / Sesiones + Encriptación de contraseñas (`bcrypt`).
* **Verificación:** Integración de CAPTCHA / ReCAPTCHA (o prueba matemática/desafío anti-bot).
* **Almacenamiento:** El almacenamiento del login será por cookies

---

## 🎨 Paleta de colores

| Color | Hex | Uso |
|---|---|---|
| Azul oscuro | `#172B4D` | Color principal: barra superior, botones principales, títulos y texto |
| Ámbar | `#F59E0B` | Acento: elemento activo, resaltados y acción destacada |
| Fondo | `#F8FAFC` | Fondo general de la página |
| Tarjetas | `#FFFFFF` | Tarjetas, tabla, formularios y modales |
| Éxito | `#16A34A` | Mensajes de confirmación |
| Error | `#DC2626` | Mensajes de error y acciones de eliminar |

Los nombres de las variables CSS y las reglas de contraste están en el §1.4 de `CONTRATO_API.md`. Los componentes compartidos (botones, campos, tablas, login de pantalla dividida, barra lateral, etc.) están en `GUIA_VISUAL.md`.

---

## 📐 Módulos del Sistema

### 1. Módulo de Seguridad y Autenticación
* **Registro / Login de Usuarios:** Formulario de acceso.
* **Verificación Humana:** Mecanismo anti-bot en el formulario de inicio de sesión.
* **Protección de Rutas:** Interceptores/Middleware en backend para verificar token/sesión antes de permitir operaciones en el inventario. Una ruta no existe debe aparecer un 404 <---Debe ser una pagina

### 2. Módulo de Inventario (CRUD + Búsqueda)
* **Crear Producto:** Nombre, categoría, precio y stock inicial. (Si es autoincrementable y/o autosuma)
* **Visualizar / Listar:** Tabla interactiva con el catálogo completo. GET / PUT / DELETE
* **Búsqueda y Filtros:** Búsqueda en tiempo real por nombre (usando consultas eficientes en BD).
* **Eliminar / Actualizar:** Gestión directa sobre cada registro.


### Nombres y apellidos de los participantes


* **Carlos Adrian Zapata**
* **Rafaela Martinez Jimenez**
* **Aaron Medina**
* **Andres Lozano**

---

## 📂 Estructura del Proyecto

```text
sistema-inventario/
├── .gitignore
├── ESPECIFICACIONES.md
├── CONTRATO_API.md
├── GUIA_VISUAL.md
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── .env             # Local, no se versiona
│   ├── .env.example     # Variables de entorno de referencia
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── css/         # Estilos (ver GUIA_VISUAL.md)
    │   │   ├── main.css         # Punto de entrada: importa los demás
    │   │   ├── tokens.css       # Variables: paleta, tipografía, espaciado, tema oscuro opcional
    │   │   ├── base.css         # Reset, tipografía, enlaces, foco
    │   │   ├── componentes.css  # Botones, campos, mensajes, tablas, iconos, modal
    │   │   ├── auth.css         # Login y registro: pantalla dividida
    │   │   └── app.css          # Estructura interna: barra lateral, barra superior, indicadores
    │   ├── js/          # Módulos del frontend
    │   ├── public/
    │   │   └── iconos.svg       # Sprite de iconos y logo (se sirve en /iconos.svg)
    │   ├── index.html   # Única página de la SPA
    │   ├── package.json
    ├── package-lock.json
    └── vite.config.js
```

## Inicialización local

Se requiere Node.js 20 o superior.

```powershell
cd backend
npm install
npm run dev
```

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

El backend expone el endpoint de comprobación `GET /api/health` en el puerto
3000. Vite sirve el frontend y reenvía las solicitudes `/api` al backend.



- Esto es un ejemplo
