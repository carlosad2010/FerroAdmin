import { randomUUID } from 'node:crypto';
import { ErrorApi } from './productos.js';

const MIME_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const configuracionStorage = () => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET = 'productos' } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new ErrorApi(
      500,
      'ERROR_INTERNO',
      'El almacenamiento de imágenes no está configurado'
    );
  }

  let base;
  try {
    base = new URL(SUPABASE_URL);
  } catch {
    throw new ErrorApi(
      500,
      'ERROR_INTERNO',
      'La configuración del almacenamiento de imágenes no es válida'
    );
  }

  if (base.protocol !== 'https:' || !SUPABASE_STORAGE_BUCKET) {
    throw new ErrorApi(
      500,
      'ERROR_INTERNO',
      'La configuración del almacenamiento de imágenes no es válida'
    );
  }

  return {
    base: base.origin,
    key: SUPABASE_SERVICE_ROLE_KEY,
    bucket: SUPABASE_STORAGE_BUCKET,
  };
};

const detectarTipo = (buffer) => {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) return 'image/jpeg';

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) return 'image/png';

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) return 'image/webp';

  return null;
};

const errorImagenInvalida = () =>
  new ErrorApi(400, 'VALIDACION', 'El archivo debe ser una imagen JPEG, PNG o WebP válida');

const urlObjeto = (base, bucket, path) =>
  `${base}/storage/v1/object/${encodeURIComponent(bucket)}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;

export const almacenarImagen = async (archivo) => {
  const tipo = detectarTipo(archivo.buffer);
  if (!tipo || tipo !== archivo.mimetype) throw errorImagenInvalida();

  const config = configuracionStorage();
  const path = randomUUID() + '.' + MIME_EXTENSION[tipo];
  let respuesta;
  try {
    respuesta = await fetch(urlObjeto(config.base, config.bucket, path), {
      method: 'POST',
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        'Content-Type': tipo,
        'x-upsert': 'false',
      },
      body: archivo.buffer,
    });
  } catch {
    throw new ErrorApi(
      500,
      'ERROR_INTERNO',
      'No se pudo conectar con el almacenamiento de imágenes'
    );
  }

  if (!respuesta.ok) {
    // Solo al log del servidor (nunca al usuario ni con la llave): sirve para saber
    // si Supabase rechazó la llave (401/403), el bucket (404) o la dirección.
    const detalle = await respuesta.text().catch(() => '');
    console.error(
      `Supabase Storage rechazó la subida: HTTP ${respuesta.status} (bucket "${config.bucket}") ${detalle.slice(0, 300)}`
    );
    throw new ErrorApi(
      500,
      'ERROR_INTERNO',
      'No se pudo guardar la imagen en el almacenamiento'
    );
  }

  const publicUrl = `${config.base}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
  return { path, publicUrl };
};

export const eliminarImagenAlmacenada = async (path) => {
  const config = configuracionStorage();
  let respuesta;
  try {
    respuesta = await fetch(
      `${config.base}/storage/v1/object/${encodeURIComponent(config.bucket)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: [path] }),
      }
    );
  } catch {
    throw new ErrorApi(
      500,
      'ERROR_INTERNO',
      'No se pudo limpiar la imagen del almacenamiento'
    );
  }

  if (!respuesta.ok) {
    throw new ErrorApi(
      500,
      'ERROR_INTERNO',
      'No se pudo limpiar la imagen del almacenamiento'
    );
  }
};
