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
let subjectId;
let careerId;

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
  careerId = career.body.career._id;

  const subject = await request(app)
    .post('/api/materias')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: 'Base de Datos',
      codigo: 'BD',
      carrera: careerId
    });
  assert.equal(subject.status, 201);
  subjectId = subject.body.subject._id;

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

test('perfil público: completo si es público, vista mínima si es privado', async () => {
  const pub = await request(app)
    .get(`/api/perfil/${student2Id}`)
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  assert.equal(pub.body.nombre, 'Bruno Paz');
  assert.equal(pub.body.perfilPrivado, false);

  await request(app)
    .put('/api/perfil/me')
    .set('Authorization', `Bearer ${student2Token}`)
    .send({ configuracionPrivacidad: { perfil: 'privado' } })
    .expect(200);

  // Privado y no-contacto: se ve una vista mínima (nombre) pero no bio ni situación.
  const priv = await request(app)
    .get(`/api/perfil/${student2Id}`)
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  assert.equal(priv.body.perfilPrivado, true);
  assert.equal(priv.body.nombre, 'Bruno Paz');
  assert.equal(priv.body.bio, undefined);
  assert.equal(priv.body.situacionAcademica, undefined);
});

test('invitaciones: enviar, listar pendientes, aceptar y convertirse en contactos', async () => {
  // El flujo de solicitud pendiente + aceptación aplica a perfiles PRIVADOS.
  await request(app)
    .put('/api/perfil/me')
    .set('Authorization', `Bearer ${student2Token}`)
    .send({ configuracionPrivacidad: { perfil: 'privado' } })
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

test('invitaciones: perfil público se acepta automáticamente (sin solicitud pendiente)', async () => {
  const regA = await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Carla Pub', email: 'carla-pub@test.com', password: 'pass1234', carrera: careerId });
  assert.equal(regA.status, 201);
  const tokenA = regA.body.token;

  const regB = await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Diego Pub', email: 'diego-pub@test.com', password: 'pass1234', carrera: careerId });
  assert.equal(regB.status, 201);
  const idB = regB.body.user.id;
  const tokenB = regB.body.token;

  // Perfil público por defecto: al enviar la solicitud se agregan al instante.
  const send = await request(app)
    .post('/api/invitaciones/enviar')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ destinatarioId: idB })
    .expect(200);
  assert.equal(send.body.autoAceptado, true);

  // No queda ninguna invitación pendiente para el destinatario.
  const pendientes = await request(app)
    .get('/api/invitaciones/pendientes')
    .set('Authorization', `Bearer ${tokenB}`)
    .expect(200);
  assert.equal(pendientes.body.length, 0);

  // Son contactos mutuos.
  const contactosA = await request(app)
    .get('/api/invitaciones/contactos')
    .set('Authorization', `Bearer ${tokenA}`)
    .expect(200);
  assert.ok(contactosA.body.some((c) => (c._id?.toString?.() || c._id) === idB));
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

test('evento: el autor puede editar su publicación y queda marcada como editada', async () => {
  const post = await request(app)
    .post('/api/eventos')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ contenido: 'Contenido original' })
    .expect(201);
  assert.equal(post.body.editado, false);

  const edit = await request(app)
    .put(`/api/eventos/${post.body._id}`)
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ contenido: 'Contenido editado' })
    .expect(200);
  assert.equal(edit.body.contenido, 'Contenido editado');
  assert.equal(edit.body.editado, true);
});

test('evento: un usuario no puede editar la publicación de otro', async () => {
  const post = await request(app)
    .post('/api/eventos')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ contenido: 'Publicación de student1' })
    .expect(201);

  await request(app)
    .put(`/api/eventos/${post.body._id}`)
    .set('Authorization', `Bearer ${student2Token}`)
    .send({ contenido: 'Intento de edición ajena' })
    .expect(403);
});

test('evento: un usuario no puede eliminar la publicación de otro', async () => {
  const post = await request(app)
    .post('/api/eventos')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ contenido: 'Otra publicación de student1' })
    .expect(201);

  await request(app)
    .delete(`/api/eventos/${post.body._id}`)
    .set('Authorization', `Bearer ${student2Token}`)
    .expect(403);
});

test('evento: el autor puede eliminar su propia publicación', async () => {
  const post = await request(app)
    .post('/api/eventos')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ contenido: 'Publicación a eliminar' })
    .expect(201);

  await request(app)
    .delete(`/api/eventos/${post.body._id}`)
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);

  const feed = await request(app)
    .get('/api/eventos/feed')
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  assert.ok(!feed.body.some((e) => e._id === post.body._id));
});

test('sesiones: proponer una sesión con todos los campos requeridos', async () => {
  const data = {
    materia: subjectId,
    tema: 'Repaso Parcial 1',
    tipo: 'presencial',
    ubicacion: 'Biblioteca Central',
    fechaHora: '2026-06-01T10:00:00',
    duracion: { horas: 2, minutos: 30 },
    cupos: 5,
    descripcion: 'Vamos a resolver el examen del año pasado',
    requiereAprobacion: true
  };

  const res = await request(app)
    .post('/api/sesiones')
    .set('Authorization', `Bearer ${student1Token}`)
    .send(data)
    .expect(201);

  assert.equal(res.body.tema, 'Repaso Parcial 1');
  assert.equal(res.body.tipo, 'presencial');
  assert.equal(res.body.ubicacion, 'Biblioteca Central');
  assert.equal(res.body.requiereAprobacion, true);
  assert.equal(res.body.materia.nombre, 'Base de Datos');
  assert.equal(res.body.creador.nombre, 'Ana Lopez');
});

test('sesiones: fallar si faltan campos obligatorios', async () => {
  await request(app)
    .post('/api/sesiones')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({ tema: 'Sin materia' })
    .expect(400);
});

test('sesiones: obtener listado de sesiones activas', async () => {
  const res = await request(app)
    .get('/api/sesiones')
    .set('Authorization', `Bearer ${student2Token}`)
    .expect(200);

  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 1);
  assert.ok(res.body.some(s => s.tema === 'Repaso Parcial 1'));
});
