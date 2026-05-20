const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['success', 'info', 'warning', 'default'],
    default: 'default'
  },
  leida: {
    type: Boolean,
    default: false
  },
  link: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
