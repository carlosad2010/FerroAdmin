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
├── ESPECIFICACIONES.md
├── backend/
│   ├── config/          # Conexión a BD y variables de entorno
│   ├── controllers/     # Lógica de negocio (Auth y Productos)
│   ├── middlewares/     # Protección de rutas (JWT/Sesión y verificación)
│   ├── routes/          # Rutas API (/api/auth, /api/productos)
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── frontend/
    ├── css/             # Estilos del Dashboard y Login
    ├── js/              # Módulos de JS (auth.js, inventario.js, captcha.js)
    ├── index.html       # Vista principal (Dashboard SPA)
    └── login.html       # Vista de acceso





