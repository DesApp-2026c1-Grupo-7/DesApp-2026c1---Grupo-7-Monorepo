const mongoose = require('mongoose');
const Material = require('../models/Material');
const Subject = require('../models/Subject');
const SystemConfig = require('../models/SystemConfig');
const { gcsHabilitado, subirArchivo } = require('../utils/gcs');

const createMaterial = async (req, res) => {
  try {
    const { titulo, descripcion, materia, tipo, categoria, url, tags, discordMetadata } = req.body;
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

    if (categoria === 'discord' && discordMetadata) {
      try {
        materialData.discordMetadata = typeof discordMetadata === 'string'
          ? JSON.parse(discordMetadata)
          : discordMetadata;
      } catch {
        materialData.discordMetadata = discordMetadata;
      }
    }

    if (tipo === 'archivo') {
      if (!req.file) {
        return res.status(400).json({ mensaje: 'Debe subir un archivo para el tipo archivo' });
      }
      if (gcsHabilitado()) {
        // Archivo real en el bucket de Google Cloud Storage.
        const { url } = await subirArchivo(req.file);
        materialData.url = url;
      } else {
        // Fallback a disco local (dev sin credenciales de GCS).
        materialData.url = `/uploads/materials/${req.file.filename}`;
      }
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

    // Obtener configuración de umbrales
    let config = await SystemConfig.findOne({ key: 'materialReportThresholds' });
    const thresholds = config ? config.value : { nPending: 3, mVerified: 1 };

    if (materia) match.materia = new mongoose.Types.ObjectId(materia);
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

    const isAdmin = req.user && req.user.role === 'admin';

    const pipeline = [
      { $match: match },
      // Lookup for reports to count pending and verified
      {
        $lookup: {
          from: 'materialreports',
          localField: '_id',
          foreignField: 'material',
          as: 'reports'
        }
      },
      {
        $addFields: {
          pendingReports: {
            $size: {
              $filter: {
                input: '$reports',
                as: 'r',
                cond: { $eq: ['$$r.estado', 'pendiente'] }
              }
            }
          },
          verifiedReports: {
            $size: {
              $filter: {
                input: '$reports',
                as: 'r',
                cond: { $eq: ['$$r.estado', 'revisado'] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          suspendido: {
            $or: [
              { $gte: ['$pendingReports', thresholds.nPending] },
              { $gte: ['$verifiedReports', thresholds.mVerified] }
            ]
          }
        }
      },
      {
        $addFields: {
          userVote: {
            $let: {
              vars: {
                userValoracion: {
                  $filter: {
                    input: { $ifNull: ["$valoraciones", []] },
                    as: "v",
                    cond: { $eq: ["$$v.usuario", new mongoose.Types.ObjectId(req.user.id)] }
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
          'valoraciones': 0,
          'reports': 0 // No enviar detalles de denuncias
        }
      },
      {
        $addFields: {
          // Ocultar URL si está suspendido
          url: {
            $cond: [
              { $and: [{ $eq: ["$suspendido", true] }, { $eq: [isAdmin, false] }] },
              null,
              "$url"
            ]
          },
          nombreOriginal: {
            $cond: [
              { $and: [{ $eq: ["$suspendido", true] }, { $eq: [isAdmin, false] }] },
              null,
              "$nombreOriginal"
            ]
          }
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

const extractInviteCode = (url) => {
  try {
    const patterns = [
      /discord\.gg\/(\w+)/,
      /discord\.com\/invite\/(\w+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
};

const getDiscordInfo = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ mensaje: 'URL requerida' });
    }

    const inviteCode = extractInviteCode(url);
    if (!inviteCode) {
      return res.status(400).json({ mensaje: 'No se pudo extraer un código de invitación de la URL' });
    }

    const apiUrl = `https://discord.com/api/v10/invites/${inviteCode}?with_counts=true`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return res.json({
        inviteCode,
        serverName: null,
        channelName: null,
        channelDescription: null,
        memberCount: null,
        error: 'No se pudo obtener información del servidor'
      });
    }

    const data = await response.json();
    
    res.json({
      inviteCode,
      serverName: data.guild?.name || null,
      channelName: data.channel?.name || null,
      channelDescription: data.guild?.description || null,
      memberCount: data.approximate_member_count || null
    });
  } catch (error) {
    res.json({
      inviteCode: null,
      serverName: null,
      channelName: null,
      channelDescription: null,
      memberCount: null,
      error: 'Error al conectar con Discord'
    });
  }
};

module.exports = {
  createMaterial,
  getMaterials,
  deleteMaterial,
  rateMaterial,
  getDiscordInfo
};
