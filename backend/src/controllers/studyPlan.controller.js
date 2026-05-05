const StudyPlan = require('../models/StudyPlan');

const getStudyPlans = async (req, res) => {
  try {
    const plans = await StudyPlan.find()
      .populate('carrera', 'nombre')
      .populate('materias', 'nombre codigo')
      .sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener planes de estudio', error: error.message });
  }
};

const createStudyPlan = async (req, res) => {
  try {
    const { nombre, anio, carrera, materias } = req.body;
    
    const plan = new StudyPlan({ nombre, anio, carrera, materias });
    await plan.save();
    
    res.status(201).json({ mensaje: 'Plan de estudio creado con éxito', plan });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear plan de estudio', error: error.message });
  }
};

module.exports = { getStudyPlans, createStudyPlan };
