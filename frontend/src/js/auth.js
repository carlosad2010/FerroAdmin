import { api, ErrorApi } from './api.js';
import { marcarCampo, validarEmail, activarValidacionRegistro } from './validaciones.js';
import { montarCaptcha } from './captcha.js';

// Sesión, envío del login, envío del registro y cierre de sesión (CONTRATO_API.md §5.3).
// Las plantillas de los formularios están en app.js.
// Pendiente (T07): enviar captchaId y captchaRespuesta cuando exista el CAPTCHA.

// Mensaje que una vista deja para la siguiente (por ejemplo, registro -> login).
let avisoPendiente = '';

// Devuelve el usuario de la sesión actual, o null si no hay sesión.
// El JavaScript no puede leer la cookie (es HttpOnly): se pregunta a la API.
export async function obtenerSesion() {
  try {
    const respuesta = await fetch('/api/auth/me', { headers: { Accept: 'application/json' } });
    if (!respuesta.ok) return null;
    return (await respuesta.json()).data;
  } catch {
    return null;
  }
}

export async function cerrarSesion() {
  try {
    await api('/auth/logout', { metodo: 'POST' });
  } catch {
    // Aunque falle la llamada, se vuelve al login.
  }
  location.hash = '#/login';
}

const mostrarErrorGeneral = (mensaje) => {
  document.getElementById('error-general').textContent = mensaje;
};

const bloquear = (form, bloqueado) => {
  form.querySelector('button[type="submit"]').disabled = bloqueado;
};

export function activarLogin() {
  const form = document.getElementById('form-login');
  const captcha = montarCaptcha(document.getElementById('captcha-bloque'));

  if (avisoPendiente) {
    const aviso = document.createElement('p');
    aviso.className = 'mensaje mensaje-exito';
    aviso.setAttribute('role', 'status');
    aviso.textContent = avisoPendiente;
    form.before(aviso);
    avisoPendiente = '';
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mostrarErrorGeneral('');

    const email = form.email.value.trim();
    const password = form.password.value;

       const emailValido = marcarCampo('email', validarEmail(email));
    const claveValida = marcarCampo('password', password === '' ? 'La clave es obligatoria.' : '');
    const desafio = captcha.leer(); // { captchaId, captchaRespuesta } o null
    if (!emailValido || !claveValida || !desafio) return;

    bloquear(form, true);
    try {
      await api('/auth/login', { metodo: 'POST', cuerpo: { email, password, ...desafio } });
      location.hash = '#/inventario';
    } catch (error) {
      mostrarErrorGeneral(error instanceof ErrorApi ? error.message : 'No se pudo iniciar sesión.');
      captcha.renovar(); // cada reto sirve una sola vez: tras un fallo se pide otro
      bloquear(form, false);
    }
  });
}

function validarClaves(form) {
  const password = form.password.value;
  let mensajeClave = '';

  if (password === '') mensajeClave = 'La clave es obligatoria.';
  else if (password.length < 8) mensajeClave = 'La clave debe tener al menos 8 caracteres.';
  else if (password.length > 72) mensajeClave = 'La clave no puede pasar de 72 caracteres.';

  const claveValida = marcarCampo('password', mensajeClave);
  const confirmacionValida = marcarCampo(
    'password2',
    form.password2.value === password ? '' : 'Las claves no coinciden.'
  );
  return claveValida && confirmacionValida;
}

export function activarRegistro() {
  const form = document.getElementById('form-registro');

  // validaciones.js revisa nombre y correo; aquí se revisan las claves y se envía.
  activarValidacionRegistro(async (nombreYCorreoValidos) => {
    mostrarErrorGeneral('');
    const clavesValidas = validarClaves(form);
    if (!nombreYCorreoValidos || !clavesValidas) return;

    bloquear(form, true);
    try {
      await api('/auth/registro', {
        metodo: 'POST',
        cuerpo: {
          // form.name sería el atributo name del formulario: el campo se busca por id
          nombre: document.getElementById('name').value.trim().replace(/\s+/g, ' '),
          email: form.email.value.trim(),
          password: form.password.value,
        },
      });
      // El registro no inicia sesión (§5.3): se va al login con un mensaje de éxito.
      avisoPendiente = 'Cuenta creada. Ya puedes iniciar sesión.';
      location.hash = '#/login';
    } catch (error) {
      mostrarErrorGeneral(error instanceof ErrorApi ? error.message : 'No se pudo crear la cuenta.');
      bloquear(form, false);
    }
  });
}
