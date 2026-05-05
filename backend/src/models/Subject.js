const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  anio: {
    type: Number,
    required: true
  },
  cuatrimestre: {
    type: Number, // 1, 2 o 0 (anual)
    required: true
  },
  creditos: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);
