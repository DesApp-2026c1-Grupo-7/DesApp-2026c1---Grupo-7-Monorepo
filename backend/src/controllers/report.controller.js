const MaterialReport = require('../models/MaterialReport');
const ReportReason = require('../models/ReportReason');
const Material = require('../models/Material');
const SystemConfig = require('../models/SystemConfig');
const Notification = require('../models/Notification');

// Obtener configuración de denuncias (thresholds)
exports.getReportConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne({ key: 'materialReportThresholds' });
    
    if (!config) {
      // Valores por defecto si no existe
      config = {
        key: 'materialReportThresholds',
        value: { nPending: 3, mVerified: 1 },
        description: 'Umbrales para suspensión automática de material'
      };
    }
    
    res.json(config.value);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener la configuración', error: error.message });
  }
};

// Actualizar configuración de denuncias
exports.updateReportConfig = async (req, res) => {
  try {
    const { nPending, mVerified } = req.body;
    
    if (typeof nPending !== 'number' || typeof mVerified !== 'number') {
      return res.status(400).json({ mensaje: 'Los umbrales deben ser números' });
    }

    const config = await SystemConfig.findOneAndUpdate(
      { key: 'materialReportThresholds' },
      { 
        value: { nPending, mVerified },
        description: 'Umbrales para suspensión automática de material'
      },
      { upsert: true, new: true }
    );

    res.json({ mensaje: 'Configuración actualizada con éxito', config: config.value });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar la configuración', error: error.message });
  }
};

// Obtener motivos de denuncia activos
exports.getReasons = async (req, res) => {
  try {
    const reasons = await ReportReason.find({ activo: true }).sort({ orden: 1 });
    res.json(reasons);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los motivos de denuncia' });
  }
};

// Crear una nueva denuncia de material
exports.createReport = async (req, res) => {
  try {
    const { materialId, reasonId, motivoEspecifico, detalle } = req.body;
    const denuncianteId = req.user.id;

    // Verificar si el material existe
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ mensaje: 'Material no encontrado' });
    }

    // El autor no puede denunciar su propio material (para eso puede eliminarlo)
    if (material.autor.toString() === denuncianteId) {
      return res.status(400).json({ mensaje: 'No podés denunciar tu propio material' });
    }

    // Verificar si el motivo existe
    const reason = await ReportReason.findById(reasonId);
    if (!reason) {
      return res.status(404).json({ mensaje: 'Motivo de denuncia no encontrado' });
    }

    // Si el motivo es "Otro", el motivo específico es requerido
    if (reason.titulo.toLowerCase() === 'otro' && !motivoEspecifico) {
      return res.status(400).json({ mensaje: 'Debe especificar el motivo' });
    }

    const report = new MaterialReport({
      material: materialId,
      denunciante: denuncianteId,
      motivo: reasonId,
      motivoEspecifico,
      detalle
    });

    await report.save();

    res.status(201).json({ mensaje: 'Denuncia enviada correctamente', report });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear la denuncia', error: error.message });
  }
};

// Admin: Obtener todas las denuncias
exports.getAllReports = async (req, res) => {
  try {
    // Obtener configuracion para calcular suspension en tiempo real
    let config = await SystemConfig.findOne({ key: 'materialReportThresholds' });
    const thresholds = config ? config.value : { nPending: 3, mVerified: 1 };

    const reports = await MaterialReport.find()
      .populate({
        path: 'material',
        populate: [
          { path: 'materia', select: 'nombre codigo' },
          { path: 'autor', select: 'nombre email' }
        ],
        select: '+mimetype +nombreOriginal'
      })
      .populate('denunciante', 'nombre email')
      .populate('motivo', 'titulo')
      .sort({ createdAt: -1 });

    // Para cada reporte, calcular si el material esta suspendido
    const reportsWithSuspension = await Promise.all(reports.map(async (r) => {
      const reportData = r.toObject();
      if (reportData.material) {
        const counts = await MaterialReport.aggregate([
          { $match: { material: reportData.material._id } },
          {
            $group: {
              _id: '$estado',
              count: { $sum: 1 }
            }
          }
        ]);

        const pending = counts.find(c => c._id === 'pendiente')?.count || 0;
        const verified = counts.find(c => c._id === 'revisado')?.count || 0;

        reportData.material.suspendido = (pending >= thresholds.nPending || verified >= thresholds.mVerified);
        reportData.material.pendingReports = pending;
        reportData.material.verifiedReports = verified;
      }
      return reportData;
    }));

    res.json(reportsWithSuspension);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener las denuncias', error: error.message });
  }
};

// Admin: Actualizar estado de una denuncia
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, resolucion } = req.body;

    const report = await MaterialReport.findById(id)
      .populate('material')
      .populate('denunciante');

    if (!report) {
      return res.status(404).json({ mensaje: 'Denuncia no encontrada' });
    }

    report.estado = estado;
    if (resolucion) report.resolucion = resolucion;
    await report.save();

    // Notificaciones
    if (estado === 'revisado') {
      // Notificar al denunciante
      await Notification.create({
        usuario: report.denunciante._id,
        titulo: 'Denuncia aceptada',
        descripcion: `Tu denuncia sobre el material "${report.material.titulo}" ha sido aceptada. Se han tomado acciones preventivas.`,
        tipo: 'success'
      });

      // Notificar al autor del material
      await Notification.create({
        usuario: report.material.autor,
        titulo: 'Material reportado y aceptado',
        descripcion: `Se ha confirmado una denuncia sobre tu material "${report.material.titulo}". Podría estar suspendido según las normas del sistema.`,
        tipo: 'warning'
      });
    } else if (estado === 'ignorado') {
      // Notificar al denunciante
      await Notification.create({
        usuario: report.denunciante._id,
        titulo: 'Denuncia desestimada',
        descripcion: `Tu denuncia sobre el material "${report.material.titulo}" ha sido revisada y rechazada.`,
        tipo: 'info'
      });

      // Notificar al autor del material
      await Notification.create({
        usuario: report.material.autor,
        titulo: 'Denuncia rechazada',
        descripcion: `Se ha rechazado una denuncia sobre tu material "${report.material.titulo}". El estado del material no se verá afectado por esta denuncia.`,
        tipo: 'info'
      });
    }

    res.json({ mensaje: 'Estado de la denuncia actualizado', report });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar la denuncia', error: error.message });
  }
};

// Admin: Configurar motivos (CRUD)
exports.createReason = async (req, res) => {
    try {
        const { titulo, descripcion } = req.body;
        const newReason = new ReportReason({ titulo, descripcion });
        await newReason.save();
        res.status(201).json(newReason);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el motivo' });
    }
};

exports.updateReason = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, descripcion, activo } = req.body;
        const reason = await ReportReason.findByIdAndUpdate(id, { titulo, descripcion, activo }, { new: true });
        res.json(reason);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el motivo' });
    }
};

exports.getReportStats = async (req, res) => {
    try {
        const totalDenuncias = await MaterialReport.countDocuments();

        const totales = await MaterialReport.aggregate([
            { $group: { _id: '$estado', count: { $sum: 1 } } }
        ]);

        const totalesMap = { pendiente: 0, revisado: 0, ignorado: 0 };
        totales.forEach(t => { totalesMap[t._id] = t.count; });

        const porMotivo = await MaterialReport.aggregate([
            {
                $lookup: {
                    from: 'reportreasons',
                    localField: 'motivo',
                    foreignField: '_id',
                    as: 'motivoData'
                }
            },
            { $unwind: '$motivoData' },
            { $group: { _id: '$motivoData.titulo', cantidad: { $sum: 1 } } },
            { $sort: { cantidad: -1 } }
        ]);

        const porPeriodo = await MaterialReport.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const materialesConDenunciasArr = await Material.aggregate([
            {
                $lookup: {
                    from: 'materialreports',
                    localField: '_id',
                    foreignField: 'material',
                    as: 'denuncias'
                }
            },
            { $match: { 'denuncias.0': { $exists: true } } },
            { $count: 'total' }
        ]);

        res.json({
            totalDenuncias,
            totales: totalesMap,
            porMotivo,
            porPeriodo,
            materialesConDenuncias: materialesConDenunciasArr[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener estadísticas de denuncias', error: error.message });
    }
};
