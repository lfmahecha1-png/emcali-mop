// ── routes/procesos.js ───────────────────────────────────────
const express  = require('express');
const supabase = require('../db/supabase');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { macroproceso_id } = req.query;
  let q = supabase.from('procesos')
    .select('*, macroprocesos(codigo, nombre, color_hex)')
    .eq('activo', true).order('macroproceso_id').order('orden');
  if (macroproceso_id) q = q.eq('macroproceso_id', macroproceso_id);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', authorize('administrador','gestor'), async (req, res) => {
  const { data, error } = await supabase.from('procesos').insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', authorize('administrador','gestor'), async (req, res) => {
  const { data, error } = await supabase.from('procesos')
    .update({ ...req.body, actualizado_en: new Date().toISOString() })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
