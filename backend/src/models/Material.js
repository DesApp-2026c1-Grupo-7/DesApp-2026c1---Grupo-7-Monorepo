const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    enum: ['archivo', 'link'],
    required: true
  },
  categoria: {
    type: String,
    enum: ['youtube', 'drive', 'web', 'discord', 'github', 'archivo', 'otro'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  nombreOriginal: {
    type: String
  },
  mimetype: {
    type: String
  },
  size: {
    type: Number
  },
  tags: [{
    type: String,
    trim: true
  }],
  valoraciones: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    voto: {
      type: Number,
      enum: [1, -1], // 1: pulgar arriba, -1: pulgar abajo
      required: true
    }
  }]
}, {
  timestamps: true
});

// Índice para búsqueda
materialSchema.index({ titulo: 'text', descripcion: 'text', tags: 'text' });

module.exports = mongoose.model('Material', materialSchema);
