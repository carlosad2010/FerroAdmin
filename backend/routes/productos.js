import { Router } from 'express';
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  ajustarStock,
  eliminarProducto,
} from '../controllers/productos.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import { ErrorApi } from '../services/productos.js';

// Rutas de productos (CONTRATO_API.md §5.5). Se montan en /api/productos.
const router = Router();
const recibirImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 }, // Vercel acepta máximo 4,5 MB por petición
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new ErrorApi(400, 'VALIDACION', 'El archivo debe ser JPEG, PNG o WebP'));
      return;
    }
    callback(null, true);
  },
}).single('imagen');

const procesarImagen = (req, res, next) => {
  recibirImagen(req, res, (error) => {
    if (!error) return next();

    const codigo = error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_FILE_COUNT'
      ? 'VALIDACION'
      : error.codigo ?? 'VALIDACION';
    const mensaje = error.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen no puede superar 4 MB'
      : error.code === 'LIMIT_FILE_COUNT'
        ? 'Solo se permite una imagen'
        : error.message;
    return res.status(400).json({
      error: { codigo, mensaje },
    });
  });
};

// Todas las rutas de productos requieren sesión.
router.use(verificarToken);

router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.post('/', procesarImagen, crearProducto);
router.put('/:id', actualizarProducto);
router.patch('/:id/stock', ajustarStock);
router.delete('/:id', eliminarProducto);

export default router;
