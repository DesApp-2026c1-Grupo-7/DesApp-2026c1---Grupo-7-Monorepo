const mongoose = require('mongoose');

const planEstudioSchema = new mongoose.Schema({
  carrera: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrera', required: true },
  anio: { type: Number, required: true },
  materias: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Materia' }],
  estado: { type: String, enum: ['Vigente', 'No vigente'], default: 'Vigente' },
}, { timestamps: true });

module.exports = mongoose.model('PlanEstudio', planEstudioSchema);
