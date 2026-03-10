const express  = require('express');
const { body, param, query, validationResult } = require('express-validator');
const supabase = require('../db/supabase');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ── GET /api/actividades ─────────────────────────────────────
// Filtros: ?macroproceso=MP01&critica=true&buscar=texto&page=1&limit=50
router.get('/', async (req, res) => {
  try {
    const { macroproceso, critica, buscar, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Query a vista mop_completo para datos completos
    let query = supabase.from('mop_completo').select('*');

    if (macroproceso) query = query.eq('mp_codigo', macroproceso);
    if (critica === 'true') query = query.eq('es_critica', true);
    if (buscar) {
      query = query.or(
        `act_codigo.ilike.%${buscar}%,act_descripcion.ilike.%${buscar}%,act_responsable.ilike.%${buscar}%,mp_nombre.ilike.%${buscar}%`
      );
    }

    const { data, error, count } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('mp_codigo')
      .order('proc_codigo')
      .order('sp_codigo');

    if (error) throw error;
    res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener actividades.' });
  }
});

// ── GET /api/actividades/:id ─────────────────────────────────
router.get('/:id', param('id').isInt(), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('actividades')
      .select(`*, subprocesos(*, procesos(*, macroprocesos(*))), areas_funcionales(*), funcionarios_proceso(*)`)
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Actividad no encontrada.' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener la actividad.' });
  }
});

// ── POST /api/actividades ────────────────────────────────────
router.post('/',
  authorize('administrador','gestor'),
  body('subproceso_id').isInt(),
  body('codigo').notEmpty().trim(),
  body('descripcion').notEmpty().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { area_funcional, funcionario, ...actData } = req.body;
      const { data: act, error: actErr } = await supabase
        .from('actividades').insert(actData).select().single();
      if (actErr) throw actErr;
      // Insertar área funcional si viene
      if (area_funcional) {
        await supabase.from('areas_funcionales')
          .insert({ ...area_funcional, actividad_id: act.id });
      }
      if (funcionario) {
        await supabase.from('funcionarios_proceso')
          .insert({ ...funcionario, actividad_id: act.id });
      }
      // Audit log
      await supabase.from('audit_log').insert({
        usuario_id: req.user.id, tabla: 'actividades',
        operacion: 'INSERT', registro_id: String(act.id),
        datos_despues: actData, ip: req.ip
      });
      res.status(201).json(act);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'El código de actividad ya existe.' });
      console.error(err);
      res.status(500).json({ error: 'Error al crear la actividad.' });
    }
  }
);

// ── PUT /api/actividades/:id ─────────────────────────────────
router.put('/:id',
  authorize('administrador','gestor'),
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { area_funcional, funcionario, ...actData } = req.body;
      actData.actualizado_en = new Date().toISOString();
      // Obtener estado anterior para audit
      const { data: anterior } = await supabase
        .from('actividades').select().eq('id', req.params.id).single();
      const { data: act, error } = await supabase
        .from('actividades').update(actData).eq('id', req.params.id).select().single();
      if (error) throw error;
      if (!act) return res.status(404).json({ error: 'Actividad no encontrada.' });
      // Upsert área funcional
      if (area_funcional) {
        const { data: existing } = await supabase
          .from('areas_funcionales').select('id').eq('actividad_id', req.params.id).single();
        if (existing) {
          await supabase.from('areas_funcionales').update(area_funcional).eq('actividad_id', req.params.id);
        } else {
          await supabase.from('areas_funcionales').insert({ ...area_funcional, actividad_id: act.id });
        }
      }
      if (funcionario) {
        const { data: existingF } = await supabase
          .from('funcionarios_proceso').select('id').eq('actividad_id', req.params.id).single();
        if (existingF) {
          await supabase.from('funcionarios_proceso').update(funcionario).eq('actividad_id', req.params.id);
        } else {
          await supabase.from('funcionarios_proceso').insert({ ...funcionario, actividad_id: act.id });
        }
      }
      // Audit log
      await supabase.from('audit_log').insert({
        usuario_id: req.user.id, tabla: 'actividades',
        operacion: 'UPDATE', registro_id: String(act.id),
        datos_antes: anterior, datos_despues: actData, ip: req.ip
      });
      res.json(act);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar la actividad.' });
    }
  }
);

// ── DELETE /api/actividades/:id ──────────────────────────────
router.delete('/:id',
  authorize('administrador'),
  param('id').isInt(),
  async (req, res) => {
    try {
      const { data: anterior } = await supabase
        .from('actividades').select().eq('id', req.params.id).single();
      const { error } = await supabase
        .from('actividades').update({ activo: false }).eq('id', req.params.id);
      if (error) throw error;
      await supabase.from('audit_log').insert({
        usuario_id: req.user.id, tabla: 'actividades',
        operacion: 'DELETE', registro_id: String(req.params.id),
        datos_antes: anterior, ip: req.ip
      });
      res.json({ message: 'Actividad eliminada correctamente.' });
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar la actividad.' });
    }
  }
);

module.exports = router;
