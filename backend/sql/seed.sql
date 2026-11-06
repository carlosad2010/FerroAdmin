INSERT INTO usuarios (nombre, email, password_hash, repeated_password_hash, rol)
VALUES ('Pedro Perez', 'pedro.perez@example.com', '$2b$12$...', '$2b$12$...', 'Administrador');

INSERT INTO categorias (id_categoria, nombre_categoria, descripcion_categoria, descripcion)
values ('1', 'Electrónica', 'Dispositivos electrónicos y gadgets');

INSERT INTO productos (nombre, descripcion, id_categoria, stock_actual, stock_minimo, precio)
VALUES ('Smartphone', 'Smartphone de última generación', '1', 100, 10, 599.99);

INSERT INTO movimiento_inventario (id_producto, id_usuario, tipo_movimiento, cantidad, movimiento, fecha_movimiento)
SELECT id_producto, (SELECT id_usuario LIMIT 1), 'ENTRADA', 10 , 'carga inicial de inventario' FROM productos;

