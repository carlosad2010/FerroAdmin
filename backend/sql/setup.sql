CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pg_trgm: permite indexar busquedas parciales (ILIKE '%texto%') por nombre (T14)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS tokens_recuperacion CASCADE;
DROP TABLE IF EXISTS captchas CASCADE;

DROP TABLE IF EXISTS movimientos_inventario CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol VARCHAR(50) DEFAULT 'Operador',
    creado_en TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(60) UNIQUE NOT NULL
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_productos_nombre_lower ON productos (lower(nombre));

-- Indice trigram para GET /api/productos?buscar= (CONTRATO_API.md 5.5).
-- Un indice normal no sirve cuando el patron empieza con comodin ('%mart%');
-- este parte el nombre en trozos de 3 letras y evita recorrer toda la tabla.
CREATE INDEX idx_productos_nombre_trgm ON productos USING gin (nombre gin_trgm_ops);

CREATE TABLE movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_movimiento VARCHAR(20) CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad INT NOT NULL,
    motivo VARCHAR(255),
    creado_en TIMESTAMPTZ DEFAULT now()
);



-- Codigos para recuperar la clave (T21). Se guarda el hash, nunca el codigo.
CREATE TABLE tokens_recuperacion (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    vence_en TIMESTAMPTZ NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- Retos del CAPTCHA (T07, CONTRATO_API.md §11.1). En la base y no en memoria,
-- para que funcione en Vercel. Cada reto se borra al verificarlo.
CREATE TABLE captchas (
    id UUID PRIMARY KEY,
    respuesta INT NOT NULL,
    vence TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_captchas_vence ON captchas (vence);

