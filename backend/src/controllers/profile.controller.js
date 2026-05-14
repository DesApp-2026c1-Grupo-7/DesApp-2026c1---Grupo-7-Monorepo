const User = require('../models/User');
const Grade = require('../models/Grade');

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
      .select('nombre email carrera bio foto configuracionPrivacidad')
      .populate('carrera', 'nombre');

    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Lógica de privacidad
    const isOwner = req.user && req.user.id === req.params.id;
    const isPublic = user.configuracionPrivacidad.perfil === 'publico';
    
    // Si es privado y no es el dueño, en el futuro verificaremos si son contactos
    // Por ahora, si es privado solo el dueño lo ve completo
    if (!isPublic && !isOwner) {
      return res.status(403).json({ mensaje: 'Este perfil es privado' });
    }

    const publicData = {
      nombre: user.nombre,
      carrera: user.carrera,
      bio: user.bio,
      foto: user.foto,
      configuracionPrivacidad: user.configuracionPrivacidad
    };

    if (user.configuracionPrivacidad.mostrarEmail || isOwner) {
      publicData.email = user.email;
    }

    if (user.configuracionPrivacidad.mostrarSituacionAcademica || isOwner) {
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

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile
};
