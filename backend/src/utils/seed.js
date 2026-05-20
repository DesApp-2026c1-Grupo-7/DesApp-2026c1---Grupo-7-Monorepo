const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Career = require('../models/Career');
const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');
const Grade = require('../models/Grade');
const AcademicOffer = require('../models/AcademicOffer');
const Final = require('../models/Final');
const CreditActivity = require('../models/CreditActivity');
const SavedStudyPlan = require('../models/SavedStudyPlan');
const logger = require('./logger');

async function resetDatabase() {
  await Promise.all([
    AcademicOffer.deleteMany({}),
    CreditActivity.deleteMany({}),
    Final.deleteMany({}),
    Grade.deleteMany({}),
    SavedStudyPlan.deleteMany({}),
    StudyPlan.deleteMany({}),
    Subject.deleteMany({}),
    Career.deleteMany({}),
    User.deleteMany({})
  ]);
}

async function seedCareers() {
  const careersData = [
    {
      nombre: 'Ingenieria en Sistemas',
      codigo: 'INGSIST',
      descripcion: 'Carrera de grado de 5 anios orientada a desarrollo de software y sistemas.',
      titulo: 'Ingeniero/a en Sistemas',
      instituto: 'Instituto de Tecnologia e Ingenieria',
      duracionAnios: 5
    },
    {
      nombre: 'Licenciatura en Informatica',
      codigo: 'LICINF',
      descripcion: 'Carrera de grado orientada a investigacion y desarrollo en informatica.',
      titulo: 'Licenciado/a en Informatica',
      instituto: 'Instituto de Tecnologia e Ingenieria',
      duracionAnios: 5
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
    { nombre: 'Analisis Matematico I', codigo: 'AM1' },
    { nombre: 'Algoritmos y Estructuras de Datos', codigo: 'AED' },
    { nombre: 'Programacion I', codigo: 'PROG1' },
    { nombre: 'Analisis Matematico II', codigo: 'AM2' },
    { nombre: 'Ingles Tecnico', codigo: 'ENG1' },
    { nombre: 'Sistemas Operativos', codigo: 'SO' },
    { nombre: 'Bases de Datos I', codigo: 'BD1' },
    { nombre: 'Ingenieria de Software', codigo: 'ISW' },
    { nombre: 'Optativa: Big Data', codigo: 'OPTBD' },
    { nombre: 'Rock Nacional', codigo: 'UNA-ROCK' },
    { nombre: 'La vida de Maradona', codigo: 'UNA-DIEGO' },
    { nombre: 'Robotica', codigo: 'UNA-ROBOT' },
    { nombre: 'La vida de las rocas', codigo: 'UNA-PIEDRA' }
  ];

  const created = {};
  for (const s of subjectsData) {
    const subject = await Subject.findOneAndUpdate(
      { codigo: s.codigo },
      { nombre: s.nombre, codigo: s.codigo, carrera: careerId },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    created[s.codigo] = subject;
  }

  return created;
}

async function seedStudyPlan(career, subjectsMap) {
  const materiasConfig = [
    { codigo: 'AM1', anio: 1, cuatrimestre: 1, creditos: 8, horasSemanales: 6 },
    { codigo: 'AED', anio: 1, cuatrimestre: 1, creditos: 6, horasSemanales: 4 },
    { codigo: 'PROG1', anio: 1, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['AED'] },
    { codigo: 'AM2', anio: 1, cuatrimestre: 2, creditos: 8, horasSemanales: 6, correlativas: ['AM1'] },
    { codigo: 'ENG1', anio: 2, cuatrimestre: 1, creditos: 4, horasSemanales: 2 },
    { codigo: 'SO', anio: 2, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['PROG1'] },
    { codigo: 'BD1', anio: 3, cuatrimestre: 1, creditos: 6, horasSemanales: 4, correlativas: ['PROG1'] },
    { codigo: 'ISW', anio: 3, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['BD1', 'SO'] },
    { codigo: 'OPTBD', anio: 4, cuatrimestre: 2, creditos: 4, horasSemanales: 4, esOptativa: true, correlativas: ['BD1'] },
    { codigo: 'UNA-ROCK', anio: 0, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true },
    { codigo: 'UNA-DIEGO', anio: 0, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true },
    { codigo: 'UNA-ROBOT', anio: 0, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true },
    { codigo: 'UNA-PIEDRA', anio: 0, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true }
  ];

  const materiasFormatted = materiasConfig.map(m => ({
    materia: subjectsMap[m.codigo]._id,
    anio: m.anio,
    cuatrimestre: m.cuatrimestre,
    creditos: m.creditos,
    horasSemanales: m.horasSemanales,
    correlativas: (m.correlativas || []).map(cod => subjectsMap[cod]._id),
    esOptativa: !!m.esOptativa,
    esUnahur: !!m.esUnahur
  }));

  return StudyPlan.findOneAndUpdate(
    { carrera: career._id, anio: 2023 },
    {
      nombre: 'Plan 2023',
      anio: 2023,
      carrera: career._id,
      materias: materiasFormatted,
      creditosNecesarios: 85,
      materiasUnahurRequeridas: 8,
      nivelInglesRequerido: 'B2',
      estado: 'Vigente',
      activo: true
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function seedAcademicOffer(subjectsMap) {
  const now = new Date();
  const cuatrimestre = now.getMonth() < 7 ? 1 : 2;
  const subjects = Object.values(subjectsMap);
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
    if (process.env.SEED_RESET !== 'false') {
      await resetDatabase();
      logger.info('Base reiniciada antes de cargar seeds por defecto.');
    }

    const careers = await seedCareers();
    const careerIngSist = careers[0];
    const subjectsMap = await seedSubjects(careerIngSist._id);
    const plan = await seedStudyPlan(careerIngSist, subjectsMap);

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

    const student2Email = 'estudiante2@universidad.edu';
    let student2 = await User.findOne({ email: student2Email });
    if (!student2) {
      student2 = await User.create({
        nombre: 'Segundo Estudiante',
        email: student2Email,
        password: await bcrypt.hash('estudiante123', 10),
        role: 'student',
        carrera: careerIngSist._id,
        planEstudio: plan._id
      });
      logger.info('Segundo usuario estudiante por defecto creado.');
    }

    await seedAcademicOffer(subjectsMap);
    logger.info('Sembrado de datos completado exitosamente.');

  } catch (error) {
    logger.error('Error durante el seeding:', error.message);
  }
}

module.exports = { seedUsers, resetDatabase };
