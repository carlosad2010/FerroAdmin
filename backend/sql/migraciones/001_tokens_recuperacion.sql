-- Migracion 001 (T21): tabla de codigos para recuperar la clave.
-- Se puede correr varias veces sin borrar datos (IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS tokens_recuperacion (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    vence_en TIMESTAMPTZ NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ DEFAULT now()
);