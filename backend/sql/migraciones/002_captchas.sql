-- Migracion 002 (T23): el CAPTCHA pasa de la memoria del servidor a la base,
-- para que funcione en Vercel (CONTRATO_API.md §11.1).
-- Se puede correr varias veces sin borrar datos (IF NOT EXISTS).
-- Desde backend/:  psql -U postgres -d ferroadmin -f sql/migraciones/002_captchas.sql
CREATE TABLE IF NOT EXISTS captchas (
    id UUID PRIMARY KEY,
    respuesta INT NOT NULL,
    vence TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_captchas_vence ON captchas (vence);
