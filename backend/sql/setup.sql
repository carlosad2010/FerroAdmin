CREATE EXTEENSION IF NOT EXIASTS "uuid-ossp";

DROP TABLE IF EXISTS movimientos_inventario CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios(
    id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL
    password_hash TEXT NOT NULL,
    repeated_password_hash TEXT NOT NULL,
    rol VARCHAR(50) DEFAULT 'Operador',
    fecha_creaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE categorias(
    id_categoria UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_categoria VARCHAR(100) NOT NULL
    desripcion_categoria TEXT
);

CREATE TABLE productos(
    id_ producto UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_categoria UUID REFERENCES categorias(id_categoria) ON DELETE CASCADE,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE movimientos_inventario(
    id_movimiento UUDI PRIMARY KEY DEFAULT uuid_generate_4v(),
    id_producto UUID REFERENCES productos(id_producto) ON DELETE CASCADE,
    id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(20) CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    canrtidad INT NOT NULL,
    motivo VARCHAR(255),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);





