# 🎨 Guía visual — FerroAdmin

> Paleta, tipografía y componentes compartidos del frontend. Los colores oficiales están en `CONTRATO_API.md` §1.4; este documento dice cómo usarlos.
> Muestra viva: con el frontend en marcha (`npm run dev`), abrir **`/guia.html`**.

## 1. Cómo usarla

`frontend/src/index.html` (y cualquier página nueva) carga un solo archivo:

```html
<link rel="stylesheet" href="/css/main.css" />
```

`main.css` importa, en este orden:

| Archivo | Qué tiene |
|---|---|
| `css/tokens.css` | Variables: colores, tipografía, espaciado, radios, sombras, foco, difuminado |
| `css/base.css` | Reset mínimo, tipografía, enlaces, foco visible, utilidades |
| `css/fondo.css` | Fondo de ondulaciones (SVG de `index.html`) |
| `css/componentes.css` | Botones, campos, mensajes, tablas, barra, modal, 404, tarjeta de vidrio |

**Reglas para todo el equipo**

1. No se escriben códigos de color (`#abc123`, `rgb()`) fuera de `tokens.css`. Se usa `var(--color-...)`.
2. No se agrega un componente propio si ya existe uno aquí. Si falta algo, se agrega a `componentes.css` mediante un PR.
3. Los nombres de clase van en español y en minúsculas con guiones (`.btn-primario`).
4. Los `id` y `name` de los formularios no cambian por estilos: el JavaScript y el contrato dependen de ellos.

## 2. Paleta

| Variable | Color | Hex | Uso |
|---|---|---|---|
| `--color-primario` | Azul oscuro | `#172B4D` | Texto principal, títulos, botón principal, barra superior |
| `--color-acento` | Ámbar | `#F59E0B` | Elemento activo, resaltados, acción destacada |
| `--color-fondo` | Fondo | `#F8FAFC` | Fondo de la página |
| `--color-tarjeta` | Tarjetas | `#FFFFFF` | Tarjetas, tabla, formularios, modales |
| `--color-exito` | Éxito | `#16A34A` | Confirmaciones |
| `--color-error` | Error | `#DC2626` | Errores y acciones de eliminar |

### Derivados

No son colores nuevos: se calculan con `color-mix()` a partir de los 6 anteriores.

| Variable | Fórmula | Uso |
|---|---|---|
| `--color-texto` | `--color-primario` | Color de texto por defecto |
| `--color-texto-suave` | primario 80 % + blanco | Texto secundario, placeholders |
| `--color-borde` | primario 18 % + blanco | Bordes de tarjetas y separadores |
| `--color-borde-campo` | primario 55 % + blanco | Borde de inputs |
| `--color-primario-hover` | primario 85 % + blanco | Botón principal al pasar el mouse |
| `--color-acento-hover` | ámbar 88 % + negro | Botón ámbar al pasar el mouse |
| `--color-error-hover` | error 85 % + negro | Botón de eliminar al pasar el mouse |
| `--color-exito-fondo`, `--color-error-fondo`, `--color-acento-fondo` | color 10 % o 20 % + blanco | Fondo de mensajes e insignias |
| `--color-exito-texto`, `--color-error-texto` | color 75 % u 80 % + negro | Texto verde o rojo sobre fondos claros o sobre vidrio |

### Contraste (WCAG AA: 4.5:1 texto normal, 3:1 texto grande y controles)

Calculados con la fórmula de luminancia relativa de WCAG 2.1.

| Combinación | Contraste | Resultado |
|---|---|---|
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

### Botones

```html
<button class="btn btn-primario">Guardar</button>
<button class="btn btn-acento">Nuevo producto</button>
<button class="btn btn-secundario">Cancelar</button>
<button class="btn btn-peligro">Eliminar</button>
<button class="btn btn-primario btn-bloque">Ocupa todo el ancho</button>
```

Deshabilitado: atributo `disabled` (o `aria-disabled="true"` en un enlace). Un solo `btn-primario` por pantalla.

### Campos

```html
<div class="campo">
  <label for="precio">Precio</label>
  <input type="text" id="precio" name="precio" />
  <p class="error" id="error-precio" aria-live="polite"></p>
</div>
```

- El `<p class="error">` va **siempre** en el HTML, vacío: es una región `aria-live` y vacío no ocupa espacio. El JavaScript solo le escribe el texto.
- Con error, el input recibe `aria-invalid="true"` (borde rojo) y se enlaza con `aria-describedby="error-<campo>"`. Al corregirlo se quita el atributo y se vacía el mensaje.
- También sirven `<select>` y `<textarea>` dentro de `.campo`.
- El mensaje de error lleva el símbolo ⚠ delante, para que el estado no dependa solo del color.

### Estados de foco

- Todos los elementos interactivos muestran, al navegar con teclado, un anillo azul oscuro de 3 px con halo ámbar (`:focus-visible`). No se quita nunca con `outline: none`.
- Sobre fondo azul oscuro (`.barra`) el anillo es blanco.

### Mensajes

```html
<p class="mensaje mensaje-exito" role="status">Producto creado correctamente.</p>
<p class="mensaje mensaje-error" role="alert">Correo o clave incorrectos.</p>
<p class="mensaje mensaje-aviso">Quedan pocas unidades.</p>
<p class="mensaje">Información.</p>
```

Cada uno lleva borde izquierdo de color y un símbolo (✔ ✖ ! ℹ). Usar `role="alert"` solo para errores.

El estado de conexión (`#api-status`) usa `class="estado"` y `data-estado="ok"` o `"error"`.

### Tabla de inventario y stock

```html
<div class="tabla-contenedor">
  <table class="tabla">
    <thead><tr><th scope="col">Producto</th><th scope="col" class="numero">Stock</th></tr></thead>
    <tbody>
      <tr>
        <td data-label="Producto">Martillo</td>
        <td data-label="Stock" class="numero"><span class="insignia insignia-ok">12</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

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
  </div>
</div>
```

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

## 8. Diseño responsive

Mobile-first: los estilos base son los del móvil y se amplían con `min-width`.

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
