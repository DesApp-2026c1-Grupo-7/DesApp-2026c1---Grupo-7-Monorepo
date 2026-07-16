const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');

// Servicios reales: los espiamos con t.mock para verificar el envio de mails
// sin mandar correos de verdad (el transporter ya es un mock en test, pero
// interceptar la funcion nos permite assertar destinatarios y cantidad).
const mailService = require('../src/services/mail.service');
const { checkAndSendReminders } = require('../src/services/reminder.service');
const User = require('../src/models/User');

let mongo;
let subjectId;
let prueba;   // Estudiante de Prueba (perfil publico)
let matias;   // Matias Lopez (perfil publico, contacto de Privado)
let privado;  // Estudiante Privado (perfil privado, contacto de Matias)

async function createBootstrapAdmin() {
  const bcrypt = require('bcryptjs');
  await User.create({
    nombre: 'Admin Sessions',
    email: 'admin-sessions@test.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-sessions@test.com', password: 'admin123' });
  assert.equal(res.status, 200);
  return res.body.token;
}

async function registrarEstudiante(nombre, email, careerId) {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ nombre, email, password: 'pass1234', carrera: careerId });
  assert.equal(reg.status, 201);
  return { id: reg.body.user.id, token: reg.body.token, email };
}

// Crea una sesion de estudio como el usuario dueño del token y devuelve el body.
async function crearSesion(token, overrides = {}) {
  const data = {
    materia: subjectId,
    tema: 'Repaso general',
    tipo: 'presencial',
    ubicacion: 'Aula 101',
    fechaHora: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duracion: { horas: 2, minutos: 0 },
    requiereAprobacion: false,
    ...overrides
  };
  const res = await request(app)
    .post('/api/sesiones')
    .set('Authorization', `Bearer ${token}`)
    .send(data)
    .expect(201);
  return res.body;
}

test.before(async () => {
  process.env.JWT_SECRET = 'test-secret-sessions';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const adminToken = await createBootstrapAdmin();

  const career = await request(app)
    .post('/api/carreras')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: 'Tecnicatura en Programacion',
      codigo: 'TUP',
      descripcion: 'Carrera de prueba para sesiones de estudio',
      titulo: 'Tecnico/a en Programacion',
      instituto: 'Instituto de Tecnologia',
      duracionAnios: 3,
      cantidadMaterias: 1,
      creditosNecesarios: 4,
      nivelInglesRequerido: 'B1'
    });
  assert.equal(career.status, 201);
  const careerId = career.body.career._id;

  const subject = await request(app)
    .post('/api/materias')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Base de Datos', codigo: 'BD', carrera: careerId });
  assert.equal(subject.status, 201);
  subjectId = subject.body.subject._id;

  prueba = await registrarEstudiante('Estudiante de Prueba', 'prueba@test.com', careerId);
  matias = await registrarEstudiante('Matias Lopez', 'matias@test.com', careerId);
  privado = await registrarEstudiante('Estudiante Privado', 'privado@test.com', careerId);

  // Escenario 3: el perfil de Privado es privado y Matias es su contacto mutuo.
  // Estudiante de Prueba queda deliberadamente fuera de esa lista de contactos.
  await User.findByIdAndUpdate(privado.id, {
    'configuracionPrivacidad.perfil': 'privado',
    contactos: [matias.id]
  });
  await User.findByIdAndUpdate(matias.id, {
    contactos: [privado.id]
  });
});

test.after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

// -------------------------------------------------------------------------
// Escenario 1: sesion abierta (sin aprobacion manual)
// -------------------------------------------------------------------------

test('escenario 1: crea una sesion sin aprobacion manual y el creador queda como primer participante', async () => {
  const sesion = await crearSesion(prueba.token, {
    tema: 'Repaso para el parcial',
    requiereAprobacion: false
  });

  assert.equal(sesion.requiereAprobacion, false);
  assert.equal(sesion.tema, 'Repaso para el parcial');
  assert.equal(sesion.creador._id, prueba.id);
  assert.ok(sesion.participantes.some(p => (p._id || p) === prueba.id));
});

test('escenario 1: Matias y Privado pueden ver la sesion abierta en el listado', async () => {
  const sesion = await crearSesion(prueba.token, { tema: 'Sesion visible para todos' });

  for (const estudiante of [matias, privado]) {
    const res = await request(app)
      .get('/api/sesiones')
      .set('Authorization', `Bearer ${estudiante.token}`)
      .expect(200);
    assert.ok(res.body.some(s => s._id === sesion._id));
  }
});

test('escenario 1: al unirse a una sesion sin aprobacion entran directo y se les envia mail de confirmacion', async (t) => {
  const spyConfirmacion = t.mock.method(mailService, 'sendSessionConfirmationEmail', async () => ({ messageId: 'test' }));
  const sesion = await crearSesion(prueba.token, { tema: 'Union directa' });

  const resMatias = await request(app)
    .post(`/api/sesiones/${sesion._id}/join`)
    .set('Authorization', `Bearer ${matias.token}`)
    .expect(200);
  assert.equal(resMatias.body.requiereAprobacion, false);

  const resPrivado = await request(app)
    .post(`/api/sesiones/${sesion._id}/join`)
    .set('Authorization', `Bearer ${privado.token}`)
    .expect(200);
  assert.equal(resPrivado.body.requiereAprobacion, false);

  // Se envio un mail de confirmacion a cada uno.
  assert.equal(spyConfirmacion.mock.callCount(), 2);
  const destinatarios = spyConfirmacion.mock.calls.map(c => c.arguments[0]);
  assert.ok(destinatarios.includes(matias.email));
  assert.ok(destinatarios.includes(privado.email));

  // Y ambos quedaron como participantes.
  const detalle = await request(app)
    .get(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);
  const ids = detalle.body.participantes.map(p => p._id);
  assert.ok(ids.includes(matias.id));
  assert.ok(ids.includes(privado.id));

  // Ademas del mail, cada uno recibe la misma notificacion in-app que al ser
  // aceptado en una sesion con aprobacion manual.
  for (const participante of [matias, privado]) {
    const notis = await request(app)
      .get('/api/notificaciones')
      .set('Authorization', `Bearer ${participante.token}`)
      .expect(200);
    assert.ok(notis.body.some((n) => n.titulo === 'Solicitud de sesión aprobada'
      && n.descripcion === 'Has sido aceptado en la sesión de "Union directa"'));
  }
});

test('escenario 1: el creador puede editar su sesion y un no-creador recibe 403', async () => {
  const sesion = await crearSesion(prueba.token, { tema: 'Tema original', ubicacion: 'Aula 101' });

  const editada = await request(app)
    .put(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .send({ tema: 'Tema editado', ubicacion: 'Aula 202' })
    .expect(200);
  assert.equal(editada.body.tema, 'Tema editado');
  assert.equal(editada.body.ubicacion, 'Aula 202');

  await request(app)
    .put(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${matias.token}`)
    .send({ tema: 'Intento de hackeo' })
    .expect(403);
});

test('escenario 1: el creador puede crear varias sesiones', async () => {
  await crearSesion(prueba.token, { tema: 'Sesion A' });
  await crearSesion(prueba.token, { tema: 'Sesion B', tipo: 'virtual', link: 'https://meet.google.com/abc', ubicacion: undefined });
  await crearSesion(prueba.token, { tema: 'Sesion C' });

  const res = await request(app)
    .get('/api/sesiones')
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);

  const propias = res.body.filter(s => s.creador._id === prueba.id);
  assert.ok(propias.length >= 3);
});

test('escenario 1: el creador cancela la sesion y se envia mail de cancelacion a los participantes (no a si mismo)', async (t) => {
  const spyConfirmacion = t.mock.method(mailService, 'sendSessionConfirmationEmail', async () => ({ messageId: 'test' }));
  const spyCancelacion = t.mock.method(mailService, 'sendSessionCancellationEmail', async () => ({ messageId: 'test' }));

  const sesion = await crearSesion(prueba.token, { tema: 'Sesion a cancelar' });
  await request(app).post(`/api/sesiones/${sesion._id}/join`).set('Authorization', `Bearer ${matias.token}`).expect(200);
  await request(app).post(`/api/sesiones/${sesion._id}/join`).set('Authorization', `Bearer ${privado.token}`).expect(200);

  await request(app)
    .delete(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);

  // La sesion quedo cancelada.
  const detalle = await request(app)
    .get(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);
  assert.equal(detalle.body.estado, 'cancelada');

  // Mail de cancelacion a los dos participantes, nunca al creador.
  assert.equal(spyCancelacion.mock.callCount(), 2);
  const destinatarios = spyCancelacion.mock.calls.map(c => c.arguments[0]);
  assert.ok(destinatarios.includes(matias.email));
  assert.ok(destinatarios.includes(privado.email));
  assert.ok(!destinatarios.includes(prueba.email));
});

test('escenario 1: un participante puede darse de baja y el creador no', async () => {
  const sesion = await crearSesion(prueba.token, { tema: 'Sesion con baja' });
  await request(app).post(`/api/sesiones/${sesion._id}/join`).set('Authorization', `Bearer ${privado.token}`).expect(200);

  await request(app)
    .post(`/api/sesiones/${sesion._id}/leave`)
    .set('Authorization', `Bearer ${privado.token}`)
    .expect(200);

  const detalle = await request(app)
    .get(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);
  assert.ok(!detalle.body.participantes.map(p => p._id).includes(privado.id));

  // El creador no puede darse de baja de su propia sesion.
  await request(app)
    .post(`/api/sesiones/${sesion._id}/leave`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(400);
});

// -------------------------------------------------------------------------
// Escenario 2: sesion con aprobacion manual
// -------------------------------------------------------------------------

test('escenario 2: al solicitar unirse a una sesion con aprobacion queda pendiente y no se envia mail todavia', async (t) => {
  const spyConfirmacion = t.mock.method(mailService, 'sendSessionConfirmationEmail', async () => ({ messageId: 'test' }));
  const sesion = await crearSesion(prueba.token, { tema: 'Sesion con aprobacion', requiereAprobacion: true });

  const res = await request(app)
    .post(`/api/sesiones/${sesion._id}/join`)
    .set('Authorization', `Bearer ${matias.token}`)
    .expect(200);
  assert.equal(res.body.requiereAprobacion, true);

  const detalle = await request(app)
    .get(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);
  const solicitud = detalle.body.solicitudes.find(s => (s.usuario._id || s.usuario) === matias.id);
  assert.ok(solicitud);
  assert.equal(solicitud.estado, 'pendiente');
  assert.ok(!detalle.body.participantes.map(p => p._id).includes(matias.id));

  // Todavia no se manda mail de confirmacion.
  assert.equal(spyConfirmacion.mock.callCount(), 0);
});

test('escenario 2: si el creador rechaza, el solicitante no queda como participante, no recibe mail de confirmacion pero si de rechazo', async (t) => {
  const spyConfirmacion = t.mock.method(mailService, 'sendSessionConfirmationEmail', async () => ({ messageId: 'test' }));
  const spyRechazo = t.mock.method(mailService, 'sendSessionRejectionEmail', async () => ({ messageId: 'test' }));
  const sesion = await crearSesion(prueba.token, { tema: 'Sesion para rechazar', requiereAprobacion: true });

  await request(app).post(`/api/sesiones/${sesion._id}/join`).set('Authorization', `Bearer ${privado.token}`).expect(200);

  await request(app)
    .post('/api/sesiones/manage-request')
    .set('Authorization', `Bearer ${prueba.token}`)
    .send({ sessionId: sesion._id, userId: privado.id, action: 'reject' })
    .expect(200);

  const detalle = await request(app)
    .get(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);
  const solicitud = detalle.body.solicitudes.find(s => (s.usuario._id || s.usuario) === privado.id);
  assert.equal(solicitud.estado, 'rechazada');
  assert.ok(!detalle.body.participantes.map(p => p._id).includes(privado.id));
  assert.equal(spyConfirmacion.mock.callCount(), 0);

  // Recibe el mail de rechazo (distinto del de confirmacion).
  assert.equal(spyRechazo.mock.callCount(), 1);
  assert.equal(spyRechazo.mock.calls[0].arguments[0], privado.email);

  // Y tambien la notificacion in-app que ya existia.
  const notis = await request(app)
    .get('/api/notificaciones')
    .set('Authorization', `Bearer ${privado.token}`)
    .expect(200);
  assert.ok(notis.body.some((n) => n.titulo === 'Solicitud de sesión rechazada'));
});

test('escenario 2: si el creador aprueba, el solicitante queda participante y recibe mail de confirmacion', async (t) => {
  const spyConfirmacion = t.mock.method(mailService, 'sendSessionConfirmationEmail', async () => ({ messageId: 'test' }));
  const sesion = await crearSesion(prueba.token, { tema: 'Sesion para aprobar', requiereAprobacion: true });

  await request(app).post(`/api/sesiones/${sesion._id}/join`).set('Authorization', `Bearer ${matias.token}`).expect(200);

  await request(app)
    .post('/api/sesiones/manage-request')
    .set('Authorization', `Bearer ${prueba.token}`)
    .send({ sessionId: sesion._id, userId: matias.id, action: 'approve' })
    .expect(200);

  const detalle = await request(app)
    .get(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);
  const solicitud = detalle.body.solicitudes.find(s => (s.usuario._id || s.usuario) === matias.id);
  assert.equal(solicitud.estado, 'aprobada');
  assert.ok(detalle.body.participantes.map(p => p._id).includes(matias.id));

  assert.equal(spyConfirmacion.mock.callCount(), 1);
  assert.equal(spyConfirmacion.mock.calls[0].arguments[0], matias.email);
});

test('escenario 2: solo el creador puede gestionar solicitudes', async () => {
  const sesion = await crearSesion(prueba.token, { tema: 'Gestion protegida', requiereAprobacion: true });
  await request(app).post(`/api/sesiones/${sesion._id}/join`).set('Authorization', `Bearer ${matias.token}`).expect(200);

  await request(app)
    .post('/api/sesiones/manage-request')
    .set('Authorization', `Bearer ${privado.token}`)
    .send({ sessionId: sesion._id, userId: matias.id, action: 'approve' })
    .expect(403);
});

// -------------------------------------------------------------------------
// Escenario 3: privacidad por contactos
// -------------------------------------------------------------------------

test('escenario 3: un contacto (Matias) puede ver la sesion de un creador privado', async () => {
  const sesion = await crearSesion(privado.token, { tema: 'Sesion privada de Privado' });

  const res = await request(app)
    .get('/api/sesiones')
    .set('Authorization', `Bearer ${matias.token}`)
    .expect(200);
  assert.ok(res.body.some(s => s._id === sesion._id));
});

test('escenario 3: un no-contacto (Estudiante de Prueba) NO puede ver la sesion de un creador privado', async () => {
  const sesion = await crearSesion(privado.token, { tema: 'Sesion oculta para Prueba' });

  const res = await request(app)
    .get('/api/sesiones')
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);
  assert.ok(!res.body.some(s => s._id === sesion._id));
});

test('escenario 3: un contacto puede unirse a la sesion del creador privado', async () => {
  const sesion = await crearSesion(privado.token, { tema: 'Sesion privada para unirse' });

  await request(app)
    .post(`/api/sesiones/${sesion._id}/join`)
    .set('Authorization', `Bearer ${matias.token}`)
    .expect(200);

  const detalle = await request(app)
    .get(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${privado.token}`)
    .expect(200);
  assert.ok(detalle.body.participantes.map(p => p._id).includes(matias.id));
});

// -------------------------------------------------------------------------
// Escenario 4: recordatorio automatico 24hs antes
// -------------------------------------------------------------------------

test('escenario 4: se envia recordatorio a los participantes de una sesion dentro de las proximas 24h', async (t) => {
  const spyRecordatorio = t.mock.method(mailService, 'sendSessionReminderEmail', async () => ({ messageId: 'test' }));

  // Sesion que ocurre dentro de 23h (cae en la ventana de las proximas 24h).
  const sesion = await crearSesion(prueba.token, {
    tema: 'Sesion inminente',
    fechaHora: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()
  });
  await request(app).post(`/api/sesiones/${sesion._id}/join`).set('Authorization', `Bearer ${matias.token}`).expect(200);
  await request(app).post(`/api/sesiones/${sesion._id}/join`).set('Authorization', `Bearer ${privado.token}`).expect(200);

  await checkAndSendReminders();

  const destinatarios = spyRecordatorio.mock.calls.map(c => c.arguments[0]);
  assert.ok(destinatarios.includes(prueba.email)); // el creador tambien participa
  assert.ok(destinatarios.includes(matias.email));
  assert.ok(destinatarios.includes(privado.email));

  const detalle = await request(app)
    .get(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);
  assert.equal(detalle.body.recordatorioEnviado, true);

  // Junto con el mail, cada participante recibe la notificacion in-app del recordatorio.
  for (const participante of [prueba, matias, privado]) {
    const notis = await request(app)
      .get('/api/notificaciones')
      .set('Authorization', `Bearer ${participante.token}`)
      .expect(200);
    assert.ok(notis.body.some((n) => n.titulo === 'Recordatorio de sesión de estudio'
      && n.descripcion.includes('Sesion inminente')));
  }
});

test('escenario 4: no se reenvia el recordatorio si ya fue enviado', async (t) => {
  const spyRecordatorio = t.mock.method(mailService, 'sendSessionReminderEmail', async () => ({ messageId: 'test' }));

  // La sesion inminente del test anterior ya quedo con recordatorioEnviado = true.
  await checkAndSendReminders();

  assert.equal(spyRecordatorio.mock.callCount(), 0);

  // Tampoco se duplica la notificacion in-app del recordatorio anterior.
  const notis = await request(app)
    .get('/api/notificaciones')
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);
  const cantidad = notis.body.filter((n) => n.titulo === 'Recordatorio de sesión de estudio'
    && n.descripcion.includes('Sesion inminente')).length;
  assert.equal(cantidad, 1);
});

test('escenario 4: no se envia recordatorio a sesiones a mas de 24h', async (t) => {
  const spyRecordatorio = t.mock.method(mailService, 'sendSessionReminderEmail', async () => ({ messageId: 'test' }));

  // Sesion que ocurre dentro de 30h: queda fuera de la ventana de 24h.
  const sesion = await crearSesion(prueba.token, {
    tema: 'Sesion lejana',
    fechaHora: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString()
  });
  await request(app).post(`/api/sesiones/${sesion._id}/join`).set('Authorization', `Bearer ${matias.token}`).expect(200);

  await checkAndSendReminders();

  assert.equal(spyRecordatorio.mock.callCount(), 0);

  const detalle = await request(app)
    .get(`/api/sesiones/${sesion._id}`)
    .set('Authorization', `Bearer ${prueba.token}`)
    .expect(200);
  assert.equal(detalle.body.recordatorioEnviado, false);

  const notis = await request(app)
    .get('/api/notificaciones')
    .set('Authorization', `Bearer ${matias.token}`)
    .expect(200);
  assert.ok(!notis.body.some((n) => n.titulo === 'Recordatorio de sesión de estudio'
    && n.descripcion.includes('Sesion lejana')));
});
