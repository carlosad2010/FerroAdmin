INSERT INTO usuarios (nombre, email, password_hash, rol) 
VALUES ('Carlos Zapata', 'carlos.zapata@ferroadmin.com', '$2b$10$EjemploHashPasswordBcryptMock', 'Administrador');

INSERT INTO categorias (id_categoria, nombre_categoria, descripcion) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Herramientas', 'Herramientas manuales y de mano'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Herramientas eléctricas', 'Taladros, sierras y equipos a motor'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Ferretería', 'Tornillería, anclajes y accesorios'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Pinturas', 'Pinturas, esmaltes y solventes'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Electricidad', 'Cables, enchufes y material eléctrico');

INSERT INTO productos (nombre, descripcion, id_categoria, stock_actual, stock_minimo, precio) VALUES
('Martillo de acero', 'Martillo carpintero con mango de fibra', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 25, 5, 45.00),
('Taladro eléctrico', 'Taladro percutor 600W', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 5, 8, 180.00),
('Tornillos 3/4"', 'Caja de tornillos autorroscantes x100', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 50, 10, 12.50),
('Pintura blanca 1L', 'Pintura vinilo tipo 1 color blanco', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 12, 4, 35.00),
('Llave ajustable', 'Llave inglesa de 8 pulgadas', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, 5, 28.00),
('Cable eléctrico 2mm', 'Rollo de cable flexible x 10 metros', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 40, 10, 22.00);

INSERT INTO movimientos_inventario (id_producto, id_usuario, tipo_movimiento, cantidad, motivo) 
SELECT id_producto, (SELECT id_usuario FROM usuarios LIMIT 1), 'ENTRADA', 10, 'Carga inicial de inventario'
FROM productos;

