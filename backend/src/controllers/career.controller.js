const Career = require('../models/Career');
const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');
const StudySession = require('../models/StudySession');
const Material = require('../models/Material');

const getCareers = async (req, res) => {
  try {
    const careers = await Career.find().sort({ nombre: 1 });

    // Calcular cantidades reales
    const enriched = await Promise.all(
      careers.map(async (c) => {
        const cantidadMaterias = await Subject.countDocuments({ carrera: c._id });
        const cantidadEstudiantes = await User.countDocuments({ carrera: c._id, role: 'student' });
        return {
          ...c.toObject(),
          cantidadMaterias: cantidadMaterias ?? c.cantidadMaterias,
          cantidadEstudiantes: cantidadEstudiantes ?? c.cantidadEstudiantes
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener carreras', error: error.message });
  }
};

const getCareerById = async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) {
      return res.status(404).json({ mensaje: 'Carrera no encontrada' });
    }
    res.json(career);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener carrera', error: error.message });
  }
};

const createCareer = async (req, res) => {
  try {
    const {
      nombre,
      codigo,
      descripcion,
      titulo,
      instituto,
      duracionAnios
    } = req.body;

    const existingCareer = await Career.findOne({ $or: [{ nombre }, { codigo }] });
    if (existingCareer) {
      return res.status(400).json({ mensaje: 'La carrera o el código ya existen' });
    }

    const career = new Career({
      nombre,
      codigo,
      descripcion,
      titulo,
      instituto,
      duracionAnios
    });

    await career.save();
    res.status(201).json({ mensaje: 'Carrera creada con éxito', career });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear carrera', error: error.message });
  }
};

const updateCareer = async (req, res) => {
  try {
    const {
      nombre,
      codigo,
      descripcion,
      titulo,
      instituto,
      duracionAnios
    } = req.body;

    const career = await Career.findByIdAndUpdate(
      req.params.id,
      {
        nombre,
        codigo,
        descripcion,
        titulo,
        instituto,
        duracionAnios
      },
      { new: true, runValidators: true }
    );

    if (!career) {
      return res.status(404).json({ mensaje: 'Carrera no encontrada' });
    }

    res.json({ mensaje: 'Carrera actualizada', career });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar carrera', error: error.message });
  }
};

const deleteCareer = async (req, res) => {
  try {
    const careerId = req.params.id;

    // No permitir borrar si tiene estudiantes o planes asociados
    const studentsUsing = await User.countDocuments({ carrera: careerId });
    const plansUsing = await StudyPlan.countDocuments({ carrera: careerId });

    if (studentsUsing > 0 || plansUsing > 0) {
      return res.status(409).json({
        mensaje: 'No se puede eliminar: la carrera tiene estudiantes o planes asociados',
        estudiantes: studentsUsing,
        planes: plansUsing
      });
    }

    const career = await Career.findByIdAndDelete(careerId);
    if (!career) {
      return res.status(404).json({ mensaje: 'Carrera no encontrada' });
    }

    res.json({ mensaje: 'Carrera eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar carrera', error: error.message });
  }
};

const getComunidadActiva = async (req, res) => {
  try {
    const studentsPorCarrera = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$carrera', estudiantes: { $sum: 1 }, totalContactos: { $sum: { $size: { $ifNull: ['$contactos', []] } } } } }
    ]);

    const sesionesPorCarrera = await StudySession.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'creador',
          foreignField: '_id',
          as: 'creadorData'
        }
      },
      { $unwind: '$creadorData' },
      { $group: { _id: '$creadorData.carrera', sesiones: { $sum: 1 } } }
    ]);

    const materialesPorCarrera = await Material.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'autor',
          foreignField: '_id',
          as: 'autorData'
        }
      },
      { $unwind: '$autorData' },
      { $group: { _id: '$autorData.carrera', materiales: { $sum: 1 } } }
    ]);

    const carreras = await Career.find().sort({ nombre: 1 });

    const sesionesMap = {};
    sesionesPorCarrera.forEach(s => { if (s._id) sesionesMap[s._id.toString()] = s.sesiones; });

    const materialesMap = {};
    materialesPorCarrera.forEach(m => { if (m._id) materialesMap[m._id.toString()] = m.materiales; });

    const studentsMap = {};
    studentsPorCarrera.forEach(s => { if (s._id) studentsMap[s._id.toString()] = s; });

    const result = carreras.map(c => {
      const id = c._id.toString();
      const studentData = studentsMap[id] || { estudiantes: 0, totalContactos: 0 };
      return {
        _id: c._id,
        nombre: c.nombre,
        codigo: c.codigo,
        estudiantes: studentData.estudiantes,
        conexiones: studentData.totalContactos,
        sesiones: sesionesMap[id] || 0,
        materiales: materialesMap[id] || 0
      };
    });

    result.sort((a, b) => b.estudiantes - a.estudiantes);

    const totales = result.reduce((acc, c) => ({
      estudiantes: acc.estudiantes + c.estudiantes,
      conexiones: acc.conexiones + c.conexiones,
      sesiones: acc.sesiones + c.sesiones,
      materiales: acc.materiales + c.materiales
    }), { estudiantes: 0, conexiones: 0, sesiones: 0, materiales: 0 });

    res.json({ carreras: result, totales });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener carreras con comunidad activa', error: error.message });
  }
};

module.exports = {
  getCareers,
  getCareerById,
  createCareer,
  updateCareer,
  deleteCareer,
  getComunidadActiva
};
