const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const Grade = require('../src/models/Grade');
const Notification = require('../src/models/Notification');
const User = require('../src/models/User');
const { checkAndNotifyExpiringRegularities, checkAndExpireRegularities } = require('../src/services/regularityExpiration.service');

let mongo;
let adminToken;
let studentToken;
let studentId;
let careerId;
let materiaId;

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const login = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200);
  return res.body.token;
};

// Regulariza la materia via API (deja fecha = ahora) y despues pisa la fecha
// directo en Mongo para simular que la regularizacion ocurrio hace tiempo.
const regularizarConFecha = async (fechaRegularizacion) => {
  await request(app)
    .post('/api/academico/situacion')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ materiaId, estado: 'Regular', cuatrimestre: 1, anioCursada: 2024 })
    .expect(200);

  await Grade.findOneAndUpdate(
    { estudiante: studentId, materia: materiaId },
    { fecha: fechaRegularizacion }
  );
};

const getNotificaciones = () =>
  request(app)
    .get('/api/notificaciones')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);

test.before(async () => {
  process.env.JWT_SECRET = 'test-secret-regularity';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const bcrypt = require('bcryptjs');
  await User.create({
    nombre: 'Admin Regularity',
    email: 'admin@regularity.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  adminToken = await login('admin@regularity.com', 'admin123');

  const career = await request(app)
    .post('/api/carreras')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Carrera Regularity', codigo: 'CR', titulo: 'Tecnico', instituto: 'Instituto', duracionAnios: 2 });
  assert.equal(career.status, 201);
  careerId = career.body.career._id;

  const materia = await request(app)
    .post('/api/materias')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Materia Regularity', codigo: 'MR', carrera: careerId });
  assert.equal(materia.status, 201);
  materiaId = materia.body.subject._id;

  await request(app).post('/api/auth/register').send({
    nombre: 'Estudiante Regularity',
    email: 'regularity@student.com',
    password: 'student123',
    carrera: careerId
  }).expect(201);
  studentToken = await login('regularity@student.com', 'student123');

  const usuarios = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  const student = usuarios.body.find((u) => u.email === 'regularity@student.com');
  studentId = student.id || student._id;
});

test.after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test.beforeEach(async () => {
  await Grade.deleteMany({ estudiante: studentId });
  await Notification.deleteMany({ usuario: studentId });
});

test('notifica cuando falta un mes o menos para el vencimiento de la regularidad', async () => {
  // Se regularizo hace (2 años - 20 dias): vencimiento dentro de 20 dias, entra en la ventana de 1 mes.
  await regularizarConFecha(new Date(Date.now() - (2 * YEAR_MS - 20 * 24 * 60 * 60 * 1000)));

  await checkAndNotifyExpiringRegularities();

  const notis = await getNotificaciones();
  assert.ok(notis.body.some((n) => n.titulo === 'Tu regularidad está por vencer'));

  const grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.notificacionVencimientoEnviada, true);
});

test('no notifica si todavia falta mas de un mes para el vencimiento', async () => {
  // Se regularizo hace (2 años - 100 dias): vencimiento dentro de 100 dias, fuera de la ventana.
  await regularizarConFecha(new Date(Date.now() - (2 * YEAR_MS - 100 * 24 * 60 * 60 * 1000)));

  await checkAndNotifyExpiringRegularities();

  const notis = await getNotificaciones();
  assert.ok(!notis.body.some((n) => n.titulo === 'Tu regularidad está por vencer'));

  const grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.notificacionVencimientoEnviada, false);
});

test('notifica en modo catch-up si la regularidad ya vencio y no se habia avisado', async () => {
  // Se regularizo hace mas de 2 años: ya vencio, pero como el flag sigue en false se avisa igual.
  await regularizarConFecha(new Date(Date.now() - (2 * YEAR_MS + 10 * 24 * 60 * 60 * 1000)));

  await checkAndNotifyExpiringRegularities();

  const notis = await getNotificaciones();
  assert.ok(notis.body.some((n) => n.titulo === 'Tu regularidad está por vencer'));
});

test('no duplica la notificacion si ya fue enviada', async () => {
  await regularizarConFecha(new Date(Date.now() - (2 * YEAR_MS - 20 * 24 * 60 * 60 * 1000)));

  await checkAndNotifyExpiringRegularities();
  const primeraCorrida = await getNotificaciones();
  const cantidadInicial = primeraCorrida.body.filter((n) => n.titulo === 'Tu regularidad está por vencer').length;
  assert.equal(cantidadInicial, 1);

  await checkAndNotifyExpiringRegularities();
  const segundaCorrida = await getNotificaciones();
  const cantidadFinal = segundaCorrida.body.filter((n) => n.titulo === 'Tu regularidad está por vencer').length;
  assert.equal(cantidadFinal, 1);
});

test('resetea el flag y puede volver a notificar si el estudiante se re-regulariza', async () => {
  await regularizarConFecha(new Date(Date.now() - (2 * YEAR_MS - 20 * 24 * 60 * 60 * 1000)));
  await checkAndNotifyExpiringRegularities();

  let grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.notificacionVencimientoEnviada, true);

  // El estudiante recursa y se regulariza de nuevo (por ejemplo, tras rendir Libre y volver a cursar).
  await regularizarConFecha(new Date(Date.now() - (2 * YEAR_MS - 20 * 24 * 60 * 60 * 1000)));

  grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.notificacionVencimientoEnviada, false);
});

test('pierde la regularidad (pasa a Desaprobado) cuando el plazo de 2 años ya vencio', async () => {
  await regularizarConFecha(new Date(Date.now() - (2 * YEAR_MS + 10 * 24 * 60 * 60 * 1000)));

  await checkAndExpireRegularities();

  const grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.estado, 'Desaprobado');

  const notis = await getNotificaciones();
  assert.ok(notis.body.some((n) => n.titulo === 'Perdiste la regularidad'));
});

test('pierde la regularidad por vencimiento aunque ya se hubiera enviado el aviso previo', async () => {
  await regularizarConFecha(new Date(Date.now() - (2 * YEAR_MS + 10 * 24 * 60 * 60 * 1000)));
  await checkAndNotifyExpiringRegularities();

  let grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.notificacionVencimientoEnviada, true, 'precondicion: ya se aviso');

  await checkAndExpireRegularities();

  grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.estado, 'Desaprobado');
});

test('no pierde la regularidad si todavia no vencio el plazo de 2 años', async () => {
  await regularizarConFecha(new Date(Date.now() - (2 * YEAR_MS - 20 * 24 * 60 * 60 * 1000)));

  await checkAndExpireRegularities();

  const grade = await Grade.findOne({ estudiante: studentId, materia: materiaId });
  assert.equal(grade.estado, 'Regular');
});
