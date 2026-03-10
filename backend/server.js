/**
 * EMCALI MOP — Backend API
 * Node.js + Express + Supabase
 */
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const app = express();

// ── MIDDLEWARES DE SEGURIDAD ─────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "'unsafe-inline'"],
      styleSrc:   ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "'unsafe-inline'"],
      fontSrc:    ["'self'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      imgSrc:     ["'self'", "data:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── RATE LIMITING ────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas solicitudes. Intente en 15 minutos.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de inicio de sesión. Intente en 15 minutos.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);

// ── RUTAS API ─────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/macroprocesos',  require('./routes/macroprocesos'));
app.use('/api/procesos',       require('./routes/procesos'));
app.use('/api/subprocesos',    require('./routes/subprocesos'));
app.use('/api/actividades',    require('./routes/actividades'));
app.use('/api/usuarios',       require('./routes/usuarios'));
app.use('/api/dashboard',      require('./routes/dashboard'));
app.use('/api/export',         require('./routes/export'));

// ── FRONTEND ESTÁTICO ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// ── MANEJO DE ERRORES ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});

// ── INICIO ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ EMCALI MOP API corriendo en puerto ${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
});
