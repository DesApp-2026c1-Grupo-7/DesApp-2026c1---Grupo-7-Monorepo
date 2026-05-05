const Career = require('../models/Career');

const getCareers = async (req, res) => {
  try {
    const careers = await Career.find().sort({ nombre: 1 });
    res.json(careers);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener carreras', error: error.message });
  }
};

const createCareer = async (req, res) => {
  try {
    const { nombre, codigo, descripcion, cantidadMaterias } = req.body;

    const existingCareer = await Career.findOne({ $or: [{ nombre }, { codigo }] });
    if (existingCareer) {
      return res.status(400).json({ mensaje: 'La carrera o el código ya existen' });
    }

    const career = new Career({
      nombre,
      codigo,
      descripcion,
      cantidadMaterias: cantidadMaterias || 0
    });

    await career.save();
    res.status(201).json({ mensaje: 'Carrera creada con éxito', career });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear carrera', error: error.message });
  }
};

module.exports = {
  getCareers,
  createCareer
};
