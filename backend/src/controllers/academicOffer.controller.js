const AcademicOffer = require('../models/AcademicOffer');

const listOffers = async (req, res) => {
  try {
    const offers = await AcademicOffer.find()
      .populate('materias', 'nombre codigo anio cuatrimestre creditos')
      .sort({ anio: -1, cuatrimestre: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar ofertas academicas', error: error.message });
  }
};

const upsertOffer = async (req, res) => {
  try {
    const { anio, cuatrimestre, materias } = req.body;
    const offer = await AcademicOffer.findOneAndUpdate(
      { anio, cuatrimestre },
      { anio, cuatrimestre, materias: materias || [] },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('materias', 'nombre codigo anio cuatrimestre creditos');

    res.status(201).json({ mensaje: 'Oferta academica guardada', offer });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar oferta academica', error: error.message });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const offer = await AcademicOffer.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({ mensaje: 'Oferta academica no encontrada' });
    }
    res.json({ mensaje: 'Oferta academica eliminada' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar oferta academica', error: error.message });
  }
};

module.exports = {
  listOffers,
  upsertOffer,
  deleteOffer
};
