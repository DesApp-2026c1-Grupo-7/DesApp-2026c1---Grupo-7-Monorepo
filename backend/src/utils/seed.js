const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Career = require('../models/Career');
const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');
const Grade = require('../models/Grade');
const AcademicOffer = require('../models/AcademicOffer');
const logger = require('./logger');

async function seedCareers() {
  const careersData = [
    {
      nombre: 'Ingenieria en Sistemas',
      codigo: 'INGSIST',
      descripcion: 'Carrera de grado de 5 anios orientada a desarrollo de software y sistemas.',
      titulo: 'Ingeniero/a en Sistemas',
      instituto: 'Instituto de Tecnologia e Ingenieria',
      duracionAnios: 5,
      cantidadMaterias: 47,
      creditosNecesarios: 240,
      nivelInglesRequerido: 'B2'
    },
    {
      nombre: 'Licenciatura en Informatica',
      codigo: 'LICINF',
      descripcion: 'Carrera de grado orientada a investigacion y desarrollo en informatica.',
      titulo: 'Licenciado/a en Informatica',
      instituto: 'Instituto de Tecnologia e Ingenieria',
      duracionAnios: 5,
      cantidadMaterias: 42,
      creditosNecesarios: 210,
      nivelInglesRequerido: 'B1'
    }
  ];

  const created = [];
  for (const c of careersData) {
    const career = await Career.findOneAndUpdate(
      { codigo: c.codigo },
      c,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    created.push(career);
  }
  return created;
}

async function seedSubjects(careerId) {
  const subjectsData = [
    { nombre: 'Analisis Matematico I', codigo: 'AM1', anio: 1, cuatrimestre: 1, creditos: 8, esUnahur: true },
    { nombre: 'Algoritmos y Estructuras de Datos', codigo: 'AED', anio: 1, cuatrimestre: 1, creditos: 6, esUnahur: true },
    { nombre: 'Programacion I', codigo: 'PROG1', anio: 1, cuatrimestre: 2, creditos: 6, esUnahur: true, correlativasCodigos: ['AED'] },
    { nombre: 'Analisis Matematico II', codigo: 'AM2', anio: 1, cuatrimestre: 2, creditos: 8, esUnahur: true, correlativasCodigos: ['AM1'] },
    { nombre: 'Ingles Tecnico', codigo: 'ENG1', anio: 2, cuatrimestre: 1, creditos: 4, esUnahur: false },
    { nombre: 'Sistemas Operativos', codigo: 'SO', anio: 2, cuatrimestre: 2, creditos: 6, esUnahur: true, correlativasCodigos: ['PROG1'] },
    { nombre: 'Bases de Datos I', codigo: 'BD1', anio: 3, cuatrimestre: 1, creditos: 6, esUnahur: true, correlativasCodigos: ['PROG1'] },
    { nombre: 'Optativa: Big Data', codigo: 'OPTBD', anio: 4, cuatrimestre: 2, creditos: 4, esOptativa: true, esUnahur: true, correlativasCodigos: ['BD1'] }
  ];

  const created = {};
  for (const s of subjectsData) {
    const { correlativasCodigos, ...data } = s;
    const subject = await Subject.findOneAndUpdate(
      { codigo: s.codigo },
      { ...data, carrera: careerId },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    created[s.codigo] = subject;
  }

  for (const s of subjectsData) {
    if (!s.correlativasCodigos?.length) continue;
    const ids = s.correlativasCodigos.map((codigo) => created[codigo]?._id).filter(Boolean);
    await Subject.findByIdAndUpdate(created[s.codigo]._id, { correlativas: ids }, { runValidators: true });
    created[s.codigo] = await Subject.findById(created[s.codigo]._id);
  }

  return Object.values(created);
}

async function seedStudyPlan(career, subjects) {
  return StudyPlan.findOneAndUpdate(
    { carrera: career._id, anio: 2023 },
    {
      nombre: 'Plan 2023',
      anio: 2023,
      carrera: career._id,
      materias: subjects.map((s) => s._id),
      creditosNecesarios: career.creditosNecesarios,
      creditosOptativasNecesarios: 8,
      nivelInglesRequerido: career.nivelInglesRequerido,
      estado: 'Vigente',
      activo: true
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function seedSituationFor(student, subjects) {
  const sample = [
    { codigo: 'AM1', estado: 'Aprobada', nota: 9, cuatrimestre: 1, anioCursada: 2024 },
    { codigo: 'AED', estado: 'Aprobada', nota: 8, cuatrimestre: 1, anioCursada: 2024 },
    { codigo: 'AM2', estado: 'Regular', cuatrimestre: 2, anioCursada: 2024 },
    { codigo: 'PROG1', estado: 'Cursando', cuatrimestre: 2, anioCursada: 2024 }
  ];
  const codeToId = Object.fromEntries(subjects.map((s) => [s.codigo, s._id]));

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
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }
}

async function seedAcademicOffer(subjects) {
  const now = new Date();
  const cuatrimestre = now.getMonth() < 7 ? 1 : 2;
  await AcademicOffer.findOneAndUpdate(
    { anio: now.getFullYear(), cuatrimestre },
    {
      anio: now.getFullYear(),
      cuatrimestre,
      materias: subjects.slice(0, 5).map((s) => s._id)
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function seedUsers() {
  try {
    const careers = await seedCareers();
    const careerIngSist = careers[0];
    const subjects = await seedSubjects(careerIngSist._id);
    const plan = await seedStudyPlan(careerIngSist, subjects);

    const adminEmail = 'admin@universidad.edu';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        nombre: 'Administrador Sistema',
        email: adminEmail,
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      });
      logger.info('Usuario administrador por defecto creado.');
    }

    const studentEmail = 'estudiante@universidad.edu';
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      student = await User.create({
        nombre: 'Estudiante de Prueba',
        email: studentEmail,
        password: await bcrypt.hash('estudiante123', 10),
        role: 'student',
        carrera: careerIngSist._id,
        planEstudio: plan._id
      });
      logger.info('Usuario estudiante por defecto creado.');
    } else {
      student.carrera = student.carrera || careerIngSist._id;
      student.planEstudio = student.planEstudio || plan._id;
      await student.save();
    }

    await seedSituationFor(student, subjects);
    await seedAcademicOffer(subjects);
  } catch (error) {
    logger.error('Error durante el seeding:', error.message);
  }
}

module.exports = { seedUsers };
