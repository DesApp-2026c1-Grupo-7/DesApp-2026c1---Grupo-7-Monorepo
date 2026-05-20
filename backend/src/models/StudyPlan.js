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
    ref: 'Career'
  },
  materias: [{
    materia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
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
    horasSemanales: {
      type: Number,
      default: 4
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
      default: false
    }
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
