const Final = require('../models/Final');
const Grade = require('../models/Grade');

const getFinales = async (req, res) => {
  try {
    const userId = req.user.id;
    const finales = await Final.find({ estudiante: userId })
      .populate('materia', 'nombre codigo creditos')
      .sort({ fecha: -1 });
    res.json(finales);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener finales', error: error.message });
  }
};

const getFinalesPendientes = async (req, res) => {
  try {
    const userId = req.user.id;
    // Materias que están Regulares y no fueron aprobadas en final
    const regulares = await Grade.find({
      estudiante: userId,
      estado: 'Regular'
    }).populate('materia', 'nombre codigo creditos');

    res.json(regulares.map((g) => ({
      materia: g.materia,
      cuatrimestre: g.cuatrimestre,
      anioCursada: g.anioCursada,
      fechaRegular: g.fecha
    })));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener finales pendientes', error: error.message });
  }
};

const inscribirseAFinal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { materiaId, fecha } = req.body;

    // Debe estar regular en la materia
    const grade = await Grade.findOne({
      estudiante: userId,
      materia: materiaId,
      estado: 'Regular'
    });
    if (!grade) {
      return res.status(400).json({ mensaje: 'Para rendir final debe estar regular en la materia' });
    }

    const final = new Final({
      estudiante: userId,
      materia: materiaId,
      fecha: fecha || Date.now(),
      estado: 'Pendiente'
    });
    await final.save();

    res.status(201).json({ mensaje: 'Inscripción a final registrada', final });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al inscribirse a final', error: error.message });
  }
};

const registrarResultadoFinal = async (req, res) => {
  try {
    const { estado, nota } = req.body;
    const final = await Final.findOneAndUpdate(
      { _id: req.params.id, estudiante: req.user.id },
      { estado, nota },
      { new: true }
    );
    if (!final) {
      return res.status(404).json({ mensaje: 'Final no encontrado' });
    }

    // Si aprobó, actualizar Grade a 'Aprobada'
    if (estado === 'Aprobado') {
      await Grade.findOneAndUpdate(
        { estudiante: req.user.id, materia: final.materia },
        { estado: 'Aprobada', nota }
      );
    }

    res.json({ mensaje: 'Resultado registrado', final });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar resultado', error: error.message });
  }
};

module.exports = {
  getFinales,
  getFinalesPendientes,
  inscribirseAFinal,
  registrarResultadoFinal
};
