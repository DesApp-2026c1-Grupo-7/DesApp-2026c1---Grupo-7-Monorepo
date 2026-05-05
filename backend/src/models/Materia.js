const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  anio: { type: Number, required: true, min: 1, max: 6 },
  carrera: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrera', required: true },
  correlativas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Materia' }],
}, { timestamps: true });

module.exports = mongoose.model('Materia', materiaSchema);
