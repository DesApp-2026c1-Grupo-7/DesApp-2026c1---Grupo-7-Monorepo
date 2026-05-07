require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { seedUsers } = require('./utils/seed');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    await seedUsers();
    app.listen(PORT, () => {
      logger.info(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  logger.info('Recibido SIGINT, cerrando...');
  process.exit(0);
});
