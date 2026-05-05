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
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
