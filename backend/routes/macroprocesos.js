// ── routes/macroprocesos.js ──────────────────────────────────
const express  = require('express');
const supabase = require('../db/supabase');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('macroprocesos').select('*').eq('activo', true).order('orden');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id/procesos', async (req, res) => {
  const { data, error } = await supabase
    .from('procesos').select('*').eq('macroproceso_id', req.params.id)
    .eq('activo', true).order('orden');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.put('/:id', authorize('administrador'), async (req, res) => {
  const { data, error } = await supabase
    .from('macroprocesos').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
