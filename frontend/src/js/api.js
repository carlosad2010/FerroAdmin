// Función única para llamar a la API (CONTRATO_API.md §1.2).
// Envía y recibe JSON, interpreta los errores del §3.2 y lleva a #/login
// cuando una ruta protegida responde 401 NO_AUTENTICADO.
// La cookie de sesión es HttpOnly y viaja sola: aquí no se toca.

export class ErrorApi extends Error {
  constructor(status, codigo, mensaje, detalles = []) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Inténtalo de nuevo.';

/**
 * Llama a la API. `ruta` va sin el prefijo /api, por ejemplo "/productos?pagina=1".
 * Devuelve el cuerpo JSON completo ({ data, meta }) o null si la respuesta es 204.
 * Si la API responde con error, lanza un ErrorApi.
 */
export async function api(ruta, { metodo = 'GET', cuerpo } = {}) {
  const opciones = { method: metodo, headers: { Accept: 'application/json' } };

  if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, opciones);
  } catch {
    throw new ErrorApi(0, 'SIN_CONEXION', MENSAJE_SIN_CONEXION);
  }

  if (respuesta.status === 204) return null;

  let json = null;
  try {
    json = await respuesta.json();
  } catch {
    // La respuesta no es JSON (por ejemplo, el backend está apagado y responde el proxy).
  }

  if (respuesta.ok) return json;

  const error = new ErrorApi(
    respuesta.status,
    json?.error?.codigo ?? 'ERROR_INTERNO',
    json?.error?.mensaje ?? MENSAJE_SIN_CONEXION,
    json?.error?.detalles ?? []
  );

  // Sesión vencida o inexistente: se vuelve al login.
  if (error.codigo === 'NO_AUTENTICADO' && location.hash !== '#/login') {
    location.hash = '#/login';
  }

  throw error;
}
