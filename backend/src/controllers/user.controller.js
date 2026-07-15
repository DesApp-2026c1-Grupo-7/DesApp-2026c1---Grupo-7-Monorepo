const bcrypt = require('bcryptjs');
const User = require('../models/User');

const publicUserFields = 'nombre email role suspendido motivoSuspension carrera planEstudio createdAt';

// Solo el administrador principal puede promover/degradar administradores.
const SUPREME_ADMIN_EMAIL = process.env.SUPREME_ADMIN_EMAIL || 'admin@universidad.edu';

const esAdminSupremo = async (userId) => {
  const actor = await User.findById(userId).select('email');
  return actor?.email === SUPREME_ADMIN_EMAIL;
};

const listUsers = async (req, res) => {
  try {
    const { role, suspendido } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (suspendido !== undefined) filter.suspendido = suspendido === 'true';

    const users = await User.find(filter)
      .select(publicUserFields)
      .populate('carrera', 'nombre codigo')
      .populate('planEstudio', 'nombre estado')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar usuarios', error: error.message });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'nombre, email y password son obligatorios' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ mensaje: 'El usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      nombre,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    res.status(201).json({
      mensaje: 'Administrador creado con exito',
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        suspendido: user.suspendido
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear administrador', error: error.message });
  }
};

const suspendUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ mensaje: 'No podes suspender tu propia cuenta' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        suspendido: true,
        motivoSuspension: req.body.motivo || 'Suspendido por administrador'
      },
      { new: true, runValidators: true }
    ).select(publicUserFields);

    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Cuenta suspendida', user });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al suspender usuario', error: error.message });
  }
};

const reactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { suspendido: false, motivoSuspension: '' },
      { new: true, runValidators: true }
    ).select(publicUserFields);

    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Cuenta reactivada', user });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al reactivar usuario', error: error.message });
  }
};

const promoteUserToAdmin = async (req, res) => {
  try {
    if (!(await esAdminSupremo(req.user.id))) {
      return res.status(403).json({ mensaje: 'Solo el administrador principal puede promover usuarios' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin', suspendido: false, motivoSuspension: '' },
      { new: true, runValidators: true }
    ).select(publicUserFields);

    if (!user) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario promovido a administrador', user });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al promover usuario', error: error.message });
  }
};

const demoteAdmin = async (req, res) => {
  try {
    if (!(await esAdminSupremo(req.user.id))) {
      return res.status(403).json({ mensaje: 'Solo el administrador principal puede degradar administradores' });
    }

    const target = await User.findById(req.params.id).select('email role');
    if (!target) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    if (target.email === SUPREME_ADMIN_EMAIL) {
      return res.status(400).json({ mensaje: 'No se puede degradar al administrador principal' });
    }
    if (target.role !== 'admin') {
      return res.status(400).json({ mensaje: 'El usuario no es administrador' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'student' },
      { new: true, runValidators: true }
    ).select(publicUserFields);

    res.json({ mensaje: 'Administrador degradado a estudiante', user });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al degradar administrador', error: error.message });
  }
};

module.exports = {
  listUsers,
  createAdmin,
  suspendUser,
  reactivateUser,
  promoteUserToAdmin,
  demoteAdmin
};
