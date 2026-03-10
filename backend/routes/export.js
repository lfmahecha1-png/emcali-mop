// ── routes/export.js ─────────────────────────────────────────
const express  = require('express');
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const escapeCSV = (val) => {
  if (val == null) return '';
  const str = String(val).replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
  return `"${str}"`;
};

router.get('/csv', async (req, res) => {
  try {
    const { macroproceso } = req.query;
    let q = supabase.from('mop_completo').select('*');
    if (macroproceso) q = q.eq('mp_codigo', macroproceso);
    const { data, error } = await q;
    if (error) throw error;

    const headers = [
      'MP Código','MP Nombre','Proceso Código','Proceso Descripción','Proceso Alcance',
      'Proceso Indicador','Proceso Responsable','Subproceso Código','Subproceso Descripción',
      'Subproceso Alcance','Subproceso Indicador','Subproceso Responsable',
      'Actividad Código','Actividad Descripción','Actividad Alcance','Actividad Indicador',
      'Actividad Responsable','Producto','Habilitador para Negocios','Es Crítica',
      'Nota Crítica','Área Funcional','Responsabilidades Área','KPI Desempeño Área',
      'KPI Productividad Área','Funciones Funcionario','KPI Desempeño Funcionario',
      'KPI Productividad Funcionario'
    ];

    const rows = data.map(r => [
      r.mp_codigo, r.mp_nombre, r.proc_codigo, r.proc_descripcion, r.proc_alcance,
      r.proc_indicador, r.proc_responsable, r.sp_codigo, r.sp_descripcion, r.sp_alcance,
      r.sp_indicador, r.sp_responsable, r.act_codigo, r.act_descripcion, r.act_alcance,
      r.act_indicador, r.act_responsable, r.act_producto, r.habilitador_negocio,
      r.es_critica ? 'SÍ' : 'NO', r.nota_critica, r.area_nombre, r.area_responsabilidades,
      r.area_kpi_desempeno, r.area_kpi_productividad, r.func_funciones,
      r.func_kpi_desempeno, r.func_kpi_productividad
    ].map(escapeCSV).join(','));

    const csv = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="EMCALI_MOP_Export.csv"');
    res.send('\uFEFF' + csv);  // BOM for Excel UTF-8
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al exportar CSV.' });
  }
});

router.get('/json', async (req, res) => {
  try {
    const { macroproceso } = req.query;
    let q = supabase.from('mop_completo').select('*');
    if (macroproceso) q = q.eq('mp_codigo', macroproceso);
    const { data, error } = await q;
    if (error) throw error;
    res.setHeader('Content-Disposition', 'attachment; filename="EMCALI_MOP_Export.json"');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar JSON.' });
  }
});

module.exports = router;
