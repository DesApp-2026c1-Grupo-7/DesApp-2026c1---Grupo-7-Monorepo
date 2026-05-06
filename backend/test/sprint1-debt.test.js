const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const xlsx = require('xlsx');
const app = require('../src/app');

let mongo;
let adminToken;
let studentToken;
let careerId;
let planId;
let subjectIds = {};

const login = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200);
  return res.body.token;
};

test.before(async () => {
  process.env.JWT_SECRET = 'test-secret';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const career = await request(app)
    .post('/api/carreras')
    .set('Authorization', `Bearer ${await createBootstrapAdmin()}`)
    .send({
      nombre: 'Tecnicatura en Programacion',
      codigo: 'TUP',
      descripcion: 'Plan de prueba',
      titulo: 'Tecnico/a Universitario/a en Programacion',
      instituto: 'Instituto de Tecnologia',
      duracionAnios: 3,
      cantidadMaterias: 3,
      creditosNecesarios: 12,
      nivelInglesRequerido: 'B1'
    });
  assert.equal(career.status, 201);
  careerId = career.body.career._id;

  adminToken = await login('admin@test.com', 'admin123');

  for (const subject of [
    { nombre: 'Algoritmos', codigo: 'ALG', anio: 1, cuatrimestre: 1, creditos: 4, carrera: careerId },
    { nombre: 'Programacion I', codigo: 'PROG1', anio: 1, cuatrimestre: 2, creditos: 4, carrera: careerId },
    { nombre: 'Base de Datos', codigo: 'BD', anio: 2, cuatrimestre: 1, creditos: 4, carrera: careerId }
  ]) {
    const res = await request(app).post('/api/materias').set('Authorization', `Bearer ${adminToken}`).send(subject);
    assert.equal(res.status, 201);
    subjectIds[subject.codigo] = res.body.subject._id;
  }

  await request(app)
    .put(`/api/materias/${subjectIds.PROG1}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ correlativas: [subjectIds.ALG] })
    .expect(200);
  await request(app)
    .put(`/api/materias/${subjectIds.BD}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ correlativas: [subjectIds.PROG1] })
    .expect(200);

  const plan = await request(app)
    .post('/api/planes')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: 'Plan 2026',
      anio: 2026,
      carrera: careerId,
      materias: Object.values(subjectIds),
      creditosNecesarios: 12,
      creditosOptativasNecesarios: 0,
      nivelInglesRequerido: 'B1',
      estado: 'Vigente'
    });
  assert.equal(plan.status, 201);
  planId = plan.body.plan._id;

  await request(app).post('/api/auth/register').send({
    nombre: 'Estudiante Uno',
    email: 'student@test.com',
    password: 'student123',
    role: 'admin',
    carrera: careerId,
    planEstudio: planId
  }).expect(201);
  studentToken = await login('student@test.com', 'student123');
});

test.after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function createBootstrapAdmin() {
  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    nombre: 'Admin Test',
    email: 'admin@test.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  return login('admin@test.com', 'admin123');
}

test('registro publico siempre crea estudiantes y admin gestiona cuentas', async () => {
  const users = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  const student = users.body.find((u) => u.email === 'student@test.com');
  assert.equal(student.role, 'student');

  const newAdmin = await request(app)
    .post('/api/usuarios/admins')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Admin Dos', email: 'admin2@test.com', password: 'admin234' })
    .expect(201);
  assert.equal(newAdmin.body.user.role, 'admin');

  await request(app)
    .put(`/api/usuarios/${student.id || student._id}/suspender`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ motivo: 'Prueba' })
    .expect(200);

  await request(app).post('/api/auth/login').send({
    email: 'student@test.com',
    password: 'student123'
  }).expect(403);

  await request(app)
    .put(`/api/usuarios/${student.id || student._id}/reactivar`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  await request(app)
    .put(`/api/usuarios/${student.id || student._id}/hacer-admin`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
});

test('carrera y plan guardan los campos exactos de la consigna', async () => {
  const career = await request(app).get(`/api/carreras/${careerId}`).expect(200);
  assert.equal(career.body.titulo, 'Tecnico/a Universitario/a en Programacion');
  assert.equal(career.body.instituto, 'Instituto de Tecnologia');
  assert.equal(career.body.duracionAnios, 3);

  const plan = await request(app).get(`/api/planes/${planId}`).expect(200);
  assert.equal(plan.body.estado, 'Vigente');
});

test('excel tiene preview editable y confirmacion posterior', async () => {
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet([
    { codigo: 'ALG', estado: 'Aprobada', nota: 8, cuatrimestre: 1, anio: 2026 },
    { codigo: 'NOPE', estado: 'Aprobada', nota: 8, cuatrimestre: 1, anio: 2026 }
  ]);
  xlsx.utils.book_append_sheet(wb, ws, 'situacion');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const preview = await request(app)
    .post('/api/academico/situacion/preview-excel')
    .set('Authorization', `Bearer ${studentToken}`)
    .attach('file', buffer, 'situacion.xlsx')
    .expect(200);

  assert.equal(preview.body.preview.length, 2);
  assert.equal(preview.body.errores.length, 1);

  const validRows = preview.body.preview.filter((row) => row.errores.length === 0);
  await request(app)
    .post('/api/academico/situacion/confirm-excel')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ records: validRows })
    .expect(200);
});

test('oferta, que-pasa-si, planificador y creditos completan el asistente', async () => {
  await request(app)
    .post('/api/ofertas')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ anio: 2026, cuatrimestre: 2, materias: [subjectIds.PROG1] })
    .expect(201);

  const disponiblesOferta = await request(app)
    .get('/api/academico/disponibles?soloOferta=true&anio=2026&cuatrimestre=2')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  assert.equal(disponiblesOferta.body.length, 1);
  assert.equal(disponiblesOferta.body[0].codigo, 'PROG1');

  const simulacion = await request(app)
    .post('/api/academico/que-pasa-si')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ materias: [subjectIds.PROG1] })
    .expect(200);
  assert.ok(simulacion.body.desbloqueadas.some((m) => m.codigo === 'BD'));

  const actividad = await request(app)
    .post('/api/academico/actividades-creditos')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ nombre: 'Curso extension', creditos: 2 })
    .expect(201);
  assert.equal(actividad.body.actividad.creditos, 2);

  const avance = await request(app)
    .get('/api/academico/avance')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  assert.equal(avance.body.creditosActividades, 2);

  const planificador = await request(app)
    .get('/api/academico/planificador?horasPorSemana=4')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  assert.ok(planificador.body.periodos.length >= 1);

  const rendimiento = await request(app)
    .get('/api/academico/rendimiento-plan?anioInicio=2026&anio=2026')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  assert.equal(rendimiento.body.materiasEsperadasAprobadas, 2);

  const saved = await request(app)
    .post('/api/academico/planes-guardados')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      nombre: 'Plan prueba',
      horasPorSemana: 4,
      periodos: planificador.body.periodos
    })
    .expect(201);
  assert.equal(saved.body.plan.nombre, 'Plan prueba');

  const savedList = await request(app)
    .get('/api/academico/planes-guardados')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  assert.equal(savedList.body.length, 1);
});
