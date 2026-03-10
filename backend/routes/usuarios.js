// ── routes/usuarios.js ───────────────────────────────────────
const express  = require('express');
const bcrypt   = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const supabase = require('../db/supabase');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, authorize('administrador'));

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios').select('id, nombre, email, activo, creado_en, roles(id, nombre)')
    .order('nombre');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/',
  body('nombre').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('rol_id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { nombre, email, password, rol_id } = req.body;
      const hash = await bcrypt.hash(password, 12);
      const { data, error } = await supabase
        .from('usuarios').insert({ nombre, email, password_hash: hash, rol_id }).select().single();
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'El email ya está registrado.' });
        throw error;
      }
      res.status(201).json({ id: data.id, nombre: data.nombre, email: data.email });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear el usuario.' });
    }
  }
);

router.put('/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.nombre)  updates.nombre  = req.body.nombre;
    if (req.body.rol_id)  updates.rol_id  = req.body.rol_id;
    if (req.body.activo !== undefined) updates.activo = req.body.activo;
    if (req.body.password) {
      updates.password_hash = await bcrypt.hash(req.body.password, 12);
    }
    updates.actualizado_en = new Date().toISOString();
    const { data, error } = await supabase
      .from('usuarios').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ id: data.id, nombre: data.nombre, email: data.email, activo: data.activo });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'No puede eliminarse a sí mismo.' });
  }
  const { error } = await supabase
    .from('usuarios').update({ activo: false }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Usuario desactivado.' });
});

router.get('/roles', async (req, res) => {
  const { data, error } = await supabase.from('roles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
