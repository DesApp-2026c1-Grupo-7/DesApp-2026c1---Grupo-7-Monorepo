const User = require('../models/User');
const Grade = require('../models/Grade');
const Invitation = require('../models/Invitation');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('carrera', 'nombre codigo')
      .populate('planEstudio', 'nombre');

    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Incluimos la situación académica
    const situacion = await Grade.find({ estudiante: user._id })
      .populate('materia', 'nombre anio')
      .sort({ fecha: -1 });

    const userObj = user.toObject();
    userObj.situacionAcademica = situacion;

    res.json(userObj);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el perfil', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nombre, bio, foto, configuracionPrivacidad } = req.body;
    
    // Obtenemos el usuario actual para no perder configuraciones previas si no se envían todas
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (nombre) user.nombre = nombre;
    if (bio !== undefined) user.bio = bio;
    if (foto !== undefined) user.foto = foto;
    
    if (configuracionPrivacidad) {
      user.configuracionPrivacidad = {
        ...user.configuracionPrivacidad.toObject(),
        ...configuracionPrivacidad
      };
    }

    await user.save();
    
    // Devolvemos el usuario poblado y sin password
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('carrera', 'nombre codigo')
      .populate('planEstudio', 'nombre');

    const situacion = await Grade.find({ estudiante: updatedUser._id })
      .populate('materia', 'nombre anio')
      .sort({ fecha: -1 });

    const userObj = updatedUser.toObject();
    userObj.situacionAcademica = situacion;

    res.json({ mensaje: 'Perfil actualizado con éxito', user: userObj });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el perfil', error: error.message });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('nombre email carrera bio foto configuracionPrivacidad contactos')
      .populate('carrera', 'nombre');

    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Lógica de privacidad
    const isOwner = req.user && req.user.id === req.params.id;
    const isPublic = user.configuracionPrivacidad.perfil === 'publico';
    const isContact = user.contactos.some(c => c.toString() === req.user.id);
    
    // Si es privado y no es el dueño ni contacto, denegar acceso
    if (!isPublic && !isOwner && !isContact) {
      return res.status(403).json({ mensaje: 'Este perfil es privado. Solo sus contactos pueden verlo.' });
    }

    // Verificar si hay una invitación pendiente
    let invitacionPendiente = null;
    if (!isOwner && !isContact) {
      invitacionPendiente = await Invitation.findOne({
        $or: [
          { remitente: req.user.id, destinatario: user._id, estado: 'pendiente' },
          { remitente: user._id, destinatario: req.user.id, estado: 'pendiente' }
        ]
      });
    }

    const publicData = {
      _id: user._id,
      nombre: user.nombre,
      carrera: user.carrera,
      bio: user.bio,
      foto: user.foto,
      configuracionPrivacidad: user.configuracionPrivacidad,
      esContacto: isContact,
      invitacionPendiente: invitacionPendiente ? {
        _id: invitacionPendiente._id,
        remitente: invitacionPendiente.remitente
      } : null
    };

    if (isOwner || user.configuracionPrivacidad.mostrarEmail) {
      publicData.email = user.email;
    }

    if (isOwner || user.configuracionPrivacidad.mostrarSituacionAcademica) {
      const situacion = await Grade.find({ estudiante: user._id })
        .populate('materia', 'nombre anio')
        .sort({ fecha: -1 });
      publicData.situacionAcademica = situacion;
    }

    res.json(publicData);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el perfil público', error: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const currentUserId = req.user.id;
    // Escapar caracteres especiales para prevenir ReDoS
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQ, 'i');

    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { role: 'student' },
        {
          $or: [
            { nombre: regex },
            { email: regex }
          ]
        }
      ]
    })
      .select('nombre foto carrera configuracionPrivacidad')
      .populate('carrera', 'nombre')
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar usuarios', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile,
  searchUsers
};
