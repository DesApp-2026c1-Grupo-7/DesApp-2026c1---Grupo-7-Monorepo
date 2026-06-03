const User = require('../models/User');
const Event = require('../models/Event');

/**
 * Crea un evento académico en el feed según la privacidad del usuario.
 * @param {string} userId - ID del usuario autor
 * @param {string} type - Estado de la materia (Inscripto, Regular, Aprobada, Promocion)
 * @param {string} subjectName - Nombre de la materia
 */
const createAcademicEvent = async (userId, type, subjectName) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.configuracionPrivacidad.mostrarEventos) return;

    let shouldPublish = false;
    let content = '';

    if (type === 'Inscripto' && user.configuracionPrivacidad.publicarInscripciones) {
      shouldPublish = true;
      content = `Se inscribió a la materia ${subjectName}`;
    } else if (type === 'Regular' && user.configuracionPrivacidad.publicarRegularizaciones) {
      shouldPublish = true;
      content = `Regularizó la materia ${subjectName}`;
    } else if (['Aprobada', 'Promocion'].includes(type) && user.configuracionPrivacidad.publicarAprobaciones) {
      shouldPublish = true;
      content = `Aprobó la materia ${subjectName}`;
    }

    if (shouldPublish) {
      await Event.create({
        autor: userId,
        tipo: 'academico',
        contenido: content
      });
    }
  } catch (error) {
    console.error('Error al crear evento académico:', error);
  }
};

module.exports = { createAcademicEvent };
