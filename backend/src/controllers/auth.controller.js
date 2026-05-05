const User = require('../models/User');
const { generateToken } = require('../middlewares/auth');

async function register(req, res, next) {
  try {
    const { nombre, email, password, role } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, error: 'Nombre, email y password son obligatorios' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ ok: false, error: 'Ya existe un usuario con ese email' });
    }

    const user = await User.create({ nombre, email, password, role });
    const token = generateToken(user);

    res.status(201).json({ ok: true, token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email y password son obligatorios' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    const token = generateToken(user);
    res.json({ ok: true, token, user });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }
    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
