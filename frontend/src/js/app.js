import { activarValidacionRegistro } from './validaciones.js';
const vista = document.getElementById('vista');

const plantillaLogin = `
  <section>
    <h2>Iniciar sesión</h2>
    <form id="form-login" novalidate>
      <div class="campo">
        <label for="email">Correo electrónico</label>
        <input type="email" id="email" name="email" autocomplete="email" required />
        <p class="error" id="error-email" aria-live="polite"></p>
      </div>
      <div class="campo">
        <label for="password">Clave</label>
        <div class="campo-clave">
          <input type="password" id="password" name="password" autocomplete="current-password" required />
          <button type="button" class="ver-clave" data-objetivo="password" aria-label="Mostrar clave">👁</button>
        </div>
        <p class="error" id="error-password" aria-live="polite"></p>
      </div>
      <!-- Aquí irá el CAPTCHA (T07) -->
      <button type="submit">Entrar</button>
      <p class="error" id="error-general" aria-live="polite"></p>
    </form>
    <p>¿No tienes cuenta? <a href="#/registro">Registrar</a></p>
  </section>
`;

const plantillaRegistro = `
  <section>
    <h2>Crear cuenta</h2>
    <form id="form-registro" novalidate>
      <div class="campo">
        <label for="name">Nombre</label>
        <input type="text" id="name" name="name" autocomplete="name" required />
        <p class="error" id="error-name" aria-live="polite"></p>
      </div>
      <div class="campo">
        <label for="email">Correo electrónico</label>
        <input type="email" id="email" name="email" autocomplete="email" required />
        <p class="error" id="error-email" aria-live="polite"></p>
      </div>
      <div class="campo">
        <label for="password">Clave</label>
        <div class="campo-clave">
          <input type="password" id="password" name="password" autocomplete="new-password" required />
          <button type="button" class="ver-clave" data-objetivo="password" aria-label="Mostrar clave">👁</button>
        </div>
        <p class="error" id="error-password" aria-live="polite"></p>
      </div>
      <div class="campo">
        <label for="password2">Confirmar clave</label>
        <div class="campo-clave">
          <input type="password" id="password2" name="password2" autocomplete="new-password" required />
          <button type="button" class="ver-clave" data-objetivo="password2" aria-label="Mostrar clave">👁</button>
        </div>
        <p class="error" id="error-password2" aria-live="polite"></p>
      </div>
      <!-- Aquí irá el CAPTCHA (T07) -->
      <button type="submit">Registrarme</button>
      <p class="error" id="error-general" aria-live="polite"></p>
    </form>
    <p>¿Ya tienes cuenta? <a href="#/login">Iniciar sesión</a></p>
  </section>
`;

function activarOjitos() {
 
  document.querySelectorAll('.ver-clave').forEach((boton) => {
    boton.addEventListener('click', () => {
      const input = document.getElementById(boton.dataset.objetivo);
      const mostrando = input.type === 'text';

      input.type = mostrando ? 'password' : 'text';
      boton.textContent = mostrando ? '👁' : '🙈';
      boton.setAttribute('aria-label', mostrando ? 'Mostrar clave' : 'Ocultar clave');
    });
  });
}

function mostrarVista() {
  const esRegistro = location.hash === '#/registro';
  vista.innerHTML = esRegistro ? plantillaRegistro : plantillaLogin;
  document.title = esRegistro ? 'Registro | FerroAdmin' : 'Iniciar sesión | FerroAdmin';
  activarOjitos();
  if (esRegistro) activarValidacionRegistro();
}

window.addEventListener('hashchange', mostrarVista);
mostrarVista();