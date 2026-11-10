import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  const token = req.cookies?.ferro_token;

  if (!token) {
    return res.status(401).json({
      error: {
        codigo: 'NO_AUTENTICADO',
        mensaje: 'No se encontró una sesión activa'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Guardamos el id del usuario en req.usuario para usarlo en los controllers
    req.usuario = { id: decoded.sub };
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        codigo: 'NO_AUTENTICADO',
        mensaje: 'Token inválido o expirado'
      }
    });
  }
};