const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Falta MONGO_URI en el entorno. Revisar backend/.env.example');
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
}

module.exports = { connectDB, disconnectDB };
