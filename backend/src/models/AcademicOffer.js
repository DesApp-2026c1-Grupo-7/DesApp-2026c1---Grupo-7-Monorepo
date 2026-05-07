const mongoose = require('mongoose');

const academicOfferSchema = new mongoose.Schema({
  anio: {
    type: Number,
    required: true
  },
  cuatrimestre: {
    type: Number,
    enum: [0, 1, 2],
    required: true
  },
  materias: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }]
}, {
  timestamps: true
});

academicOfferSchema.index({ anio: 1, cuatrimestre: 1 }, { unique: true });

module.exports = mongoose.model('AcademicOffer', academicOfferSchema);
