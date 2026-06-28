const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    enum: ['posteo', 'academico'],
    default: 'posteo'
  },
  contenido: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  editado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
