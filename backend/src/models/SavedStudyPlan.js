const mongoose = require('mongoose');

const savedStudyPlanSchema = new mongoose.Schema({
  estudiante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  horasPorSemana: {
    type: Number,
    required: true,
    min: 1
  },
  periodos: [{
    anio: Number,
    cuatrimestre: Number,
    horasUsadas: Number,
    materias: [{
      materia: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      nombre: String,
      codigo: String,
      creditos: Number,
      horasSemanalesEstimadas: Number,
      correlativas: [mongoose.Schema.Types.ObjectId]
    }]
  }],
  periodosOriginales: [{
    anio: Number,
    cuatrimestre: Number,
    horasUsadas: Number,
    materias: [{
      materia: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      nombre: String,
      codigo: String,
      creditos: Number,
      horasSemanalesEstimadas: Number,
      correlativas: [mongoose.Schema.Types.ObjectId]
    }]
  }],
  ultimoRecalculo: {
    fecha: Date,
    materiasRetrasadas: [{
      materia: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      nombre: String,
      codigo: String,
      periodoOrigen: String,
      periodoNuevo: String
    }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SavedStudyPlan', savedStudyPlanSchema);
