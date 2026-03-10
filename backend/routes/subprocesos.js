// ── routes/subprocesos.js ────────────────────────────────────
const express  = require('express');
const supabase = require('../db/supabase');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { proceso_id } = req.query;
  let q = supabase.from('subprocesos')
    .select('*, procesos(codigo, descripcion, macroprocesos(codigo,nombre))')
    .eq('activo', true).order('proceso_id').order('orden');
  if (proceso_id) q = q.eq('proceso_id', proceso_id);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', authorize('administrador','gestor'), async (req, res) => {
  const { data, error } = await supabase.from('subprocesos').insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', authorize('administrador','gestor'), async (req, res) => {
  const { data, error } = await supabase.from('subprocesos')
    .update({ ...req.body, actualizado_en: new Date().toISOString() })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
