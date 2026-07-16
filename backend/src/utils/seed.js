const fs = require('fs');
const path = require('path');
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
const ReportReason = require('../models/ReportReason');
const Material = require('../models/Material');
const MaterialReport = require('../models/MaterialReport');
const SystemConfig = require('../models/SystemConfig');
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
    Event.deleteMany({}),
    ReportReason.deleteMany({}),
    Material.deleteMany({}),
    MaterialReport.deleteMany({}),
    SystemConfig.deleteMany({})
  ]);
}

async function seedSystemConfig() {
  const defaultConfig = {
    key: 'materialReportThresholds',
    value: { nPending: 3, mVerified: 1 },
    description: 'Umbrales para suspensión automática de material'
  };

  await SystemConfig.findOneAndUpdate(
    { key: defaultConfig.key },
    defaultConfig,
    { upsert: true, new: true }
  );
  logger.info('Configuración de sistema sembrada (umbrales de materiales).');
}

async function seedReportReasons() {
  const reasons = [
    { titulo: 'Contenido pornográfico o sexual explícito', orden: 1 },
    { titulo: 'Lenguaje ofensivo o insultos', orden: 2 },
    { titulo: 'Material protegido por derechos de autor', orden: 3 },
    { titulo: 'Spam o publicidad engañosa', orden: 4 },
    { titulo: 'Información incorrecta o engañosa', orden: 5 },
    { titulo: 'Otro', orden: 6 }
  ];

  const creados = [];
  for (const r of reasons) {
    const reason = await ReportReason.findOneAndUpdate(
      { titulo: r.titulo },
      r,
      { upsert: true, new: true }
    );
    creados.push(reason);
  }
  logger.info('Motivos de denuncia sembrados con orden específico.');
  return creados;
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
    },
    {
      // Plan de estudios real de UNAHUR (RCS 008/2026, Exp. 870/2023).
      nombre: 'Profesorado Universitario de Chino',
      codigo: 'PUCH',
      descripcion: 'Carrera de grado (4 anios) para formar profesores/as de idioma chino, con titulacion intermedia de Tecnico/a Universitario/a en Practicas Socioeducativas del Idioma Chino.',
      titulo: 'Profesor/a Universitario/a de Chino',
      instituto: 'Instituto de Educacion',
      duracionAnios: 4
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
    { codigo: 'UNA-AMB', anio: 1, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true },
    { codigo: 'UNA-CTS', anio: 1, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true },
    { codigo: 'UNA-DDHH', anio: 1, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true },
    { codigo: 'UNA-COM', anio: 1, cuatrimestre: 0, creditos: 4, horasSemanales: 2, esOptativa: true, esUnahur: true }
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

// -------------------------------------------------------------------------
// Profesorado Universitario de Chino (plan real UNAHUR, RCS 008/2026).
// Materias con codigos CHN-* para no colisionar con las de Informatica.
// Regimen: A = anual (cuatrimestre 0), C = cuatrimestral (1 o 2).
// -------------------------------------------------------------------------
const CHINO_MATERIAS = [
  // PRIMER AÑO
  { codigo: 'CHN-CIA1', nombre: 'Chino Integral Avanzado I', anio: 1, cuatrimestre: 0, creditos: 11, horasSemanales: 6 },
  { codigo: 'CHN-COP1', nombre: 'Comprension y Produccion Oral en Chino I', anio: 1, cuatrimestre: 0, creditos: 11, horasSemanales: 4 },
  { codigo: 'CHN-FON', nombre: 'Fonetica y Practica en Laboratorio', anio: 1, cuatrimestre: 1, creditos: 3, horasSemanales: 2 },
  { codigo: 'CHN-CAR', nombre: 'Caracteres Chinos', anio: 1, cuatrimestre: 1, creditos: 3, horasSemanales: 2 },
  { codigo: 'CHN-ICC', nombre: 'Introduccion a la Cultura China', anio: 1, cuatrimestre: 2, creditos: 5, horasSemanales: 3 },
  { codigo: 'CHN-CAD', nombre: 'Cultura y Alfabetizacion Digital en la Universidad', anio: 1, cuatrimestre: 1, creditos: 4, horasSemanales: 2 },
  { codigo: 'CHN-PED', nombre: 'Pedagogia', anio: 1, cuatrimestre: 1, creditos: 5, horasSemanales: 4 },
  { codigo: 'CHN-LEO', nombre: 'Lectura, Escritura y Oralidad', anio: 1, cuatrimestre: 2, creditos: 4, horasSemanales: 3 },
  { codigo: 'CHN-APE', nombre: 'Aprendizajes y Practicas Educativas', anio: 1, cuatrimestre: 2, creditos: 5, horasSemanales: 4 },
  { codigo: 'CHN-TSI', nombre: 'Territorio, Sujetos e Instituciones', anio: 1, cuatrimestre: 1, creditos: 6, horasSemanales: 4 },
  // SEGUNDO AÑO
  { codigo: 'CHN-CIA2', nombre: 'Chino Integral Avanzado II', anio: 2, cuatrimestre: 0, creditos: 11, horasSemanales: 6, correlativas: ['CHN-CIA1'] },
  { codigo: 'CHN-COP2', nombre: 'Comprension y Produccion Oral en Chino II', anio: 2, cuatrimestre: 0, creditos: 11, horasSemanales: 4, correlativas: ['CHN-COP1'] },
  { codigo: 'CHN-GRA', nombre: 'Gramatica China', anio: 2, cuatrimestre: 1, creditos: 3, horasSemanales: 2, correlativas: ['CHN-CIA1'] },
  { codigo: 'CHN-HISC', nombre: 'Historia China', anio: 2, cuatrimestre: 2, creditos: 3, horasSemanales: 2 },
  { codigo: 'CHN-LEC', nombre: 'Lectura y Escritura en Chino', anio: 2, cuatrimestre: 1, creditos: 5, horasSemanales: 4, correlativas: ['CHN-CAR'] },
  { codigo: 'CHN-DYC', nombre: 'Didactica y Curriculum', anio: 2, cuatrimestre: 1, creditos: 5, horasSemanales: 3, correlativas: ['CHN-PED'] },
  { codigo: 'CHN-ESI', nombre: 'Educacion Sexual Integral', anio: 2, cuatrimestre: 2, creditos: 4, horasSemanales: 2 },
  { codigo: 'CHN-PPL', nombre: 'Pensamiento Pedagogico Latinoamericano', anio: 2, cuatrimestre: 2, creditos: 5, horasSemanales: 3 },
  { codigo: 'CHN-PES', nombre: 'Practicas de la Ensenanza en el Ambito Socioeducativo', anio: 2, cuatrimestre: 1, creditos: 6, horasSemanales: 4, correlativas: ['CHN-APE'] },
  // TERCER AÑO
  { codigo: 'CHN-CIA3', nombre: 'Chino Integral Avanzado III', anio: 3, cuatrimestre: 0, creditos: 14, horasSemanales: 6, correlativas: ['CHN-CIA2'] },
  { codigo: 'CHN-COP3', nombre: 'Comprension y Produccion Oral en Chino III', anio: 3, cuatrimestre: 0, creditos: 5, horasSemanales: 2, correlativas: ['CHN-COP2'] },
  { codigo: 'CHN-DID', nombre: 'Didactica del Chino', anio: 3, cuatrimestre: 1, creditos: 5, horasSemanales: 3, correlativas: ['CHN-DYC'] },
  { codigo: 'CHN-SCC', nombre: 'Sociedad China Contemporanea', anio: 3, cuatrimestre: 2, creditos: 3, horasSemanales: 2 },
  { codigo: 'CHN-HNA', nombre: 'Historia de la Nacion Argentina y sus Proyectos Educativos', anio: 3, cuatrimestre: 1, creditos: 5, horasSemanales: 3 },
  { codigo: 'CHN-DES', nombre: 'Didactica en Contextos de Educacion Superior', anio: 3, cuatrimestre: 2, creditos: 5, horasSemanales: 3 },
  { codigo: 'CHN-UNA', nombre: 'Asignatura UNAHUR', anio: 3, cuatrimestre: 1, creditos: 3, horasSemanales: 2, esOptativa: true, esUnahur: true },
  { codigo: 'CHN-PDP', nombre: 'Practicas Docentes en el Nivel Primario', anio: 3, cuatrimestre: 0, creditos: 11, horasSemanales: 5, correlativas: ['CHN-PES'] },
  // CUARTO AÑO
  { codigo: 'CHN-CIA4', nombre: 'Chino Integral Avanzado IV', anio: 4, cuatrimestre: 0, creditos: 14, horasSemanales: 6, correlativas: ['CHN-CIA3'] },
  { codigo: 'CHN-LIT', nombre: 'Literatura China', anio: 4, cuatrimestre: 1, creditos: 5, horasSemanales: 3, correlativas: ['CHN-CIA3'] },
  { codigo: 'CHN-ACO', nombre: 'Analisis Contrastivo del Chino y el Espanol', anio: 4, cuatrimestre: 2, creditos: 3, horasSemanales: 2, correlativas: ['CHN-GRA'] },
  { codigo: 'CHN-CIN', nombre: 'Comunicacion Intercultural', anio: 4, cuatrimestre: 1, creditos: 3, horasSemanales: 2 },
  { codigo: 'CHN-IEL', nombre: 'Investigacion Educativa en Lenguas Extranjeras', anio: 4, cuatrimestre: 2, creditos: 4, horasSemanales: 2 },
  { codigo: 'CHN-TEC', nombre: 'Tecnologia Educativa', anio: 4, cuatrimestre: 1, creditos: 4, horasSemanales: 2 },
  { codigo: 'CHN-POL', nombre: 'Politica Educativa', anio: 4, cuatrimestre: 2, creditos: 5, horasSemanales: 3 },
  { codigo: 'CHN-PDS', nombre: 'Practicas Docentes en el Nivel Secundario y Superior', anio: 4, cuatrimestre: 0, creditos: 11, horasSemanales: 5, correlativas: ['CHN-PDP'] }
];

async function seedSubjectsChino(careerId) {
  const created = {};
  for (const s of CHINO_MATERIAS) {
    const subject = await Subject.findOneAndUpdate(
      { codigo: s.codigo },
      { nombre: s.nombre, codigo: s.codigo, carrera: careerId },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    created[s.codigo] = subject;
  }
  return created;
}

async function seedStudyPlanChino(career, subjectsMap) {
  const materiasFormatted = CHINO_MATERIAS.map(m => ({
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
    { carrera: career._id, anio: 2026 },
    {
      nombre: 'Plan 2026',
      anio: 2026,
      carrera: career._id,
      materias: materiasFormatted,
      creditosNecesarios: 240,
      materiasUnahurRequeridas: 1,
      nivelInglesRequerido: 'Ninguno',
      estado: 'Vigente',
      activo: true
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

// Crea (si no existen) los estudiantes del Profesorado de Chino, para que el
// seed tenga alumnos de mas de una carrera.
async function seedEstudiantesChino(career, plan, subjectsMap) {
  const nuevos = [
    { nombre: 'Ana Wang', email: 'ana.wang@universidad.edu', privacidad: 'publico' },
    { nombre: 'Lucia Fernandez', email: 'lucia.fernandez@universidad.edu', privacidad: 'publico' },
    { nombre: 'Diego Martinez', email: 'diego.martinez@universidad.edu', privacidad: 'privado' },
    { nombre: 'Sofia Li', email: 'sofia.li@universidad.edu', privacidad: 'publico' }
  ];

  const creados = [];
  for (const n of nuevos) {
    let u = await User.findOne({ email: n.email });
    if (!u) {
      u = await User.create({
        nombre: n.nombre,
        email: n.email,
        password: await bcrypt.hash('estudiante123', 10),
        role: 'student',
        carrera: career._id,
        planEstudio: plan._id,
        configuracionPrivacidad: { perfil: n.privacidad }
      });
    }
    creados.push(u);
  }

  // A la primera estudiante le cargamos algunas materias de 1er anio aprobadas,
  // asi su situacion academica / asistente no arrancan vacios.
  const [ana] = creados;
  if (ana && (await Grade.countDocuments({ estudiante: ana._id })) === 0) {
    const aprobadas = [
      { codigo: 'CHN-FON', nota: 8 },
      { codigo: 'CHN-CAR', nota: 9 },
      { codigo: 'CHN-PED', nota: 7 }
    ];
    for (const a of aprobadas) {
      await Grade.create({
        estudiante: ana._id,
        materia: subjectsMap[a.codigo]._id,
        estado: 'Aprobada',
        nota: a.nota,
        fecha: new Date('2026-07-01')
      });
    }
  }

  logger.info(`Estudiantes del Profesorado de Chino sembrados (${creados.length}).`);
  return creados;
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
    // Materias UNAHUR aprobadas para que el 1er año figure como Completo
    { codigo: 'UNA-AMB', estado: 'Aprobada', nota: 10, anioCursada: 2024, cuatrimestre: 0 },
    { codigo: 'UNA-CTS', estado: 'Aprobada', nota: 10, anioCursada: 2024, cuatrimestre: 0 },
    { codigo: 'UNA-DDHH', estado: 'Aprobada', nota: 10, anioCursada: 2024, cuatrimestre: 0 },
    { codigo: 'UNA-COM', estado: 'Aprobada', nota: 10, anioCursada: 2024, cuatrimestre: 0 },
    // 2do anio en marcha
    // BD2 aprobada: deja a PROG3 bloqueada UNICAMENTE por PROG2 (en curso), ideal para
    // la demo de "que pasa si" (regularizo PROG2 -> se habilita PROG3).
    { codigo: 'BD2', estado: 'Aprobada', nota: 8, anioCursada: 2025, cuatrimestre: 1 },
    { codigo: 'IS1', estado: 'Regular', anioCursada: 2025, cuatrimestre: 1 },
    // En curso ahora: su correlativa (PROG3) NO debe habilitarse en el primer cuatri del plan
    { codigo: 'PROG2', estado: 'Cursando', anioCursada: 2025, cuatrimestre: 1 },
    // Regularizada "hace 2 anios menos ~25 dias": vencimiento cae dentro de la ventana de
    // aviso de 1 mes, para poder mostrar en vivo la notificacion de vencimiento de regularidad.
    {
      codigo: 'SO',
      estado: 'Regular',
      nota: 6,
      anioCursada: 2024,
      cuatrimestre: 1,
      fecha: new Date('2024-07-30T12:00:00')
    }
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
      fecha: n.fecha || Date.now()
    });
  }
  logger.info('Situacion academica de demo cargada para el estudiante por defecto.');
}

// Plan de estudio guardado de demo para que el estudiante por defecto ya tenga uno
// al levantar la app, permitiendo probar la comparación de rendimiento.
async function seedDemoSavedPlan(student, subjectsMap) {
  const yaTiene = await SavedStudyPlan.countDocuments({ estudiante: student._id });
  if (yaTiene > 0) return;

  const id = (cod) => subjectsMap[cod]._id;
  const materia = (cod, correlativas = []) => ({
    materia: id(cod),
    nombre: subjectsMap[cod].nombre,
    codigo: cod,
    creditos: subjectsMap[cod].creditos,
    horasSemanalesEstimadas: subjectsMap[cod].horasSemanales,
    correlativas: correlativas.map(id)
  });

  const periodos = [
    { anio: 2024, cuatrimestre: 1, horasUsadas: 19, materias: [
      materia('IP'), materia('MAT'), materia('OC'), materia('ING1')
    ]},
    { anio: 2024, cuatrimestre: 2, horasUsadas: 17, materias: [
      materia('PROG1', ['IP']), materia('ED', ['IP']), materia('BD1', ['IP']), materia('ING2', ['ING1'])
    ]},
    { anio: 2025, cuatrimestre: 1, horasUsadas: 18, materias: [
      materia('PROG2', ['PROG1', 'ED']), materia('BD2', ['BD1']), materia('SO', ['OC']), materia('IS1', ['PROG1', 'BD1'])
    ]},
    { anio: 2025, cuatrimestre: 2, horasUsadas: 14, materias: [
      materia('PROG3', ['PROG2', 'BD2']), materia('RED', ['SO']), materia('IS2', ['IS1', 'PROG2'])
    ]},
    { anio: 2026, cuatrimestre: 1, horasUsadas: 12, materias: [
      materia('DAW', ['PROG3']), materia('SEG', ['RED']), materia('GP', ['IS2'])
    ]},
    { anio: 2026, cuatrimestre: 2, horasUsadas: 12, materias: [
      materia('PP', ['PROG3', 'IS2', 'BD2']), materia('OPTCD', ['BD2'])
    ]}
  ];

  await SavedStudyPlan.create({
    estudiante: student._id,
    nombre: 'Mi plan de cursada',
    horasPorSemana: 24,
    periodos,
    periodosOriginales: periodos.map(p => ({ ...p, materias: [...p.materias] }))
  });
  logger.info('Plan guardado de demo creado para Estudiante de Prueba.');
}

// Materiales de demo con archivos reales de ejemplo (uno por tipo permitido).
// Los binarios viven versionados en seed-assets/materiales y se copian a
// uploads/materials (servido estaticamente) para que el link de descarga funcione.
async function seedMateriales(subjectsMap, autores) {
  const assetsDir = path.join(__dirname, 'seed-assets', 'materiales');
  const uploadsDir = path.join(__dirname, '../../uploads/materials');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const materiales = [
    { asset: 'ejemplo.pdf', titulo: 'Archivo PDF', autor: autores.student, tag: 'Der', mimetype: 'application/pdf' },
    { asset: 'ejemplo.docx', titulo: 'Archivo Word', autor: autores.matias, tag: 'Diagrama', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { asset: 'ejemplo.pptx', titulo: 'Archivo PPT', autor: autores.student2, tag: 'ClavePrimaria', mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
    { asset: 'ejemplo.xlsx', titulo: 'Archivo Excel', autor: autores.privado, tag: 'ClaveForanea', mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { asset: 'ejemplo.zip', titulo: 'Archivo ZIP', autor: autores.marcos, tag: 'Atributos', mimetype: 'application/zip' },
    { asset: 'ejemplo.jpg', titulo: 'Archivo JPG', autor: autores.student, tag: 'SQL', mimetype: 'image/jpeg' },
    { asset: 'ejemplo.png', titulo: 'Archivo PNG', autor: autores.matias, tag: 'Der', mimetype: 'image/png' }
  ];

  const materiaId = subjectsMap['BD1']._id;

  const creados = [];
  for (const m of materiales) {
    const destName = `seed-${m.asset}`;
    const destPath = path.join(uploadsDir, destName);
    const srcPath = path.join(assetsDir, m.asset);
    if (!fs.existsSync(destPath) && fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
    const size = fs.existsSync(destPath) ? fs.statSync(destPath).size : 0;

    const material = await Material.findOneAndUpdate(
      { titulo: m.titulo, autor: m.autor._id },
      {
        titulo: m.titulo,
        materia: materiaId,
        autor: m.autor._id,
        tipo: 'archivo',
        categoria: 'archivo',
        url: `/uploads/materials/${destName}`,
        nombreOriginal: m.asset,
        mimetype: m.mimetype,
        size,
        tags: [m.tag]
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    creados.push(material);
  }
  logger.info('Materiales de demo sembrados (archivos de ejemplo).');
  return creados;
}

// Materiales de demo tipo link: recursos externos (YouTube, Discord, GitHub, web).
async function seedMaterialesLinks(subjectsMap, autores) {
  const materiaId = subjectsMap['BD1']._id;

  const links = [
    {
      titulo: 'Link de youtube',
      url: 'https://www.youtube.com/watch?v=l5PDQtUVye8',
      categoria: 'youtube',
      autor: autores.student2,
      tag: 'SQL'
    },
    {
      titulo: 'Link de discord',
      url: 'https://discord.gg/akjYqKywJ',
      categoria: 'discord',
      autor: autores.student,
      tag: 'Der',
      discordMetadata: {
        serverName: 'Comunidad Bases de Datos',
        channelName: 'general',
        channelDescription: 'Canal de consultas sobre Bases de Datos',
        memberCount: null,
        inviteCode: 'akjYqKywJ'
      }
    },
    {
      titulo: 'link de github',
      url: 'https://github.com/',
      categoria: 'github',
      autor: autores.marcos,
      tag: 'Diagrama'
    },
    {
      titulo: 'link de la web',
      url: 'https://www.usfhealthonline.com/resources/health-informatics/what-is-database-theory/',
      categoria: 'web',
      autor: autores.student,
      tag: 'Atributos'
    }
  ];

  const creados = [];
  for (const l of links) {
    const material = await Material.findOneAndUpdate(
      { titulo: l.titulo, autor: l.autor._id },
      {
        titulo: l.titulo,
        descripcion: 'Este es un link educativo',
        materia: materiaId,
        autor: l.autor._id,
        tipo: 'link',
        categoria: l.categoria,
        url: l.url,
        tags: [l.tag],
        ...(l.discordMetadata ? { discordMetadata: l.discordMetadata } : {})
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    creados.push(material);
  }
  logger.info('Materiales de demo (links externos) sembrados.');
  return creados;
}

// Valoraciones y denuncias de demo sobre los materiales sembrados.
// - Cada material recibe el voto (pulgar arriba/abajo) de todos los estudiantes
//   menos su autor.
// - 6 materiales acumulan denuncias cubriendo los 6 motivos: uno queda con 3
//   denuncias pendientes (se suspende por umbral), otro con 2, y cuatro con 1.
async function seedValoracionesYDenuncias(materiales, usuarios, reasons) {
  const { student, student2, matias, privado, marcos } = usuarios;
  const todos = [student, student2, matias, privado, marcos];

  const porTitulo = {};
  for (const m of materiales) porTitulo[m.titulo] = m;

  // 1) Valoraciones: votan todos los estudiantes excepto el autor (mezcla 👍/👎).
  for (const mat of materiales) {
    const elegibles = todos.filter(u => u._id.toString() !== mat.autor.toString());
    elegibles.forEach((u, i) => {
      const yaVoto = mat.valoraciones.some(v => v.usuario.toString() === u._id.toString());
      if (!yaVoto) {
        mat.valoraciones.push({ usuario: u._id, voto: i % 2 === 0 ? 1 : -1 });
      }
    });
    await mat.save();
  }

  // 2) Denuncias: motivos indexados por su campo `orden` (1..6).
  const motivoPorOrden = {};
  for (const r of reasons) motivoPorOrden[r.orden] = r;

  const denuncias = [
    // Archivo PDF -> 3 denuncias (queda suspendido por superar el umbral)
    { titulo: 'Archivo PDF', denunciante: matias, orden: 1 },
    { titulo: 'Archivo PDF', denunciante: student2, orden: 4 },
    { titulo: 'Archivo PDF', denunciante: marcos, orden: 5 },
    // Archivo Word -> 2 denuncias
    { titulo: 'Archivo Word', denunciante: student, orden: 2 },
    { titulo: 'Archivo Word', denunciante: student2, orden: 3 },
    // Cuatro materiales con 1 denuncia cada uno
    { titulo: 'Archivo PPT', denunciante: marcos, orden: 6 },
    { titulo: 'Archivo Excel', denunciante: student, orden: 1 },
    { titulo: 'Archivo ZIP', denunciante: student, orden: 2 },
    { titulo: 'Archivo JPG', denunciante: privado, orden: 3 }
  ];

  for (const d of denuncias) {
    const mat = porTitulo[d.titulo];
    const motivo = motivoPorOrden[d.orden];
    if (!mat || !motivo) continue;

    const yaDenunciado = await MaterialReport.findOne({
      material: mat._id,
      denunciante: d.denunciante._id
    });
    if (yaDenunciado) continue;

    await MaterialReport.create({
      material: mat._id,
      denunciante: d.denunciante._id,
      motivo: motivo._id,
      detalle: `Denuncia de demo por: ${motivo.titulo}`,
      ...(motivo.titulo === 'Otro'
        ? { motivoEspecifico: 'El contenido no corresponde a la materia' }
        : {}),
      estado: 'pendiente'
    });
  }
  logger.info('Valoraciones y denuncias de demo sembradas.');
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

    // Carrera adicional con estudiantes propios (Profesorado de Chino), asi el
    // seed no queda con alumnos de una sola carrera.
    const careerChino = careers.find(c => c.codigo === 'PUCH');
    const subjectsChino = await seedSubjectsChino(careerChino._id);
    const planChino = await seedStudyPlanChino(careerChino, subjectsChino);
    await seedEstudiantesChino(careerChino, planChino, subjectsChino);

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

    const matiasEmail = 'matiaslopez1345@gmail.com';
    let matias = await User.findOne({ email: matiasEmail });
    if (!matias) {
      matias = await User.create({
        nombre: 'Matias Lopez',
        email: matiasEmail,
        password: await bcrypt.hash('estudiante123', 10),
        role: 'student',
        carrera: careerTup._id,
        planEstudio: plan._id,
        configuracionPrivacidad: { perfil: 'publico' }
      });
      logger.info('Usuario Matias Lopez creado.');
    }

    const privadoEmail = 'estudianteprivado@universidad.edu';
    let privado = await User.findOne({ email: privadoEmail });
    if (!privado) {
      privado = await User.create({
        nombre: 'Estudiante Privado',
        email: privadoEmail,
        password: await bcrypt.hash('estudiante123', 10),
        role: 'student',
        carrera: careerTup._id,
        planEstudio: plan._id,
        configuracionPrivacidad: { perfil: 'privado' }
      });
      logger.info('Usuario Estudiante Privado creado.');
    }

    const marcosEmail = 'marcos.bejarano01@hotmail.com';
    let marcos = await User.findOne({ email: marcosEmail });
    if (!marcos) {
      marcos = await User.create({
        nombre: 'Marcos Bejarano',
        email: marcosEmail,
        password: await bcrypt.hash('estudiante123', 10),
        role: 'student',
        carrera: careerTup._id,
        planEstudio: plan._id,
        configuracionPrivacidad: { perfil: 'publico' }
      });
      logger.info('Usuario Marcos Bejarano creado.');
    }

    // Establecer contacto mutuo para la demo
    const yaSonContactos = matias.contactos.includes(privado._id);
    if (!yaSonContactos) {
      matias.contactos.push(privado._id);
      privado.contactos.push(matias._id);
      await Promise.all([matias.save(), privado.save()]);
      logger.info('Contacto mutuo establecido entre Matias y Estudiante Privado.');
    }

    await seedDemoGrades(student, subjectsMap);

    await seedDemoSavedPlan(student, subjectsMap);

    // Crear sesion de estudio para Estudiante de Prueba
    const yaTieneSesion = await StudySession.findOne({ creador: student._id, tema: 'Repaso para el parcial' });
    if (!yaTieneSesion) {
      await StudySession.create({
        creador: student._id,
        materia: subjectsMap['IP']._id,
        tema: 'Repaso para el parcial',
        tipo: 'presencial',
        ubicacion: 'Aula 305',
        fechaHora: new Date('2026-06-10T13:00:00'),
        duracion: { horas: 1, minutos: 30 },
        cupos: null, // sin limite
        descripcion: 'Repaso para el primer parcial con ayudantes',
        requiereAprobacion: false,
        participantes: [student._id],
        estado: 'finalizada'
      });
      logger.info('Sesion de estudio finalizada de demo creada para Estudiante de Prueba.');
    }

    // Crear sesion de estudio para Matias Lopez
    const yaTieneSesionMatias = await StudySession.findOne({ creador: matias._id, tema: 'Resolucion del TP 3' });
    if (!yaTieneSesionMatias) {
      await StudySession.create({
        creador: matias._id,
        materia: subjectsMap['BD1']._id,
        tema: 'Resolucion del TP 3',
        tipo: 'virtual',
        link: 'https://meet.google.com/jpy-mfyd-xdp',
        fechaHora: new Date('2026-07-24T19:00:00'),
        duracion: { horas: 2, minutos: 0 },
        cupos: 2,
        descripcion: 'Guia para resolver correctamente el Trabajo Practico 3',
        requiereAprobacion: true,
        participantes: [matias._id],
        estado: 'activa'
      });
      logger.info('Sesion de estudio de demo creada para Matias Lopez.');
    }

    // Crear sesion de estudio para Estudiante Privado
    const yaTieneSesionPrivado = await StudySession.findOne({ creador: privado._id, tema: 'Sesion privada' });
    if (!yaTieneSesionPrivado) {
      await StudySession.create({
        creador: privado._id,
        materia: subjectsMap['MAT']._id,
        tema: 'Sesion privada',
        tipo: 'presencial',
        ubicacion: 'Cafeteria',
        fechaHora: new Date('2026-07-25T16:00:00'),
        duracion: { horas: 0, minutos: 40 },
        cupos: 5,
        descripcion: 'Reunion informativa del grupo 4',
        requiereAprobacion: true,
        participantes: [privado._id],
        estado: 'activa'
      });
      logger.info('Sesion de estudio de demo creada para Estudiante Privado.');
    }

    // Crear sesion de estudio LLENA (cupo completo) para Estudiante de Prueba
    const yaTieneSesionLlena = await StudySession.findOne({ creador: student._id, tema: 'Calculos en binario' });
    if (!yaTieneSesionLlena) {
      await StudySession.create({
        creador: student._id,
        materia: subjectsMap['OC']._id,
        tema: 'Calculos en binario',
        tipo: 'presencial',
        ubicacion: 'Aula 110 - Malvinas Argentinas',
        fechaHora: new Date('2026-07-25T18:00:00'),
        duracion: { horas: 1, minutos: 0 },
        cupos: 3,
        requiereAprobacion: false,
        participantes: [student._id, student2._id, matias._id],
        estado: 'activa'
      });
      logger.info('Sesion de estudio LLENA de demo creada para Estudiante de Prueba.');
    }

    const matArchivos = await seedMateriales(subjectsMap, { student, student2, matias, privado, marcos });
    const matLinks = await seedMaterialesLinks(subjectsMap, { student, student2, matias, privado, marcos });
    const reasons = await seedReportReasons();
    await seedValoracionesYDenuncias(
      [...matArchivos, ...matLinks],
      { student, student2, matias, privado, marcos },
      reasons
    );

    await seedAcademicOffer(subjectsMap);
    await seedSystemConfig();
    logger.info('Sembrado de datos completado exitosamente.');

  } catch (error) {
    logger.error('Error durante el seeding:', error.message);
  }
}

module.exports = { seedUsers, resetDatabase };
