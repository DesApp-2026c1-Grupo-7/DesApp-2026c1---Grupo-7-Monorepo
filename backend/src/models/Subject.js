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
  carrera: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Career'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);
