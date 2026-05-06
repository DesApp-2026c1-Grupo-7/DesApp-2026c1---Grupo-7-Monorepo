const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  estudiante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Inscripto', 'Cursando', 'Regular', 'Aprobada', 'Libre', 'Promocion'],
    default: 'Pendiente'
  },
  nota: {
    type: Number,
    min: 0,
    max: 10
  },
  cuatrimestre: {
    type: Number // 1, 2 o 0 (anual)
  },
  anioCursada: {
    type: Number
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Asegurar que un estudiante no tenga duplicados de la misma materia
gradeSchema.index({ estudiante: 1, materia: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
