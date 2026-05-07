const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  anio: {
    type: Number,
    required: true
  },
  carrera: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Career',
    required: true
  },
  materias: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  creditosNecesarios: {
    type: Number,
    default: 0
  },
  materiasUnahurRequeridas: {
    type: Number,
    default: 0
  },
  nivelInglesRequerido: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Ninguno'],
    default: 'B1'
  },
  estado: {
    type: String,
    enum: ['Vigente', 'En transicion', 'Discontinuado'],
    default: 'Vigente'
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
