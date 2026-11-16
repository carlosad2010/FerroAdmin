import { api, ErrorApi } from './api.js';

// Reto de verificación humana (CONTRATO_API.md §4.4).
// La respuesta correcta vive en el servidor: aquí solo se muestra la pregunta
// y se recoge lo que escribe la persona.

export function montarCaptcha(contenedor) {
  contenedor.innerHTML = `
    <div class="campo">
      <label for="captcha">Verificación: <strong id="captcha-pregunta"></strong></label>
      <div class="campo-control">
        <input type="text" id="captcha" inputmode="numeric" autocomplete="off" placeholder="Resultado" />
      </div>
      <p class="error" id="error-captcha" aria-live="polite"></p>
      <button type="button" class="btn btn-fantasma btn-pequeno" id="captcha-nuevo">Nuevo reto</button>
    </div>
  `;

  const pregunta = contenedor.querySelector('#captcha-pregunta');
  const entrada = contenedor.querySelector('#captcha');
  const error = contenedor.querySelector('#error-captcha');
  let captchaId = '';

  // Pide un reto nuevo (también se usa después de cada intento fallido).
  async function renovar() {
    entrada.value = '';
    error.textContent = '';
    pregunta.textContent = 'cargando...';
    try {
      const { data } = await api('/auth/captcha');
      captchaId = data.captchaId;
      pregunta.textContent = `${data.pregunta} = ?`;
    } catch (e) {
      captchaId = '';
      pregunta.textContent = '';
      error.textContent = e instanceof ErrorApi ? e.message : 'No se pudo cargar la verificación.';
    }
  }

  contenedor.querySelector('#captcha-nuevo').addEventListener('click', renovar);
  renovar();

  return {
    renovar,
    // Devuelve { captchaId, captchaRespuesta } o null si falta la respuesta.
    leer() {
      const texto = entrada.value.trim();
      if (!/^\d+$/.test(texto)) {
        error.textContent = 'Escribe el resultado de la operación.';
        return null;
      }
      if (captchaId === '') {
        error.textContent = 'Pide un reto nuevo.';
        return null;
      }
      error.textContent = '';
      return { captchaId, captchaRespuesta: Number(texto) };
    },
  };
}