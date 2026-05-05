const Carrera = require('../models/Carrera');
const Materia = require('../models/Materia');
const User = require('../models/User');

async function list(req, res, next) {
  try {
    const carreras = await Carrera.find().sort({ nombre: 1 });

    const result = await Promise.all(carreras.map(async (c) => {
      const materias = await Materia.countDocuments({ carrera: c._id });
      const estudiantes = await User.countDocuments({ role: 'estudiante' });
      return { ...c.toObject(), materias, estudiantes };
    }));

    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const carrera = await Carrera.findById(req.params.id);
    if (!carrera) {
      return res.status(404).json({ ok: false, error: 'Carrera no encontrada' });
    }
    res.json({ ok: true, data: carrera });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { nombre, codigo, descripcion } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({ ok: false, error: 'Nombre y código son obligatorios' });
    }

    const exists = await Carrera.findOne({ codigo: codigo.toUpperCase() });
    if (exists) {
      return res.status(409).json({ ok: false, error: 'Ya existe una carrera con ese código' });
    }

    const carrera = await Carrera.create({ nombre, codigo, descripcion });
    res.status(201).json({ ok: true, data: carrera });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const carrera = await Carrera.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!carrera) {
      return res.status(404).json({ ok: false, error: 'Carrera no encontrada' });
    }
    res.json({ ok: true, data: carrera });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const carrera = await Carrera.findByIdAndDelete(req.params.id);
    if (!carrera) {
      return res.status(404).json({ ok: false, error: 'Carrera no encontrada' });
    }
    res.json({ ok: true, data: carrera });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
