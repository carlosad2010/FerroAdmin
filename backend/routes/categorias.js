import { Router } from 'express';
import { listarCategorias } from '../controllers/categorias.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

// Rutas de categorías (CONTRATO_API.md §5.4). Se montan en /api/categorias.
const router = Router();

router.get('/', verificarToken, listarCategorias);

export default router;
