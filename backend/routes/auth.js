import { Router } from 'express';
import { registrarUsuario, loginUsuario, logoutUsuario, obtenerMe } from '../controllers/authController.js';
import { verificarToken } from '../middlewares/authMiddleware.js'; // (Ver paso 4)

const router = Router();

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/logout', logoutUsuario);
router.get('/me', verificarToken, obtenerMe);

export default router;


