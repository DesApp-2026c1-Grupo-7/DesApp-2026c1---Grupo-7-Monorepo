const Material = require('../models/Material');
const Subject = require('../models/Subject');

const createMaterial = async (req, res) => {
  try {
    const { titulo, descripcion, materia, tipo, categoria, url, tags } = req.body;
    const autor = req.user.id;

    let materialData = {
      titulo,
      descripcion,
      materia,
      autor,
      tipo,
      categoria,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : []
    };

    if (tipo === 'archivo') {
      if (!req.file) {
        return res.status(400).json({ mensaje: 'Debe subir un archivo para el tipo archivo' });
      }
      materialData.url = `/uploads/materials/${req.file.filename}`;
      materialData.nombreOriginal = req.file.originalname;
      materialData.mimetype = req.file.mimetype;
      materialData.size = req.file.size;
      materialData.categoria = 'archivo';
    } else {
      if (!url) {
        return res.status(400).json({ mensaje: 'Debe proporcionar una URL para el tipo link' });
      }
      materialData.url = url;
    }

    const material = new Material(materialData);
    await material.save();

    res.status(201).json({ mensaje: 'Material publicado con éxito', material });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al publicar material', error: error.message });
  }
};

const getMaterials = async (req, res) => {
  try {
    const { materia, search, categoria, tags } = req.query;
    const filter = {};

    if (materia) filter.materia = materia;
    if (categoria) filter.categoria = categoria;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    
    if (search) {
      filter.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const materials = await Material.find(filter)
      .populate('materia', 'nombre codigo')
      .populate('autor', 'nombre apellido email')
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener materiales', error: error.message });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }

    // Solo el autor o un admin puede borrar (asumiendo que hay roles)
    if (material.autor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este material' });
    }

    await Material.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Material eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar material', error: error.message });
  }
};

module.exports = {
  createMaterial,
  getMaterials,
  deleteMaterial
};
