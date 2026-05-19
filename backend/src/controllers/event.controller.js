const Event = require('../models/Event');
const User = require('../models/User');

const createEvent = async (req, res) => {
  try {
    const { contenido, tipo = 'posteo' } = req.body;
    if (!contenido || !contenido.trim()) {
      return res.status(400).json({ mensaje: 'El contenido es requerido' });
    }
    if (contenido.trim().length > 500) {
      return res.status(400).json({ mensaje: 'El contenido no puede superar los 500 caracteres' });
    }

    const event = await Event.create({
      autor: req.user.id,
      tipo,
      contenido: contenido.trim()
    });

    await event.populate('autor', 'nombre foto carrera');
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el evento', error: error.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select('contactos');
    const contactIds = currentUser.contactos.map(c => c.toString());

    // El usuario siempre puede ver sus propios eventos.
    // Para otros autores, deben tener 'mostrarEventos' en true Y ser contacto o perfil público.
    const visibleAuthors = await User.find({
      role: 'student',
      $or: [
        { _id: req.user.id },
        {
          'configuracionPrivacidad.mostrarEventos': true,
          $or: [
            { _id: { $in: contactIds } },
            { 'configuracionPrivacidad.perfil': 'publico' }
          ]
        }
      ]
    }).select('_id');

    const visibleAuthorIds = visibleAuthors.map(u => u._id);

    const events = await Event.find({ autor: { $in: visibleAuthorIds } })
      .populate('autor', 'nombre foto carrera')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(events);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el feed', error: error.message });
  }
};

module.exports = { createEvent, getFeed };
