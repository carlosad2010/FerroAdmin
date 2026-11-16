import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { comprobarConexion } from './config/db.js';
import { openapi } from './docs/openapi.js';
import authRoutes from './routes/auth.js';
import categoriasRoutes from './routes/categorias.js';
import productosRoutes from './routes/productos.js';
import { programarValidacionStockBajo } from './services/stockBajo.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares globales
app.use(express.json());
app.use(cookieParser());

// 2. Health check (§5.6) - Excepción que no va envuelta en data
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rutas del contrato (§5)
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', productosRoutes);

// Documentación interactiva (Swagger): http://localhost:3000/api/docs
// Solo fuera de producción, para no publicar la documentación interna.
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/docs.json', (req, res) => res.json(openapi));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, {
    customSiteTitle: 'FerroAdmin API',
  }));
}

// 3. Manejador 404 para rutas de API no encontradas (§3.2 del contrato)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: {
      codigo: 'NO_ENCONTRADO',
      mensaje: 'La ruta de API solicitada no existe'
    }
  });
});

// 4. Manejador global de errores normalizado (§3.2)
app.use((err, req, res, next) => {
  // JSON mal formado en el cuerpo: es un error del cliente (§3.3), no un 500
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        codigo: 'VALIDACION',
        mensaje: 'El cuerpo de la petición no es un JSON válido'
      }
    });
  }

  console.error(' Error interno no controlado:', err.stack);
  res.status(500).json({
    error: {
      codigo: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error interno en el servidor'
    }
  });
});

// 5. Comprobar PostgreSQL antes de aceptar peticiones (T09)
try {
  await comprobarConexion();
  console.log(' Conexión a PostgreSQL OK');
  programarValidacionStockBajo();
} catch (error) {
  console.error(' Error al conectar a PostgreSQL:', error.message);
  process.exit(1);
}

// 6. Iniciar servidor
app.listen(PORT, () => {
  console.log(` Servidor Express de FerroAdmin corriendo en http://localhost:${PORT}`);
});