const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  tema: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['virtual', 'presencial'],
    default: 'presencial',
    required: true
  },
  link: {
    type: String,
    trim: true
  },
  ubicacion: {
    type: String,
    trim: true
  },
  fechaHora: {
    type: Date,
    required: true
  },
  duracion: {
    horas: { type: Number, default: 1 },
    minutos: { type: Number, default: 0 }
  },
  cupos: {
    type: Number
  },
  descripcion: {
    type: String,
    trim: true
  },
  requiereAprobacion: {
    type: Boolean,
    default: false
  },
  participantes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  solicitudes: [{
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    estado: { 
      type: String, 
      enum: ['pendiente', 'aprobada', 'rechazada'], 
      default: 'pendiente' 
    },
    fecha: { type: Date, default: Date.now }
  }],
  estado: {
    type: String,
    enum: ['activa', 'finalizada', 'cancelada'],
    default: 'activa'
  },
  recordatorioEnviado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudySession', studySessionSchema);
