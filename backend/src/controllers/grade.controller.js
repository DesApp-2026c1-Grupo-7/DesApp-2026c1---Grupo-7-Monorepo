const Grade = require('../models/Grade');
const Subject = require('../models/Subject');

const getStudentSituation = async (req, res) => {
  try {
    const userId = req.user.id; // Asumiendo que el middleware de auth inyecta el id
    const situation = await Grade.find({ estudiante: userId })
      .populate('materia')
      .sort({ 'materia.anio': 1, 'materia.cuatrimestre': 1 });
    
    res.json(situation);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener situación académica', error: error.message });
  }
};

const updateGrade = async (req, res) => {
  try {
    const { materiaId, estado, nota } = req.body;
    const userId = req.user.id;

    const grade = await Grade.findOneAndUpdate(
      { estudiante: userId, materia: materiaId },
      { estado, nota, fecha: Date.now() },
      { new: true, upsert: true }
    );

    res.json({ mensaje: 'Situación actualizada', grade });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar situación', error: error.message });
  }
};

module.exports = { getStudentSituation, updateGrade };
