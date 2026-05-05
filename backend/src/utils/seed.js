const User = require('../models/User');
const Career = require('../models/Career');
const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');
const Grade = require('../models/Grade');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

async function seedAcademicSituation(studentId, subjectIds) {
  const situationExists = await Grade.findOne({ estudiante: studentId });
  if (!situationExists && subjectIds.length >= 2) {
    await new Grade({
      estudiante: studentId,
      materia: subjectIds[0],
      estado: 'Aprobada',
      nota: 9
    }).save();

    await new Grade({
      estudiante: studentId,
      materia: subjectIds[1],
      estado: 'Regular',
    }).save();

    logger.info('Situación académica inicial creada para el estudiante de prueba.');
  }
}

async function seedSubjects() {
  const subjects = [
    { nombre: 'Algoritmos y Estructuras de Datos', codigo: 'AED', anio: 1, cuatrimestre: 1, creditos: 6 },
    { nombre: 'Análisis Matemático I', codigo: 'AM1', anio: 1, cuatrimestre: 1, creditos: 8 },
    { nombre: 'Sistemas Operativos', codigo: 'SO', anio: 2, cuatrimestre: 2, creditos: 6 },
    { nombre: 'Bases de Datos I', codigo: 'BD1', anio: 3, cuatrimestre: 1, creditos: 6 },
  ];

  const createdSubjects = [];
  for (const s of subjects) {
    let subject = await Subject.findOne({ codigo: s.codigo });
    if (!subject) {
      subject = await new Subject(s).save();
      logger.info(`Materia ${s.nombre} creada.`);
    }
    createdSubjects.push(subject._id);
  }
  return createdSubjects;
}

async function seedStudyPlans(careerId, subjectIds) {
  const planExists = await StudyPlan.findOne({ carrera: careerId });
  if (!planExists) {
    await new StudyPlan({
      nombre: 'Plan 2023',
      anio: 2023,
      carrera: careerId,
      materias: subjectIds
    }).save();
    logger.info('Plan de estudio por defecto creado.');
  }
}

async function seedCareers() {
  const careers = [
    { nombre: 'Ingeniería en Sistemas', codigo: 'INGSIST', cantidadMaterias: 47 },
    { nombre: 'Licenciatura en Informática', codigo: 'LICINF', cantidadMaterias: 42 },
  ];

  const createdCareers = [];
  for (const c of careers) {
    let career = await Career.findOne({ codigo: c.codigo });
    if (!career) {
      career = await new Career(c).save();
      logger.info(`Carrera ${c.nombre} creada.`);
    }
    createdCareers.push(career);
  }
  return createdCareers;
}

async function seedUsers() {
  try {
    // Seed Careers and Subjects first
    const careers = await seedCareers();
    const subjectIds = await seedSubjects();
    
    if (careers.length > 0) {
      await seedStudyPlans(careers[0]._id, subjectIds);
    }

    // 1. Seed Admin
    const adminEmail = 'admin@universidad.edu';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        nombre: 'Administrador Sistema',
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin'
      });
      await admin.save();
      logger.info('Usuario administrador por defecto creado con éxito.');
    } else {
      logger.debug('El usuario administrador por defecto ya existe.');
    }

    // 2. Seed Student
    const studentEmail = 'estudiante@universidad.edu';
    let student = await User.findOne({ email: studentEmail });

    if (!student) {
      const hashedStudentPassword = await bcrypt.hash('estudiante123', 10);
      student = new User({
        nombre: 'Estudiante de Prueba',
        email: studentEmail,
        password: hashedStudentPassword,
        role: 'student'
      });
      await student.save();
      logger.info('Usuario estudiante por defecto creado con éxito.');
    } else {
      logger.debug('El usuario estudiante por defecto ya existe.');
    }

    // Seed Academic Situation for this student
    if (student && subjectIds.length > 0) {
      await seedAcademicSituation(student._id, subjectIds);
    }

  } catch (error) {
    logger.error('Error durante el seeding:', error.message);
  }
}

module.exports = { seedUsers };
