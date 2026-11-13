import {
  registrarUsuario as registrarUsuarioService,
  loginUsuario as loginUsuarioService,
  obtenerUsuario as obtenerUsuarioService
} from '../services/auth.js';

export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validación básica de campos obligatorios (según contrato §5.2)
    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: {
          codigo: 'VALIDACION',
          mensaje: 'Faltan campos obligatorios'
        }
      });
    }

    const nuevoUsuario = await registrarUsuarioService({ nombre, email, password });

    // Respuesta 201 Created con el objeto de salida del contrato
    return res.status(201).json({
      data: nuevoUsuario
    });

  } catch (error) {
    // Correo duplicado: lo detecta el servicio (codigo CONFLICTO) o,
    // si dos registros llegan a la vez, el índice único de PostgreSQL (23505)
    if (error.codigo === 'CONFLICTO' || error.code === '23505') {
      return res.status(409).json({
        error: {
          codigo: 'CONFLICTO',
          mensaje: 'El correo electrónico ya se encuentra registrado'
        }
      });
    }

    console.error('Error en registro:', error);
    return res.status(500).json({
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: 'Error interno al registrar el usuario'
      }
    });
  }
};

export const loginUsuario = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          codigo: 'VALIDACION',
          mensaje: 'Correo y contraseña son obligatorios'
        }
      });
    }

    const resultado = await loginUsuarioService({ email, password });

    if (!resultado) {
      // Contrato §3.3: mismo mensaje genérico por seguridad
      return res.status(401).json({
        error: {
          codigo: 'CREDENCIALES_INVALIDAS',
          mensaje: 'Correo o clave incorrectos'
        }
      });
    }

    const { usuario, token } = resultado;

    // Configurar la cookie HttpOnly según el contrato (§4.1)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('ferro_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      path: '/',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas en milisegundos
    });

    return res.status(200).json({
      data: usuario
    });

  } catch (error) {
    // El servicio lanza este código si el correo no existe o la clave no coincide
    if (error.codigo === 'CREDENCIALES_INVALIDAS') {
      return res.status(401).json({
        error: {
          codigo: 'CREDENCIALES_INVALIDAS',
          mensaje: 'Correo o clave incorrectos'
        }
      });
    }

    console.error('Error en login:', error);
    return res.status(500).json({
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: 'Error interno al iniciar sesión'
      }
    });
  }
};

export const logoutUsuario = (req, res) => {
  // Borrar cookie limpiando su tiempo de vida (§5.3)
  res.cookie('ferro_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  });
  return res.sendStatus(204);
};

export const obtenerMe = async (req, res, next) => {
  // Se usa junto con el middleware verificarToken, que deja req.usuario = { id }
  try {
    const usuario = await obtenerUsuarioService(req.usuario.id);

    // §5.3: también es 401 si el usuario del token ya no existe
    if (!usuario) {
      return res.status(401).json({
        error: {
          codigo: 'NO_AUTENTICADO',
          mensaje: 'No se encontró una sesión activa'
        }
      });
    }

    return res.status(200).json({
      data: usuario
    });
  } catch (error) {
    return next(error);
  }
};