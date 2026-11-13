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

// Rutas de productos (CONTRATO_API.md §5.5). Se montan en /api/productos.
const router = Router();

// Todas las rutas de productos requieren sesión.
router.use(verificarToken);

router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.patch('/:id/stock', ajustarStock);
router.delete('/:id', eliminarProducto);

export default router;
