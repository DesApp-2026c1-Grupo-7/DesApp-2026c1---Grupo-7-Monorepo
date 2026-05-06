const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');

const getSubjects = async (req, res) => {
  try {
    const { carrera, anio, esOptativa } = req.query;
    const filter = {};
    if (carrera) filter.carrera = carrera;
    if (anio) filter.anio = Number(anio);
    if (esOptativa !== undefined) filter.esOptativa = esOptativa === 'true';

    const subjects = await Subject.find(filter)
      .populate('carrera', 'nombre codigo')
      .populate('correlativas', 'nombre codigo')
      .sort({ anio: 1, cuatrimestre: 1, nombre: 1 });

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener materias', error: error.message });
  }
};

const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('carrera', 'nombre codigo')
      .populate('correlativas', 'nombre codigo anio');
    if (!subject) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener materia', error: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { nombre, codigo, anio, cuatrimestre, creditos, carrera, correlativas, esOptativa, esUnahur } = req.body;

    const existingSubject = await Subject.findOne({ codigo });
    if (existingSubject) {
      return res.status(400).json({ mensaje: 'El código de materia ya existe' });
    }

    const subject = new Subject({
      nombre,
      codigo,
      anio,
      cuatrimestre,
      creditos: creditos || 0,
      carrera: carrera || null,
      correlativas: correlativas || [],
      esOptativa: !!esOptativa,
      esUnahur: esUnahur !== false
    });

    await subject.save();

    res.status(201).json({ mensaje: 'Materia creada con éxito', subject });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear materia', error: error.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!subject) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }
    res.json({ mensaje: 'Materia actualizada', subject });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar materia', error: error.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;

    // Si forma parte de algún plan, removerla del plan
    await StudyPlan.updateMany(
      { materias: subjectId },
      { $pull: { materias: subjectId } }
    );

    // Si es correlativa de otra materia, removerla
    await Subject.updateMany(
      { correlativas: subjectId },
      { $pull: { correlativas: subjectId } }
    );

    const subject = await Subject.findByIdAndDelete(subjectId);
    if (!subject) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }

    res.json({ mensaje: 'Materia eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar materia', error: error.message });
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
