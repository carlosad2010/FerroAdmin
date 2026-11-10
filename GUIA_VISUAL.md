<<<<<<< HEAD
# 🎨 Guía visual — FerroAdmin

> Paleta, tipografía y componentes compartidos del frontend. Los colores oficiales están en `CONTRATO_API.md` §1.4; este documento dice cómo usarlos.
> Muestra viva: con el frontend en marcha (`npm run dev`), abrir **`/guia.html`**.

## 1. Cómo usarla

`frontend/src/index.html` (y cualquier página nueva) carga un solo archivo:
=======
# 🎨 Guía visual — FerroAdmin (v2)

> Paleta, tipografía y componentes compartidos del frontend. Los colores oficiales están en `CONTRATO_API.md` §1.4; este documento dice cómo usarlos.
> La aplicación es una SPA: hay **un solo** `index.html`. Las vistas (registro, inventario, 404) las renderiza el JavaScript usando las clases de esta guía.

## 1. Archivos

`frontend/src/index.html` carga un solo archivo de estilos:
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d

```html
<link rel="stylesheet" href="/css/main.css" />
```

`main.css` importa, en este orden:

| Archivo | Qué tiene |
|---|---|
<<<<<<< HEAD
| `css/tokens.css` | Variables: colores, tipografía, espaciado, radios, sombras, foco, difuminado |
| `css/base.css` | Reset mínimo, tipografía, enlaces, foco visible, utilidades |
| `css/fondo.css` | Fondo de ondulaciones (SVG de `index.html`) |
| `css/componentes.css` | Botones, campos, mensajes, tablas, barra, modal, 404, tarjeta de vidrio |
=======
| `css/tokens.css` | Variables: colores, tipografía, espaciado, radios, sombras, foco, layout y tema oscuro opcional |
| `css/base.css` | Reset mínimo, tipografía, enlaces, foco visible, utilidades |
| `css/componentes.css` | Iconos, marca, botones, campos, mensajes, estado, insignias, tabla, barra simple, modal, 404 |
| `css/auth.css` | Login y registro: pantalla dividida |
| `css/app.css` | Estructura interna: barra lateral, barra superior, buscador, indicadores, secciones |

Iconos: `frontend/src/public/iconos.svg` (Vite lo sirve en `/iconos.svg` y lo copia al build).
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d

**Reglas para todo el equipo**

1. No se escriben códigos de color (`#abc123`, `rgb()`) fuera de `tokens.css`. Se usa `var(--color-...)`.
<<<<<<< HEAD
2. No se agrega un componente propio si ya existe uno aquí. Si falta algo, se agrega a `componentes.css` mediante un PR.
3. Los nombres de clase van en español y en minúsculas con guiones (`.btn-primario`).
4. Los `id` y `name` de los formularios no cambian por estilos: el JavaScript y el contrato dependen de ellos.
=======
2. No se crea un componente propio si ya existe uno aquí. Si falta algo, se agrega mediante un PR.
3. Clases en español, en minúsculas con guiones (`.btn-primario`).
4. Los `id` y `name` de los formularios no cambian por estilos: el JavaScript y el contrato dependen de ellos.
5. No se agregan archivos `.html`: todo se renderiza dentro de `index.html`.
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d

## 2. Paleta

| Variable | Color | Hex | Uso |
|---|---|---|---|
<<<<<<< HEAD
| `--color-primario` | Azul oscuro | `#172B4D` | Texto principal, títulos, botón principal, barra superior |
| `--color-acento` | Ámbar | `#F59E0B` | Elemento activo, resaltados, acción destacada |
=======
| `--color-primario` | Azul oscuro | `#172B4D` | Texto principal, títulos, botón principal, barra lateral |
| `--color-acento` | Ámbar | `#F59E0B` | Ítem activo, iconos destacados, acción destacada |
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d
| `--color-fondo` | Fondo | `#F8FAFC` | Fondo de la página |
| `--color-tarjeta` | Tarjetas | `#FFFFFF` | Tarjetas, tabla, formularios, modales |
| `--color-exito` | Éxito | `#16A34A` | Confirmaciones |
| `--color-error` | Error | `#DC2626` | Errores y acciones de eliminar |

### Derivados

No son colores nuevos: se calculan con `color-mix()` a partir de los 6 anteriores.

| Variable | Fórmula | Uso |
|---|---|---|
<<<<<<< HEAD
| `--color-texto` | `--color-primario` | Color de texto por defecto |
| `--color-texto-suave` | primario 80 % + blanco | Texto secundario, placeholders |
| `--color-borde` | primario 18 % + blanco | Bordes de tarjetas y separadores |
| `--color-borde-campo` | primario 55 % + blanco | Borde de inputs |
| `--color-primario-hover` | primario 85 % + blanco | Botón principal al pasar el mouse |
| `--color-acento-hover` | ámbar 88 % + negro | Botón ámbar al pasar el mouse |
| `--color-error-hover` | error 85 % + negro | Botón de eliminar al pasar el mouse |
| `--color-exito-fondo`, `--color-error-fondo`, `--color-acento-fondo` | color 10 % o 20 % + blanco | Fondo de mensajes e insignias |
| `--color-exito-texto`, `--color-error-texto` | color 75 % u 80 % + negro | Texto verde o rojo sobre fondos claros o sobre vidrio |
=======
| `--color-texto` | primario | Texto por defecto |
| `--color-texto-suave` | primario 80 % + blanco | Texto secundario, placeholders, encabezados de tabla |
| `--color-borde` / `--color-borde-campo` | primario 18 % / 55 % + blanco | Bordes de tarjetas / bordes de inputs |
| `--color-primario-hover`, `--color-acento-hover`, `--color-error-hover` | — | Botones al pasar el mouse |
| `--color-exito-fondo`, `--color-error-fondo`, `--color-acento-fondo`, `--color-primario-fondo` | color 10–20 % + blanco | Fondos de mensajes, insignias e iconos de indicadores |
| `--color-fondo-hundido` | primario 7 % + blanco | Encabezado de tabla, buscador, hover de botones claros |
| `--color-exito-texto`, `--color-error-texto`, `--color-aviso-texto` | color + negro | Texto verde, rojo o ámbar oscuro sobre fondos claros |
| `--color-sobre-primario`, `--color-sobre-acento`, `--color-sobre-error` | — | Texto **encima** de un relleno de color (cambian en el tema oscuro) |
| `--color-lateral`, `--color-lateral-texto`, `--color-lateral-suave`, `--color-lateral-activo`, `--color-lateral-linea` | — | Barra lateral y zonas oscuras |
| `--color-panel` | primario 62 % + negro | Panel de marca del login, fondo del modal |
| `--cubo-*` | — | Caras de la ilustración isométrica del login y del logo |
| `--color-foco` | primario | Color del anillo de foco |
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d

### Contraste (WCAG AA: 4.5:1 texto normal, 3:1 texto grande y controles)

Calculados con la fórmula de luminancia relativa de WCAG 2.1.

| Combinación | Contraste | Resultado |
|---|---|---|
<<<<<<< HEAD
| Azul oscuro sobre blanco | 17.5:1 | ✅ |
| Azul oscuro sobre ámbar | 7.1:1 | ✅ |
| Blanco sobre rojo (botón eliminar) | 5.4:1 | ✅ |
| `--color-texto-suave` sobre blanco | 10.5:1 | ✅ |
| `--color-error-texto` sobre blanco / sobre `--color-error-fondo` | 8.2:1 / 6.7:1 | ✅ |
| `--color-exito-texto` sobre blanco / sobre `--color-exito-fondo` | 7.3:1 / 6.4:1 | ✅ |
| Borde de input (`--color-borde-campo`) sobre blanco | 4.6:1 | ✅ (mínimo 3:1) |
| Blanco sobre verde | 4.1:1 | ⚠️ Solo texto grande o en negrita. Para texto normal usar `--color-exito-texto` |
| Blanco sobre ámbar | 2.5:1 | ❌ No usar. Sobre ámbar el texto va en azul oscuro |
| Ámbar sobre blanco | 2.5:1 | ❌ No usar ámbar como color de texto ni de enlace |

## 3. Tipografía

- **Fuente:** la del sistema (`--fuente`: `system-ui`, Segoe UI, Roboto…). No se cargan fuentes externas.
- **Cuerpo:** 16 px, interlineado 1.5.
- **Escala:** `--texto-sm` 14 px · `--texto-base` 16 px · `--texto-lg` 18 px · `--texto-xl` 24 px (h2) · `--texto-2xl` 28–36 px (h1, se adapta al ancho).
- Los inputs usan siempre 16 px: con menos, iOS hace zoom al enfocarlos.
- Enlaces en azul oscuro y subrayados; al pasar el mouse el subrayado se engrosa y se vuelve ámbar.

## 4. Espaciado, forma y sombras

| Token | Valor |
|---|---|
| `--espacio-1` … `--espacio-6` | 4 · 8 · 16 · 24 · 32 · 48 px |
| `--radio-sm` / `-md` / `-lg` | 6 · 8 · 16 px |
| `--sombra-sm` / `-md` / `-lg` | Sombras teñidas de azul oscuro |
| `--alto-control` | 44 px (alto mínimo de botones e inputs, área táctil) |

## 5. Componentes

=======
| Azul oscuro sobre blanco | 14.1:1 | ✅ |
| Azul oscuro sobre ámbar | 6.6:1 | ✅ |
| Blanco sobre rojo (botón eliminar) | 4.8:1 | ✅ |
| `--color-texto-suave` sobre blanco / sobre `--color-fondo-hundido` | 7.5:1 / 6.6:1 | ✅ |
| `--color-error-texto` sobre `--color-error-fondo` | 5.9:1 | ✅ |
| `--color-exito-texto` sobre `--color-exito-fondo` | 4.9:1 | ✅ |
| `--color-aviso-texto` sobre `--color-acento-fondo` | 6.1:1 | ✅ |
| Blanco sobre `--color-lateral` / `--color-lateral-suave` sobre `--color-lateral` | 14.1:1 / 7.6:1 | ✅ |
| Blanco sobre `--color-panel` (login) | 17.2:1 | ✅ |
| Borde de input sobre blanco | 3.5:1 | ✅ (mínimo 3:1) |
| Blanco sobre verde | 3.3:1 | ⚠️ Solo texto grande o en negrita. Para texto normal, `--color-exito-texto` |
| Blanco sobre ámbar / ámbar sobre blanco | 2.2:1 | ❌ No usar. Sobre ámbar el texto va en azul oscuro y el ámbar nunca es color de texto sobre blanco |

## 3. Tipografía

- **Fuente:** la del sistema (`--fuente`). Para códigos SKU, `--fuente-mono`. No se cargan fuentes externas.
- **Cuerpo:** 16 px, interlineado 1.5.
- **Títulos:** peso 700 (h2, h3) y 800 en los grandes (`--peso-titulo`), con `letter-spacing` negativo (`--ajuste-titulo: -0.02em`).
- **Escala:** `--texto-xs` 12 · `--texto-sm` 14 · `--texto-base` 16 · `--texto-lg` 18 · `--texto-xl` 24 · `--texto-2xl` 28–36 (h1) · `--texto-3xl` 36–56 (titular del login) · `--texto-cifra` 36 (indicadores).
- Los inputs usan siempre 16 px: con menos, iOS hace zoom al enfocarlos.
- Enlaces en color primario y subrayados; al pasar el mouse el subrayado se engrosa y se vuelve ámbar.

## 4. Espaciado, forma y layout

| Token | Valor |
|---|---|
| `--espacio-1` … `--espacio-7` | 4 · 8 · 16 · 24 · 32 · 48 · 64 px |
| `--radio-sm` / `-md` / `-lg` / `-xl` | 6 · 8 · 16 · 20 px |
| `--radio-pildora` | 999 px (insignias, contador de notificaciones) |
| `--sombra-sm` / `-md` / `-lg` | Sombras teñidas de azul oscuro |
| `--alto-control` | 44 px (alto mínimo de botones e inputs) |
| `--ancho-lateral` | 15.5 rem (barra lateral en escritorio) |
| `--alto-superior` | 4.5 rem (barra superior) |

## 5. Componentes

### Iconos

Sprite en `/iconos.svg`. Disponibles: `i-panel`, `i-caja`, `i-etiqueta`, `i-buscar`, `i-campana`, `i-alerta`, `i-ok`, `i-mas`, `i-editar`, `i-eliminar`, `i-salir`, `i-flecha`, `i-pulso`, `i-intercambio`, `i-correo`, `i-candado`, `i-usuario`, `i-ojo`, `i-ojo-tachado` y el logo `logo`.

```html
<svg class="icono" aria-hidden="true" focusable="false"><use href="/iconos.svg#i-caja" /></svg>
```

- `.icono` mide 20 px y toma el color del texto (`currentColor`); `.icono-sm` mide 16 px.
- Siempre `aria-hidden="true"`: el significado lo da el texto o el `aria-label` del botón.
- El logo es **provisional** (cubo ámbar). Se reemplaza en `iconos.svg#logo` cuando haya logo definitivo.

### Marca

```html
<a class="marca" href="/">
  <svg class="marca-logo" aria-hidden="true" focusable="false"><use href="/iconos.svg#logo" /></svg>
  <span><span class="marca-nombre">FerroAdmin</span><span class="marca-lema">Gestión de inventario</span></span>
</a>
```

Pensada para zonas oscuras (panel de marca, barra lateral).

>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d
### Botones

```html
<button class="btn btn-primario">Guardar</button>
<button class="btn btn-acento">Nuevo producto</button>
<button class="btn btn-secundario">Cancelar</button>
<button class="btn btn-peligro">Eliminar</button>
<<<<<<< HEAD
<button class="btn btn-primario btn-bloque">Ocupa todo el ancho</button>
```

Deshabilitado: atributo `disabled` (o `aria-disabled="true"` en un enlace). Un solo `btn-primario` por pantalla.
=======
<button class="btn btn-fantasma">Acción terciaria</button>
<button class="btn btn-primario btn-grande btn-bloque">Entrar</button>
<button class="btn btn-acento btn-pequeno">
  <svg class="icono icono-sm" aria-hidden="true" focusable="false"><use href="/iconos.svg#i-mas" /></svg>Nuevo producto
</button>
<button class="btn-icono" type="button" aria-label="Editar Martillo de acero">
  <svg class="icono" aria-hidden="true" focusable="false"><use href="/iconos.svg#i-editar" /></svg>
</button>
```

- `.btn-icono` **exige** `aria-label` que diga la acción y el objeto ("Editar Martillo de acero", no solo "Editar").
- `data-cuenta="3"` en un `.btn-icono` muestra un contador rojo (notificaciones).
- Tamaños: `.btn-grande` 52 px, normal 44 px, `.btn-pequeno` 36 px y `.btn-icono` 40 px. Los dos últimos quedan por debajo de los 44 px recomendados: usarlos solo en tablas y cabeceras, nunca como acción principal en móvil.
- Deshabilitado: `disabled` (o `aria-disabled="true"` en un enlace). Un solo `btn-primario` por pantalla.
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d

### Campos

```html
<div class="campo">
  <label for="precio">Precio</label>
  <input type="text" id="precio" name="precio" />
  <p class="error" id="error-precio" aria-live="polite"></p>
</div>
```

<<<<<<< HEAD
- El `<p class="error">` va **siempre** en el HTML, vacío: es una región `aria-live` y vacío no ocupa espacio. El JavaScript solo le escribe el texto.
- Con error, el input recibe `aria-invalid="true"` (borde rojo) y se enlaza con `aria-describedby="error-<campo>"`. Al corregirlo se quita el atributo y se vacía el mensaje.
- También sirven `<select>` y `<textarea>` dentro de `.campo`.
- El mensaje de error lleva el símbolo ⚠ delante, para que el estado no dependa solo del color.

### Estados de foco

- Todos los elementos interactivos muestran, al navegar con teclado, un anillo azul oscuro de 3 px con halo ámbar (`:focus-visible`). No se quita nunca con `outline: none`.
- Sobre fondo azul oscuro (`.barra`) el anillo es blanco.

### Mensajes
=======
- Inputs de 48 px de alto. `<select>` lleva flecha propia.
- El `<p class="error">` va **siempre** en el HTML, vacío: es una región `aria-live` y vacío no ocupa espacio. El JavaScript solo le escribe el texto.
- Con error, el input recibe `aria-invalid="true"` (borde rojo de 2 px) y `aria-describedby="error-<campo>"`. El mensaje lleva ⚠ delante para no depender solo del color.

### Estados de foco

- Todo elemento interactivo muestra con teclado un anillo de 3 px en `--color-foco` con halo ámbar (`:focus-visible`). Nunca se quita con `outline: none`.
- En zonas oscuras (`.auth-marca`, `.app-lateral`, `.barra`) el anillo es claro.
- El buscador (`.buscador`) marca el foco en su contenedor (`:focus-within`), no en el input.

### Mensajes y estado de conexión
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d

```html
<p class="mensaje mensaje-exito" role="status">Producto creado correctamente.</p>
<p class="mensaje mensaje-error" role="alert">Correo o clave incorrectos.</p>
<p class="mensaje mensaje-aviso">Quedan pocas unidades.</p>
<p class="mensaje">Información.</p>
```

<<<<<<< HEAD
Cada uno lleva borde izquierdo de color y un símbolo (✔ ✖ ! ℹ). Usar `role="alert"` solo para errores.

El estado de conexión (`#api-status`) usa `class="estado"` y `data-estado="ok"` o `"error"`.

### Tabla de inventario y stock
=======
- Borde completo tintado del color del estado, fondo suave y símbolo (✔ ✖ ! ℹ). `role="alert"` solo para errores.
- `#api-status` usa `class="estado"` y `data-estado="ok"` o `"error"`: es una píldora con símbolo y texto.

### Insignias de stock

```html
<span class="insignia insignia-ok">Disponible</span>
<span class="insignia insignia-bajo">Stock bajo</span>
<span class="insignia insignia-agotado">Agotado</span>
```

Píldora con un punto de color y texto (el texto es obligatorio: el color solo no basta).

### Tabla de inventario
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d

```html
<div class="tabla-contenedor">
  <table class="tabla">
<<<<<<< HEAD
    <thead><tr><th scope="col">Producto</th><th scope="col" class="numero">Stock</th></tr></thead>
    <tbody>
      <tr>
        <td data-label="Producto">Martillo</td>
        <td data-label="Stock" class="numero"><span class="insignia insignia-ok">12</span></td>
=======
    <caption class="sr-only">Productos del inventario</caption>
    <thead>
      <tr><th scope="col">Producto</th><th scope="col" class="numero">Stock</th><th scope="col">Estado</th><th scope="col"><span class="sr-only">Acciones</span></th></tr>
    </thead>
    <tbody>
      <tr>
        <td data-label="Producto"><span>Martillo de acero<span class="sku">FER-00012</span></span></td>
        <td data-label="Stock" class="numero">25</td>
        <td data-label="Estado"><span class="insignia insignia-ok">Disponible</span></td>
        <td class="acciones">
          <button class="btn-icono" type="button" aria-label="Editar Martillo de acero"><svg class="icono" aria-hidden="true" focusable="false"><use href="/iconos.svg#i-editar" /></svg></button>
          <button class="btn-icono" type="button" aria-label="Eliminar Martillo de acero"><svg class="icono" aria-hidden="true" focusable="false"><use href="/iconos.svg#i-eliminar" /></svg></button>
        </td>
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d
      </tr>
    </tbody>
  </table>
</div>
```

<<<<<<< HEAD
- `data-label` es obligatorio en cada `<td>`: en móvil la fila pasa a tarjeta y esa etiqueta hace de encabezado.
- La columna de botones lleva `class="acciones"` y no necesita `data-label`.
- Insignias de stock: `insignia-ok` (verde, hay), `insignia-bajo` (ámbar, quedan pocas), `insignia-agotado` (rojo, 0).

### Barra superior

```html
<header class="barra">
  <div class="contenedor barra-interior">
    <span class="barra-marca">FerroAdmin</span>
    <nav aria-label="Principal">
      <a href="/inventario" aria-current="page">Inventario</a>
    </nav>
  </div>
</header>
```

El enlace de la página actual lleva `aria-current="page"` y se ve ámbar con texto azul oscuro.

### Modal

```html
<div class="modal-fondo">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal">
    <h2 id="titulo-modal">Eliminar producto</h2>
    <p>Esta acción no se puede deshacer.</p>
    <div class="modal-acciones">
      <button class="btn btn-secundario">Cancelar</button>
      <button class="btn btn-peligro">Eliminar</button>
    </div>
=======
- Encabezado claro en mayúsculas pequeñas. La primera columna va en negrita; `.sku` muestra el código en fuente monoespaciada debajo del nombre.
- `data-label` es obligatorio en cada `<td>` (salvo `.acciones`): bajo 640 px cada fila pasa a tarjeta y esa etiqueta hace de encabezado.

### Barra simple, modal y 404

- `.barra` + `.barra-interior` + `.barra-marca`: barra superior oscura para páginas sin barra lateral. Ítem activo con `aria-current="page"` (ámbar con texto azul oscuro).
- Modal: `.modal-fondo` > `.modal` (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) > `.modal-acciones`. El JavaScript mueve el foco al abrir, cierra con Escape y devuelve el foco al botón que lo abrió.
- 404: `<main class="contenedor vista-404"><p class="codigo">404</p><h1>Página no encontrada</h1><a class="btn btn-acento" href="/">Volver al inicio</a></main>`.

### Utilidades

`.contenedor`, `.pagina-centrada`, `.tarjeta`, `.texto-centrado`, `.texto-suave`, `.sr-only`.

## 6. Login y registro: pantalla dividida (`auth.css`)

`index.html` es un **cascarón fijo**: el panel de marca y el estado del servidor están en el HTML, y `js/app.js` solo pinta dentro de `#vista` el formulario que toca según la ruta (`#/login` o `#/registro`).

```html
<div class="auth">
  <section class="auth-marca" aria-label="FerroAdmin">
    <svg class="auth-arte" …>…patrón isométrico…</svg>
    <span class="auth-resplandor" aria-hidden="true"></span>
    <a class="marca" href="/">…</a>
    <div class="auth-marca-cuerpo">
      <p class="auth-titular" role="presentation">Cada tornillo, en su lugar.</p>
      <p class="auth-texto">…</p>
    </div>
    <div class="auth-escena" aria-hidden="true">
      <svg class="auth-torre" …>…torre de cubos…</svg>
      <div class="auth-ficha auth-ficha-1">…</div>
    </div>
  </section>
  <main class="auth-panel">
    <div class="auth-columna">
      <div id="vista" class="auth-formulario"></div>   <!-- aquí pinta js/app.js -->
      <p id="api-status" class="estado" role="status">…</p>
    </div>
  </main>
</div>
```

Plantilla de un formulario (dentro de `#vista`):

```html
<h1>Iniciar sesión</h1>
<p class="auth-subtitulo">Ingresa para gestionar tu inventario.</p>
<form id="form-login" novalidate>
  <div class="campo">
    <label for="email">Correo electrónico</label>
    <div class="campo-control">
      <svg class="icono" aria-hidden="true" focusable="false"><use href="/iconos.svg#i-correo" /></svg>
      <input type="email" id="email" name="email" … />
    </div>
    <p class="error" id="error-email" aria-live="polite"></p>
  </div>
  <div class="campo">
    <label for="password">Clave</label>
    <div class="campo-control campo-clave">
      <svg class="icono" …><use href="/iconos.svg#i-candado" /></svg>
      <input type="password" id="password" … />
      <button type="button" class="btn-icono ver-clave" data-objetivo="password" aria-label="Mostrar clave">
        <svg class="icono" …><use href="/iconos.svg#i-ojo" /></svg>
      </button>
    </div>
    <p class="error" id="error-password" aria-live="polite"></p>
  </div>
  <button type="submit" class="btn btn-primario btn-grande btn-bloque">Entrar <svg class="icono" …>…i-flecha…</svg></button>
</form>
<p class="auth-alterno">¿No tienes cuenta? <a href="#/registro">Registrar</a></p>
```

- **Izquierda (`.auth-marca`):** fondo `--color-panel` con bordes redondeados, patrón isométrico que se desvanece, resplandor ámbar, torre de cubos (`cubo-sup/izq/der`, `cubo-acento-*`, colores desde `--cubo-*`) y fichas flotantes de vidrio (`.auth-ficha`). Todo decorativo (`aria-hidden`).
- **Derecha (`.auth-panel`):** el formulario va en tarjeta (`.auth-formulario`, ancho máximo 26 rem) con animación de entrada.
- **`.campo-control`:** campo con icono a la izquierda. Con `.campo-clave` además lleva el botón `.ver-clave` a la derecha; `js/app.js` alterna el tipo del input, el icono (`i-ojo` ↔ `i-ojo-tachado`) y el `aria-label` (Mostrar/Ocultar clave).
- **Móvil (hasta 899 px):** solo una franja de marca arriba (logo y nombre) y el formulario debajo. El titular y la escena se ocultan.
- **Desde 900 px:** dos columnas (1.1 : 1). Con poca altura (≤ 700 px) se oculta la escena y se compactan los espacios.
- El registro usa la misma tarjeta con los campos nombre (`i-usuario`), correo, clave y confirmar clave.
- **Pendiente del equipo:** las rutas usan hash (`#/login`, `#/registro`); el contrato (§1.2) pide History API (`/login`, `/registro`) con las vistas en `js/auth.js`.

## 7. Estructura de la aplicación (`app.css`)

Para la vista de inventario (renderizada por el JavaScript dentro de `index.html`):

```html
<div class="app">
  <aside class="app-lateral">
    <a class="marca" href="/inventario">…</a>
    <nav aria-label="Principal">
      <ul class="app-nav">
        <li><a href="/inventario" aria-current="page"><svg class="icono" …><use href="/iconos.svg#i-caja" /></svg>Inventario</a></li>
      </ul>
    </nav>
    <button class="app-salir" type="button"><svg class="icono" …><use href="/iconos.svg#i-salir" /></svg>Cerrar sesión</button>
  </aside>

  <div class="app-principal">
    <header class="app-superior">
      <label class="buscador">
        <svg class="icono" …><use href="/iconos.svg#i-buscar" /></svg>
        <span class="sr-only">Buscar producto</span>
        <input type="search" placeholder="Buscar producto" />
      </label>
      <div class="app-usuario">
        <span class="avatar" aria-hidden="true">AG</span>
        <span class="app-usuario-nombre">Ana Gómez</span>
      </div>
    </header>

    <main class="app-contenido">
      <div class="cabecera-pagina"><h1>Inventario</h1><p>Resumen general</p></div>

      <div class="indicadores">
        <div class="indicador">
          <span class="indicador-icono"><svg class="icono" …><use href="/iconos.svg#i-caja" /></svg></span>
          <div><p class="indicador-etiqueta">Total de productos</p><p class="indicador-valor">128</p></div>
        </div>
        <!-- indicador-icono-ok (verde) e indicador-icono-aviso (ámbar) -->
      </div>

      <div class="panel-columnas">
        <section class="tarjeta seccion" aria-labelledby="t-inventario">
          <div class="seccion-cabecera"><h2 id="t-inventario">Productos</h2><button class="btn btn-acento btn-pequeno">…Nuevo producto</button></div>
          <div class="herramientas"><!-- .campo de búsqueda y .campo de categoría --></div>
          <!-- .tabla-contenedor -->
        </section>
        <section class="tarjeta seccion" aria-labelledby="t-bajo">
          <h2 class="titulo-aviso" id="t-bajo"><svg class="icono" …><use href="/iconos.svg#i-alerta" /></svg>Stock bajo</h2>
          <ul class="lista-alertas"><li>Taladro eléctrico<span class="insignia insignia-bajo">5 uds</span></li></ul>
        </section>
      </div>
    </main>
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d
  </div>
</div>
```

<<<<<<< HEAD
El JavaScript debe mover el foco al modal al abrirlo, cerrarlo con Escape y devolver el foco al botón que lo abrió.

### Página 404

```html
<main class="contenedor vista-404">
  <p class="codigo">404</p>
  <h1>Página no encontrada</h1>
  <a class="btn btn-acento" href="/">Volver al inicio</a>
</main>
```

### Utilidades

`.contenedor` (ancho máximo 72 rem centrado), `.pagina-centrada` (centra una tarjeta en la pantalla), `.tarjeta`, `.texto-centrado`, `.texto-suave`, `.sr-only` (texto solo para lectores de pantalla).

## 6. Login y registro: tarjeta con difuminado

La clase `.auth-tarjeta` crea un efecto de vidrio esmerilado sobre el fondo de ondas:

| Propiedad | Valor |
|---|---|
| Fondo | Blanco al 78 % (`--vidrio-fondo`) |
| Difuminado | `backdrop-filter: blur(14px) saturate(140%)` (`--blur-vidrio`) |
| Borde | Blanco al 65 % de 1 px |
| Ancho | `min(100%, 26rem)` |
| Respaldo | Si el navegador no soporta `backdrop-filter`, la tarjeta es blanca opaca (`@supports`) |

Reglas:

- Los inputs dentro de la tarjeta son **blancos sólidos**, no translúcidos.
- Los errores usan `--color-error-texto` (5.3:1 incluso sobre la parte roja del fondo).
- El texto secundario usa `--color-texto-suave` (mínimo 6.1:1 sobre cualquier color del fondo).
- Solo se usa en pantallas con el fondo de ondas (login y registro). Las pantallas internas usan `.tarjeta`.

## 7. Fondo de ondulaciones

SVG inline al inicio del `<body>` de `index.html` (inline para que `fill="var(--color-...)"` use la paleta). Cuatro ondas (azul oscuro, ámbar, verde y rojo) sobre el fondo claro, que se desplazan lentamente; con "reducir movimiento" activado en el sistema se quedan quietas. Las pantallas internas de la aplicación (inventario) no lo llevan: usan el fondo liso `--color-fondo`.

**No poner `background` en `<body>`**: se pintaría encima de las ondas. El fondo de página va en `html` (ya está en `base.css`).
=======
- Ítem activo de la barra lateral: `aria-current="page"` (fondo más claro e icono ámbar).
- Los enlaces de la navegación usan las rutas SPA del contrato §1.2 (`/inventario`), no archivos `.html`.
- `.lista-alertas`, `.indicadores` y la campana de notificaciones son solo visuales: la lógica es de otras tareas.
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d

## 8. Diseño responsive

Mobile-first: los estilos base son los del móvil y se amplían con `min-width`.

<<<<<<< HEAD
| Nombre | Ancho | Cambios |
|---|---|---|
| Móvil | hasta 639 px | Tabla en tarjetas, botones del modal a todo el ancho, tarjetas con relleno de 24 px |
| Tablet | desde 640 px | Tabla normal, relleno de tarjetas de 32 px |
| Escritorio | desde 1024 px | `.contenedor` llega a 72 rem |

- Las media queries no aceptan variables CSS: se escriben los valores 640 px y 1024 px.
- Mínimo de ancho soportado: 320 px. La página nunca debe tener scroll horizontal; solo `.tabla-contenedor` puede desplazarse.
- Botones e inputs miden al menos 44 px de alto.

## 9. Lista de revisión antes de un PR de frontend

- [ ] Sin colores sueltos: solo `var(--color-...)`.
- [ ] Se puede usar todo con teclado y el foco se ve en cada elemento.
- [ ] Los errores se muestran con texto (no solo con color) y en `#error-<campo>`.
- [ ] Se ve bien a 360 px, 768 px y 1280 px, sin scroll horizontal.
- [ ] Texto sobre ámbar en azul oscuro; nunca blanco ni ámbar como color de texto.
- [ ] Se reutilizaron los componentes de la sección 5.

## 10. Cómo se cambia esta guía

Igual que el contrato (§9): con un PR que modifique este archivo y los CSS a la vez. Cambiar un color de la paleta también exige actualizar `CONTRATO_API.md` §1.4 y `ESPECIFICACIONES.md`.
=======
| Zona | Móvil | Desde 640 px | Desde 900 px | Desde 1024 px |
|---|---|---|---|---|
| Componentes | Tabla en tarjetas, botones del modal a todo el ancho | Tabla normal | — | — |
| `.app` | Barra lateral como franja horizontal arriba, indicadores en una columna | Indicadores en 3 columnas, nombre de usuario visible | — | Barra lateral fija a la izquierda, contenido en dos columnas |
| `.auth` | Franja de marca + formulario | — | Pantalla dividida | — |

- Las media queries no aceptan variables: se escriben los valores. `.auth` usa 900 px (excepción a la regla 640/1024).
- Ancho mínimo soportado: 320 px. La página nunca tiene scroll horizontal; solo `.tabla-contenedor` y la navegación móvil pueden desplazarse.

## 9. Tema oscuro opcional

`tokens.css` incluye un tema oscuro que se activa con `<html data-tema="oscuro">`. Solo redefine variables: los componentes no cambian. No hay conmutador ni `prefers-color-scheme`; agregar uno (y guardar la elección en `localStorage`) es una tarea aparte. Sus colores no forman parte de la paleta del contrato y son el único lugar, junto a la paleta, donde se escriben hexadecimales.

Contraste en tema oscuro: texto 13.5:1, texto suave 8.4:1, texto sobre botón principal 14.9:1, mensajes 7.4–8.6:1.

## 10. Lista de revisión antes de un PR de frontend

- [ ] Sin colores sueltos: `grep -nE "#[0-9a-fA-F]{3,8}\b|rgb\(" frontend/src/css/*.css` solo encuentra `tokens.css`.
- [ ] Sin archivos `.html` nuevos.
- [ ] Todo se puede usar con teclado y el foco se ve.
- [ ] Botones de solo icono con `aria-label`; iconos con `aria-hidden="true"`.
- [ ] Errores con texto (no solo color) en `#error-<campo>`.
- [ ] Se ve bien a 320, 390, 768, 1024 y 1360 px sin scroll horizontal.
- [ ] Texto sobre ámbar en azul oscuro.

## 11. Cómo se cambia esta guía

Con un PR que modifique este archivo y los CSS a la vez (igual que el contrato §9). Cambiar un color de la paleta exige actualizar también `CONTRATO_API.md` §1.4 y `ESPECIFICACIONES.md`.
>>>>>>> c53fa010803da289a4c2400d9e945d8323a6169d
