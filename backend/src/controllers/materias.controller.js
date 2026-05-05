const Materia = require('../models/Materia');

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.carrera) filter.carrera = req.query.carrera;
    if (req.query.anio) filter.anio = Number(req.query.anio);

    const materias = await Materia.find(filter)
      .populate('carrera', 'nombre codigo')
      .populate('correlativas', 'nombre codigo')
      .sort({ anio: 1, nombre: 1 });

    res.json({ ok: true, data: materias });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const materia = await Materia.findById(req.params.id)
      .populate('carrera', 'nombre codigo')
      .populate('correlativas', 'nombre codigo');

    if (!materia) {
      return res.status(404).json({ ok: false, error: 'Materia no encontrada' });
    }
    res.json({ ok: true, data: materia });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { nombre, codigo, anio, carrera, correlativas } = req.body;

    if (!nombre || !codigo || !anio || !carrera) {
      return res.status(400).json({ ok: false, error: 'Nombre, código, año y carrera son obligatorios' });
    }

    const exists = await Materia.findOne({ codigo: codigo.toUpperCase() });
    if (exists) {
      return res.status(409).json({ ok: false, error: 'Ya existe una materia con ese código' });
    }

    const materia = await Materia.create({ nombre, codigo, anio, carrera, correlativas });
    const populated = await materia.populate('carrera', 'nombre codigo');
    res.status(201).json({ ok: true, data: populated });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const materia = await Materia.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('carrera', 'nombre codigo').populate('correlativas', 'nombre codigo');

    if (!materia) {
      return res.status(404).json({ ok: false, error: 'Materia no encontrada' });
    }
    res.json({ ok: true, data: materia });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const materia = await Materia.findByIdAndDelete(req.params.id);
    if (!materia) {
      return res.status(404).json({ ok: false, error: 'Materia no encontrada' });
    }
    res.json({ ok: true, data: materia });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
