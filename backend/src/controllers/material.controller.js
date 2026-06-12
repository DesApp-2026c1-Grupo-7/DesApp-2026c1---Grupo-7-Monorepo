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
    const { materia, search, categoria, tags, sort } = req.query;
    const match = {};

    if (materia) match.materia = new (require('mongoose').Types.ObjectId)(materia);
    if (categoria) match.categoria = categoria;
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      match.tags = { $in: tagsArray };
    }
    
    if (search) {
      match.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const pipeline = [
      { $match: match },
      {
        $addFields: {
          userVote: {
            $let: {
              vars: {
                userValoracion: {
                  $filter: {
                    input: { $ifNull: ["$valoraciones", []] },
                    as: "v",
                    cond: { $eq: ["$$v.usuario", new (require('mongoose').Types.ObjectId)(req.user.id)] }
                  }
                }
              },
              in: { $arrayElemAt: ["$$userValoracion.voto", 0] }
            }
          },
          likes: {
            $size: {
              $filter: {
                input: { $ifNull: ["$valoraciones", []] },
                as: "v",
                cond: { $eq: ["$$v.voto", 1] }
              }
            }
          },
          dislikes: {
            $size: {
              $filter: {
                input: { $ifNull: ["$valoraciones", []] },
                as: "v",
                cond: { $eq: ["$$v.voto", -1] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          totalValoraciones: { $add: ["$likes", "$dislikes"] },
          ratio: {
            $cond: [
              { $eq: [{ $add: ["$likes", "$dislikes"] }, 0] },
              0,
              { $divide: ["$likes", { $add: ["$likes", "$dislikes"] }] }
            ]
          }
        }
      }
    ];

    // Sorting logic
    let sortObj = { createdAt: -1 };
    if (sort === 'valoracion') {
      sortObj = { ratio: -1, totalValoraciones: -1 };
    }
    pipeline.push({ $sort: sortObj });

    // Lookup for materia and autor
    pipeline.push(
      {
        $lookup: {
          from: 'subjects',
          localField: 'materia',
          foreignField: '_id',
          as: 'materia'
        }
      },
      { $unwind: '$materia' },
      {
        $lookup: {
          from: 'users',
          localField: 'autor',
          foreignField: '_id',
          as: 'autor'
        }
      },
      { $unwind: '$autor' },
      {
        $project: {
          'autor.password': 0,
          'autor.configuracionPrivacidad': 0,
          'valoraciones': 0 // Opcional: no enviar todas las valoraciones individuales si no se necesitan
        }
      }
    );

    const materials = await Material.aggregate(pipeline);

    res.json(materials);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener materiales', error: error.message });
  }
};

const rateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { voto } = req.body; // 1 o -1
    const usuarioId = req.user.id;

    if (![1, -1].includes(voto)) {
      return res.status(400).json({ mensaje: 'Voto inválido' });
    }

    const material = await Material.findById(id);
    if (!material) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }

    // Buscar si el usuario ya valoró
    const index = material.valoraciones.findIndex(v => v.usuario.toString() === usuarioId);

    if (index !== -1) {
      if (material.valoraciones[index].voto === voto) {
        // Si es el mismo voto, lo quitamos (toggle)
        material.valoraciones.splice(index, 1);
      } else {
        // Si es distinto, lo actualizamos
        material.valoraciones[index].voto = voto;
      }
    } else {
      // Si no valoró, agregamos
      material.valoraciones.push({ usuario: usuarioId, voto });
    }

    await material.save();
    res.json({ mensaje: 'Valoración actualizada con éxito', valoraciones: material.valoraciones });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al valorar material', error: error.message });
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
  deleteMaterial,
  rateMaterial
};
