const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API routes
app.use('/api', authRoutes);
app.use('/api', dataRoutes);

// Simple health check
app.get('/api/healthcheck', (req, res) => {
  res.json({ ok: true, service: 'echo-trace-backend', time: new Date().toISOString() });
});

// Optional: serve frontend (static) if user wants single-server mode
// app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.listen(PORT, () => {
  console.log(`Echo Trace backend running on http://localhost:${PORT}`);
});
