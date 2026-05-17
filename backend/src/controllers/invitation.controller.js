const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mailService = require('../services/mail.service');
const crypto = require('crypto');

const sendInvitation = async (req, res) => {
  try {
    const { email } = req.body;
    const remitenteId = req.user.id;

    if (!email) {
      return res.status(400).json({ mensaje: 'El email es obligatorio' });
    }

    const remitente = await User.findById(remitenteId);
    const destinatario = await User.findOne({ email: email.toLowerCase() });

    if (!destinatario) {
      // Caso B: El destinatario no está registrado
      await mailService.sendUserNotFoundEmail(remitente.email, email);
      return res.json({ 
        mensaje: 'El usuario no está registrado. Se ha enviado un aviso a tu correo.',
        usuarioRegistrado: false 
      });
    }

    if (destinatario._id.toString() === remitenteId) {
      return res.status(400).json({ mensaje: 'No puedes invitarte a ti mismo' });
    }

    // Verificar si ya son contactos
    if (remitente.contactos.includes(destinatario._id)) {
      return res.status(400).json({ mensaje: 'Este usuario ya está en tu lista de contactos' });
    }

    // Verificar si ya hay una invitación pendiente
    const invitacionExistente = await Invitation.findOne({
      remitente: remitenteId,
      destinatario: destinatario._id,
      estado: 'pendiente'
    });

    if (invitacionExistente) {
      return res.status(400).json({ mensaje: 'Ya existe una invitación pendiente para este usuario' });
    }

    // Caso A: El destinatario está registrado
    const token = crypto.randomBytes(32).toString('hex');
    const nuevaInvitacion = new Invitation({
      remitente: remitenteId,
      emailDestino: email.toLowerCase(),
      destinatario: destinatario._id,
      token
    });

    await nuevaInvitacion.save();

    // Crear notificación en la app para el destinatario
    await Notification.create({
      usuario: destinatario._id,
      titulo: 'Nueva solicitud de contacto',
      descripcion: `${remitente.nombre} quiere sumarte a sus contactos.`,
      tipo: 'info',
      link: `/student/social`
    });

    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/aceptar-invitacion?token=${token}`;
    await mailService.sendInvitationEmail(destinatario.email, remitente.nombre, invitationLink);

    res.json({ 
      mensaje: 'Invitación enviada con éxito',
      usuarioRegistrado: true 
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al enviar la invitación', error: error.message });
  }
};

const getInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const invitacion = await Invitation.findOne({ token })
      .populate('remitente', 'nombre email foto')
      .populate('destinatario', 'nombre email');

    if (!invitacion) {
      return res.status(404).json({ mensaje: 'Invitación no válida o expirada' });
    }

    if (invitacion.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'Esta invitación ya ha sido procesada' });
    }

    res.json(invitacion);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener la invitación', error: error.message });
  }
};

const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const invitacion = await Invitation.findOne({ token });

    if (!invitacion || invitacion.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'Invitación no válida o ya procesada' });
    }

    // Verificar que el usuario que acepta es el destinatario
    if (invitacion.destinatario.toString() !== userId) {
      return res.status(403).json({ mensaje: 'No tienes permiso para aceptar esta invitación' });
    }

    // Agregar a contactos mutuamente
    await User.findByIdAndUpdate(invitacion.remitente, {
      $addToSet: { contactos: invitacion.destinatario }
    });

    await User.findByIdAndUpdate(invitacion.destinatario, {
      $addToSet: { contactos: invitacion.remitente }
    });

    invitacion.estado = 'aceptada';
    await invitacion.save();

    // Obtener datos para la notificación
    const remitente = await User.findById(invitacion.remitente);
    const destinatario = await User.findById(invitacion.destinatario);

    // Notificar al remitente que su invitación fue aceptada
    await Notification.create({
      usuario: invitacion.remitente,
      titulo: 'Invitación aceptada',
      descripcion: `${destinatario.nombre} aceptó tu invitación de contacto.`,
      tipo: 'success',
      link: `/student/social`
    });

    res.json({ mensaje: 'Invitación aceptada con éxito. Ahora son contactos.' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al aceptar la invitación', error: error.message });
  }
};

const rejectInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const invitacion = await Invitation.findOne({ token });

    if (!invitacion || invitacion.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'Invitación no válida o ya procesada' });
    }

    if (invitacion.destinatario.toString() !== userId) {
      return res.status(403).json({ mensaje: 'No tienes permiso para rechazar esta invitación' });
    }

    invitacion.estado = 'rechazada';
    await invitacion.save();

    res.json({ mensaje: 'Invitación rechazada' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al rechazar la invitación', error: error.message });
  }
};

const getInvitacionesPendientes = async (req, res) => {
  try {
    const invitaciones = await Invitation.find({ 
      destinatario: req.user.id,
      estado: 'pendiente'
    }).populate('remitente', 'nombre email foto carrera');
    
    res.json(invitaciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener invitaciones', error: error.message });
  }
};

const getInvitacionesEnviadas = async (req, res) => {
  try {
    const invitaciones = await Invitation.find({ 
      remitente: req.user.id,
      estado: 'pendiente'
    }).populate('destinatario', 'nombre email foto carrera');
    
    res.json(invitaciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener invitaciones enviadas', error: error.message });
  }
};

const cancelarInvitacion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invitacion = await Invitation.findOne({ _id: id, remitente: userId, estado: 'pendiente' });

    if (!invitacion) {
      return res.status(404).json({ mensaje: 'Invitación no encontrada o ya procesada' });
    }

    await Invitation.findByIdAndDelete(id);
    res.json({ mensaje: 'Invitación cancelada con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cancelar invitación', error: error.message });
  }
};

const getContactos = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('contactos', 'nombre email foto carrera bio');
    
    res.json(user.contactos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener contactos', error: error.message });
  }
};

const removeContacto = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Eliminar el contacto de ambas listas
    await User.findByIdAndUpdate(userId, {
      $pull: { contactos: id }
    });

    await User.findByIdAndUpdate(id, {
      $pull: { contactos: userId }
    });

    res.json({ mensaje: 'Contacto eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar contacto', error: error.message });
  }
};

module.exports = {
  sendInvitation,
  getInvitationByToken,
  acceptInvitation,
  rejectInvitation,
  getInvitacionesPendientes,
  getInvitacionesEnviadas,
  cancelarInvitacion,
  getContactos,
  removeContacto
};
