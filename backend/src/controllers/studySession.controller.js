const StudySession = require('../models/StudySession');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mailService = require('../services/mail.service');

const createStudySession = async (req, res) => {
  try {
    const { 
      materia, 
      tema, 
      tipo, 
      link, 
      ubicacion, 
      fechaHora, 
      duracion, 
      cupos, 
      descripcion, 
      requiereAprobacion 
    } = req.body;

    // Validaciones básicas
    if (!materia || !tema || !tipo || !fechaHora) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    // Verificar si la materia existe
    const subject = await Subject.findById(materia);
    if (!subject) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }

    const nuevaSesion = new StudySession({
      creador: req.user.id,
      materia,
      tema,
      tipo,
      link: tipo === 'virtual' ? link : undefined,
      ubicacion: tipo === 'presencial' ? ubicacion : undefined,
      fechaHora,
      duracion,
      cupos,
      descripcion,
      requiereAprobacion: requiereAprobacion === true || requiereAprobacion === 'true',
      participantes: [req.user.id] // El creador es el primer participante
    });

    await nuevaSesion.save();
    
    const sesionPoblada = await StudySession.findById(nuevaSesion._id)
      .populate('creador', 'nombre foto configuracionPrivacidad')
      .populate('materia', 'nombre codigo');

    res.status(201).json(sesionPoblada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear la sesión de estudio', error: error.message });
  }
};

const getStudySessions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    // Obtenemos todas las sesiones activas
    const sesiones = await StudySession.find({ estado: 'activa' })
      .populate('creador', 'nombre foto configuracionPrivacidad contactos')
      .populate('materia', 'nombre codigo')
      .populate('participantes', 'nombre foto')
      .populate('solicitudes.usuario', 'nombre')
      .sort({ fechaHora: 1 });
    
    // Filtrar por privacidad
    const sesionesFiltradas = sesiones.filter(s => {
      const creador = s.creador;
      if (!creador) return false;

      // Si soy el creador, la veo
      const creadorId = creador._id ? creador._id.toString() : creador.toString();
      if (creadorId === req.user.id) return true;

      // Si el perfil del creador es público, todos la ven
      if (creador.configuracionPrivacidad?.perfil === 'publico') return true;

      // Si el perfil es privado, solo sus contactos la ven
      const esContacto = creador.contactos && creador.contactos.some(c => {
        const cId = c._id ? c._id.toString() : c.toString();
        return cId === req.user.id;
      });
      return esContacto;
    });
    
    res.json(sesionesFiltradas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener las sesiones', error: error.message });
  }
};

const joinStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sesion = await StudySession.findById(id).populate('creador', 'nombre');
    if (!sesion || sesion.estado !== 'activa') {
      return res.status(404).json({ mensaje: 'Sesión no encontrada o ya no está activa' });
    }

    // Verificar si ya es participante
    if (sesion.participantes.includes(userId)) {
      return res.status(400).json({ mensaje: 'Ya eres participante de esta sesión' });
    }

    // Verificar si ya tiene una solicitud pendiente
    const solicitudExistente = sesion.solicitudes.find(s => s.usuario.toString() === userId && s.estado === 'pendiente');
    if (solicitudExistente) {
      return res.status(400).json({ mensaje: 'Ya has enviado una solicitud para unirte a esta sesión' });
    }

    // Verificar cupos
    if (sesion.cupos && sesion.participantes.length >= sesion.cupos) {
      return res.status(400).json({ mensaje: 'La sesión ya no tiene cupos disponibles' });
    }

    if (sesion.requiereAprobacion) {
      // Agregar solicitud
      sesion.solicitudes.push({ usuario: userId, estado: 'pendiente' });
      await sesion.save();

      // Obtener datos del estudiante para la notificación
      const student = await User.findById(userId);
      const nombreCompleto = `${student.nombre}${student.apellido ? ' ' + student.apellido : ''}`;

      // Notificar al creador
      await Notification.create({
        usuario: sesion.creador._id,
        titulo: 'Nueva solicitud para sesión de estudio',
        descripcion: `${nombreCompleto} quiere unirse a tu sesión de "${sesion.tema}"`,
        tipo: 'info',
        link: `/student/sessions` 
      });

      return res.json({ mensaje: 'Solicitud enviada. Debes esperar a que el organizador te acepte.', requiereAprobacion: true });
    } else {
      // Unirse directamente
      sesion.participantes.push(userId);
      await sesion.save();

      // Obtener datos del estudiante para mail y notificación
      const student = await User.findById(userId);
      const nombreCompleto = `${student.nombre}${student.apellido ? ' ' + student.apellido : ''}`;

      // Enviar mail de confirmación
      try {
        const sesionConMateria = await StudySession.findById(id).populate('materia', 'nombre');
        await mailService.sendSessionConfirmationEmail(student.email, student.nombre, sesionConMateria);
      } catch (mailError) {
        console.error('Error al enviar mail de confirmación de sesión:', mailError);
      }

      // Notificar al estudiante (mismo formato que al ser aceptado en una sesion con aprobacion)
      await Notification.create({
        usuario: userId,
        titulo: 'Solicitud de sesión aprobada',
        descripcion: `Has sido aceptado en la sesión de "${sesion.tema}"`,
        tipo: 'success',
        link: '/student/sessions'
      });

      // Notificar al creador
      await Notification.create({
        usuario: sesion.creador._id,
        titulo: 'Nuevo participante en tu sesión',
        descripcion: `${nombreCompleto} se ha unido a tu sesión de "${sesion.tema}"`,
        tipo: 'success'
      });

      return res.json({ mensaje: 'Te has unido a la sesión con éxito', requiereAprobacion: false });
    }
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al intentar unirse a la sesión', error: error.message });
  }
};

const manageJoinRequest = async (req, res) => {
  try {
    const { sessionId, userId, action } = req.body; // action: 'approve' o 'reject'

    const sesion = await StudySession.findById(sessionId);
    if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });

    // Solo el creador puede gestionar solicitudes
    if (sesion.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para gestionar solicitudes de esta sesión' });
    }

    const solicitud = sesion.solicitudes.find(s => s.usuario.toString() === userId && s.estado === 'pendiente');
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada o ya procesada' });
    }

    if (action === 'approve') {
      // Verificar cupos nuevamente por las dudas
      if (sesion.cupos && sesion.participantes.length >= sesion.cupos) {
        return res.status(400).json({ mensaje: 'No hay cupos disponibles para aprobar esta solicitud' });
      }

      solicitud.estado = 'aprobada';
      sesion.participantes.push(userId);
      
      await sesion.save();

      // Obtener datos del estudiante para mail y descripción
      const student = await User.findById(userId);
      const nombreCompleto = `${student.nombre}${student.apellido ? ' ' + student.apellido : ''}`;

      // Enviar mail de confirmación
      try {
        const sesionConMateria = await StudySession.findById(sessionId).populate('materia', 'nombre');
        await mailService.sendSessionConfirmationEmail(student.email, student.nombre, sesionConMateria);
      } catch (mailError) {
        console.error('Error al enviar mail de confirmación de sesión:', mailError);
      }

      // Notificar al estudiante
      await Notification.create({
        usuario: userId,
        titulo: 'Solicitud de sesión aprobada',
        descripcion: `Has sido aceptado en la sesión de "${sesion.tema}"`,
        tipo: 'success',
        link: '/student/sessions'
      });

      // Notificar al creador (opcional, pero consistente con joinStudySession)
      await Notification.create({
        usuario: sesion.creador._id,
        titulo: 'Nuevo integrante aceptado',
        descripcion: `${nombreCompleto} ahora forma parte de tu sesión "${sesion.tema}"`,
        tipo: 'success'
      });

      return res.json({ mensaje: 'Solicitud aprobada con éxito' });
    } else if (action === 'reject') {
      solicitud.estado = 'rechazada';
      await sesion.save();

      // Enviar mail de rechazo
      try {
        const student = await User.findById(userId);
        const sesionConMateria = await StudySession.findById(sessionId).populate('materia', 'nombre');
        await mailService.sendSessionRejectionEmail(student.email, student.nombre, sesionConMateria);
      } catch (mailError) {
        console.error('Error al enviar mail de rechazo de sesión:', mailError);
      }

      // Notificar al estudiante
      await Notification.create({
        usuario: userId,
        titulo: 'Solicitud de sesión rechazada',
        descripcion: `Tu solicitud para la sesión de "${sesion.tema}" ha sido rechazada`,
        tipo: 'warning'
      });

      return res.json({ mensaje: 'Solicitud rechazada' });
    } else {
      return res.status(400).json({ mensaje: 'Acción no válida' });
    }
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al gestionar la solicitud', error: error.message });
  }
};

const leaveStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const sesion = await StudySession.findById(id);
    if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });

    // El creador no puede "irse", debe cancelarla (lógica que podría ir en otro endpoint)
    if (sesion.creador.toString() === userId) {
      return res.status(400).json({ mensaje: 'Como organizador no puedes darte de baja. Debes cancelar la sesión.' });
    }

    // Verificar si es participante
    if (!sesion.participantes.includes(userId)) {
      return res.status(400).json({ mensaje: 'No eres participante de esta sesión' });
    }

    // Quitar de participantes
    sesion.participantes = sesion.participantes.filter(p => p.toString() !== userId);
    
    // También quitar cualquier solicitud aprobada previa para que quede consistente
    sesion.solicitudes = sesion.solicitudes.filter(s => s.usuario.toString() !== userId);

    await sesion.save();

    // Notificar al creador
    await Notification.create({
      usuario: sesion.creador,
      titulo: 'Un participante ha dejado la sesión',
      descripcion: `Un estudiante se ha dado de baja de tu sesión de "${sesion.tema}"`,
      tipo: 'warning'
    });

    res.json({ mensaje: 'Te has dado de baja de la sesión con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al intentar darse de baja', error: error.message });
  }
};

const getStudySessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const sesion = await StudySession.findById(id)
      .populate('creador', 'nombre foto')
      .populate('materia', 'nombre codigo institute')
      .populate('participantes', 'nombre foto')
      .populate('solicitudes.usuario', 'nombre foto');

    if (!sesion) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    res.json(sesion);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los detalles de la sesión', error: error.message });
  }
};

const updateStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tema, 
      tipo, 
      link, 
      ubicacion, 
      fechaHora, 
      duracion, 
      cupos, 
      descripcion, 
      requiereAprobacion 
    } = req.body;

    const sesion = await StudySession.findById(id);
    if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });

    // Solo el creador puede editar
    if (sesion.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para editar esta sesión' });
    }

    // Actualizar campos
    if (tema) sesion.tema = tema;
    if (tipo) {
      sesion.tipo = tipo;
      sesion.link = tipo === 'virtual' ? link : undefined;
      sesion.ubicacion = tipo === 'presencial' ? ubicacion : undefined;
    } else {
      if (link !== undefined) sesion.link = link;
      if (ubicacion !== undefined) sesion.ubicacion = ubicacion;
    }
    if (fechaHora) sesion.fechaHora = fechaHora;
    if (duracion) sesion.duracion = duracion;
    if (cupos !== undefined) sesion.cupos = cupos;
    if (descripcion !== undefined) sesion.descripcion = descripcion;
    if (requiereAprobacion !== undefined) {
      sesion.requiereAprobacion = requiereAprobacion === true || requiereAprobacion === 'true';
    }

    await sesion.save();
    
    const sesionPoblada = await StudySession.findById(sesion._id)
      .populate('creador', 'nombre foto')
      .populate('materia', 'nombre codigo');

    res.json(sesionPoblada);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar la sesión', error: error.message });
  }
};

const cancelStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const sesion = await StudySession.findById(id).populate('materia', 'nombre').populate('participantes', 'nombre email');
    
    if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });

    // Solo el creador puede cancelar
    if (sesion.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para cancelar esta sesión' });
    }

    sesion.estado = 'cancelada';
    await sesion.save();

    // Notificar a los participantes (excluyendo al creador)
    const participantesANotificar = sesion.participantes.filter(p => p._id.toString() !== req.user.id);

    for (const participante of participantesANotificar) {
      // Notificación en la app
      await Notification.create({
        usuario: participante._id,
        titulo: 'Sesión cancelada',
        descripcion: `La sesión de "${sesion.tema}" de ${sesion.materia.nombre} ha sido cancelada`,
        tipo: 'warning'
      });

      // Notificación por mail
      try {
        await mailService.sendSessionCancellationEmail(participante.email, participante.nombre, sesion);
      } catch (mailError) {
        console.error(`Error al enviar mail de cancelación a ${participante.email}:`, mailError);
      }
    }

    res.json({ mensaje: 'Sesión cancelada con éxito y participantes notificados' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cancelar la sesión', error: error.message });
  }
};

const kickParticipant = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const sesion = await StudySession.findById(id);

    if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });

    // Solo el creador puede expulsar
    if (sesion.creador.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No tienes permiso para expulsar miembros de esta sesión' });
    }

    // No puede expulsarse a sí mismo
    if (userId === req.user.id) {
      return res.status(400).json({ mensaje: 'No puedes expulsarte a ti mismo' });
    }

    // Quitar de participantes
    sesion.participantes = sesion.participantes.filter(p => p.toString() !== userId);
    // Quitar de solicitudes aprobadas
    sesion.solicitudes = sesion.solicitudes.filter(s => s.usuario.toString() !== userId);

    await sesion.save();

    // Notificar al estudiante expulsado
    await Notification.create({
      usuario: userId,
      titulo: 'Has sido removido de una sesión',
      descripcion: `El organizador te ha removido de la sesión "${sesion.tema}"`,
      tipo: 'warning'
    });

    res.json({ mensaje: 'Miembro expulsado con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al expulsar al miembro', error: error.message });
  }
};

const getSessionsByPeriod = async (req, res) => {
  try {
    const result = await StudySession.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          creadas: { $sum: 1 },
          activas: {
            $sum: { $cond: [{ $eq: ['$estado', 'activa'] }, 1, 0] }
          },
          finalizadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'finalizada'] }, 1, 0] }
          },
          canceladas: {
            $sum: { $cond: [{ $eq: ['$estado', 'cancelada'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          periodo: '$_id',
          creadas: 1,
          activas: 1,
          finalizadas: 1,
          canceladas: 1
        }
      }
    ]);

    const totalSesiones = await StudySession.countDocuments();

    const totales = await StudySession.aggregate([
      {
        $group: {
          _id: null,
          activas: { $sum: { $cond: [{ $eq: ['$estado', 'activa'] }, 1, 0] } },
          finalizadas: { $sum: { $cond: [{ $eq: ['$estado', 'finalizada'] }, 1, 0] } },
          canceladas: { $sum: { $cond: [{ $eq: ['$estado', 'cancelada'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      periodos: result,
      totalSesiones,
      totales: totales[0] || { activas: 0, finalizadas: 0, canceladas: 0 }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener sesiones por período', error: error.message });
  }
};

const getSessionUtilization = async (req, res) => {
  try {
    const totalSesiones = await StudySession.countDocuments();

    const porEstado = await StudySession.aggregate([
      { $group: { _id: '$estado', count: { $sum: 1 } } }
    ]);

    const porTipo = await StudySession.aggregate([
      { $group: { _id: '$tipo', count: { $sum: 1 } } }
    ]);

    const participantes = await StudySession.aggregate([
      {
        $project: {
          cantidadParticipantes: { $size: { $ifNull: ['$participantes', []] } },
          cupos: 1,
          solicitudesPendientes: {
            $size: {
              $filter: {
                input: { $ifNull: ['$solicitudes', []] },
                as: 's',
                cond: { $eq: ['$$s.estado', 'pendiente'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalParticipantes: {
            $sum: {
              $cond: [{ $gt: ['$cupos', 0] }, '$cantidadParticipantes', 0]
            }
          },
          totalCupos: { $sum: { $ifNull: ['$cupos', 0] } },
          sesionesConCupo: { $sum: { $cond: [{ $gt: ['$cupos', 0] }, 1, 0] } },
          sesionesSinCupo: {
            $sum: {
              $cond: [
                { $eq: [{ $ifNull: ['$cupos', 0] }, 0] },
                1,
                0
              ]
            }
          },
          totalSolicitudesPendientes: { $sum: '$solicitudesPendientes' }
        }
      }
    ]);

    const porMateria = await StudySession.aggregate([
      { $group: { _id: '$materia', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'materia'
        }
      },
      { $unwind: { path: '$materia', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          nombre: { $ifNull: ['$materia.nombre', 'Sin materia'] },
          sesiones: '$count'
        }
      }
    ]);

    const estadoMap = { activa: 0, finalizada: 0, cancelada: 0 };
    porEstado.forEach(e => { estadoMap[e._id] = e.count; });

    const tipoMap = { virtual: 0, presencial: 0 };
    porTipo.forEach(t => { tipoMap[t._id] = t.count; });

    const p = participantes[0] || { totalParticipantes: 0, totalCupos: 0, sesionesConCupo: 0, sesionesSinCupo: 0, totalSolicitudesPendientes: 0 };
    const promedioParticipantes = totalSesiones > 0 ? (p.totalParticipantes / totalSesiones).toFixed(1) : 0;
    const ocupacionPromedio = p.sesionesConCupo > 0 ? ((p.totalParticipantes / p.totalCupos) * 100).toFixed(1) : 0;

    res.json({
      totalSesiones,
      porEstado: estadoMap,
      porTipo: tipoMap,
      totalParticipantes: p.totalParticipantes,
      totalCupos: p.totalCupos,
      sesionesConCupo: p.sesionesConCupo,
      sesionesSinCupo: p.sesionesSinCupo,
      promedioParticipantes: Number(promedioParticipantes),
      ocupacionPromedio: Number(ocupacionPromedio),
      solicitudesPendientes: p.totalSolicitudesPendientes,
      materiasTop: porMateria
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener utilización de sesiones', error: error.message });
  }
};

module.exports = {
  createStudySession,
  getStudySessions,
  joinStudySession,
  manageJoinRequest,
  leaveStudySession,
  getStudySessionById,
  updateStudySession,
  cancelStudySession,
  kickParticipant,
  getSessionsByPeriod,
  getSessionUtilization
};
