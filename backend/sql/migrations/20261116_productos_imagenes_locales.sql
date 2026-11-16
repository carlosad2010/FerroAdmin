UPDATE productos
SET imagen_url = CASE nombre
  WHEN 'Martillo de uña 16 oz' THEN '/productos/Martillo.png'
  WHEN 'Taladro eléctrico' THEN '/productos/Taladro.png'
  WHEN 'Tornillos 3/4"' THEN '/productos/Caja de tornillos.webp'
  WHEN 'Pintura blanca 1L' THEN '/productos/Pintura.png'
  WHEN 'Llave ajustable' THEN '/productos/Llave ajustable.png'
  WHEN 'Cable eléctrico 2mm' THEN '/productos/Rollo de cable flexible.webp'
END
WHERE imagen_url IS NULL
  AND nombre IN (
    'Martillo de uña 16 oz',
    'Taladro eléctrico',
    'Tornillos 3/4"',
    'Pintura blanca 1L',
    'Llave ajustable',
    'Cable eléctrico 2mm'
  );
