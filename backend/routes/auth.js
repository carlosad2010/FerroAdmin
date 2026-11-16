import { Router } from 'express';
import { registrarUsuario, loginUsuario, logoutUsuario, obtenerMe } from '../controllers/auth.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { obtenerCaptcha } from '../controllers/captcha.js';
import { pedirRecuperacion, cambiarClave } from '../controllers/recuperacion.js'; // LINEA NUEVA

const router = Router();

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/logout', logoutUsuario);
router.get('/me', verificarToken, obtenerMe);
router.get('/captcha', obtenerCaptcha);
router.post('/recuperar', pedirRecuperacion);   // LINEA NUEVA
router.post('/restablecer', cambiarClave);      // LINEA NUEVA

export default router;