const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');

let mongo;
let studentToken;
let denuncianteToken;
let denunciante2Token;
let adminToken;
let materialId;
let reasonId;
let careerId;

async function createBootstrapAdmin() {
  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    nombre: 'Admin Config',
    email: 'admin-config@test.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-config@test.com', password: 'admin123' });
  return res.body.token;
}

test.before(async () => {
  process.env.JWT_SECRET = 'test-secret-suspension';
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
  
  careerId = career.body.career._id;

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

  // Un tercer estudiante: cada usuario solo puede denunciar una vez el mismo material.
  await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Denunciante 2', email: 'denunciante2@test.com', password: 'pass1234', carrera: careerId });

  const loginDenunciante2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'denunciante2@test.com', password: 'pass1234' });
  denunciante2Token = loginDenunciante2.body.token;

  // Crear material
  const mat = await request(app)
    .post('/api/materiales')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      titulo: 'Apunte Suspension',
      materia: subjectId,
      tipo: 'link',
      url: 'https://sensitive-content.com',
      categoria: 'web'
    });
  materialId = mat.body.material._id;

  // Crear motivo de denuncia
  const r1 = await request(app)
    .post('/api/denuncias/reasons')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ titulo: 'Contenido inapropiado', descripcion: '...' });
  
  reasonId = r1.body._id;
});

test.after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('suspensión de material: umbrales y visibilidad', async () => {
  // 1. Verificar que inicialmente no está suspendido
  const res1 = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  
  const mat1 = res1.body.find(m => m._id === materialId);
  assert.equal(mat1.suspendido, false);
  assert.equal(mat1.url, 'https://sensitive-content.com');

  // 2. Configurar umbrales bajos para testear (N=2, M=1)
  await request(app)
    .patch('/api/denuncias/config')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nPending: 2, mVerified: 1 })
    .expect(200);

  // 3. Crear 2 denuncias pendientes de 2 estudiantes distintos (una por usuario).
  for (const token of [denuncianteToken, denunciante2Token]) {
    await request(app)
      .post('/api/denuncias')
      .set('Authorization', `Bearer ${token}`)
      .send({ materialId, reasonId, detalle: 'Denuncia' })
      .expect(201);
  }

  const res2 = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  
  const mat2 = res2.body.find(m => m._id === materialId);
  assert.equal(mat2.suspendido, true, 'Debería estar suspendido al alcanzar N=2 denuncias');
  assert.equal(mat2.url, null, 'La URL debe ser null al alcanzar el umbral');

  // Otro estudiante no debe ver el material suspendido
  await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Otro', email: 'otro@test.com', password: 'pass1234', carrera: careerId });
  const loginOtro = await request(app)
    .post('/api/auth/login')
    .send({ email: 'otro@test.com', password: 'pass1234' });
  const otroToken = loginOtro.body.token;

  const resOtro = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${otroToken}`)
    .expect(200);
  assert.equal(resOtro.body.find(m => m._id === materialId), undefined, 'Otro estudiante no ve material suspendido');

  // 4. Verificar que el Admin SÍ puede ver la URL
  const resAdmin = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  
  const matAdmin = resAdmin.body.find(m => m._id === materialId);
  assert.equal(matAdmin.suspendido, true);
  assert.equal(matAdmin.url, 'https://sensitive-content.com', 'El admin debe ver la URL');

  // 5. Testear umbral de verificadas (M=1)
  // Ignoramos las anteriores (las pasamos a revisado)
  const allReports = await request(app)
    .get('/api/denuncias')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  
  // Pasamos 1 a revisado (alcanza M=1)
  await request(app)
    .patch(`/api/denuncias/${allReports.body[0]._id}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ estado: 'revisado' })
    .expect(200);

  // Ahora tiene 1 verificada y 1 pendiente. M=1, N=2.
  // Debería estar suspendido por verificada (1 >= 1)
  const res4 = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  
  const mat4 = res4.body.find(m => m._id === materialId);
  assert.equal(mat4.suspendido, true, 'Suspendido al alcanzar M=1 verificada');
  assert.equal(mat4.verifiedReports, 1);
});

test('el autor no puede denunciar su propio material', async () => {
  const res = await request(app)
    .post('/api/denuncias')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ materialId, reasonId, detalle: 'Intento de auto-denuncia' })
    .expect(400);

  assert.match(res.body.mensaje, /tu propio material/i);
});
