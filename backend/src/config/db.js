const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

async function connectDB() {
  let uri = process.env.MONGO_URI;

  // Soporte para base de datos en memoria si se solicita o si no hay URI
  if (process.env.USE_MEMORY_DB === 'true') {
    console.log('[db] Iniciando MongoDB en memoria...');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }

  if (!uri) {
    throw new Error('Falta MONGO_URI en el entorno y USE_MEMORY_DB no es true.');
  }

  mongoose.connection.on('connected', () => {
    console.log('[db] conectado a MongoDB');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] error de conexion:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] desconectado de MongoDB');
  });

  await mongoose.connect(uri);
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

module.exports = { connectDB, disconnectDB };
