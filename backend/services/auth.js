import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export const registrarUsuario = async ({ nombre, email, password }) => {
  // Verificar si el correo ya existe
  const usuarioExistente = await pool.query(
    'SELECT id FROM usuarios WHERE email = $1',
    [email.toLowerCase()]
  );

  if (usuarioExistente.rows.length > 0) {
    const error = new Error('El correo ya está registrado');
    error.codigo = 'CONFLICTO';
    throw error;
  }

  // Encriptar contraseña (costo 10)
  const passwordHash = await bcrypt.hash(password, 10);

  // Insertar usuario
  const query = `
    INSERT INTO usuarios (nombre, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, nombre, email, creado_en AS "creadoEn"
  `;
  const values = [nombre.trim(), email.toLowerCase(), passwordHash];
  const resultado = await pool.query(query, values);

  return resultado.rows[0];
};

export const loginUsuario = async ({ email, password }) => {
  const query = `
    SELECT id, nombre, email, password_hash 
    FROM usuarios 
    WHERE email = $1
  `;
  const resultado = await pool.query(query, [email.toLowerCase()]);
  const usuario = resultado.rows[0];

  // Si no existe o la contraseña no coincide, lanzamos un error genérico de credenciales
  if (!usuario) {
    const error = new Error('Correo o clave incorrectos');
    error.codigo = 'CREDENCIALES_INVALIDAS';
    throw error;
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    const error = new Error('Correo o clave incorrectos');
    error.codigo = 'CREDENCIALES_INVALIDAS';
    throw error;
  }

  // Generar JWT
  const token = jwt.sign(
    { sub: usuario.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRA || '8h' }
  );

  // Retornar datos del usuario (sin el hash) y el token
  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email
    },
    token
  };
};