
INSERT INTO usuarios (nombre, email, password_hash, rol) 
VALUES ('Carlos Zapata', 'carlos.zapata@ferroadmin.com', '$2b$10$EjemploHashPasswordBcryptMock', 'Administrador');


INSERT INTO categorias (nombre) VALUES
('Herramientas manuales'),
('Herramientas eléctricas'),
('Ferretería'),
('Pinturas'),
('Electricidad');

INSERT INTO productos (nombre, descripcion, categoria_id, precio, stock) VALUES
('Martillo de uña 16 oz', 'Martillo carpintero con mango de fibra', 1, 28500.00, 12),
('Taladro eléctrico', 'Taladro percutor 600W', 2, 180000.00, 5),
('Tornillos 3/4"', 'Caja de tornillos autorroscantes x100', 3, 12500.00, 50),
('Pintura blanca 1L', 'Pintura vinilo tipo 1 color blanco', 4, 35000.00, 12),
('Llave ajustable', 'Llave inglesa de 8 pulgadas', 1, 28000.00, 3),
('Cable eléctrico 2mm', 'Rollo de cable flexible x 10 metros', 5, 22000.00, 40);

INSERT INTO movimientos_inventario (producto_id, usuario_id, tipo_movimiento, cantidad, motivo) 
SELECT id, (SELECT id FROM usuarios LIMIT 1), 'ENTRADA', stock, 'Carga inicial de inventario'
FROM productos;
