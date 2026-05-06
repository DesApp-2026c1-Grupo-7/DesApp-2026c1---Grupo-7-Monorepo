const Career = require('../models/Career');
const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');

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
    const { nombre, codigo, descripcion, cantidadMaterias, creditosNecesarios, nivelInglesRequerido } = req.body;

    const existingCareer = await Career.findOne({ $or: [{ nombre }, { codigo }] });
    if (existingCareer) {
      return res.status(400).json({ mensaje: 'La carrera o el código ya existen' });
    }

    const career = new Career({
      nombre,
      codigo,
      descripcion,
      cantidadMaterias: cantidadMaterias || 0,
      creditosNecesarios: creditosNecesarios || 0,
      nivelInglesRequerido: nivelInglesRequerido || 'B1'
    });

    await career.save();
    res.status(201).json({ mensaje: 'Carrera creada con éxito', career });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear carrera', error: error.message });
  }
};

const updateCareer = async (req, res) => {
  try {
    const { nombre, codigo, descripcion, cantidadMaterias, creditosNecesarios, nivelInglesRequerido } = req.body;

    const career = await Career.findByIdAndUpdate(
      req.params.id,
      { nombre, codigo, descripcion, cantidadMaterias, creditosNecesarios, nivelInglesRequerido },
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

module.exports = {
  getCareers,
  getCareerById,
  createCareer,
  updateCareer,
  deleteCareer
};
