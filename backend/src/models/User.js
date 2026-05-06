const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  carrera: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Career'
  },
  planEstudio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyPlan'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
