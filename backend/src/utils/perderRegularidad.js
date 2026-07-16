const Notification = require('../models/Notification');
const { recalcularPlanesDelEstudiante } = require('./recalcularPlan');

const MENSAJES = {
  vencimiento: (nombreMateria) =>
    `Perdiste la regularidad en ${nombreMateria} por vencimiento del plazo de 2 años. Deberás volver a cursarla.`,
  intentos: (nombreMateria) =>
    `Perdiste la regularidad en ${nombreMateria} por agotar los intentos de final. Deberás volver a cursarla.`
};

/**
 * Transiciona una materia Regular a Desaprobado por pérdida de regularidad
 * (vencimiento de 2 años o agotamiento de los 10 intentos de final) y notifica al estudiante.
 */
async function perderRegularidad(grade, motivo, nombreMateria) {
  grade.estado = 'Desaprobado';
  await grade.save();

  await Notification.create({
    usuario: grade.estudiante,
    titulo: 'Perdiste la regularidad',
    descripcion: MENSAJES[motivo](nombreMateria),
    tipo: 'warning'
  });

  await recalcularPlanesDelEstudiante(grade.estudiante);
}

module.exports = { perderRegularidad };
