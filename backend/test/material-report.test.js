const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');

let mongo;
let studentToken;
let denuncianteToken;
let adminToken;
let materialId;
let reasonId;

async function createBootstrapAdmin() {
  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    nombre: 'Admin Denuncias',
    email: 'admin-den@test.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-den@test.com', password: 'admin123' });
  return res.body.token;
}

test.before(async () => {
  process.env.JWT_SECRET = 'test-secret-reports';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  adminToken = await createBootstrapAdmin();

  // Crear carrera y materia
  const career = await request(app)
    .post('/api/carreras')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: 'Sistemas',
      codigo: 'SIS',
      descripcion: 'Carrera de prueba',
      titulo: 'Lic.',
      instituto: 'Infor',
      duracionAnios: 5,
      cantidadMaterias: 10,
      creditosNecesarios: 100,
      nivelInglesRequerido: 'A1'
    });
  
  const careerId = career.body.career._id;

  const subject = await request(app)
    .post('/api/materias')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: 'Programacion 1',
      codigo: 'PROG1',
      carrera: careerId
    });
  const subjectId = subject.body.subject._id;

  // Registrar estudiante
  await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Estudiante', email: 'est@test.com', password: 'pass1234', carrera: careerId });
  
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'est@test.com', password: 'pass1234' });
  studentToken = login.body.token;

  // Registrar un segundo estudiante que será quien denuncie (el autor no puede denunciar su propio material)
  await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Denunciante', email: 'denunciante@test.com', password: 'pass1234', carrera: careerId });

  const loginDenunciante = await request(app)
    .post('/api/auth/login')
    .send({ email: 'denunciante@test.com', password: 'pass1234' });
  denuncianteToken = loginDenunciante.body.token;

  // Crear material
  const mat = await request(app)
    .post('/api/materiales')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      titulo: 'Apunte Progra 1',
      materia: subjectId,
      tipo: 'link',
      url: 'https://test.com',
      categoria: 'web'
    });
  materialId = mat.body.material._id;

  // Crear motivos de denuncia (admin)
  const r1 = await request(app)
    .post('/api/denuncias/reasons')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ titulo: 'Spam', descripcion: 'Publicidad no deseada' });
  
  const r2 = await request(app)
    .post('/api/denuncias/reasons')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ titulo: 'Otro', descripcion: 'Otros motivos' });

  reasonId = r1.body._id;
  reasonOtroId = r2.body._id;
});

test.after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('sistema de denuncias: crear denuncia y validar motivos', async () => {
  // 1. Obtener motivos
  const resReasons = await request(app)
    .get('/api/denuncias/reasons')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  
  assert.ok(resReasons.body.length >= 2);

  // 2. Crear denuncia válida
  const resReport = await request(app)
    .post('/api/denuncias')
    .set('Authorization', `Bearer ${denuncianteToken}`)
    .send({
      materialId: materialId,
      reasonId: reasonId,
      detalle: 'Esto es spam'
    })
    .expect(201);

  assert.equal(resReport.body.report.estado, 'pendiente');

  // 3. Crear denuncia con "Otro" sin especificar (debe fallar)
  await request(app)
    .post('/api/denuncias')
    .set('Authorization', `Bearer ${denuncianteToken}`)
    .send({
      materialId: materialId,
      reasonId: reasonOtroId,
      detalle: 'No especifico'
    })
    .expect(400);

  // 4. Crear denuncia con "Otro" especificado
  await request(app)
    .post('/api/denuncias')
    .set('Authorization', `Bearer ${denuncianteToken}`)
    .send({
      materialId: materialId,
      reasonId: reasonOtroId,
      motivoEspecifico: 'Mi motivo propio',
      detalle: 'Detalle personalizado'
    })
    .expect(201);
});

test('sistema de denuncias: gestión por parte del admin', async () => {
  // 1. Admin lista denuncias
  const resList = await request(app)
    .get('/api/denuncias')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  
  assert.ok(resList.body.length >= 2);
  const reportId = resList.body[0]._id;

  // 2. Admin actualiza estado
  const resUpdate = await request(app)
    .patch(`/api/denuncias/${reportId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ estado: 'revisado', resolucion: 'Se ha eliminado el contenido' })
    .expect(200);
  
  assert.equal(resUpdate.body.report.estado, 'revisado');
  assert.equal(resUpdate.body.report.resolucion, 'Se ha eliminado el contenido');
});
