const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const Grade = require('../src/models/Grade');
const Notification = require('../src/models/Notification');
const User = require('../src/models/User');

let mongo;
let adminToken;
let studentToken;
let studentId;
let careerId;
let materiaId;

const login = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200);
  return res.body.token;
};

const regularizar = () =>
  request(app)
    .post('/api/academico/situacion')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ materiaId, estado: 'Regular', cuatrimestre: 1, anioCursada: 2024 })
    .expect(200);

// Inscribe y rinde un final con el resultado indicado ('Desaprobado' via nota baja, o ausente).
const rendirFinal = async ({ ausente = false } = {}) => {
  const inscripcion = await request(app)
    .post('/api/finales')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ materiaId })
    .expect(201);

  const finalId = inscripcion.body.final._id;

  return request(app)
    .put(`/api/finales/${finalId}/resultado`)
    .set('Authorization', `Bearer ${studentToken}`)
    .send(ausente ? { ausente: true } : { nota: 2 });
};

const getNotificaciones = () =>
  request(app)
    .get('/api/notificaciones')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);

test.before(async () => {
  process.env.JWT_SECRET = 'test-secret-final-intentos';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const bcrypt = require('bcryptjs');
  await User.create({
    nombre: 'Admin Intentos',
    email: 'admin@intentos.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  adminToken = await login('admin@intentos.com', 'admin123');

  const career = await request(app)
    .post('/api/carreras')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Carrera Intentos', codigo: 'CI', titulo: 'Tecnico', instituto: 'Instituto', duracionAnios: 2 });
  assert.equal(career.status, 201);
  careerId = career.body.career._id;

  const materia = await request(app)
    .post('/api/materias')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Materia Intentos', codigo: 'MI', carrera: careerId });
  assert.equal(materia.status, 201);
  materiaId = materia.body.subject._id;

  await request(app).post('/api/auth/register').send({
    nombre: 'Estudiante Intentos',
    email: 'intentos@student.com',
    password: 'student123',
    carrera: careerId
  }).expect(201);
  studentToken = await login('intentos@student.com', 'student123');

  const usuarios = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  const student = usuarios.body.find((u) => u.email === 'intentos@student.com');
  studentId = student.id || student._id;
});

test.after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test.beforeEach(async () => {
  await Grade.deleteMany({ estudiante: studentId });
  await Notification.deleteMany({ usuario: studentId });
  const Final = require('../src/models/Final');
  await Final.deleteMany({ estudiante: studentId });
});

test('pierde la regularidad al agotar los 10 intentos de final sin aprobar', async () => {
  await regularizar();

  for (let i = 0; i < 9; i++) {
    const res = await rendirFinal();
    assert.equal(res.status, 200);
  }

  let grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.estado, 'Regular', 'sigue regular antes del 10mo intento');

  const decimo = await rendirFinal();
  assert.equal(decimo.status, 200);

  grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.estado, 'Desaprobado', 'pierde la regularidad en el 10mo intento fallido');

  const notis = await getNotificaciones();
  assert.ok(notis.body.some((n) => n.titulo === 'Perdiste la regularidad'));
});

test('el ausente cuenta como intento y tambien puede agotar el limite', async () => {
  await regularizar();

  for (let i = 0; i < 9; i++) {
    await rendirFinal({ ausente: true });
  }

  const decimo = await rendirFinal({ ausente: true });
  assert.equal(decimo.status, 200);

  const grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.estado, 'Desaprobado');
});

test('no puede volver a inscribirse a un final despues de perder la regularidad', async () => {
  await regularizar();

  for (let i = 0; i < 10; i++) {
    await rendirFinal();
  }

  const grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.estado, 'Desaprobado');

  const res = await request(app)
    .post('/api/finales')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ materiaId });
  assert.equal(res.status, 400);
});

test('aprobar el final antes de agotar los intentos no pierde la regularidad', async () => {
  await regularizar();

  for (let i = 0; i < 5; i++) {
    await rendirFinal();
  }

  const inscripcion = await request(app)
    .post('/api/finales')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ materiaId })
    .expect(201);

  const res = await request(app)
    .put(`/api/finales/${inscripcion.body.final._id}/resultado`)
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ nota: 8 })
    .expect(200);
  assert.equal(res.body.final.estado, 'Aprobado');

  const grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.estado, 'Aprobada');
});

test('recursar y volver a regularizar resetea el conteo de intentos previos', async () => {
  await regularizar();

  for (let i = 0; i < 5; i++) {
    await rendirFinal();
  }
  let grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.estado, 'Regular', 'sigue regular con 5 intentos fallidos');

  // Recursa y se regulariza de nuevo (nueva fecha de regularizacion)
  await regularizar();

  const pendientes = await request(app)
    .get('/api/finales/pendientes')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  const pendiente = pendientes.body.find((p) => p.materia._id === materiaId);
  assert.equal(pendiente.intentosPrevios, 0, 'los intentos de la cursada anterior no deben arrastrarse');

  // Y puede agotar otros 9 intentos sin perder la regularidad todavia
  // (si los 5 viejos se sumaran, se hubiera perdido en el 5to de esta tanda)
  for (let i = 0; i < 9; i++) {
    await rendirFinal();
  }
  grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.estado, 'Regular', 'los intentos de la cursada anterior no deberian sumar para el limite');
});
