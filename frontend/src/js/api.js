// Función única para llamar a la API (contrato §3.2)
export async function llamarApi(ruta, { metodo = 'GET', cuerpo } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw { codigo: 'SIN_CONEXION', mensaje: 'No se pudo conectar con el servidor.' };
  }

  if (respuesta.status === 204) return null;

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // la respuesta no era JSON
  }

  if (!respuesta.ok) {
    const error = datos?.error;
    throw {
      codigo: error?.codigo ?? 'ERROR',
      mensaje:
        error?.mensaje ??
        (typeof error === 'string' ? error : `El servidor respondió con estado ${respuesta.status}.`),
    };
  }
  return datos;
}
