const StudyPlan = require('../models/StudyPlan');

const getStudyPlans = async (req, res) => {
  try {
    const plans = await StudyPlan.find()
      .populate('carrera', 'nombre codigo')
      .populate('materias', 'nombre codigo anio cuatrimestre creditos esOptativa')
      .sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener planes de estudio', error: error.message });
  }
};

const getStudyPlanById = async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.id)
      .populate('carrera', 'nombre codigo')
      .populate({
        path: 'materias',
        populate: { path: 'correlativas', select: 'nombre codigo' }
      });
    if (!plan) {
      return res.status(404).json({ mensaje: 'Plan no encontrado' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener plan', error: error.message });
  }
};

const createStudyPlan = async (req, res) => {
  try {
    const { nombre, anio, carrera, materias, creditosNecesarios, creditosOptativasNecesarios, nivelInglesRequerido, activo } = req.body;

    const plan = new StudyPlan({
      nombre,
      anio,
      carrera,
      materias: materias || [],
      creditosNecesarios: creditosNecesarios || 0,
      creditosOptativasNecesarios: creditosOptativasNecesarios || 0,
      nivelInglesRequerido: nivelInglesRequerido || 'B1',
      activo: activo !== false
    });
    await plan.save();

    res.status(201).json({ mensaje: 'Plan de estudio creado con éxito', plan });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear plan de estudio', error: error.message });
  }
};

const updateStudyPlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('carrera', 'nombre codigo')
     .populate('materias', 'nombre codigo anio cuatrimestre creditos esOptativa');

    if (!plan) {
      return res.status(404).json({ mensaje: 'Plan no encontrado' });
    }

    res.json({ mensaje: 'Plan actualizado', plan });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar plan', error: error.message });
  }
};

const deleteStudyPlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ mensaje: 'Plan no encontrado' });
    }
    res.json({ mensaje: 'Plan eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar plan', error: error.message });
  }
};

module.exports = {
  getStudyPlans,
  getStudyPlanById,
  createStudyPlan,
  updateStudyPlan,
  deleteStudyPlan
};
