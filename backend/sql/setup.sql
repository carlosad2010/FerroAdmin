CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS movimientos_inventario CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol VARCHAR(50) DEFAULT 'Operador',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
    id_categoria UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_categoria VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
);

CREATE TABLE productos (
    id_producto UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    id_categoria UUID REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movimientos_inventario (
    id_movimiento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_producto UUID REFERENCES productos(id_producto) ON DELETE CASCADE,
    id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    tipo_movimiento VARCHAR(20) CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad INT NOT NULL,
    motivo VARCHAR(255),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);





