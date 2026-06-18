const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'cambiame';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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

const loginGoogle = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ mensaje: 'Falta el token de Google' });
    }
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ mensaje: 'El login con Google no está configurado en el servidor' });
    }

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();

    if (!email || !payload.email_verified) {
      return res.status(401).json({ mensaje: 'La cuenta de Google no tiene un email verificado' });
    }

    let user = await User.findOne({ email })
      .populate('carrera', 'nombre codigo')
      .populate('planEstudio', 'nombre estado');

    if (!user) {
      // Primera vez: se crea una cuenta de estudiante vinculada a Google (sin password).
      user = new User({
        nombre: payload.name || email,
        email,
        googleId: payload.sub,
        foto: payload.picture || '',
        role: 'student'
      });
      await user.save();
    } else if (!user.googleId) {
      // Cuenta local existente con el mismo email: se vincula a Google.
      user.googleId = payload.sub;
      if (!user.foto && payload.picture) user.foto = payload.picture;
      await user.save();
    }

    if (user.suspendido) {
      return res.status(403).json({ mensaje: 'La cuenta se encuentra suspendida' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.json({
      mensaje: 'Login con Google exitoso',
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
    res.status(401).json({ mensaje: 'No se pudo validar el login con Google', error: error.message });
  }
};

module.exports = {
  register,
  login,
  loginGoogle
};
