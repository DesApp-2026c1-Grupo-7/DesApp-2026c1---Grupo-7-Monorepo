const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'cambiame';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const register = async (req, res) => {
  try {
    const { nombre, email, password, carrera, planEstudio } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ mensaje: 'El usuario ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let selectedPlan = planEstudio;
    if (carrera && !selectedPlan) {
      const activePlan = await StudyPlan.findOne({ carrera, activo: true }).sort({ anio: -1 });
      selectedPlan = activePlan?._id;
    }

    const user = new User({
      nombre, 
      email, 
      password: hashedPassword, 
      role: 'student',
      carrera,
      planEstudio: selectedPlan
    });
    
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.status(201).json({
      mensaje: 'Usuario registrado con éxito',
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        carrera: user.carrera,
        planEstudio: user.planEstudio
      },
      token
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar usuario', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).populate('carrera', 'nombre codigo').populate('planEstudio', 'nombre estado');
    if (!user) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    if (user.suspendido) {
      return res.status(403).json({ mensaje: 'La cuenta se encuentra suspendida' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.json({
      mensaje: 'Login exitoso',
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        carrera: user.carrera,
        planEstudio: user.planEstudio
      },
      token
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message });
  }
};

module.exports = {
  register,
  login
};
