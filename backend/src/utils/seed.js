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

async function resetDatabase() {
  console.log('[seed] Borrando base de datos...');
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
  console.log('[seed] Base de datos limpia.');
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
  console.log(`[seed] ${created.length} Carreras creadas/actualizadas.`);
  return created;
}

async function seedSubjects(careerId) {
  const subjectsData = [
    { nombre: 'Introduccion a la Programacion', codigo: 'IP' },
    { nombre: 'Matematica', codigo: 'MAT' },
    { nombre: 'Organizacion de las Computadoras', codigo: 'OC' },
    { nombre: 'Ingles con Orientacion en Informatica I', codigo: 'ING1' },
    { nombre: 'Programacion I', codigo: 'PROG1' },
    { nombre: 'Estructura de Datos', codigo: 'ED' },
    { nombre: 'Bases de Datos I', codigo: 'BD1' },
    { nombre: 'Ingles con Orientacion en Informatica II', codigo: 'ING2' },
    { nombre: 'Programacion II', codigo: 'PROG2' },
    { nombre: 'Bases de Datos II', codigo: 'BD2' },
    { nombre: 'Sistemas Operativos', codigo: 'SO' },
    { nombre: 'Ingenieria de Software I', codigo: 'IS1' },
    { nombre: 'Programacion III', codigo: 'PROG3' },
    { nombre: 'Redes de Computadoras', codigo: 'RED' },
    { nombre: 'Ingenieria de Software II', codigo: 'IS2' },
    { nombre: 'Desarrollo de Aplicaciones Web', codigo: 'DAW' },
    { nombre: 'Seguridad Informatica', codigo: 'SEG' },
    { nombre: 'Gestion de Proyectos de Software', codigo: 'GP' },
    { nombre: 'Practica Profesionalizante', codigo: 'PP' },
    { nombre: 'Optativa: Introduccion a la Ciencia de Datos', codigo: 'OPTCD' },
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
  console.log(`[seed] ${Object.keys(created).length} Materias creadas/actualizadas.`);
  return created;
}

async function seedStudyPlan(career, subjectsMap) {
  const materiasConfig = [
    { codigo: 'IP', anio: 1, cuatrimestre: 1, creditos: 8, horasSemanales: 6 },
    { codigo: 'MAT', anio: 1, cuatrimestre: 1, creditos: 8, horasSemanales: 6 },
    { codigo: 'OC', anio: 1, cuatrimestre: 1, creditos: 6, horasSemanales: 4 },
    { codigo: 'ING1', anio: 1, cuatrimestre: 1, creditos: 4, horasSemanales: 3 },
    { codigo: 'PROG1', anio: 1, cuatrimestre: 2, creditos: 8, horasSemanales: 6, correlativas: ['IP'] },
    { codigo: 'ED', anio: 1, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['IP'] },
    { codigo: 'BD1', anio: 1, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['IP'] },
    { codigo: 'ING2', anio: 1, cuatrimestre: 2, creditos: 4, horasSemanales: 3, correlativas: ['ING1'] },
    { codigo: 'PROG2', anio: 2, cuatrimestre: 1, creditos: 8, horasSemanales: 6, correlativas: ['PROG1', 'ED'] },
    { codigo: 'BD2', anio: 2, cuatrimestre: 1, creditos: 6, horasSemanales: 4, correlativas: ['BD1'] },
    { codigo: 'SO', anio: 2, cuatrimestre: 1, creditos: 6, horasSemanales: 4, correlativas: ['OC'] },
    { codigo: 'IS1', anio: 2, cuatrimestre: 1, creditos: 6, horasSemanales: 4, correlativas: ['PROG1', 'BD1'] },
    { codigo: 'PROG3', anio: 2, cuatrimestre: 2, creditos: 8, horasSemanales: 6, correlativas: ['PROG2', 'BD2'] },
    { codigo: 'RED', anio: 2, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['SO'] },
    { codigo: 'IS2', anio: 2, cuatrimestre: 2, creditos: 6, horasSemanales: 4, correlativas: ['IS1', 'PROG2'] },
    { codigo: 'DAW', anio: 3, cuatrimestre: 1, creditos: 6, horasSemanales: 5, correlativas: ['PROG3'] },
    { codigo: 'SEG', anio: 3, cuatrimestre: 1, creditos: 6, horasSemanales: 4, correlativas: ['RED'] },
    { codigo: 'GP', anio: 3, cuatrimestre: 1, creditos: 4, horasSemanales: 3, correlativas: ['IS2'] },
    { codigo: 'PP', anio: 3, cuatrimestre: 2, creditos: 10, horasSemanales: 8, correlativas: ['PROG3', 'IS2', 'BD2'] },
    { codigo: 'OPTCD', anio: 3, cuatrimestre: 2, creditos: 4, horasSemanales: 4, esOptativa: true, correlativas: ['BD2'] },
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

  const plan = await StudyPlan.findOneAndUpdate(
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
  console.log('[seed] Plan de estudio creado.');
  return plan;
}

async function seedAcademicOffer(subjectsMap) {
  const now = new Date();
  const cuatrimestre = now.getMonth() < 7 ? 1 : 2;
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
  console.log('[seed] Oferta académica creada.');
}

async function seedUsers() {
  console.log('[seed] Iniciando proceso de sembrado...');
  try {
    if (process.env.SEED_RESET !== 'false') {
      await resetDatabase();
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
      console.log('[seed] Admin creado.');
    }

    const s1Email = 'estudiante1@universidad.edu';
    let s1 = await User.findOne({ email: s1Email });
    if (!s1) {
      s1 = await User.create({
        nombre: 'Estudiante Uno',
        email: s1Email,
        password: await bcrypt.hash('estudiante123', 10),
        role: 'student',
        carrera: careerTup._id,
        planEstudio: plan._id,
        configuracionPrivacidad: { perfil: 'publico' }
      });
      console.log('[seed] Estudiante 1 (Público) creado.');
    }

    const s2Email = 'estudiante2@universidad.edu';
    let s2 = await User.findOne({ email: s2Email });
    if (!s2) {
      s2 = await User.create({
        nombre: 'Estudiante Dos',
        email: s2Email,
        password: await bcrypt.hash('estudiante123', 10),
        role: 'student',
        carrera: careerTup._id,
        planEstudio: plan._id,
        configuracionPrivacidad: { perfil: 'publico' }
      });
      console.log('[seed] Estudiante 2 (Público) creado.');
    }

    const s3Email = 'estudiante3@universidad.edu';
    let s3 = await User.findOne({ email: s3Email });
    if (!s3) {
      s3 = await User.create({
        nombre: 'Estudiante Tres',
        email: s3Email,
        password: await bcrypt.hash('estudiante123', 10),
        role: 'student',
        carrera: careerTup._id,
        planEstudio: plan._id,
        configuracionPrivacidad: { perfil: 'privado' }
      });
      console.log('[seed] Estudiante 3 (Privado) creado.');
    }

    await seedAcademicOffer(subjectsMap);
    console.log('[seed] Sembrado de datos finalizado exitosamente.');

  } catch (error) {
    console.error('[seed] ERROR CRÍTICO:', error.message);
  }
}

module.exports = { seedUsers, resetDatabase };
