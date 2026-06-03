#!/usr/bin/env node
// Demo de consola: crea dos usuarios y los hace contactos entre si usando la API real.
//
// Requiere el backend levantado (npm run dev) y su MongoDB.
// Uso:
//   node scripts/demo-contactos.js
//   API_URL=http://localhost:5000/api node scripts/demo-contactos.js

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

const sufijo = Date.now();
const usuario1 = {
  nombre: 'Demo Ada',
  email: `demo.ada.${sufijo}@universidad.edu`,
  password: 'demo1234'
};
const usuario2 = {
  nombre: 'Demo Alan',
  email: `demo.alan.${sufijo}@universidad.edu`,
  password: 'demo1234'
};

async function api(metodo, ruta, { token, body } = {}) {
  const res = await fetch(`${API_URL}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const texto = await res.text();
  let datos;
  try {
    datos = texto ? JSON.parse(texto) : {};
  } catch {
    datos = { raw: texto };
  }

  if (!res.ok) {
    throw new Error(`${metodo} ${ruta} -> ${res.status}: ${datos.mensaje || texto}`);
  }
  return datos;
}

function paso(n, texto) {
  console.log(`\n[${n}] ${texto}`);
}

async function main() {
  console.log(`Demo de contactos contra ${API_URL}`);

  paso(1, `Registrando a ${usuario1.nombre}...`);
  const reg1 = await api('POST', '/auth/register', { body: usuario1 });
  const token1 = reg1.token;
  console.log(`    OK -> id ${reg1.user.id} (${reg1.user.email})`);

  paso(2, `Registrando a ${usuario2.nombre}...`);
  const reg2 = await api('POST', '/auth/register', { body: usuario2 });
  const id2 = reg2.user.id;
  const token2 = reg2.token;
  console.log(`    OK -> id ${id2} (${reg2.user.email})`);

  paso(3, `${usuario1.nombre} busca a "${usuario2.nombre}" en la busqueda de perfiles...`);
  const resultados = await api('GET', `/perfil/search?q=${encodeURIComponent('Demo Alan')}`, { token: token1 });
  const encontrado = resultados.find((u) => u._id === id2);
  if (!encontrado) {
    throw new Error('La busqueda no devolvio al segundo usuario');
  }
  console.log(`    Encontrado: ${encontrado.nombre} (${encontrado._id})`);

  paso(4, `${usuario1.nombre} le envia una invitacion de contacto...`);
  await api('POST', '/invitaciones/enviar', { token: token1, body: { destinatarioId: id2 } });
  console.log('    Invitacion enviada');

  paso(5, `${usuario2.nombre} revisa sus invitaciones pendientes...`);
  const pendientes = await api('GET', '/invitaciones/pendientes', { token: token2 });
  console.log(`    Tiene ${pendientes.length} pendiente(s): de ${pendientes.map((i) => i.remitente.nombre).join(', ')}`);
  const invitacion = pendientes[0];

  paso(6, `${usuario2.nombre} acepta la invitacion...`);
  await api('POST', '/invitaciones/aceptar', { token: token2, body: { invitacionId: invitacion._id } });
  console.log('    Invitacion aceptada');

  paso(7, 'Verificando que ahora son contactos mutuos...');
  const contactos1 = await api('GET', '/invitaciones/contactos', { token: token1 });
  const contactos2 = await api('GET', '/invitaciones/contactos', { token: token2 });
  console.log(`    Contactos de ${usuario1.nombre}: ${contactos1.map((c) => c.nombre).join(', ') || '(ninguno)'}`);
  console.log(`    Contactos de ${usuario2.nombre}: ${contactos2.map((c) => c.nombre).join(', ') || '(ninguno)'}`);

  const ok = contactos1.some((c) => c._id === id2) && contactos2.some((c) => c._id === reg1.user.id);
  if (!ok) {
    throw new Error('Los usuarios no quedaron como contactos mutuos');
  }

  console.log('\nListo: los dos usuarios quedaron agregados como amigos.');
}

main().catch((err) => {
  console.error(`\nFallo la demo: ${err.message}`);
  console.error('Verifica que el backend este levantado (npm run dev) y que API_URL apunte a la API.');
  process.exit(1);
});
