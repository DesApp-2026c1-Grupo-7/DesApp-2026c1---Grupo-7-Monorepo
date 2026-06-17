const mongoose = require('mongoose');

const reportReasonSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  orden: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReportReason', reportReasonSchema);
