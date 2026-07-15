const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const Notification = require('../src/models/Notification');

let mongo;
let adminToken;
let autorToken;   // sube los materiales
let autorId;
let denuncianteToken; // hace las denuncias
let denuncianteId;
let subjectId;
let careerId;

// titulo del motivo -> _id (motivos reales del sistema)
const reasons = {};

const MOTIVO = {
  PORNO: 'Contenido pornográfico o sexual explícito',
  LENGUAJE: 'Lenguaje ofensivo o insultos',
  AUTOR: 'Material protegido por derechos de autor',
  SPAM: 'Spam o publicidad engañosa',
  INFO: 'Información incorrecta o engañosa',
  OTRO: 'Otro'
};

async function createBootstrapAdmin() {
  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    nombre: 'Admin Motivos',
    email: 'admin-motivos@test.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-motivos@test.com', password: 'admin123' });
  assert.equal(res.status, 200);
  return res.body.token;
}

async function registrarEstudiante(nombre, email, careerId) {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ nombre, email, password: 'pass1234', carrera: careerId });
  assert.equal(reg.status, 201);
  return { id: reg.body.user.id, token: reg.body.token };
}

// Cada escenario crea su propio material (del autor) para denunciarlo de forma aislada.
async function crearMaterial(titulo) {
  const res = await request(app)
    .post('/api/materiales')
    .set('Authorization', `Bearer ${autorToken}`)
    .send({ titulo, materia: subjectId, tipo: 'link', url: 'https://ejemplo.com/apunte', categoria: 'web' })
    .expect(201);
  return res.body.material._id;
}

function denunciar(body) {
  return denunciarComo(denuncianteToken, body);
}

function denunciarComo(token, body) {
  return request(app)
    .post('/api/denuncias')
    .set('Authorization', `Bearer ${token}`)
    .send(body);
}

test.before(async () => {
  process.env.JWT_SECRET = 'test-secret-motivos';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  adminToken = await createBootstrapAdmin();

  const career = await request(app)
    .post('/api/carreras')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: 'Tecnicatura en Programacion',
      codigo: 'TUP',
      descripcion: 'Carrera de prueba para denuncias',
      titulo: 'Tecnico/a en Programacion',
      instituto: 'Instituto de Tecnologia',
      duracionAnios: 3,
      cantidadMaterias: 1,
      creditosNecesarios: 4,
      nivelInglesRequerido: 'B1'
    });
  assert.equal(career.status, 201);
  careerId = career.body.career._id;

  const subject = await request(app)
    .post('/api/materias')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Bases de Datos', codigo: 'BD', carrera: careerId });
  assert.equal(subject.status, 201);
  subjectId = subject.body.subject._id;

  const autor = await registrarEstudiante('Autor Material', 'autor@test.com', careerId);
  autorToken = autor.token;
  autorId = autor.id;

  const denunciante = await registrarEstudiante('Estudiante Denunciante', 'denunciante@test.com', careerId);
  denuncianteToken = denunciante.token;
  denuncianteId = denunciante.id;

  // Crear los 6 motivos reales del sistema (en tests el seed no corre solo).
  const titulos = [MOTIVO.PORNO, MOTIVO.LENGUAJE, MOTIVO.AUTOR, MOTIVO.SPAM, MOTIVO.INFO, MOTIVO.OTRO];
  for (const titulo of titulos) {
    const res = await request(app)
      .post('/api/denuncias/reasons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ titulo })
      .expect(201);
    reasons[titulo] = res.body._id;
  }
});

test.after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

// -------------------------------------------------------------------------
// Escenarios 1-5: denuncia por cada motivo (uno por material)
// -------------------------------------------------------------------------

test('escenario 1: un estudiante denuncia un material por contenido pornográfico', async () => {
  const materialId = await crearMaterial('Apunte con contenido pornografico');
  const res = await denunciar({
    materialId,
    reasonId: reasons[MOTIVO.PORNO],
    detalle: 'El material contiene imágenes pornográficas'
  }).expect(201);

  assert.equal(res.body.report.estado, 'pendiente');
  assert.equal(res.body.report.motivo[0], reasons[MOTIVO.PORNO]);
});

test('escenario 2: un estudiante denuncia un material por lenguaje ofensivo o insultos', async () => {
  const materialId = await crearMaterial('Apunte con insultos');
  const res = await denunciar({
    materialId,
    reasonId: reasons[MOTIVO.LENGUAJE],
    detalle: 'Incluye insultos y lenguaje ofensivo'
  }).expect(201);

  assert.equal(res.body.report.estado, 'pendiente');
  assert.equal(res.body.report.motivo[0], reasons[MOTIVO.LENGUAJE]);
});

test('escenario 3: un estudiante denuncia un material por derechos de autor', async () => {
  const materialId = await crearMaterial('Libro escaneado sin permiso');
  const res = await denunciar({
    materialId,
    reasonId: reasons[MOTIVO.AUTOR],
    detalle: 'Es material con copyright subido sin permiso'
  }).expect(201);

  assert.equal(res.body.report.estado, 'pendiente');
  assert.equal(res.body.report.motivo[0], reasons[MOTIVO.AUTOR]);
});

test('escenario 4: un estudiante denuncia un material por spam o publicidad engañosa', async () => {
  const materialId = await crearMaterial('Promo de un curso pago');
  const res = await denunciar({
    materialId,
    reasonId: reasons[MOTIVO.SPAM],
    detalle: 'Es publicidad engañosa, no es material de estudio'
  }).expect(201);

  assert.equal(res.body.report.estado, 'pendiente');
  assert.equal(res.body.report.motivo[0], reasons[MOTIVO.SPAM]);
});

test('escenario 5: un estudiante denuncia un material por información incorrecta o engañosa', async () => {
  const materialId = await crearMaterial('Resumen con datos erroneos');
  const res = await denunciar({
    materialId,
    reasonId: reasons[MOTIVO.INFO],
    detalle: 'Los datos del apunte son incorrectos'
  }).expect(201);

  assert.equal(res.body.report.estado, 'pendiente');
  assert.equal(res.body.report.motivo[0], reasons[MOTIVO.INFO]);
});

// -------------------------------------------------------------------------
// Escenario 6: motivo "Otro" con descripción extra (motivoEspecifico)
// -------------------------------------------------------------------------

test('escenario 6: un estudiante denuncia un material por "otro" indicando que no corresponde a la materia', async () => {
  const materialId = await crearMaterial('Material de otra carrera');
  const res = await denunciar({
    materialId,
    reasonId: reasons[MOTIVO.OTRO],
    motivoEspecifico: 'No es contenido correspondiente a esta materia',
    detalle: 'Subido en la materia equivocada'
  }).expect(201);

  assert.equal(res.body.report.estado, 'pendiente');
  assert.equal(res.body.report.motivo[0], reasons[MOTIVO.OTRO]);
  assert.equal(res.body.report.motivoEspecifico, 'No es contenido correspondiente a esta materia');
});

// -------------------------------------------------------------------------
// Escenario 6b: checklist con varios motivos en una sola denuncia
// -------------------------------------------------------------------------

test('escenario 6b: una denuncia puede tener varios motivos (checklist)', async () => {
  const materialId = await crearMaterial('Material con multiples problemas');
  const res = await denunciar({
    materialId,
    reasonIds: [reasons[MOTIVO.SPAM], reasons[MOTIVO.INFO]],
    detalle: 'Es spam y además tiene datos incorrectos'
  }).expect(201);

  assert.equal(res.body.report.motivo.length, 2);
  assert.deepEqual(
    res.body.report.motivo.map(String).sort(),
    [reasons[MOTIVO.SPAM], reasons[MOTIVO.INFO]].map(String).sort()
  );
});

// -------------------------------------------------------------------------
// Escenario 7: el admin puede ver las denuncias
// -------------------------------------------------------------------------

test('escenario 7: el admin puede ver las denuncias (y un estudiante no)', async () => {
  const materialId = await crearMaterial('Material para listar');
  const creada = await denunciar({
    materialId,
    reasonId: reasons[MOTIVO.SPAM],
    detalle: 'Denuncia para el listado del admin'
  }).expect(201);
  const reportId = creada.body.report._id;

  const res = await request(app)
    .get('/api/denuncias')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  assert.ok(Array.isArray(res.body));
  const encontrada = res.body.find(r => r._id === reportId);
  assert.ok(encontrada, 'la denuncia recién creada debe aparecer en el listado');
  assert.equal(encontrada.motivo[0].titulo, MOTIVO.SPAM);
  assert.ok(encontrada.denunciante && encontrada.denunciante.nombre);

  // Un estudiante no puede acceder al listado (ruta solo admin).
  await request(app)
    .get('/api/denuncias')
    .set('Authorization', `Bearer ${denuncianteToken}`)
    .expect(403);
});

// -------------------------------------------------------------------------
// Escenario 8: el admin puede aceptar una denuncia (estado 'revisado')
// -------------------------------------------------------------------------

test('escenario 8: el admin puede aceptar una denuncia y se notifica al denunciante y al autor', async () => {
  const materialId = await crearMaterial('Material a aceptar denuncia');
  const creada = await denunciar({
    materialId,
    reasonId: reasons[MOTIVO.PORNO],
    detalle: 'Denuncia que el admin va a aceptar'
  }).expect(201);
  const reportId = creada.body.report._id;

  const res = await request(app)
    .patch(`/api/denuncias/${reportId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ estado: 'revisado', resolucion: 'Contenido verificado y dado de baja' })
    .expect(200);

  assert.equal(res.body.report.estado, 'revisado');
  assert.equal(res.body.report.resolucion, 'Contenido verificado y dado de baja');

  // Notificaciones: al denunciante ("Denuncia aceptada") y al autor ("Material reportado y aceptado").
  const notifDenunciante = await Notification.findOne({ usuario: denuncianteId, titulo: 'Denuncia aceptada' });
  assert.ok(notifDenunciante, 'el denunciante debe recibir la notificación de denuncia aceptada');

  const notifAutor = await Notification.findOne({ usuario: autorId, titulo: 'Material reportado y aceptado' });
  assert.ok(notifAutor, 'el autor debe recibir la notificación de material reportado y aceptado');
});

// -------------------------------------------------------------------------
// Escenario 9: el admin puede rechazar una denuncia (estado 'ignorado')
// -------------------------------------------------------------------------

test('escenario 9: el admin puede rechazar una denuncia y se notifica al denunciante y al autor', async () => {
  const materialId = await crearMaterial('Material a rechazar denuncia');
  const creada = await denunciar({
    materialId,
    reasonId: reasons[MOTIVO.INFO],
    detalle: 'Denuncia que el admin va a rechazar'
  }).expect(201);
  const reportId = creada.body.report._id;

  const res = await request(app)
    .patch(`/api/denuncias/${reportId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ estado: 'ignorado', resolucion: 'La denuncia no corresponde' })
    .expect(200);

  assert.equal(res.body.report.estado, 'ignorado');

  // Notificaciones: al denunciante ("Denuncia desestimada") y al autor ("Denuncia rechazada").
  const notifDenunciante = await Notification.findOne({ usuario: denuncianteId, titulo: 'Denuncia desestimada' });
  assert.ok(notifDenunciante, 'el denunciante debe recibir la notificación de denuncia desestimada');

  const notifAutor = await Notification.findOne({ usuario: autorId, titulo: 'Denuncia rechazada' });
  assert.ok(notifAutor, 'el autor debe recibir la notificación de denuncia rechazada');

  // Un estudiante no puede cambiar el estado de una denuncia (ruta solo admin).
  await request(app)
    .patch(`/api/denuncias/${reportId}/status`)
    .set('Authorization', `Bearer ${denuncianteToken}`)
    .send({ estado: 'revisado' })
    .expect(403);
});

// -------------------------------------------------------------------------
// Escenario 10: material con 2 denuncias -> sigue visible (umbral por defecto = 3)
// -------------------------------------------------------------------------

test('escenario 10: un material con 2 denuncias sigue visible para los estudiantes', async () => {
  const materialId = await crearMaterial('Material con 2 denuncias');
  // Cada estudiante denuncia una sola vez: usamos 2 denunciantes distintos.
  const den2 = await registrarEstudiante('Denunciante 10b', 'den10b@test.com', careerId);
  await denunciar({ materialId, reasonId: reasons[MOTIVO.SPAM], detalle: 'Denuncia 1' }).expect(201);
  await denunciarComo(den2.token, { materialId, reasonId: reasons[MOTIVO.SPAM], detalle: 'Denuncia 2' }).expect(201);

  // Otro estudiante (no autor) lo sigue viendo, no suspendido y con url.
  const resOtro = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${denuncianteToken}`)
    .expect(200);
  const visto = resOtro.body.find(m => m._id === materialId);
  assert.ok(visto, 'el material con 2 denuncias debe seguir visible');
  assert.equal(visto.suspendido, false);
  assert.ok(visto.url, 'la url sigue disponible mientras no está suspendido');

  // El creador lo ve como denunciado (2 pendientes) pero no suspendido.
  const resAutor = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${autorToken}`)
    .expect(200);
  const propio = resAutor.body.find(m => m._id === materialId);
  assert.equal(propio.pendingReports, 2);
  assert.equal(propio.suspendido, false);
});

// -------------------------------------------------------------------------
// Escenario 11: material con 3 denuncias -> suspendido (oculto salvo admin y creador)
// -------------------------------------------------------------------------

test('escenario 11: un material con 3 denuncias queda suspendido y oculto salvo para admin y creador', async () => {
  const materialId = await crearMaterial('Material con 3 denuncias');
  // 3 denunciantes distintos: cada estudiante solo puede denunciar una vez.
  const denA = await registrarEstudiante('Denunciante 11a', 'den11a@test.com', careerId);
  const denB = await registrarEstudiante('Denunciante 11b', 'den11b@test.com', careerId);
  const tokens = [denuncianteToken, denA.token, denB.token];
  for (let i = 0; i < 3; i++) {
    await denunciarComo(tokens[i], { materialId, reasonId: reasons[MOTIVO.PORNO], detalle: `Denuncia ${i + 1}` }).expect(201);
  }

  // Otro estudiante (no autor) ya NO lo ve.
  const resOtro = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${denuncianteToken}`)
    .expect(200);
  assert.equal(resOtro.body.find(m => m._id === materialId), undefined, 'otro estudiante no ve el material suspendido');

  // El admin lo ve con la url real.
  const resAdmin = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  const vistoAdmin = resAdmin.body.find(m => m._id === materialId);
  assert.ok(vistoAdmin, 'el admin ve el material suspendido');
  assert.equal(vistoAdmin.suspendido, true);
  assert.ok(vistoAdmin.url, 'el admin ve la url real');

  // El creador lo ve suspendido, con las 3 denuncias, pero con la url enmascarada.
  const resAutor = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${autorToken}`)
    .expect(200);
  const propio = resAutor.body.find(m => m._id === materialId);
  assert.ok(propio, 'el creador sigue viendo su material');
  assert.equal(propio.suspendido, true);
  assert.equal(propio.pendingReports, 3);
  assert.equal(propio.url, null, 'la url queda enmascarada para el creador');
});

// -------------------------------------------------------------------------
// Escenario 12: el creador elimina su material
// -------------------------------------------------------------------------

test('escenario 12: el creador puede eliminar su material (y otro estudiante no)', async () => {
  const materialId = await crearMaterial('Material a eliminar');

  // Otro estudiante no puede eliminar material ajeno.
  await request(app)
    .delete(`/api/materiales/${materialId}`)
    .set('Authorization', `Bearer ${denuncianteToken}`)
    .expect(403);

  // El creador sí puede.
  const res = await request(app)
    .delete(`/api/materiales/${materialId}`)
    .set('Authorization', `Bearer ${autorToken}`)
    .expect(200);
  assert.match(res.body.mensaje, /eliminad/i);

  // Ya no aparece en el listado.
  const lista = await request(app)
    .get('/api/materiales')
    .set('Authorization', `Bearer ${autorToken}`)
    .expect(200);
  assert.equal(lista.body.find(m => m._id === materialId), undefined, 'el material eliminado no debe aparecer');
});
