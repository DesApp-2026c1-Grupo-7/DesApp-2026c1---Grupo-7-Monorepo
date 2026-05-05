const mongoose = require('mongoose');

const carreraSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },
  descripcion: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Carrera', carreraSchema);
