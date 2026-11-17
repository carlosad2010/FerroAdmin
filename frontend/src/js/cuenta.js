import { api, ErrorApi } from './api.js';
import { validarClave, validarConfirmacion, marcarCampo } from './validaciones.js';

// Menú de la cuenta y cambio de contraseña (T25, CONTRATO_API.md §11.5).
// No modifica inventario.js: trabaja sobre el encabezado que esa vista ya dibujó
// (.app-usuario) y reutiliza las clases del modal de GUIA_VISUAL.md.

const icono = (nombre) =>
  `<svg class="icono" aria-hidden="true" focusable="false"><use href="/iconos.svg#${nombre}" /></svg>`;

// Campo de clave con candado y ojito, igual que en el login.
const campoClave = (id, etiqueta, autocompletar) => `
  <div class="campo">
    <label for="${id}">${etiqueta}</label>
    <div class="campo-control campo-clave">
      ${icono('i-candado')}
      <input type="password" id="${id}" name="${id}" autocomplete="${autocompletar}" aria-describedby="error-${id}" />
      <button type="button" class="btn-icono ver-clave" data-objetivo="${id}" aria-label="Mostrar clave">${icono('i-ojo')}</button>
    </div>
    <p class="error" id="error-${id}" aria-live="polite"></p>
  </div>
`;

// ---------- Menú desplegable ----------

export function activarMenuCuenta(contenedor) {
  const bloque = contenedor.querySelector('.app-usuario');
  if (!bloque) return;

  const nombre = bloque.querySelector('.app-usuario-nombre')?.textContent.trim() ?? '';

  // El avatar y el nombre pasan a estar dentro de un botón.
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'cuenta-boton';
  boton.setAttribute('aria-haspopup', 'true');
  boton.setAttribute('aria-expanded', 'false');
  boton.setAttribute('aria-controls', 'menu-cuenta');
  boton.setAttribute('aria-label', `Opciones de la cuenta de ${nombre}`);
  boton.append(...bloque.childNodes);

  const menu = document.createElement('ul');
  menu.className = 'cuenta-menu';
  menu.id = 'menu-cuenta';
  menu.innerHTML = `
    <li><button type="button" class="cuenta-opcion" data-opcion="clave">${icono('i-candado')}Cambiar contraseña</button></li>
  `;

  bloque.classList.add('cuenta');
  bloque.append(boton, menu);

  const opcionClave = menu.querySelector('[data-opcion="clave"]');
  const abierto = () => boton.getAttribute('aria-expanded') === 'true';

  const abrir = () => {
    boton.setAttribute('aria-expanded', 'true');
    menu.classList.add('abierto');
    opcionClave.focus();
  };

  const cerrar = (devolverFoco = false) => {
    if (!abierto()) return;
    boton.setAttribute('aria-expanded', 'false');
    menu.classList.remove('abierto');
    if (devolverFoco) boton.focus();
  };

  boton.addEventListener('click', () => (abierto() ? cerrar() : abrir()));

  opcionClave.addEventListener('click', () => {
    cerrar();
    abrirCambioClave(contenedor, boton);
  });

  bloque.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrar(true);
  });

  // Clic o foco fuera del menú: se cierra. Si la vista ya no está, se deja de escuchar.
  const fuera = (evento) => {
    if (!bloque.isConnected) {
      document.removeEventListener('click', fuera);
      document.removeEventListener('focusin', fuera);
      return;
    }
    if (!bloque.contains(evento.target)) cerrar();
  };
  document.addEventListener('click', fuera);
  document.addEventListener('focusin', fuera);
}

// ---------- Modal de cambio de contraseña ----------

function abrirCambioClave(contenedor, origen) {
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-cambio-clave">
      <h2 id="titulo-cambio-clave">Cambiar contraseña</h2>
      <form novalidate>
        ${campoClave('claveActual', 'Contraseña actual', 'current-password')}
        ${campoClave('claveNueva', 'Contraseña nueva', 'new-password')}
        ${campoClave('claveRepetida', 'Repetir contraseña nueva', 'new-password')}
        <p class="error" id="error-cambio-clave" aria-live="polite"></p>
        <div class="modal-acciones">
          <button class="btn btn-secundario" type="button" data-cerrar>Cancelar</button>
          <button class="btn btn-primario" type="submit">Guardar contraseña</button>
        </div>
      </form>
    </div>
  `;
  contenedor.append(fondo);

  const form = fondo.querySelector('form');
  const enviar = form.querySelector('button[type="submit"]');
  const errorGeneral = form.querySelector('#error-cambio-clave');

  const cerrar = () => {
    fondo.remove();
    if (origen.isConnected) origen.focus();
  };

  // Ojitos: mostrar u ocultar cada clave.
  fondo.querySelectorAll('.ver-clave').forEach((ojo) => {
    ojo.addEventListener('click', () => {
      const input = form.querySelector(`#${ojo.dataset.objetivo}`);
      const mostrando = input.type === 'text';
      input.type = mostrando ? 'password' : 'text';
      ojo.querySelector('use').setAttribute('href', mostrando ? '/iconos.svg#i-ojo' : '/iconos.svg#i-ojo-tachado');
      ojo.setAttribute('aria-label', mostrando ? 'Mostrar clave' : 'Ocultar clave');
    });
  });

  // Cerrar con Cancelar, con clic en el fondo o con Esc. El foco no sale del modal.
  fondo.querySelector('[data-cerrar]').addEventListener('click', cerrar);
  fondo.addEventListener('mousedown', (evento) => {
    if (evento.target === fondo) cerrar();
  });
  fondo.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      cerrar();
      return;
    }
    if (evento.key !== 'Tab') return;

    const enfocables = [...fondo.querySelectorAll('input, button')].filter((el) => !el.disabled);
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (evento.shiftKey && document.activeElement === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  });

  // Mismas reglas que el registro (validaciones.js) y además: la nueva distinta de la actual.
  const reglas = {
    claveActual: (valor) => (valor === '' ? 'Escribe tu contraseña actual.' : ''),
    claveNueva: (valor) =>
      validarClave(valor) ||
      (valor === form.claveActual.value ? 'La contraseña nueva debe ser distinta de la actual.' : ''),
    claveRepetida: (valor) => validarConfirmacion(form.claveNueva.value, valor),
  };

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    errorGeneral.textContent = '';

    const validos = Object.entries(reglas).map(([id, regla]) => marcarCampo(id, regla(form[id].value)));
    if (validos.includes(false)) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    enviar.disabled = true;
    try {
      // La repetición no se envía: ya se comprobó aquí (§11.5).
      await api('/auth/password', {
        metodo: 'PATCH',
        cuerpo: { claveActual: form.claveActual.value, claveNueva: form.claveNueva.value },
      });
      cerrar();
      avisar(contenedor, 'Contraseña actualizada correctamente.');
    } catch (error) {
      enviar.disabled = false;
      if (error.codigo === 'NO_AUTENTICADO') return; // api.js ya lleva al login

      // Los errores de la API van bajo su campo; si no tienen campo, abajo del formulario.
      let sinCampo = error.detalles?.length
        ? ''
        : error instanceof ErrorApi ? error.message : 'No se pudo cambiar la contraseña.';
      for (const detalle of error.detalles ?? []) {
        if (form.querySelector(`#error-${detalle.campo}`)) marcarCampo(detalle.campo, detalle.mensaje);
        else sinCampo = detalle.mensaje;
      }
      errorGeneral.textContent = sinCampo;
      form.querySelector('[aria-invalid="true"]')?.focus();
    }
  });

  form.claveActual.focus();
}

// Mensaje de éxito en el espacio de avisos de la vista (#aviso).
function avisar(contenedor, texto) {
  const aviso = contenedor.querySelector('#aviso');
  if (aviso) aviso.innerHTML = `<p class="mensaje mensaje-exito" role="status">${texto}</p>`;
}
