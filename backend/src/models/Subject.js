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
  },
  carrera: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Career'
  },
  correlativas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  esOptativa: {
    type: Boolean,
    default: false
  },
  esUnahur: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual: indica si la materia es anual
subjectSchema.virtual('esAnual').get(function () {
  return this.cuatrimestre === 0;
});

subjectSchema.set('toJSON', { virtuals: true });
subjectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Subject', subjectSchema);
