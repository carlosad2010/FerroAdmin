import { obtenerSesion, activarLogin, activarRegistro } from './auth.js';
import { mostrarInventario } from './inventario.js';

const vista = document.getElementById('vista');

// Cascarón de login/registro (está en index.html) y contenedor de las vistas
// internas (inventario y 404). Solo uno de los dos está en la página a la vez.
const cascaronAuth = document.querySelector('.auth');
const cascaronApp = document.createElement('div');

function mostrarCascaron(visible, oculto) {
  oculto.remove();
  if (!visible.isConnected) document.body.prepend(visible);
}

// Icono del sprite /iconos.svg (decorativo: lo oculta del lector de pantalla)
const icono = (nombre) =>
  `<svg class="icono" aria-hidden="true" focusable="false"><use href="/iconos.svg#${nombre}" /></svg>`;

// Botón para mostrar u ocultar la clave del campo indicado
const botonOjito = (objetivo) =>
  `<button type="button" class="btn-icono ver-clave" data-objetivo="${objetivo}" aria-label="Mostrar clave">${icono('i-ojo')}</button>`;

const plantillaLogin = `
  <h1>Iniciar sesión</h1>
  <p class="auth-subtitulo">Ingresa para gestionar tu inventario.</p>

  <form id="form-login" novalidate>
    <div class="campo">
      <label for="email">Correo electrónico</label>
      <div class="campo-control">
        ${icono('i-correo')}
        <input type="email" id="email" name="email" autocomplete="email" placeholder="tu@ferreteria.co" required />
      </div>
      <p class="error" id="error-email" aria-live="polite"></p>
    </div>
    <div class="campo">
      <label for="password">Clave</label>
      <div class="campo-control campo-clave">
        ${icono('i-candado')}
        <input type="password" id="password" name="password" autocomplete="current-password" placeholder="••••••••" required />
        ${botonOjito('password')}
      </div>
      <p class="error" id="error-password" aria-live="polite"></p>
    </div>
    <div id="captcha-bloque"></div>
    <button type="submit" class="btn btn-primario btn-grande btn-bloque">Entrar ${icono('i-flecha')}</button>
    <p class="error" id="error-general" aria-live="polite"></p>
  </form>
  <p class="auth-alterno">¿No tienes cuenta? <a href="#/registro">Registrar</a></p>
`;

const plantillaRegistro = `
  <h1>Crear cuenta</h1>
  <p class="auth-subtitulo">Regístrate para empezar a gestionar tu inventario.</p>

  <form id="form-registro" novalidate>
    <div class="campo">
      <label for="name">Nombre</label>
      <div class="campo-control">
        ${icono('i-usuario')}
        <input type="text" id="name" name="name" autocomplete="name" placeholder="Nombre y apellido" required />
      </div>
      <p class="error" id="error-name" aria-live="polite"></p>
    </div>
    <div class="campo">
      <label for="email">Correo electrónico</label>
      <div class="campo-control">
        ${icono('i-correo')}
        <input type="email" id="email" name="email" autocomplete="email" placeholder="tu@ferreteria.co" required />
      </div>
      <p class="error" id="error-email" aria-live="polite"></p>
    </div>
    <div class="campo">
      <label for="password">Clave</label>
      <div class="campo-control campo-clave">
        ${icono('i-candado')}
        <input type="password" id="password" name="password" autocomplete="new-password" placeholder="••••••••" required />
        ${botonOjito('password')}
      </div>
      <p class="error" id="error-password" aria-live="polite"></p>
    </div>
    <div class="campo">
      <label for="password2">Confirmar clave</label>
      <div class="campo-control campo-clave">
        ${icono('i-candado')}
        <input type="password" id="password2" name="password2" autocomplete="new-password" placeholder="••••••••" required />
        ${botonOjito('password2')}
      </div>
      <p class="error" id="error-password2" aria-live="polite"></p>
    </div>
    <div id="captcha-bloque"></div>
    <button type="submit" class="btn btn-primario btn-grande btn-bloque">Registrarme ${icono('i-flecha')}</button>
    <p class="error" id="error-general" aria-live="polite"></p>
  </form>
  <p class="auth-alterno">¿Ya tienes cuenta? <a href="#/login">Iniciar sesión</a></p>
`;

function activarOjitos() {
  document.querySelectorAll('.ver-clave').forEach((boton) => {
    boton.addEventListener('click', () => {
      const input = document.getElementById(boton.dataset.objetivo);
      const mostrando = input.type === 'text';

      input.type = mostrando ? 'password' : 'text';
      boton.querySelector('use').setAttribute('href', mostrando ? '/iconos.svg#i-ojo' : '/iconos.svg#i-ojo-tachado');
      boton.setAttribute('aria-label', mostrando ? 'Mostrar clave' : 'Ocultar clave');
    });
  });
}

function mostrarAuth(esRegistro) {
  mostrarCascaron(cascaronAuth, cascaronApp);
  cascaronApp.innerHTML = '';
  vista.innerHTML = esRegistro ? plantillaRegistro : plantillaLogin;
  document.title = esRegistro ? 'Registro | FerroAdmin' : 'Iniciar sesión | FerroAdmin';
  activarOjitos();
  if (esRegistro) activarRegistro();
  else activarLogin();
}

function mostrar404() {
  mostrarCascaron(cascaronApp, cascaronAuth);
  document.title = 'Página no encontrada | FerroAdmin';
  cascaronApp.innerHTML = `
    <main class="contenedor vista-404">
      <p class="codigo">404</p>
      <h1>Página no encontrada</h1>
      <a class="btn btn-acento" href="#/">Volver al inicio</a>
    </main>
  `;
}

// Cada cambio de ruta recibe un número: si mientras se consulta la sesión
// el usuario cambia otra vez de ruta, la respuesta vieja se descarta.
let navegacion = 0;

// Rutas (CONTRATO_API.md §1.2), por ahora con hash: #/login, #/registro, #/inventario.
async function mostrarVista() {
  const turno = ++navegacion;
  const ruta = location.hash.replace(/^#/, '') || '/';

  if (!['/', '/login', '/registro', '/inventario'].includes(ruta)) {
    mostrar404();
    return;
  }

  const usuario = await obtenerSesion();
  if (turno !== navegacion) return;

  // "/" e "/inventario" requieren sesión; "/login" con sesión va al inventario.
  if (ruta === '/registro') {
    mostrarAuth(true);
  } else if (!usuario) {
    if (ruta === '/login') mostrarAuth(false);
    else location.hash = '#/login';
  } else if (ruta === '/inventario') {
    mostrarCascaron(cascaronApp, cascaronAuth);
    document.title = 'Inventario | FerroAdmin';
    mostrarInventario(cascaronApp, usuario);
  } else {
    location.hash = '#/inventario';
  }
}

window.addEventListener('hashchange', mostrarVista);
mostrarVista();
