import { api, ErrorApi } from './api.js';
import { marcarCampo, validarEmail, validarClave, validarConfirmacion } from './validaciones.js';
import { montarCaptcha } from './captcha.js';

// Pantallas de recuperación de clave (T21): #/recuperar y #/restablecer?token=...
const icono = (nombre) =>
  `<svg class="icono" aria-hidden="true" focusable="false"><use href="/iconos.svg#${nombre}" /></svg>`;

const mostrarError = (mensaje) => {
  document.getElementById('error-general').textContent = mensaje;
};

// Reemplaza el formulario por un aviso de éxito.
function mostrarExito(form, mensaje) {
  const aviso = document.createElement('p');
  aviso.className = 'mensaje mensaje-exito';
  aviso.setAttribute('role', 'status');
  aviso.textContent = mensaje;
  form.replaceWith(aviso);
}

export function montarRecuperar(vista) {
  document.title = 'Recuperar clave | FerroAdmin';
  vista.innerHTML = `
    <h1>Recuperar clave</h1>
    <p class="auth-subtitulo">Escribe tu correo y te enviaremos un enlace para crear una clave nueva.</p>

    <form id="form-recuperar" novalidate>
      <div class="campo">
        <label for="email">Correo electrónico</label>
        <div class="campo-control">
          ${icono('i-correo')}
          <input type="email" id="email" name="email" autocomplete="email" placeholder="tu@ferreteria.co" required />
        </div>
        <p class="error" id="error-email" aria-live="polite"></p>
      </div>
      <div id="captcha-bloque"></div>
      <button type="submit" class="btn btn-primario btn-grande btn-bloque">Enviar enlace ${icono('i-flecha')}</button>
      <p class="error" id="error-general" aria-live="polite"></p>
    </form>
    <p class="auth-alterno"><a href="#/login">Volver a iniciar sesión</a></p>
  `;

  const form = document.getElementById('form-recuperar');
  const captcha = montarCaptcha(document.getElementById('captcha-bloque'));

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mostrarError('');

    const email = form.email.value.trim();
    const emailValido = marcarCampo('email', validarEmail(email));
    const desafio = captcha.leer();
    if (!emailValido || !desafio) return;

    form.querySelector('button[type="submit"]').disabled = true;
    try {
      const { data } = await api('/auth/recuperar', { metodo: 'POST', cuerpo: { email, ...desafio } });
      mostrarExito(form, data.mensaje);
    } catch (error) {
      mostrarError(error instanceof ErrorApi ? error.message : 'No se pudo enviar el enlace.');
      captcha.renovar();
      form.querySelector('button[type="submit"]').disabled = false;
    }
  });
}

export function montarRestablecer(vista, token) {
  document.title = 'Nueva clave | FerroAdmin';

  if (!token) {
    vista.innerHTML = `
      <h1>Enlace no válido</h1>
      <p class="auth-subtitulo">Este enlace está incompleto. Pide uno nuevo.</p>
      <p class="auth-alterno"><a href="#/recuperar">Pedir un enlace nuevo</a></p>
    `;
    return;
  }

  vista.innerHTML = `
    <h1>Nueva clave</h1>
    <p class="auth-subtitulo">Escribe la clave nueva para tu cuenta.</p>

    <form id="form-restablecer" novalidate>
      <div class="campo">
        <label for="password">Clave nueva</label>
        <div class="campo-control">
          ${icono('i-candado')}
          <input type="password" id="password" name="password" autocomplete="new-password" placeholder="••••••••" required />
        </div>
        <p class="error" id="error-password" aria-live="polite"></p>
      </div>
      <div class="campo">
        <label for="password2">Confirmar clave</label>
        <div class="campo-control">
          ${icono('i-candado')}
          <input type="password" id="password2" name="password2" autocomplete="new-password" placeholder="••••••••" required />
        </div>
        <p class="error" id="error-password2" aria-live="polite"></p>
      </div>
      <button type="submit" class="btn btn-primario btn-grande btn-bloque">Cambiar clave ${icono('i-flecha')}</button>
      <p class="error" id="error-general" aria-live="polite"></p>
    </form>
    <p class="auth-alterno"><a href="#/login">Volver a iniciar sesión</a></p>
  `;

  const form = document.getElementById('form-restablecer');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mostrarError('');

    const password = form.password.value;
    const claveValida = marcarCampo('password', validarClave(password));
    const confirmacionValida = marcarCampo('password2', validarConfirmacion(password, form.password2.value));
    if (!claveValida || !confirmacionValida) return;

    form.querySelector('button[type="submit"]').disabled = true;
    try {
      const { data } = await api('/auth/restablecer', { metodo: 'POST', cuerpo: { token, password } });
      mostrarExito(form, data.mensaje);
    } catch (error) {
      mostrarError(error instanceof ErrorApi ? error.message : 'No se pudo cambiar la clave.');
      form.querySelector('button[type="submit"]').disabled = false;
    }
  });
}