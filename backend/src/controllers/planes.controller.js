const PlanEstudio = require('../models/PlanEstudio');

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.carrera) filter.carrera = req.query.carrera;

    const planes = await PlanEstudio.find(filter)
      .populate('carrera', 'nombre codigo')
      .populate('materias', 'nombre codigo anio')
      .sort({ anio: -1 });

    res.json({ ok: true, data: planes });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const plan = await PlanEstudio.findById(req.params.id)
      .populate('carrera', 'nombre codigo')
      .populate('materias', 'nombre codigo anio');

    if (!plan) {
      return res.status(404).json({ ok: false, error: 'Plan no encontrado' });
    }
    res.json({ ok: true, data: plan });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { carrera, anio, materias, estado } = req.body;

    if (!carrera || !anio) {
      return res.status(400).json({ ok: false, error: 'Carrera y año son obligatorios' });
    }

    const plan = await PlanEstudio.create({ carrera, anio, materias, estado });
    const populated = await plan.populate('carrera', 'nombre codigo');
    res.status(201).json({ ok: true, data: populated });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const plan = await PlanEstudio.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('carrera', 'nombre codigo').populate('materias', 'nombre codigo anio');

    if (!plan) {
      return res.status(404).json({ ok: false, error: 'Plan no encontrado' });
    }
    res.json({ ok: true, data: plan });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const plan = await PlanEstudio.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ ok: false, error: 'Plan no encontrado' });
    }
    res.json({ ok: true, data: plan });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
