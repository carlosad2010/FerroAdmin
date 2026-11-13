
import { activarValidacionRegistro, marcarCampo } from './validaciones.js';
import { llamarApi } from './api.js';
const vista = document.getElementById('vista');

let avisoLogin = '';

// Icono del sprite /iconos.svg (decorativo: lo oculta del lector de pantalla)
const icono = (nombre) =>
  `<svg class="icono" aria-hidden="true" focusable="false"><use href="/iconos.svg#${nombre}" /></svg>`;

// Botón para mostrar u ocultar la clave del campo indicado
const botonOjito = (objetivo) =>
  `<button type="button" class="btn-icono ver-clave" data-objetivo="${objetivo}" aria-label="Mostrar clave">${icono('i-ojo')}</button>`;

const plantillaLogin = `
  <h1>Iniciar sesión</h1>
  <p class="auth-subtitulo">Ingresa para gestionar tu inventario.</p>
  <p id="aviso-exito" role="status" style="color: var(--color-exito);"></p>

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
    <!-- Aquí irá el CAPTCHA (T07) -->
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
    <!-- Aquí irá el CAPTCHA (T07) -->
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

async function enviarRegistro(datos) {
  const boton = document.querySelector('#form-registro button[type="submit"]');
  const errorGeneral = document.getElementById('error-general');
  errorGeneral.textContent = '';
  boton.disabled = true;

  try {
    await llamarApi('/auth/registro', { metodo: 'POST', cuerpo: datos });
    avisoLogin = 'Cuenta creada. Ahora inicia sesión.';
    location.hash = '#/login';
  } catch (error) {
    if (error.codigo === 'CONFLICTO') marcarCampo('email', error.mensaje);
    else errorGeneral.textContent = error.mensaje;
  } finally {
    boton.disabled = false;
  }
}

function mostrarVista() {
  const esRegistro = location.hash === '#/registro';
  vista.innerHTML = esRegistro ? plantillaRegistro : plantillaLogin;
  document.title = esRegistro ? 'Registro | FerroAdmin' : 'Iniciar sesión | FerroAdmin';
  activarOjitos();
    if (esRegistro) {
    activarValidacionRegistro(enviarRegistro);
  } else {
    document.getElementById('aviso-exito').textContent = avisoLogin;
    avisoLogin = '';
  }
}

window.addEventListener('hashchange', mostrarVista);
mostrarVista();
