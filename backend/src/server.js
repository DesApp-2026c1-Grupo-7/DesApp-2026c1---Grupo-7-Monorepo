require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { seedUsers } = require('./utils/seed');
const { initReminderService } = require('./services/reminder.service');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    console.log('Iniciando servidor...');
    await connectDB();
    console.log('Conexión a DB establecida.');
    await seedUsers();
    console.log('Proceso de seeding finalizado.');
    initReminderService();
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  logger.info('Recibido SIGINT, cerrando...');
  process.exit(0);
});
