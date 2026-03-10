const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/auth/login ────────────────────────────────────
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      // Obtener usuario con su rol
      const { data: users, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, password_hash, activo, roles(nombre)')
        .eq('email', email)
        .limit(1);

      if (error) throw error;
      if (!users || users.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }
      const user = users[0];
      if (!user.activo) {
        return res.status(401).json({ error: 'Usuario desactivado. Contacte al administrador.' });
      }
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }
      const payload = {
        id:     user.id,
        email:  user.email,
        nombre: user.nombre,
        rol:    user.roles?.nombre || 'consulta'
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
      });
      res.json({
        token,
        user: { id: user.id, nombre: user.nombre, email: user.email, rol: payload.rol }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
  }
);

// ── GET /api/auth/me ────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ── POST /api/auth/init-admin (solo primera vez) ────────────
router.post('/init-admin', async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('usuarios').select('id').limit(1);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Ya existen usuarios registrados.' });
    }
    const hash = await bcrypt.hash('Admin2025!', 12);
    const { data: rol } = await supabase
      .from('roles').select('id').eq('nombre','administrador').single();
    const { data: user, error } = await supabase
      .from('usuarios')
      .insert({ nombre: 'Administrador EMCALI', email: 'admin@emcali.com.co',
                password_hash: hash, rol_id: rol.id })
      .select().single();
    if (error) throw error;
    res.json({ message: 'Administrador creado exitosamente.', email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear administrador.' });
  }
});

module.exports = router;
