const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');

let mongo;
let student1Token;
let student2Token;
let subjectId;
let materialId;

async function createBootstrapAdmin() {
  const User = require('../src/models/User');
  const bcrypt = require('bcryptjs');
  await User.create({
    nombre: 'Admin Materiales',
    email: 'admin-mat@test.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-mat@test.com', password: 'admin123' });
  return res.body.token;
}

test.before(async () => {
  process.env.JWT_SECRET = 'test-secret-materials';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const adminToken = await createBootstrapAdmin();

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
  subjectId = subject.body.subject._id;

  const reg1 = await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Estudiante 1', email: 'e1@test.com', password: 'pass1234', carrera: careerId });
  
  const login1 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'e1@test.com', password: 'pass1234' });
  student1Token = login1.body.token;

  const reg2 = await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Estudiante 2', email: 'e2@test.com', password: 'pass1234', carrera: careerId });
  
  const login2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'e2@test.com', password: 'pass1234' });
  student2Token = login2.body.token;

  // Crear un material inicial
  const mat = await request(app)
    .post('/api/materiales')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({
      titulo: 'Apunte Progra 1',
      descripcion: 'Muy bueno',
      materia: subjectId,
      tipo: 'link',
      url: 'https://test.com',
      categoria: 'web'
    });
  materialId = mat.body.material._id;
});

test.after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('valoración de material: thumbs up, thumbs down y toggle', async () => {
  // 1. Dar pulgar arriba con estudiante 2
  const resUp = await request(app)
    .post(`/api/materiales/${materialId}/valorar`)
    .set('Authorization', `Bearer ${student2Token}`)
    .send({ voto: 1 })
    .expect(200);
  
  // 2. Verificar que aparezca en el listado
  const resList = await request(app)
    .get(`/api/materiales?materia=${subjectId}`)
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  
  const material = resList.body.find(m => m._id === materialId);
  assert.equal(material.likes, 1);
  assert.equal(material.dislikes, 0);
  assert.equal(material.totalValoraciones, 1);
  assert.equal(material.ratio, 1);

  // 3. Toggle off (mismo voto)
  await request(app)
    .post(`/api/materiales/${materialId}/valorar`)
    .set('Authorization', `Bearer ${student2Token}`)
    .send({ voto: 1 })
    .expect(200);
  
  const resList2 = await request(app)
    .get(`/api/materiales?materia=${subjectId}`)
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  
  const material2 = resList2.body.find(m => m._id === materialId);
  assert.equal(material2.likes, 0);
  assert.equal(material2.totalValoraciones, 0);

  // 4. Cambiar voto (arriba -> abajo)
  await request(app)
    .post(`/api/materiales/${materialId}/valorar`)
    .set('Authorization', `Bearer ${student2Token}`)
    .send({ voto: 1 });
  
  await request(app)
    .post(`/api/materiales/${materialId}/valorar`)
    .set('Authorization', `Bearer ${student2Token}`)
    .send({ voto: -1 });

  const resList3 = await request(app)
    .get(`/api/materiales?materia=${subjectId}`)
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  
  const material3 = resList3.body.find(m => m._id === materialId);
  assert.equal(material3.likes, 0);
  assert.equal(material3.dislikes, 1);
  assert.equal(material3.ratio, 0);
});

test('ordenamiento por valoración', async () => {
  // Crear dos materiales nuevos para esta prueba y que no dependan del estado anterior
  const matA = await request(app)
    .post('/api/materiales')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({
      titulo: 'Material A',
      materia: subjectId,
      tipo: 'link',
      url: 'https://a.com',
      categoria: 'web'
    });
  const idA = matA.body.material._id;

  const matB = await request(app)
    .post('/api/materiales')
    .set('Authorization', `Bearer ${student1Token}`)
    .send({
      titulo: 'Material B',
      materia: subjectId,
      tipo: 'link',
      url: 'https://b.com',
      categoria: 'web'
    });
  const idB = matB.body.material._id;

  // Material A: 2 likes (ratio 1.0)
  await request(app).post(`/api/materiales/${idA}/valorar`).set('Authorization', `Bearer ${student1Token}`).send({ voto: 1 });
  await request(app).post(`/api/materiales/${idA}/valorar`).set('Authorization', `Bearer ${student2Token}`).send({ voto: 1 });

  // Material B: 1 like, 1 dislike (ratio 0.5)
  await request(app).post(`/api/materiales/${idB}/valorar`).set('Authorization', `Bearer ${student1Token}`).send({ voto: 1 });
  await request(app).post(`/api/materiales/${idB}/valorar`).set('Authorization', `Bearer ${student2Token}`).send({ voto: -1 });

  // Listar ordenado por valoración
  const resSorted = await request(app)
    .get(`/api/materiales?materia=${subjectId}&sort=valoracion`)
    .set('Authorization', `Bearer ${student1Token}`)
    .expect(200);
  
  // Material A debe estar primero
  const itemA = resSorted.body.find(m => m._id === idA);
  const itemB = resSorted.body.find(m => m._id === idB);

  assert.equal(resSorted.body[0]._id, idA);
  assert.equal(itemA.ratio, 1);
  assert.equal(itemB.ratio, 0.5);
});
