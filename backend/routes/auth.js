import { Router } from 'express';
import { 
  obtenerCaptcha, 
  registrarUsuario, 
  loginUsuario, 
  logoutUsuario, 
  obtenerMe 
} from '../controllers/auth.js';
import { verificarToken } from '../middlewares/auth.js';

const router = Router();

// Rutas públicas de autenticación y seguridad
router.get('/captcha', obtenerCaptcha);
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/logout', logoutUsuario);

// Ruta protegida
router.get('/me', verificarToken, obtenerMe);

export default router;