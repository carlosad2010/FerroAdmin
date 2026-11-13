import { Router } from 'express';
import { registrarUsuario, loginUsuario, logoutUsuario, obtenerMe } from '../controllers/auth.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { obtenerCaptcha } from '../controllers/captcha.js';

const router = Router();

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/logout', logoutUsuario);
router.get('/me', verificarToken, obtenerMe);
router.get('/captcha', obtenerCaptcha);

export default router;


