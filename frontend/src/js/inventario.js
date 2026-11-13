import { api, ErrorApi } from './api.js';
import { cerrarSesion } from './auth.js';

// Vista de inventario (T04): tabla, búsqueda en tiempo real, filtro por categoría,
// paginación y formularios de crear, editar, ajustar stock y eliminar.
// Usa los endpoints del CONTRATO_API.md §5.4 y §5.5 y las clases de GUIA_VISUAL.md §5 y §7.

const ESPERA_BUSQUEDA_MS = 300; // debounce de la búsqueda (§1.2)
const PRODUCTOS_POR_PAGINA = 10;
const STOCK_BAJO = 5; // con este stock o menos, la insignia es "Stock bajo"

// Pesos sin decimales ("$ 28.500"); si el precio tiene centavos, siempre con dos ("$ 28.500,50").
const formatoEntero = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const formatoDecimal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 });
const formatoPrecio = {
  format: (precio) => (Number.isInteger(precio) ? formatoEntero : formatoDecimal).format(precio),
};

// Estado de la vista. Se reinicia cada vez que se entra a #/inventario.
let raiz;
let estado;

const icono = (nombre, extra = '') =>
  `<svg class="icono ${extra}" aria-hidden="true" focusable="false"><use href="/iconos.svg#${nombre}" /></svg>`;

// Los datos de la API se escriben con innerHTML: siempre pasan por aquí.
const esc = (valor) =>
  String(valor).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const $ = (selector) => raiz.querySelector(selector);

const mensajeDe = (error) =>
  error instanceof ErrorApi ? error.message : 'Ocurrió un error inesperado.';

// ---------- Plantilla ----------

function iniciales(nombre) {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('');
}

const plantilla = (usuario) => `
  <div class="app">
    <aside class="app-lateral">
      <a class="marca" href="#/inventario">
        <svg class="marca-logo" aria-hidden="true" focusable="false"><use href="/iconos.svg#logo" /></svg>
        <span><span class="marca-nombre">FerroAdmin</span><span class="marca-lema">Gestión de inventario</span></span>
      </a>
      <nav aria-label="Principal">
        <ul class="app-nav">
          <li><a href="#/inventario" aria-current="page">${icono('i-caja')}Inventario</a></li>
        </ul>
      </nav>
      <button class="app-salir" type="button" id="btn-salir">${icono('i-salir')}Cerrar sesión</button>
    </aside>

    <div class="app-principal">
      <header class="app-superior">
        <label class="buscador">
          ${icono('i-buscar')}
          <span class="sr-only">Buscar producto</span>
          <input type="search" id="buscar" placeholder="Buscar producto" maxlength="100" autocomplete="off" />
        </label>
        <div class="app-usuario">
          <span class="avatar" aria-hidden="true">${esc(iniciales(usuario.nombre ?? ''))}</span>
          <span class="app-usuario-nombre">${esc(usuario.nombre ?? '')}</span>
        </div>
      </header>

      <main class="app-contenido">
        <div class="cabecera-pagina"><h1>Inventario</h1><p>Catálogo de productos</p></div>

        <section class="tarjeta seccion" aria-labelledby="t-inventario">
          <div class="seccion-cabecera">
            <h2 id="t-inventario">Productos</h2>
            <button class="btn btn-acento btn-pequeno" type="button" id="btn-nuevo">${icono('i-mas', 'icono-sm')}Nuevo producto</button>
          </div>

          <div class="herramientas">
            <div class="campo">
              <label for="filtro-categoria">Categoría</label>
              <select id="filtro-categoria"><option value="">Todas las categorías</option></select>
            </div>
          </div>

          <div id="aviso" aria-live="polite"></div>
          <div id="listado"></div>

          <div class="paginacion">
            <p class="texto-suave" id="resumen" role="status"></p>
            <div class="paginacion-botones">
              <button class="btn btn-secundario btn-pequeno" type="button" id="btn-anterior">Anterior</button>
              <button class="btn btn-secundario btn-pequeno" type="button" id="btn-siguiente">Siguiente</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
`;

// ---------- Listado ----------

function insignia(stock) {
  if (stock === 0) return '<span class="insignia insignia-agotado">Agotado</span>';
  if (stock <= STOCK_BAJO) return '<span class="insignia insignia-bajo">Stock bajo</span>';
  return '<span class="insignia insignia-ok">Disponible</span>';
}

const fila = (p) => `
  <tr>
    <td data-label="Producto">${esc(p.nombre)}</td>
    <td data-label="Categoría">${p.categoria ? esc(p.categoria.nombre) : 'Sin categoría'}</td>
    <td data-label="Precio" class="numero">${esc(formatoPrecio.format(p.precio))}</td>
    <td data-label="Stock" class="numero">${p.stock}</td>
    <td data-label="Estado">${insignia(p.stock)}</td>
    <td class="acciones">
      <button class="btn-icono" type="button" data-accion="stock" data-id="${p.id}" aria-label="Ajustar stock de ${esc(p.nombre)}">${icono('i-intercambio')}</button>
      <button class="btn-icono" type="button" data-accion="editar" data-id="${p.id}" aria-label="Editar ${esc(p.nombre)}">${icono('i-editar')}</button>
      <button class="btn-icono" type="button" data-accion="eliminar" data-id="${p.id}" aria-label="Eliminar ${esc(p.nombre)}">${icono('i-eliminar')}</button>
    </td>
  </tr>
`;

function pintarListado() {
  const { productos, meta, buscar, categoriaId } = estado;
  const listado = $('#listado');

  if (productos.length === 0) {
    const hayFiltros = buscar !== '' || categoriaId !== '';
    listado.innerHTML = `<p class="mensaje">${
      hayFiltros
        ? 'Ningún producto coincide con la búsqueda.'
        : 'Todavía no hay productos. Crea el primero con «Nuevo producto».'
    }</p>`;
  } else {
    listado.innerHTML = `
      <div class="tabla-contenedor">
        <table class="tabla">
          <caption class="sr-only">Productos del inventario</caption>
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col">Categoría</th>
              <th scope="col" class="numero">Precio</th>
              <th scope="col" class="numero">Stock</th>
              <th scope="col">Estado</th>
              <th scope="col"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>${productos.map(fila).join('')}</tbody>
        </table>
      </div>
    `;
  }

  const paginas = Math.max(meta.totalPaginas, 1);
  $('#resumen').textContent =
    meta.total === 0
      ? '0 productos'
      : `${meta.total} ${meta.total === 1 ? 'producto' : 'productos'} · Página ${meta.pagina} de ${paginas}`;
  $('#btn-anterior').disabled = meta.pagina <= 1;
  $('#btn-siguiente').disabled = meta.pagina >= paginas;
}

function avisar(texto, tipo = 'exito') {
  const aviso = $('#aviso');
  if (!texto) {
    aviso.innerHTML = '';
    return;
  }
  const rol = tipo === 'error' ? 'alert' : 'status';
  aviso.innerHTML = `<p class="mensaje mensaje-${tipo}" role="${rol}">${esc(texto)}</p>`;
}

// Pide la página actual con los filtros actuales. Si llega una respuesta
// de una petición anterior (el usuario siguió escribiendo), se descarta.
async function cargarProductos() {
  const vista = estado;
  const turno = ++vista.peticion;

  const parametros = new URLSearchParams({
    pagina: vista.pagina,
    limite: PRODUCTOS_POR_PAGINA,
  });
  if (vista.buscar) parametros.set('buscar', vista.buscar);
  if (vista.categoriaId) parametros.set('categoriaId', vista.categoriaId);

  try {
    const { data, meta } = await api(`/productos?${parametros}`);
    if (vista !== estado || turno !== vista.peticion) return;

    // Si se eliminó el último producto de una página, se retrocede una.
    if (data.length === 0 && meta.total > 0 && vista.pagina > 1) {
      vista.pagina = Math.max(meta.totalPaginas, 1);
      await cargarProductos();
      return;
    }

    vista.productos = data;
    vista.meta = meta;
    pintarListado();
  } catch (error) {
    if (vista !== estado || turno !== vista.peticion) return;
    if (error.codigo !== 'NO_AUTENTICADO') avisar(mensajeDe(error), 'error');
  }
}

async function cargarCategorias() {
  const vista = estado;
  try {
    const { data } = await api('/categorias');
    if (vista !== estado) return;
    vista.categorias = data;
    $('#filtro-categoria').insertAdjacentHTML('beforeend', opcionesCategoria());
  } catch (error) {
    if (vista !== estado) return;
    if (error.codigo !== 'NO_AUTENTICADO') avisar(mensajeDe(error), 'error');
  }
}

const opcionesCategoria = (seleccionada) =>
  estado.categorias
    .map((c) => `<option value="${c.id}"${c.id === seleccionada ? ' selected' : ''}>${esc(c.nombre)}</option>`)
    .join('');

// ---------- Modal ----------

const campo = (id, etiqueta, control) => `
  <div class="campo">
    <label for="${id}">${etiqueta}</label>
    ${control}
    <p class="error" id="error-${id}" aria-live="polite"></p>
  </div>
`;

// Escribe el mensaje bajo el campo del modal. Devuelve true si el campo es válido.
function marcar(form, id, mensaje) {
  const control = form.querySelector(`#${id}`);
  const error = form.querySelector(`#error-${id}`);
  if (!control || !error) return false;
  error.textContent = mensaje;
  control.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  return mensaje === '';
}

/**
 * Abre un modal con un formulario. `alConfirmar(form)` devuelve el texto de éxito
 * o lanza un error. Devuelve '' (sin llamar a la API) si la validación local falla.
 */
function abrirModal({ titulo, cuerpo, textoAccion, claseAccion = 'btn-primario', alConfirmar }) {
  const origen = document.activeElement;
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <h2 id="modal-titulo">${titulo}</h2>
      <form novalidate>
        ${cuerpo}
        <p class="error" id="error-modal" aria-live="polite"></p>
        <div class="modal-acciones">
          <button class="btn btn-secundario" type="button" data-cerrar>Cancelar</button>
          <button class="btn ${claseAccion}" type="submit">${textoAccion}</button>
        </div>
      </form>
    </div>
  `;
  raiz.append(fondo);

  const form = fondo.querySelector('form');
  const enfocables = () =>
    [...fondo.querySelectorAll('input, select, button')].filter((el) => !el.disabled);

  const cerrar = () => {
    fondo.remove();
    // El foco vuelve al botón que abrió el modal; si la tabla se repintó, al de "Nuevo producto".
    (origen?.isConnected ? origen : $('#btn-nuevo'))?.focus();
  };

  fondo.addEventListener('mousedown', (evento) => {
    if (evento.target === fondo) cerrar();
  });
  fondo.querySelector('[data-cerrar]').addEventListener('click', cerrar);

  fondo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      cerrar();
      return;
    }
    if (evento.key !== 'Tab') return;

    // El foco no sale del modal mientras está abierto.
    const lista = enfocables();
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const enviar = form.querySelector('button[type="submit"]');
    form.querySelector('#error-modal').textContent = '';
    enviar.disabled = true;

    try {
      const exito = await alConfirmar(form);
      if (!exito) {
        enviar.disabled = false;
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      cerrar();
      avisar(exito);
      await cargarProductos();
    } catch (error) {
      enviar.disabled = false;
      if (error.codigo === 'NO_AUTENTICADO') return;

      // Los errores de validación de la API se muestran bajo su campo (§3.2).
      let sinCampo = error.detalles?.length ? '' : mensajeDe(error);
      for (const detalle of error.detalles ?? []) {
        if (!form.querySelector(`#error-${detalle.campo}`)) sinCampo = detalle.mensaje;
        else marcar(form, detalle.campo, detalle.mensaje);
      }
      // 409 por nombre repetido: el mensaje va en el campo nombre.
      if (error.codigo === 'CONFLICTO' && form.querySelector('#nombre')) {
        marcar(form, 'nombre', error.message);
        sinCampo = '';
      }
      form.querySelector('#error-modal').textContent = sinCampo;
      form.querySelector('[aria-invalid="true"]')?.focus();
    }
  });

  (form.querySelector('input, select') ?? fondo.querySelector('[data-cerrar]')).focus();
}

// ---------- Formularios ----------

// Lee y valida los 4 campos del producto (§5.2). Devuelve null si hay errores.
function leerProducto(form) {
  const nombre = form.querySelector('#nombre').value.trim();
  const categoria = form.querySelector('#categoriaId').value;
  const precio = form.querySelector('#precio').value.trim().replace(',', '.');
  const stock = form.querySelector('#stock').value.trim();

  const validos = [
    marcar(form, 'nombre',
      nombre === '' ? 'El nombre es obligatorio.'
        : nombre.length < 2 || nombre.length > 120 ? 'Debe tener entre 2 y 120 caracteres.' : ''),
    marcar(form, 'categoriaId', categoria === '' ? 'Selecciona una categoría.' : ''),
    marcar(form, 'precio',
      precio === '' ? 'El precio es obligatorio.'
        : !/^\d+(\.\d{1,2})?$/.test(precio) ? 'Escribe un número mayor o igual a 0, con máximo 2 decimales.' : ''),
    marcar(form, 'stock',
      stock === '' ? 'El stock es obligatorio.'
        : !/^\d+$/.test(stock) ? 'Escribe un número entero mayor o igual a 0.' : ''),
  ];

  if (validos.includes(false)) return null;
  return { nombre, categoriaId: Number(categoria), precio: Number(precio), stock: Number(stock) };
}

function abrirFormularioProducto(producto) {
  const editando = Boolean(producto);

  abrirModal({
    titulo: editando ? 'Editar producto' : 'Nuevo producto',
    textoAccion: editando ? 'Guardar cambios' : 'Crear producto',
    cuerpo:
      campo('nombre', 'Nombre',
        `<input type="text" id="nombre" name="nombre" maxlength="120" autocomplete="off" aria-describedby="error-nombre" value="${editando ? esc(producto.nombre) : ''}" />`) +
      campo('categoriaId', 'Categoría',
        `<select id="categoriaId" name="categoriaId" aria-describedby="error-categoriaId">
           <option value="">Selecciona una categoría</option>
           ${opcionesCategoria(producto?.categoria?.id)}
         </select>`) +
      campo('precio', 'Precio',
        `<input type="text" id="precio" name="precio" inputmode="decimal" autocomplete="off" aria-describedby="error-precio" value="${editando ? producto.precio : ''}" />`) +
      campo('stock', editando ? 'Stock' : 'Stock inicial',
        `<input type="text" id="stock" name="stock" inputmode="numeric" autocomplete="off" aria-describedby="error-stock" value="${editando ? producto.stock : ''}" />`),
    alConfirmar: async (form) => {
      const datos = leerProducto(form);
      if (!datos) return '';

      if (editando) {
        await api(`/productos/${producto.id}`, { metodo: 'PUT', cuerpo: datos });
        return 'Producto actualizado correctamente.';
      }
      await api('/productos', { metodo: 'POST', cuerpo: datos });
      return 'Producto creado correctamente.';
    },
  });
}

function abrirAjusteStock(producto) {
  abrirModal({
    titulo: `Ajustar stock de ${esc(producto.nombre)}`,
    textoAccion: 'Registrar',
    cuerpo:
      `<p class="texto-suave">Stock actual: <strong>${producto.stock}</strong>. Escribe un número positivo para una entrada o negativo para una salida.</p>` +
      campo('cantidad', 'Cantidad',
        `<input type="text" id="cantidad" name="cantidad" inputmode="text" autocomplete="off" placeholder="Ej.: 10 o -3" aria-describedby="error-cantidad" />`),
    alConfirmar: async (form) => {
      const cantidad = form.querySelector('#cantidad').value.trim();
      const valido = marcar(form, 'cantidad',
        cantidad === '' ? 'La cantidad es obligatoria.'
          : !/^[+-]?\d+$/.test(cantidad) || Number(cantidad) === 0 ? 'Escribe un número entero distinto de 0.' : '');
      if (!valido) return '';

      const { data } = await api(`/productos/${producto.id}/stock`, {
        metodo: 'PATCH',
        cuerpo: { cantidad: Number(cantidad) },
      });
      return `Stock actualizado: ${data.nombre} ahora tiene ${data.stock}.`;
    },
  });
}

function abrirConfirmacionEliminar(producto) {
  abrirModal({
    titulo: 'Eliminar producto',
    textoAccion: 'Eliminar',
    claseAccion: 'btn-peligro',
    cuerpo: `<p>¿Seguro que quieres eliminar <strong>${esc(producto.nombre)}</strong>? Esta acción no se puede deshacer.</p>`,
    alConfirmar: async () => {
      await api(`/productos/${producto.id}`, { metodo: 'DELETE' });
      return 'Producto eliminado correctamente.';
    },
  });
}

// ---------- Entrada ----------

export function mostrarInventario(contenedor, usuario) {
  raiz = contenedor;
  estado = {
    buscar: '',
    categoriaId: '',
    pagina: 1,
    peticion: 0,
    categorias: [],
    productos: [],
    meta: { total: 0, pagina: 1, limite: PRODUCTOS_POR_PAGINA, totalPaginas: 0 },
  };
  raiz.innerHTML = plantilla(usuario);

  $('#btn-salir').addEventListener('click', cerrarSesion);
  $('#btn-nuevo').addEventListener('click', () => abrirFormularioProducto(null));

  // Búsqueda en tiempo real: se espera a que el usuario deje de escribir.
  let temporizador;
  $('#buscar').addEventListener('input', (evento) => {
    clearTimeout(temporizador);
    const vista = estado;
    temporizador = setTimeout(() => {
      if (vista !== estado) return;
      vista.buscar = evento.target.value.trim();
      vista.pagina = 1;
      cargarProductos();
    }, ESPERA_BUSQUEDA_MS);
  });

  $('#filtro-categoria').addEventListener('change', (evento) => {
    estado.categoriaId = evento.target.value;
    estado.pagina = 1;
    cargarProductos();
  });

  $('#btn-anterior').addEventListener('click', () => {
    estado.pagina -= 1;
    cargarProductos();
  });
  $('#btn-siguiente').addEventListener('click', () => {
    estado.pagina += 1;
    cargarProductos();
  });

  // Un solo listener para los botones de todas las filas.
  $('#listado').addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;
    const producto = estado.productos.find((p) => p.id === Number(boton.dataset.id));
    if (!producto) return;

    if (boton.dataset.accion === 'editar') abrirFormularioProducto(producto);
    else if (boton.dataset.accion === 'stock') abrirAjusteStock(producto);
    else abrirConfirmacionEliminar(producto);
  });

  pintarListado();
  cargarCategorias();
  cargarProductos();
}
