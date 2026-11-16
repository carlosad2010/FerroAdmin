// Arranque en local (npm run dev / npm start).
// En Vercel este archivo no se usa: allá no hay app.listen ni node-cron (§11.1).
import app from './app.js';
import { comprobarConexion } from './config/db.js';
import { programarValidacionStockBajo } from './services/stockBajo.js';

const PORT = process.env.PORT || 3000;

// Comprobar PostgreSQL antes de aceptar peticiones (T09)
try {
  await comprobarConexion();
  console.log(' Conexión a PostgreSQL OK');
  programarValidacionStockBajo();
} catch (error) {
  console.error(' Error al conectar a PostgreSQL:', error.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(` Servidor Express de FerroAdmin corriendo en http://localhost:${PORT}`);
});
