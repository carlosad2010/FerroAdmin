import * as productosService from '../services/productos.js';
import { ErrorApi } from '../services/productos.js';

// Controladores de productos (CONTRATO_API.md §5.5).
// Leen req, validan la entrada (§5.2), llaman al servicio y responden con el
// formato del §3. Los errores no previstos pasan al manejador global (500).

const ENTERO_MAX = 2147483647; // Límite de INT en PostgreSQL
const PRECIO_MAX = 9999999999.99; // Límite de NUMERIC(12,2)
const ORDENES = ['nombre', 'precio', 'stock', 'creadoEn'];
const DIRECCIONES = ['asc', 'desc'];

const errorValidacion = (detalles) =>
  new ErrorApi(400, 'VALIDACION', 'Hay campos con errores', detalles);

// Convierte un ErrorApi en la respuesta del §3.2; el resto va al manejador global.
const responderError = (error, res, next) => {
  if (!(error instanceof ErrorApi)) return next(error);

  const cuerpo = { codigo: error.codigo, mensaje: error.message };
  if (error.detalles) cuerpo.detalles = error.detalles;
  return res.status(error.status).json({ error: cuerpo });
};

// ---------- Validaciones ----------

// Devuelve el entero de un texto como "15", o null si no es un entero positivo válido.
const enteroPositivo = (texto) => {
  if (typeof texto !== 'string' || !/^[1-9]\d*$/.test(texto)) return null;
  const numero = Number(texto);
  return numero <= ENTERO_MAX ? numero : null;
};

const leerId = (req) => {
  const id = enteroPositivo(req.params.id);
  if (id === null) {
    throw errorValidacion([
      { campo: 'id', mensaje: 'Debe ser un número entero positivo' },
    ]);
  }
  return id;
};

const esObjeto = (valor) =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor);

// Valida los 4 campos de POST y PUT. Los campos que genera el servidor
// (id, creadoEn, actualizadoEn) se ignoran si vienen en el cuerpo.
const leerProducto = (req) => {
  const cuerpo = esObjeto(req.body) ? req.body : {};
  const detalles = [];

  const nombre = typeof cuerpo.nombre === 'string' ? cuerpo.nombre.trim() : '';
  if (cuerpo.nombre === undefined || cuerpo.nombre === null) {
    detalles.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio' });
  } else if (typeof cuerpo.nombre !== 'string') {
    detalles.push({ campo: 'nombre', mensaje: 'Debe ser un texto' });
  } else if (nombre.length < 2 || nombre.length > 120) {
    detalles.push({ campo: 'nombre', mensaje: 'Debe tener entre 2 y 120 caracteres' });
  }

  const { categoriaId, precio, stock } = cuerpo;

  if (categoriaId === undefined || categoriaId === null) {
    detalles.push({ campo: 'categoriaId', mensaje: 'La categoría es obligatoria' });
  } else if (!Number.isInteger(categoriaId) || categoriaId < 1 || categoriaId > ENTERO_MAX) {
    detalles.push({ campo: 'categoriaId', mensaje: 'Debe ser un número entero positivo' });
  }

  if (precio === undefined || precio === null) {
    detalles.push({ campo: 'precio', mensaje: 'El precio es obligatorio' });
  } else if (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0) {
    detalles.push({ campo: 'precio', mensaje: 'Debe ser un número mayor o igual a 0' });
  } else if (Number(precio.toFixed(2)) !== precio) {
    detalles.push({ campo: 'precio', mensaje: 'Debe tener máximo 2 decimales' });
  } else if (precio > PRECIO_MAX) {
    detalles.push({ campo: 'precio', mensaje: 'El precio es demasiado grande' });
  }

  if (stock === undefined || stock === null) {
    detalles.push({ campo: 'stock', mensaje: 'El stock es obligatorio' });
  } else if (!Number.isInteger(stock) || stock < 0) {
    detalles.push({ campo: 'stock', mensaje: 'Debe ser un número entero mayor o igual a 0' });
  } else if (stock > ENTERO_MAX) {
    detalles.push({ campo: 'stock', mensaje: 'El stock es demasiado grande' });
  }

  if (detalles.length > 0) throw errorValidacion(detalles);
  return { nombre, categoriaId, precio, stock };
};

const leerCantidad = (req) => {
  const cantidad = esObjeto(req.body) ? req.body.cantidad : undefined;
  let mensaje = null;

  if (cantidad === undefined || cantidad === null) {
    mensaje = 'La cantidad es obligatoria';
  } else if (!Number.isInteger(cantidad) || cantidad === 0) {
    mensaje = 'Debe ser un número entero distinto de 0';
  } else if (Math.abs(cantidad) > ENTERO_MAX) {
    mensaje = 'La cantidad es demasiado grande';
  }

  if (mensaje) throw errorValidacion([{ campo: 'cantidad', mensaje }]);
  return cantidad;
};

// Valida los parámetros de consulta de GET /api/productos y aplica los valores por defecto.
const leerFiltros = (req) => {
  const { buscar, categoriaId, pagina, limite, orden, direccion } = req.query;
  const detalles = [];
  const filtros = { pagina: 1, limite: 20, orden: 'nombre', direccion: 'asc' };

  if (buscar !== undefined) {
    if (typeof buscar !== 'string' || buscar.trim().length > 100) {
      detalles.push({ campo: 'buscar', mensaje: 'Debe ser un texto de máximo 100 caracteres' });
    } else if (buscar.trim() !== '') {
      filtros.buscar = buscar.trim();
    }
  }

  if (categoriaId !== undefined) {
    filtros.categoriaId = enteroPositivo(categoriaId);
    if (filtros.categoriaId === null) {
      detalles.push({ campo: 'categoriaId', mensaje: 'Debe ser un número entero positivo' });
    }
  }

  if (pagina !== undefined) {
    filtros.pagina = enteroPositivo(pagina);
    if (filtros.pagina === null) {
      detalles.push({ campo: 'pagina', mensaje: 'Debe ser un número entero mayor o igual a 1' });
    }
  }

  if (limite !== undefined) {
    filtros.limite = enteroPositivo(limite);
    if (filtros.limite === null || filtros.limite > 100) {
      detalles.push({ campo: 'limite', mensaje: 'Debe ser un número entero entre 1 y 100' });
    }
  }

  if (orden !== undefined) {
    if (!ORDENES.includes(orden)) {
      detalles.push({ campo: 'orden', mensaje: `Debe ser uno de: ${ORDENES.join(', ')}` });
    } else {
      filtros.orden = orden;
    }
  }

  if (direccion !== undefined) {
    if (!DIRECCIONES.includes(direccion)) {
      detalles.push({ campo: 'direccion', mensaje: 'Debe ser asc o desc' });
    } else {
      filtros.direccion = direccion;
    }
  }

  if (detalles.length > 0) throw errorValidacion(detalles);
  return filtros;
};

// ---------- Controladores ----------

// GET /api/productos
export const listarProductos = async (req, res, next) => {
  try {
    const filtros = leerFiltros(req);
    const { data, meta } = await productosService.listarProductos(filtros);
    return res.status(200).json({ data, meta });
  } catch (error) {
    return responderError(error, res, next);
  }
};

// GET /api/productos/:id
export const obtenerProducto = async (req, res, next) => {
  try {
    const id = leerId(req);
    const producto = await productosService.obtenerProducto(id);
    return res.status(200).json({ data: producto });
  } catch (error) {
    return responderError(error, res, next);
  }
};

// POST /api/productos
export const crearProducto = async (req, res, next) => {
  try {
    const datos = leerProducto(req);
    const producto = await productosService.crearProducto(datos);
    return res.status(201).json({ data: producto });
  } catch (error) {
    return responderError(error, res, next);
  }
};

// PUT /api/productos/:id
export const actualizarProducto = async (req, res, next) => {
  try {
    const id = leerId(req);
    const datos = leerProducto(req);
    const producto = await productosService.actualizarProducto(id, datos);
    return res.status(200).json({ data: producto });
  } catch (error) {
    return responderError(error, res, next);
  }
};

// PATCH /api/productos/:id/stock
export const ajustarStock = async (req, res, next) => {
  try {
    const id = leerId(req);
    const cantidad = leerCantidad(req);
    const producto = await productosService.ajustarStock(id, cantidad);
    return res.status(200).json({ data: producto });
  } catch (error) {
    return responderError(error, res, next);
  }
};

// DELETE /api/productos/:id
export const eliminarProducto = async (req, res, next) => {
  try {
    const id = leerId(req);
    await productosService.eliminarProducto(id);
    return res.sendStatus(204);
  } catch (error) {
    return responderError(error, res, next);
  }
};
