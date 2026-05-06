const mongoose = require('mongoose');

const finalSchema = new mongoose.Schema({
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
  fecha: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Aprobado', 'Desaprobado', 'Ausente'],
    default: 'Pendiente'
  },
  nota: {
    type: Number,
    min: 0,
    max: 10
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Final', finalSchema);
