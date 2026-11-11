import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error(' Error al conectar con PostgreSQL:', err.stack);
  } else {
    console.log(' Conectado a PostgreSQL:', res.rows[0].now);
  }
});