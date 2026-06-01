const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const Grade = require('../src/models/Grade');

let mongo;
let adminToken;
let studentToken;
let studentId;
let careerId;
let planId;
const S = {}; // codigo -> id de materia

const login = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200);
  return res.body.token;
};

const crearMateria = async (nombre, codigo) => {
  const res = await request(app)
    .post('/api/materias')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre, codigo, carrera: careerId });
  assert.equal(res.status, 201);
  return res.body.subject._id;
};

const setEstado = (materiaId, estado) =>
  request(app)
    .post('/api/academico/situacion')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      materiaId,
      estado,
      nota: estado === 'Aprobada' ? 8 : undefined,
      cuatrimestre: 1,
      anioCursada: 2024
    });

const getPlanificador = (horas) =>
  request(app)
    .get(`/api/academico/planificador?horasPorSemana=${horas}`)
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);

// codigo -> indice del periodo en el que quedo planificada la materia
const mapaPeriodos = (periodos) => {
  const m = {};
  periodos.forEach((p, idx) => p.materias.forEach((mat) => { m[mat.codigo] = idx; }));
  return m;
};

test.before(async () => {
  process.env.JWT_SECRET = 'test-secret';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    nombre: 'Admin Plan',
    email: 'admin@plan.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  adminToken = await login('admin@plan.com', 'admin123');

  const career = await request(app)
    .post('/api/carreras')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ nombre: 'Carrera Plan', codigo: 'CP', titulo: 'Tecnico', instituto: 'Instituto', duracionAnios: 2 });
  assert.equal(career.status, 201);
  careerId = career.body.career._id;

  for (const [nombre, codigo] of [
    ['Materia 1A', 'M1A'], ['Materia 1B', 'M1B'],
    ['Materia 2A', 'M2A'], ['Materia 2B', 'M2B'],
    ['Optativa', 'OPT'], ['Materia Pesada', 'HEAVY']
  ]) {
    S[codigo] = await crearMateria(nombre, codigo);
  }

  // Cadena de correlatividades: M1A -> M1B -> M2A -> M2B.
  // OPT es optativa anual sin correlativas. HEAVY pide 20h (mas que algunos presupuestos).
  // M1A es UNAHUR y el plan exige 1 materia UNAHUR (para testear faltantes).
  const plan = await request(app)
    .post('/api/planes')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      nombre: 'Plan Test',
      anio: 2024,
      carrera: careerId,
      materias: [
        { materia: S.M1A, anio: 1, cuatrimestre: 1, creditos: 4, horasSemanales: 4, correlativas: [], esUnahur: true },
        { materia: S.M1B, anio: 1, cuatrimestre: 2, creditos: 4, horasSemanales: 4, correlativas: [S.M1A] },
        { materia: S.M2A, anio: 2, cuatrimestre: 1, creditos: 4, horasSemanales: 4, correlativas: [S.M1B] },
        { materia: S.M2B, anio: 2, cuatrimestre: 2, creditos: 4, horasSemanales: 4, correlativas: [S.M2A] },
        { materia: S.OPT, anio: 0, cuatrimestre: 0, creditos: 4, horasSemanales: 4, correlativas: [], esOptativa: true },
        { materia: S.HEAVY, anio: 1, cuatrimestre: 1, creditos: 4, horasSemanales: 20, correlativas: [] }
      ],
      creditosNecesarios: 24,
      materiasUnahurRequeridas: 1,
      nivelInglesRequerido: 'B1',
      estado: 'Vigente'
    });
  assert.equal(plan.status, 201);
  planId = plan.body.plan._id;

  await request(app).post('/api/auth/register').send({
    nombre: 'Estudiante Plan',
    email: 'plan@student.com',
    password: 'student123',
    carrera: careerId,
    planEstudio: planId
  }).expect(201);
  studentToken = await login('plan@student.com', 'student123');

  const usuarios = await request(app)
    .get('/api/usuarios')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);
  const student = usuarios.body.find((u) => u.email === 'plan@student.com');
  studentId = student.id || student._id;
});

test.after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

// Cada test arranca sin notas para no contaminar al siguiente.
test.beforeEach(async () => {
  await Grade.deleteMany({ estudiante: studentId });
});

test('planifica toda la carrera hasta recibirse respetando correlatividades', async () => {
  const res = await getPlanificador(100);
  const m = mapaPeriodos(res.body.periodos);

  for (const c of ['M1A', 'M1B', 'M2A', 'M2B', 'OPT', 'HEAVY']) {
    assert.ok(c in m, `falta ${c} en el plan`);
  }

  // La cadena de correlatividades respeta el orden de cuatrimestres.
  assert.ok(m.M1A < m.M1B, 'M1A debe ir antes que M1B');
  assert.ok(m.M1B < m.M2A, 'M1B debe ir antes que M2A');
  assert.ok(m.M2A < m.M2B, 'M2A debe ir antes que M2B');
  assert.notEqual(m.M1A, m.M1B, 'materias de distinto cuatrimestre no comparten periodo');

  // Invariante global: toda correlativa que este en el plan va en un periodo anterior.
  const periodoDe = {};
  res.body.periodos.forEach((p, idx) => p.materias.forEach((mat) => { periodoDe[mat._id] = idx; }));
  res.body.periodos.forEach((p, idx) => p.materias.forEach((mat) => {
    (mat.correlativas || []).forEach((corr) => {
      const cid = corr.toString();
      if (cid in periodoDe) {
        assert.ok(periodoDe[cid] < idx, `${mat.codigo} viola una correlativa`);
      }
    });
  }));

  assert.equal(res.body.pendientesNoPlanificadas.length, 0, 'con 100h no debe quedar nada sin planificar');
});

test('una materia que excede el presupuesto de horas no se planifica', async () => {
  const res = await getPlanificador(8);
  const m = mapaPeriodos(res.body.periodos);

  assert.ok(!('HEAVY' in m), 'HEAVY (20h) no entra en un presupuesto de 8h/sem');
  assert.ok(
    res.body.pendientesNoPlanificadas.some((p) => p.codigo === 'HEAVY'),
    'HEAVY debe reportarse como no planificable'
  );

  // El resto de la carrera igual se planifica completa y en orden.
  for (const c of ['M1A', 'M1B', 'M2A', 'M2B', 'OPT']) assert.ok(c in m, `falta ${c}`);
  assert.ok(m.M1A < m.M1B && m.M1B < m.M2A && m.M2A < m.M2B);
});

test('las materias en curso se excluyen del plan y desbloquean sus correlativas', async () => {
  await setEstado(S.M1A, 'Cursando').expect(200);

  const res = await getPlanificador(100);
  const m = mapaPeriodos(res.body.periodos);

  assert.ok(!('M1A' in m), 'una materia que se esta cursando no se vuelve a planificar');
  assert.ok('M1B' in m, 'M1B se desbloquea porque M1A esta en curso');
});

test('una materia en curso no habilita a su correlativa en el primer cuatrimestre', async () => {
  // M1A esta en curso (no aprobada). M1B (que requiere M1A) puede planificarse, pero NO en el
  // primer cuatrimestre proyectado: recien una vez que M1A se apruebe (segundo periodo en adelante).
  await setEstado(S.M1A, 'Cursando').expect(200);

  const res = await getPlanificador(100);
  const primero = res.body.periodos[0];

  assert.ok(res.body.primerPeriodo, 'el planificador informa el primer periodo proyectado');
  const m1bEnPrimero = (primero?.materias || []).some((mat) => mat.codigo === 'M1B');
  assert.ok(!m1bEnPrimero, 'M1B no puede ir en el primer cuatrimestre con M1A solo en curso');

  // Igualmente M1B queda planificada mas adelante (el plan llega hasta recibirse).
  const m = mapaPeriodos(res.body.periodos);
  assert.ok('M1B' in m && m.M1B >= 1, 'M1B se planifica recien a partir del segundo periodo');
});

test('una materia aprobada se excluye y habilita la siguiente', async () => {
  await setEstado(S.M1A, 'Aprobada').expect(200);

  const res = await getPlanificador(100);
  const m = mapaPeriodos(res.body.periodos);

  assert.ok(!('M1A' in m), 'una materia aprobada no se planifica');
  assert.ok('M1B' in m, 'M1B queda disponible al tener M1A aprobada');
});

test('el avance refleja correctamente los faltantes (creditos y UNAHUR)', async () => {
  let av = await request(app)
    .get('/api/academico/avance')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  assert.equal(av.body.totalMaterias, 6);
  assert.equal(av.body.aprobadas, 0);
  assert.equal(av.body.porcentajeAvance, 0);
  assert.equal(av.body.materiasUnahurFaltantes, 1);

  await setEstado(S.M1A, 'Aprobada').expect(200); // M1A es UNAHUR

  av = await request(app)
    .get('/api/academico/avance')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  assert.equal(av.body.aprobadas, 1);
  assert.equal(av.body.porcentajeAvance, Math.round((1 / 6) * 100));
  assert.equal(av.body.materiasUnahurFaltantes, 0);
  assert.equal(av.body.creditosMateriasAprobadas, 4);
});

test('la comparacion con el plan detecta atraso respecto a lo esperado', async () => {
  await setEstado(S.M1A, 'Aprobada').expect(200);

  // En 1 anio transcurrido se esperan las materias de 1er anio + anuales: M1A, M1B, HEAVY, OPT = 4.
  const r = await request(app)
    .get('/api/academico/rendimiento-plan?anioInicio=2024&anio=2024')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);

  assert.equal(r.body.materiasEsperadasAprobadas, 4);
  assert.equal(r.body.materiasAprobadasEsperadas, 1);
  assert.equal(r.body.estado, 'atrasado');
  assert.equal(r.body.porcentajeCumplimiento, 25);
});

test('cuando se aprueban las materias esperadas, el plan queda al dia', async () => {
  await setEstado(S.M1A, 'Aprobada').expect(200);
  await setEstado(S.M1B, 'Aprobada').expect(200); // requiere M1A aprobada (correlativa)
  await setEstado(S.HEAVY, 'Aprobada').expect(200);
  await setEstado(S.OPT, 'Aprobada').expect(200);

  const r = await request(app)
    .get('/api/academico/rendimiento-plan?anioInicio=2024&anio=2024')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);

  assert.equal(r.body.materiasEsperadasAprobadas, 4);
  assert.equal(r.body.materiasAprobadasEsperadas, 4);
  assert.equal(r.body.estado, 'al-dia');
  assert.equal(r.body.porcentajeCumplimiento, 100);
});

test('no se puede aprobar una materia sin sus correlativas', async () => {
  // M2A pide M1B, que no esta aprobada: el backend debe rechazar.
  const res = await setEstado(S.M2A, 'Aprobada');
  assert.equal(res.status, 400);
});

test('compara el rendimiento real contra un plan guardado (plus)', async () => {
  // Guardamos un plan cuyo primer periodo ya transcurrio (anio pasado) con M1A y M1B.
  const anioPasado = new Date().getFullYear() - 1;
  const saved = await request(app)
    .post('/api/academico/planes-guardados')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      nombre: 'Plan a comparar',
      horasPorSemana: 12,
      periodos: [
        { anio: anioPasado, cuatrimestre: 1, horasUsadas: 8, materias: [
          { _id: S.M1A, nombre: 'Materia 1A', codigo: 'M1A', creditos: 4, horasSemanalesEstimadas: 4 },
          { _id: S.M1B, nombre: 'Materia 1B', codigo: 'M1B', creditos: 4, horasSemanalesEstimadas: 4 }
        ] }
      ]
    })
    .expect(201);
  const planId = saved.body.plan._id;

  // Todavia no aprobamos nada: deberiamos estar atrasados (0 de 2 esperadas).
  let comp = await request(app)
    .get(`/api/academico/planes-guardados/${planId}/comparacion`)
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  assert.equal(comp.body.materiasEsperadas, 2);
  assert.equal(comp.body.materiasCumplidas, 0);
  assert.equal(comp.body.porcentajeCumplimiento, 0);
  assert.notEqual(comp.body.estado, 'al-dia');

  // Aprobamos M1A y regularizamos M1B: el cumplimiento sube a 2 de 2.
  await setEstado(S.M1A, 'Aprobada').expect(200);
  await request(app)
    .post('/api/academico/situacion')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ materiaId: S.M1B, estado: 'Regular', cuatrimestre: 1, anioCursada: anioPasado })
    .expect(200);

  comp = await request(app)
    .get(`/api/academico/planes-guardados/${planId}/comparacion`)
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  assert.equal(comp.body.materiasCumplidas, 2);
  assert.equal(comp.body.porcentajeCumplimiento, 100);
  assert.equal(comp.body.estado, 'al-dia');
});

test('la comparacion detalla por periodo las materias que quedaron atrasadas (etapa 3)', async () => {
  // Plan: un cuatri ya transcurrido con 2 materias planeadas (M1A y M1B).
  const anioPasado = new Date().getFullYear() - 1;
  const saved = await request(app)
    .post('/api/academico/planes-guardados')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      nombre: 'Plan con atraso',
      horasPorSemana: 12,
      periodos: [
        { anio: anioPasado, cuatrimestre: 1, horasUsadas: 8, materias: [
          { _id: S.M1A, nombre: 'Materia 1A', codigo: 'M1A', creditos: 4, horasSemanalesEstimadas: 4 },
          { _id: S.M1B, nombre: 'Materia 1B', codigo: 'M1B', creditos: 4, horasSemanalesEstimadas: 4 }
        ] }
      ]
    })
    .expect(201);

  // Solo cumplo una de las dos materias planeadas para ese periodo.
  await setEstado(S.M1A, 'Aprobada').expect(200);

  const comp = await request(app)
    .get(`/api/academico/planes-guardados/${saved.body.plan._id}/comparacion`)
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);

  const periodo = comp.body.periodos.find((p) => p.anio === anioPasado && p.cuatrimestre === 1);
  assert.ok(periodo, 'la comparacion incluye el periodo planeado');
  assert.equal(periodo.transcurrido, true);
  assert.equal(periodo.totalMaterias, 2);
  assert.equal(periodo.cumplidas, 1);
  assert.equal(periodo.materiasAtrasadas.length, 1);
  assert.equal(periodo.materiasAtrasadas[0].codigo, 'M1B');
  assert.notEqual(comp.body.estado, 'al-dia');
});

test('guarda y recupera planes de cursada', async () => {
  const plan = await getPlanificador(100);

  const saved = await request(app)
    .post('/api/academico/planes-guardados')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({ nombre: 'Mi plan', horasPorSemana: 100, periodos: plan.body.periodos })
    .expect(201);
  assert.equal(saved.body.plan.nombre, 'Mi plan');

  const list = await request(app)
    .get('/api/academico/planes-guardados')
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(200);
  assert.ok(list.body.length >= 1);
});
