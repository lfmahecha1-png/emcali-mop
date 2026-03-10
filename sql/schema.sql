-- ============================================================
-- EMCALI MOP — Esquema de Base de Datos
-- Supabase / PostgreSQL
-- ============================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- TABLA: roles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id   SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL  -- administrador | gestor | consulta
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: usuarios
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre       VARCHAR(100) NOT NULL,
    email        VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol_id       INTEGER NOT NULL REFERENCES roles(id) DEFAULT 3,
    activo       BOOLEAN DEFAULT TRUE,
    creado_en    TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol   ON usuarios(rol_id);

-- ─────────────────────────────────────────────────────────────
-- TABLA: macroprocesos
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS macroprocesos (
    id          SERIAL PRIMARY KEY,
    codigo      VARCHAR(10) UNIQUE NOT NULL,     -- MP01..MP05
    nombre      VARCHAR(200) NOT NULL,
    descripcion TEXT,
    color_hex   VARCHAR(7) DEFAULT '#1A237E',
    orden       INTEGER DEFAULT 0,
    activo      BOOLEAN DEFAULT TRUE,
    creado_en   TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_macroprocesos_codigo ON macroprocesos(codigo);

-- ─────────────────────────────────────────────────────────────
-- TABLA: procesos
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procesos (
    id               SERIAL PRIMARY KEY,
    macroproceso_id  INTEGER NOT NULL REFERENCES macroprocesos(id) ON DELETE CASCADE,
    codigo           VARCHAR(20) UNIQUE NOT NULL,
    descripcion      TEXT,
    alcance          TEXT,
    indicador        TEXT,
    responsable      VARCHAR(200),
    orden            INTEGER DEFAULT 0,
    activo           BOOLEAN DEFAULT TRUE,
    creado_en        TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_procesos_macroproceso ON procesos(macroproceso_id);
CREATE INDEX idx_procesos_codigo       ON procesos(codigo);

-- ─────────────────────────────────────────────────────────────
-- TABLA: subprocesos
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subprocesos (
    id              SERIAL PRIMARY KEY,
    proceso_id      INTEGER NOT NULL REFERENCES procesos(id) ON DELETE CASCADE,
    codigo          VARCHAR(20) UNIQUE NOT NULL,
    descripcion     TEXT,
    alcance         TEXT,
    indicador       TEXT,
    responsable     VARCHAR(200),
    orden           INTEGER DEFAULT 0,
    activo          BOOLEAN DEFAULT TRUE,
    creado_en       TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subprocesos_proceso ON subprocesos(proceso_id);

-- ─────────────────────────────────────────────────────────────
-- TABLA: actividades
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS actividades (
    id                  SERIAL PRIMARY KEY,
    subproceso_id       INTEGER NOT NULL REFERENCES subprocesos(id) ON DELETE CASCADE,
    codigo              VARCHAR(30) UNIQUE NOT NULL,
    descripcion         TEXT,
    alcance             TEXT,
    indicador           TEXT,
    responsable         VARCHAR(200),
    producto            TEXT,
    habilitador_negocio TEXT,          -- describe cómo habilita A&A / Energía / TIC
    es_critica          BOOLEAN DEFAULT FALSE,   -- ⚡ actividades urgentes
    nota_critica        TEXT,          -- nota cuando es_critica = TRUE
    orden               INTEGER DEFAULT 0,
    activo              BOOLEAN DEFAULT TRUE,
    creado_en           TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actividades_subproceso  ON actividades(subproceso_id);
CREATE INDEX idx_actividades_es_critica  ON actividades(es_critica);
CREATE INDEX idx_actividades_codigo      ON actividades(codigo);

-- ─────────────────────────────────────────────────────────────
-- TABLA: areas_funcionales
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS areas_funcionales (
    id                  SERIAL PRIMARY KEY,
    actividad_id        INTEGER NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    nombre              VARCHAR(200),
    responsabilidades   TEXT,
    kpi_desempeno       TEXT,
    kpi_productividad   TEXT,
    creado_en           TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_areas_actividad ON areas_funcionales(actividad_id);

-- ─────────────────────────────────────────────────────────────
-- TABLA: funcionarios_proceso
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funcionarios_proceso (
    id                SERIAL PRIMARY KEY,
    actividad_id      INTEGER NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    funciones         TEXT,
    kpi_desempeno     TEXT,
    kpi_productividad TEXT,
    creado_en         TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_funcionarios_actividad ON funcionarios_proceso(actividad_id);

-- ─────────────────────────────────────────────────────────────
-- TABLA: audit_log (trazabilidad de cambios)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  UUID REFERENCES usuarios(id),
    tabla       VARCHAR(100),
    operacion   VARCHAR(10),  -- INSERT | UPDATE | DELETE
    registro_id TEXT,
    datos_antes JSONB,
    datos_despues JSONB,
    ip          VARCHAR(45),
    creado_en   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_usuario   ON audit_log(usuario_id);
CREATE INDEX idx_audit_tabla     ON audit_log(tabla);
CREATE INDEX idx_audit_creado_en ON audit_log(creado_en DESC);

-- ─────────────────────────────────────────────────────────────
-- VISTA: mop_completo (para exportaciones y dashboard)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW mop_completo AS
SELECT
    mp.codigo          AS mp_codigo,
    mp.nombre          AS mp_nombre,
    mp.color_hex       AS mp_color,
    p.codigo           AS proc_codigo,
    p.descripcion      AS proc_descripcion,
    p.alcance          AS proc_alcance,
    p.indicador        AS proc_indicador,
    p.responsable      AS proc_responsable,
    sp.codigo          AS sp_codigo,
    sp.descripcion     AS sp_descripcion,
    sp.alcance         AS sp_alcance,
    sp.indicador       AS sp_indicador,
    sp.responsable     AS sp_responsable,
    a.id               AS act_id,
    a.codigo           AS act_codigo,
    a.descripcion      AS act_descripcion,
    a.alcance          AS act_alcance,
    a.indicador        AS act_indicador,
    a.responsable      AS act_responsable,
    a.producto         AS act_producto,
    a.habilitador_negocio,
    a.es_critica,
    a.nota_critica,
    af.nombre          AS area_nombre,
    af.responsabilidades AS area_responsabilidades,
    af.kpi_desempeno   AS area_kpi_desempeno,
    af.kpi_productividad AS area_kpi_productividad,
    fp.funciones       AS func_funciones,
    fp.kpi_desempeno   AS func_kpi_desempeno,
    fp.kpi_productividad AS func_kpi_productividad
FROM actividades a
JOIN subprocesos sp    ON a.subproceso_id = sp.id
JOIN procesos p        ON sp.proceso_id   = p.id
JOIN macroprocesos mp  ON p.macroproceso_id = mp.id
LEFT JOIN areas_funcionales  af ON af.actividad_id = a.id
LEFT JOIN funcionarios_proceso fp ON fp.actividad_id = a.id
WHERE mp.activo AND p.activo AND sp.activo AND a.activo
ORDER BY mp.orden, p.orden, sp.orden, a.orden;
