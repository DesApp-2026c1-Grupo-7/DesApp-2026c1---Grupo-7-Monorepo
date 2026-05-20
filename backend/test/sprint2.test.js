const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');

let mongo;
let student1Token;
let student1Id;
let student2Token;
let student2Id;

async function createBootstrapAdmin() {
  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    nombre: 'Admin Sprint2',
    email: 'admin-s2@test.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-s2@test.com', password: 'admin123' });
  assert.equal(res.status, 200);
  return res.body.token;
}

test.before(async () => {
  process.env.JWT_SECRET = 'test-secret-sprint2';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const adminToken = await createBootstrapAdmin();

  const career = await request(app)
    .post('/api/carreras')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: 'Ingenieria Informatica',
      codigo: 'II',
      descripcion: 'Carrera de prueba sprint 2',
      titulo: 'Ingeniero/a en Informatica',
      instituto: 'Instituto de Tecnologia',
      duracionAnios: 5,
      cantidadMaterias: 1,
      creditosNecesarios: 4,
      nivelInglesRequerido: 'B1'
    });
  assert.equal(career.status, 201);
  const careerId = career.body.career._id;

  const reg1 = await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Ana Lopez', email: 'ana@test.com', password: 'pass1234', carrera: careerId });
  assert.equal(reg1.status, 201);
  student1Id = reg1.body.user.id;

  const login1 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'ana@test.com', password: 'pass1234' });
  assert.equal(login1.status, 200);
  student1Token = login1.body.token;

  const reg2 = await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Bruno Paz', email: 'bruno@test.com', password: 'pass1234', carrera: careerId });
  assert.equal(reg2.status, 201);
  student2Id = reg2.body.user.id;

  const login2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'bruno@test.com', password: 'pass1234' });
  assert.equal(login2.status, 200);
  student2Token = login2.body.token;
});

test.after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('búsqueda de usuarios: filtra por nombre, excluye al buscador y retorna solo estudiantes', async () => {
  const res = await request(app)
    .get('/api/perfil/search?q=Bruno')
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);

  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].nombre, 'Bruno Paz');

  const selfSearch = await request(app)
    .get('/api/perfil/search?q=Ana')
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  assert.ok(!selfSearch.body.find((u) => u.email === 'ana@test.com'), 'no debe incluirse a si mismo');

  const short = await request(app)
    .get('/api/perfil/search?q=B')
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  assert.equal(short.body.length, 0, 'query < 2 chars debe retornar vacío');
});

test('búsqueda sanitiza regex especiales sin crashear', async () => {
  const res = await request(app)
    .get('/api/perfil/search?q=(a%2B)%2B%24')
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  assert.ok(Array.isArray(res.body));
});

test('perfil público: visible si es público, bloqueado si es privado', async () => {
  const pub = await request(app)
    .get(`/api/perfil/${student2Id}`)
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  assert.equal(pub.body.nombre, 'Bruno Paz');

  await request(app)
    .put('/api/perfil/me')
    .set('Authorization', `Bearer ${student2Token}`)
    .send({ configuracionPrivacidad: { perfil: 'privado' } })
    .expect(200);

  await request(app)
    .get(`/api/perfil/${student2Id}`)
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(403);
});

test('invitaciones: enviar, listar pendientes, aceptar y convertirse en contactos', async () => {
  await request(app)
    .put('/api/perfil/me')
    .set('Authorization', `Bearer ${student2Token}`)
    .send({ configuracionPrivacidad: { perfil: 'publico' } })
    .expect(200);

  const send = await request(app)
    .post('/api/invitaciones/enviar')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ email: 'bruno@test.com' })
    .expect(200);
  assert.ok(send.body.mensaje);

  const pendientes = await request(app)
    .get('/api/invitaciones/pendientes')
    .set('Authorization', `Bearer ${student2Token}`)
    .expect(200);
  assert.equal(pendientes.body.length, 1);

  const token = pendientes.body[0].token;
  await request(app)
    .post('/api/invitaciones/aceptar')
    .set('Authorization', `Bearer ${student2Token}`)
    .send({ token })
    .expect(200);

  const contactos = await request(app)
    .get('/api/invitaciones/contactos')
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  assert.ok(contactos.body.some((c) => c._id === student2Id || c._id.toString() === student2Id));
});

test('feed: publicar evento y verlo en el feed de un contacto', async () => {
  const post = await request(app)
    .post('/api/eventos')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ contenido: 'Aprobé Algoritmos con 9!' })
    .expect(201);
  assert.equal(post.body.contenido, 'Aprobé Algoritmos con 9!');
  assert.equal(post.body.tipo, 'posteo');

  const feed = await request(app)
    .get('/api/eventos/feed')
    .set('Authorization', `Bearer ${student2Token}`)
    .expect(200);
  assert.ok(feed.body.some((e) => e.contenido === 'Aprobé Algoritmos con 9!'));
});

test('feed: no muestra eventos de usuarios con mostrarEventos=false', async () => {
  await request(app)
    .put('/api/perfil/me')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ configuracionPrivacidad: { mostrarEventos: false } })
    .expect(200);

  const feed = await request(app)
    .get('/api/eventos/feed')
    .set('Authorization', `Bearer ${student2Token}`)
    .expect(200);
  assert.ok(!feed.body.some((e) => e.autor._id === student1Id || e.autor._id?.toString() === student1Id));

  await request(app)
    .put('/api/perfil/me')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ configuracionPrivacidad: { mostrarEventos: true } })
    .expect(200);
});

test('evento: requiere contenido no vacío', async () => {
  await request(app)
    .post('/api/eventos')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ contenido: '' })
    .expect(400);

  await request(app)
    .post('/api/eventos')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ contenido: 'x'.repeat(501) })
    .expect(400);
});
