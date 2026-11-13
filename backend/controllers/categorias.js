import * as categoriasService from '../services/categorias.js';

// GET /api/categorias (CONTRATO_API.md §5.4)
export const listarCategorias = async (req, res, next) => {
  try {
    const categorias = await categoriasService.listarCategorias();
    return res.status(200).json({ data: categorias });
  } catch (error) {
    return next(error);
  }
};
