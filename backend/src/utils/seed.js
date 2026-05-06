const User = require('../models/User');
const Career = require('../models/Career');
const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');
const Grade = require('../models/Grade');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

async function seedCareers() {
  const careersData = [
    {
      nombre: 'Ingeniería en Sistemas',
      codigo: 'INGSIST',
      descripcion: 'Carrera de grado de 5 años con orientación a desarrollo de software y sistemas.',
      cantidadMaterias: 47,
      creditosNecesarios: 240,
      nivelInglesRequerido: 'B2'
    },
    {
      nombre: 'Licenciatura en Informática',
      codigo: 'LICINF',
      descripcion: 'Carrera de grado orientada a investigación y desarrollo en informática.',
      cantidadMaterias: 42,
      creditosNecesarios: 210,
      nivelInglesRequerido: 'B1'
    }
  ];

  const created = [];
  for (const c of careersData) {
    let career = await Career.findOne({ codigo: c.codigo });
    if (!career) {
      career = await new Career(c).save();
      logger.info(`Carrera ${c.nombre} creada.`);
    } else {
      // Refrescar campos nuevos si están vacíos
      let changed = false;
      if (!career.creditosNecesarios) { career.creditosNecesarios = c.creditosNecesarios; changed = true; }
      if (!career.nivelInglesRequerido || career.nivelInglesRequerido === 'B1' && c.nivelInglesRequerido !== 'B1') {
        career.nivelInglesRequerido = c.nivelInglesRequerido; changed = true;
      }
      if (!career.descripcion && c.descripcion) { career.descripcion = c.descripcion; changed = true; }
      if (changed) await career.save();
    }
    created.push(career);
  }
  return created;
}

async function seedSubjects(careerId) {
  // Materias de Ing. Sistemas con correlativas
  const subjectsData = [
    { nombre: 'Análisis Matemático I', codigo: 'AM1', anio: 1, cuatrimestre: 1, creditos: 8, esUnahur: true },
    { nombre: 'Algoritmos y Estructuras de Datos', codigo: 'AED', anio: 1, cuatrimestre: 1, creditos: 6, esUnahur: true },
    { nombre: 'Programación I', codigo: 'PROG1', anio: 1, cuatrimestre: 2, creditos: 6, esUnahur: true, correlativasCodigos: ['AED'] },
    { nombre: 'Análisis Matemático II', codigo: 'AM2', anio: 1, cuatrimestre: 2, creditos: 8, esUnahur: true, correlativasCodigos: ['AM1'] },
    { nombre: 'Sistemas Operativos', codigo: 'SO', anio: 2, cuatrimestre: 2, creditos: 6, esUnahur: true, correlativasCodigos: ['PROG1'] },
    { nombre: 'Bases de Datos I', codigo: 'BD1', anio: 3, cuatrimestre: 1, creditos: 6, esUnahur: true, correlativasCodigos: ['PROG1'] },
    { nombre: 'Inglés Técnico', codigo: 'ENG1', anio: 2, cuatrimestre: 1, creditos: 4, esUnahur: false },
    { nombre: 'Optativa: Big Data', codigo: 'OPTBD', anio: 4, cuatrimestre: 2, creditos: 4, esOptativa: true, esUnahur: true, correlativasCodigos: ['BD1'] }
  ];

  // Crear materias sin correlativas primero
  const created = {};
  for (const s of subjectsData) {
    const { correlativasCodigos, ...rest } = s;
    let subject = await Subject.findOne({ codigo: s.codigo });
    if (!subject) {
      subject = await new Subject({ ...rest, carrera: careerId }).save();
      logger.info(`Materia ${s.nombre} creada.`);
    } else {
      // Asegurarse de que la carrera quede asociada
      if (!subject.carrera) {
        subject.carrera = careerId;
        await subject.save();
      }
    }
    created[s.codigo] = subject;
  }

  // Asignar correlativas
  for (const s of subjectsData) {
    if (s.correlativasCodigos && s.correlativasCodigos.length) {
      const ids = s.correlativasCodigos.map((c) => created[c]?._id).filter(Boolean);
      const subj = created[s.codigo];
      const currentIds = (subj.correlativas || []).map((id) => id.toString());
      const newIds = ids.map((id) => id.toString());
      if (currentIds.length !== newIds.length || !newIds.every((id) => currentIds.includes(id))) {
        subj.correlativas = ids;
        await subj.save();
      }
    }
  }

  return Object.values(created);
}

async function seedStudyPlan(career, subjects) {
  let plan = await StudyPlan.findOne({ carrera: career._id, anio: 2023 });
  if (!plan) {
    plan = await new StudyPlan({
      nombre: 'Plan 2023',
      anio: 2023,
      carrera: career._id,
      materias: subjects.map((s) => s._id),
      creditosNecesarios: career.creditosNecesarios,
      creditosOptativasNecesarios: 8,
      nivelInglesRequerido: career.nivelInglesRequerido,
      activo: true
    }).save();
    logger.info('Plan de estudio por defecto creado.');
  } else {
    // Asegurar que materias y campos enriquecidos estén actualizados
    let changed = false;
    const newIds = subjects.map((s) => s._id.toString()).sort();
    const oldIds = (plan.materias || []).map((id) => id.toString()).sort();
    if (newIds.join(',') !== oldIds.join(',')) {
      plan.materias = subjects.map((s) => s._id);
      changed = true;
    }
    if (!plan.creditosNecesarios) { plan.creditosNecesarios = career.creditosNecesarios; changed = true; }
    if (!plan.creditosOptativasNecesarios) { plan.creditosOptativasNecesarios = 8; changed = true; }
    if (!plan.nivelInglesRequerido || plan.nivelInglesRequerido === 'B1' && career.nivelInglesRequerido !== 'B1') {
      plan.nivelInglesRequerido = career.nivelInglesRequerido;
      changed = true;
    }
    if (changed) await plan.save();
  }
  return plan;
}

async function seedSituationFor(student, subjects) {
  // Crear ejemplo: 1 aprobada, 1 regular, resto pendiente
  if (subjects.length < 3) return;

  const sample = [
    { codigo: 'AM1', estado: 'Aprobada', nota: 9, cuatrimestre: 1, anioCursada: 2024 },
    { codigo: 'AED', estado: 'Aprobada', nota: 8, cuatrimestre: 1, anioCursada: 2024 },
    { codigo: 'AM2', estado: 'Regular', cuatrimestre: 2, anioCursada: 2024 },
    { codigo: 'PROG1', estado: 'Cursando', cuatrimestre: 2, anioCursada: 2024 }
  ];

  const codeToId = {};
  subjects.forEach((s) => { codeToId[s.codigo] = s._id; });

  for (const r of sample) {
    if (!codeToId[r.codigo]) continue;
    await Grade.findOneAndUpdate(
      { estudiante: student._id, materia: codeToId[r.codigo] },
      {
        estado: r.estado,
        nota: r.nota,
        cuatrimestre: r.cuatrimestre,
        anioCursada: r.anioCursada,
        fecha: Date.now()
      },
      { upsert: true, new: true }
    );
  }
  logger.info('Situación académica de prueba cargada para el estudiante.');
}

async function seedUsers() {
  try {
    const careers = await seedCareers();
    const careerIngSist = careers[0];
    const subjects = await seedSubjects(careerIngSist._id);
    const plan = await seedStudyPlan(careerIngSist, subjects);

    // Admin
    const adminEmail = 'admin@universidad.edu';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hash = await bcrypt.hash('admin123', 10);
      admin = await new User({
        nombre: 'Administrador Sistema',
        email: adminEmail,
        password: hash,
        role: 'admin'
      }).save();
      logger.info('Usuario administrador por defecto creado con éxito.');
    }

    // Estudiante
    const studentEmail = 'estudiante@universidad.edu';
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      const hash = await bcrypt.hash('estudiante123', 10);
      student = await new User({
        nombre: 'Estudiante de Prueba',
        email: studentEmail,
        password: hash,
        role: 'student',
        carrera: careerIngSist._id,
        planEstudio: plan._id
      }).save();
      logger.info('Usuario estudiante por defecto creado con éxito.');
    } else {
      // Asegurar que tenga carrera y plan asociados
      let changed = false;
      if (!student.carrera) { student.carrera = careerIngSist._id; changed = true; }
      if (!student.planEstudio) { student.planEstudio = plan._id; changed = true; }
      if (changed) await student.save();
    }

    if (student && subjects.length) {
      await seedSituationFor(student, subjects);
    }
  } catch (error) {
    logger.error('Error durante el seeding:', error.message);
  }
}

module.exports = { seedUsers };
