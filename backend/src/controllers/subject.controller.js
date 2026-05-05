const Subject = require('../models/Subject');

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ anio: 1, cuatrimestre: 1, nombre: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener materias', error: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { nombre, codigo, anio, cuatrimestre, creditos } = req.body;
    
    const existingSubject = await Subject.findOne({ codigo });
    if (existingSubject) {
      return res.status(400).json({ mensaje: 'El código de materia ya existe' });
    }

    const subject = new Subject({ nombre, codigo, anio, cuatrimestre, creditos });
    await subject.save();
    
    res.status(201).json({ mensaje: 'Materia creada con éxito', subject });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear materia', error: error.message });
  }
};

module.exports = { getSubjects, createSubject };
