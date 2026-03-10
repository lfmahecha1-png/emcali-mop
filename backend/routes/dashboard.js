// ── routes/dashboard.js ──────────────────────────────────────
const express  = require('express');
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [
      { count: totalMP },
      { count: totalP },
      { count: totalSP },
      { count: totalAct },
      { count: criticas },
      { data: porMP }
    ] = await Promise.all([
      supabase.from('macroprocesos').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('procesos').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('subprocesos').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('actividades').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('actividades').select('*', { count: 'exact', head: true }).eq('activo', true).eq('es_critica', true),
      supabase.from('macroprocesos').select(`id, codigo, nombre, color_hex, procesos(count)`)
        .eq('activo', true).order('orden')
    ]);

    res.json({
      totales: { macroprocesos: totalMP, procesos: totalP, subprocesos: totalSP, actividades: totalAct, criticas },
      por_macroproceso: porMP
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener métricas del dashboard.' });
  }
});

module.exports = router;
