import "dotenv/config";
import pkg from "pg";

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en backend/.env (copia .env.example y completa tus datos).");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Un error en una conexión inactiva no debe tumbar el proceso.
// Solo se registra el mensaje: nunca la URL, que lleva la clave.
pool.on("error", (error) => {
  console.error(`Error en una conexión inactiva de PostgreSQL: ${error.message}`);
});

const MENSAJES_CONEXION = {
  ECONNREFUSED: "No se pudo conectar a PostgreSQL: el servidor está apagado o el puerto es incorrecto.",
  ENOTFOUND: "No se pudo conectar a PostgreSQL: el host de DATABASE_URL no existe.",
  "28P01": "PostgreSQL rechazó el usuario o la clave de DATABASE_URL.",
  "3D000": "La base de datos de DATABASE_URL no existe. Créala con: CREATE DATABASE ferroadmin;",
};

// Ejecuta SELECT 1. Si falla, lanza un error con un mensaje claro en español.
export async function comprobarConexion() {
  try {
    await pool.query("SELECT 1");
  } catch (error) {
    const mensaje =
      MENSAJES_CONEXION[error.code] ||
      `No se pudo conectar a PostgreSQL (${error.code || "error desconocido"}).`;
    throw new Error(mensaje, { cause: error });
  }

}
