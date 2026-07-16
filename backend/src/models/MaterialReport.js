const mongoose = require('mongoose');

const materialReportSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  denunciante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  motivo: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ReportReason' }],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: 'Debe indicar al menos un motivo'
    }
  },
  motivoEspecifico: {
    type: String,
    trim: true,
    required: function() {
      // Si el motivo es "otro" (basado en el titulo del ReportReason), este campo podria ser requerido
      // Pero por ahora lo dejamos opcional y lo validamos en el controlador si es necesario.
      return false;
    }
  },
  detalle: {
    type: String,
    trim: true,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'revisado', 'ignorado'],
    default: 'pendiente'
  },
  resolucion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Un usuario solo puede denunciar un material una vez. El indice unico blinda
// la regla contra dobles requests concurrentes (el chequeo en el controller es
// solo la ruta rapida/amigable).
materialReportSchema.index({ material: 1, denunciante: 1 }, { unique: true });

module.exports = mongoose.model('MaterialReport', materialReportSchema);
