const mongoose = require('mongoose');

const dbStateLabels = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

function getHealth(req, res) {
  const dbState = mongoose.connection.readyState;
  res.json({
    ok: true,
    uptimeSeconds: Math.round(process.uptime()),
    db: dbStateLabels[dbState] || 'unknown',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
