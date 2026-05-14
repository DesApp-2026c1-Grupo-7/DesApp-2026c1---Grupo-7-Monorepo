const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ usuario: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener notificaciones', error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { leida: true });
    res.json({ mensaje: 'Notificación marcada como leída' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al marcar notificación', error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ usuario: req.user.id }, { leida: true });
    res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al marcar notificaciones', error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
