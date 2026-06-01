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
const StudySession = require('../models/StudySession');
const Invitation = require('../models/Invitation');
const Notification = require('../models/Notification');
const Event = require('../models/Event');
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
    User.deleteMany({}),
    StudySession.deleteMany({}),
    Invitation.deleteMany({}),
    Notification.deleteMany({}),
    Event.deleteMany({})
  ]);
}

async function seedCareers() {
  const careersData = [
    {
      nombre: 'Tecnicatura Universitaria en Programacion',
      codigo: 'TUP',
      descripcion: 'Carrera de pregrado (3 anios) orientada al desarrollo de software, con fuerte base en programacion, bases de datos e ingenieria de software.',
      titulo: 'Tecnico/a Universitario/a en Programacion',
      instituto: 'Instituto de Tecnologia e Ingenieria',
      duracionAnios: 3
    },
    {
      nombre: 'Tecnicatura Universitaria en Tecnologia de la Informacion',
      codigo: 'TUTI',
      descripcion: 'Carrera de pregrado orientada a infraestructura, redes y administracion de sistemas.',
      titulo: 'Tecnico/a Universitario/a en Tecnologia de la Informacion',
      instituto: 'Instituto de Tecnologia e Ingenieria',
      duracionAnios: 3
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
    // 1er anio
    { nombre: 'Introduccion a la Programacion', codigo: 'IP' },
    { nombre: 'Matematica', codigo: 'MAT' },
    { nombre: 'Organizacion de las Computadoras', codigo: 'OC' },
    { nombre: 'Ingles con Orientacion en Informatica I', codigo: 'ING1' },
    { nombre: 'Programacion I', codigo: 'PROG1' },
    { nombre: 'Estructura de Datos', codigo: 'ED' },
    { nombre: 'Bases de Datos I', codigo: 'BD1' },
    { nombre: 'Ingles con Orientacion en Informatica II', codigo: 'ING2' },
    // 2do anio
    { nombre: 'Programacion II', codigo: 'PROG2' },
    { nombre: 'Bases de Datos II', codigo: 'BD2' },
    { nombre: 'Sistemas Operativos', codigo: 'SO' },
    { nombre: 'Ingenieria de Software I', codigo: 'IS1' },
    { nombre: 'Programacion III', codigo: 'PROG3' },
    { nombre: 'Redes de Computadoras', codigo: 'RED' },
    { nombre: 'Ingenieria de Software II', codigo: 'IS2' },
    // 3er anio
    { nombre: 'Desarrollo de Aplicaciones Web', codigo: 'DAW' },
    { nombre: 'Seguridad Informatica', codigo: 'SEG' },
    { nombre: 'Gestion de Proyectos de Software', codigo: 'GP' },
    { nombre: 'Practica Profesionalizante', codigo: 'PP' },
    { nombre: 'Optativa: Introduccion a la Ciencia de Datos', codigo: 'OPTCD' },
    // Asignaturas transversales UNAHUR
    { nombre: 'Problematica Ambiental', codigo: 'UNA-AMB' },
    { nombre: 'Ciencia, Tecnologia y Sociedad', codigo: 'UNA-CTS' },
    { nombre: 'Derechos Humanos y Ciudadania', codigo: 'UNA-DDHH' },
    { nombre: 'Taller de Comunicacion', codigo: 'UNA-COM' }
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
    // 1er anio - 1er cuatrimestre
    { codigo: 'IP', anio: 1, cuatrimestre: 1, creditos: 8, horasSemanales: 6 },
    { codigo: 'MAT', anio: 1, cuatrimestre: 1, creditos: 8, horasSemanales: 6 },
    { codigo: 'OC', anio: 1, cuatrimestre: 1, creditos: 6, horasSemanales: 4 },
    { codigo: 'ING1', anio: 1, cuatrimestre: 1, creditos: 4, horasSemanales: 3 },
    // 1er anio - 2do cuatrimestre
    { codigo: 'PROG1', anio: 1, cuatrimestre: 2, creditos: 8, horasSemanales: 6, correlativas: ['IP'] },
    { codigo: 'ED', anio: 1, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['IP'] },
    { codigo: 'BD1', anio: 1, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['IP'] },
    { codigo: 'ING2', anio: 1, cuatrimestre: 2, creditos: 4, horasSemanales: 3, correlativas: ['ING1'] },
    // 2do anio - 1er cuatrimestre
    { codigo: 'PROG2', anio: 2, cuatrimestre: 1, creditos: 8, horasSemanales: 6, correlativas: ['PROG1', 'ED'] },
    { codigo: 'BD2', anio: 2, cuatrimestre: 1, creditos: 6, horasSemanales: 4, correlativas: ['BD1'] },
    { codigo: 'SO', anio: 2, cuatrimestre: 1, creditos: 6, horasSemanales: 4, correlativas: ['OC'] },
    { codigo: 'IS1', anio: 2, cuatrimestre: 1, creditos: 6, horasSemanales: 4, correlativas: ['PROG1', 'BD1'] },
    // 2do anio - 2do cuatrimestre
    { codigo: 'PROG3', anio: 2, cuatrimestre: 2, creditos: 8, horasSemanales: 6, correlativas: ['PROG2', 'BD2'] },
    { codigo: 'RED', anio: 2, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['SO'] },
    { codigo: 'IS2', anio: 2, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['IS1', 'PROG2'] },
    // 3er anio - 1er cuatrimestre
    { codigo: 'DAW', anio: 3, cuatrimestre: 1, creditos: 6, horasSemanales: 5, correlativas: ['PROG3'] },
    { codigo: 'SEG', anio: 3, cuatrimestre: 1, creditos: 6, horasSemanales: 4, correlativas: ['RED'] },
    { codigo: 'GP', anio: 3, cuatrimestre: 1, creditos: 4, horasSemanales: 3, correlativas: ['IS2'] },
    // 3er anio - 2do cuatrimestre
    { codigo: 'PP', anio: 3, cuatrimestre: 2, creditos: 10, horasSemanales: 8, correlativas: ['PROG3', 'IS2', 'BD2'] },
    { codigo: 'OPTCD', anio: 3, cuatrimestre: 2, creditos: 4, horasSemanales: 4, esOptativa: true, correlativas: ['BD2'] },
    // Asignaturas transversales UNAHUR (electivas, sin cuatrimestre fijo)
    { codigo: 'UNA-AMB', anio: 0, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true },
    { codigo: 'UNA-CTS', anio: 0, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true },
    { codigo: 'UNA-DDHH', anio: 0, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true },
    { codigo: 'UNA-COM', anio: 0, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true }
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
      creditosNecesarios: 120,
      materiasUnahurRequeridas: 3,
      nivelInglesRequerido: 'B1',
      estado: 'Vigente',
      activo: true
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function seedAcademicOffer(subjectsMap) {
  const now = new Date();
  const cuatrimestre = now.getMonth() < 7 ? 1 : 2;
  // Ofrecemos las materias de 1er anio de ambos cuatrimestres + las transversales UNAHUR,
  // para que un estudiante nuevo tenga materias en las que inscribirse de entrada.
  const codigosOferta = ['IP', 'MAT', 'OC', 'ING1', 'PROG1', 'ED', 'BD1', 'ING2', 'UNA-AMB', 'UNA-CTS', 'UNA-DDHH', 'UNA-COM'];
  await AcademicOffer.findOneAndUpdate(
    { anio: now.getFullYear(), cuatrimestre },
    {
      anio: now.getFullYear(),
      cuatrimestre,
      materias: codigosOferta.map((cod) => subjectsMap[cod]._id)
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

// Situacion academica de demo para que el asistente (planificador, "que pasa si",
// avance por anio) tenga datos interesantes apenas se levanta el proyecto.
async function seedDemoGrades(student, subjectsMap) {
  const yaTieneNotas = await Grade.countDocuments({ estudiante: student._id });
  if (yaTieneNotas > 0) return;

  const notas = [
    // 1er anio COMPLETO (para mostrar el badge "Completo" en avance por anio)
    { codigo: 'IP', estado: 'Aprobada', nota: 8, anioCursada: 2024, cuatrimestre: 1 },
    { codigo: 'MAT', estado: 'Aprobada', nota: 7, anioCursada: 2024, cuatrimestre: 1 },
    { codigo: 'OC', estado: 'Aprobada', nota: 9, anioCursada: 2024, cuatrimestre: 1 },
    { codigo: 'ING1', estado: 'Aprobada', nota: 8, anioCursada: 2024, cuatrimestre: 1 },
    { codigo: 'PROG1', estado: 'Aprobada', nota: 8, anioCursada: 2024, cuatrimestre: 2 },
    { codigo: 'ED', estado: 'Aprobada', nota: 7, anioCursada: 2024, cuatrimestre: 2 },
    { codigo: 'BD1', estado: 'Aprobada', nota: 7, anioCursada: 2024, cuatrimestre: 2 },
    { codigo: 'ING2', estado: 'Aprobada', nota: 9, anioCursada: 2024, cuatrimestre: 2 },
    // 2do anio en marcha
    // BD2 aprobada: deja a PROG3 bloqueada UNICAMENTE por PROG2 (en curso), ideal para
    // la demo de "que pasa si" (regularizo PROG2 -> se habilita PROG3).
    { codigo: 'BD2', estado: 'Aprobada', nota: 8, anioCursada: 2025, cuatrimestre: 1 },
    { codigo: 'IS1', estado: 'Regular', anioCursada: 2025, cuatrimestre: 1 },
    // En curso ahora: su correlativa (PROG3) NO debe habilitarse en el primer cuatri del plan
    { codigo: 'PROG2', estado: 'Cursando', anioCursada: 2025, cuatrimestre: 1 }
  ];

  for (const n of notas) {
    const subject = subjectsMap[n.codigo];
    if (!subject) continue;
    await Grade.create({
      estudiante: student._id,
      materia: subject._id,
      estado: n.estado,
      nota: n.nota,
      anioCursada: n.anioCursada,
      cuatrimestre: n.cuatrimestre,
      fecha: Date.now()
    });
  }
  logger.info('Situacion academica de demo cargada para el estudiante por defecto.');
}

async function seedUsers() {
  try {
    if (process.env.SEED_RESET !== 'false') {
      await resetDatabase();
      logger.info('Base reiniciada antes de cargar seeds por defecto.');
    }

    const careers = await seedCareers();
    const careerTup = careers[0];
    const subjectsMap = await seedSubjects(careerTup._id);
    const plan = await seedStudyPlan(careerTup, subjectsMap);

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
        carrera: careerTup._id,
        planEstudio: plan._id
      });
      logger.info('Usuario estudiante por defecto creado.');
    } else {
      student.carrera = student.carrera || careerTup._id;
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
        carrera: careerTup._id,
        planEstudio: plan._id
      });
      logger.info('Segundo usuario estudiante por defecto creado.');
    }

    await seedDemoGrades(student, subjectsMap);
    await seedAcademicOffer(subjectsMap);
    logger.info('Sembrado de datos completado exitosamente.');

  } catch (error) {
    logger.error('Error durante el seeding:', error.message);
  }
}

module.exports = { seedUsers, resetDatabase };
