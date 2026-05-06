const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  cantidadEstudiantes: {
    type: Number,
    default: 0
  },
  cantidadMaterias: {
    type: Number,
    default: 0
  },
  creditosNecesarios: {
    type: Number,
    default: 0
  },
  nivelInglesRequerido: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Ninguno'],
    default: 'B1'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Career', careerSchema);
