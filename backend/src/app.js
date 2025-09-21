const express = require('express');
const cors = require('cors');
const authRoutes = require('./api/auth/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(err.message || 'Something broke!');
});

module.exports = app;