# 🏗️ EMCALI MOP — Sistema de Gestión del Modelo Operativo de Procesos

## Arquitectura del Sistema

```
emcali-mop/
├── backend/                    # Node.js + Express API REST
│   ├── server.js               # Punto de entrada principal
│   ├── package.json
│   ├── .env.example            # Variables de entorno (copiar a .env)
│   ├── db/
│   │   └── supabase.js         # Cliente Supabase
│   ├── middleware/
│   │   └── auth.js             # JWT + autorización por rol
│   └── routes/
│       ├── auth.js             # Login, me, init-admin
│       ├── macroprocesos.js
│       ├── procesos.js
│       ├── subprocesos.js
│       ├── actividades.js      # CRUD completo
│       ├── usuarios.js         # Gestión de usuarios
│       ├── dashboard.js        # Métricas
│       └── export.js           # CSV, JSON
├── frontend/
│   ├── login.html
│   ├── dashboard.html
│   ├── mop.html                # Tabla 25 columnas / 39 actividades
│   ├── editar_actividad.html   # Formulario CRUD
│   ├── administrar_usuarios.html
│   └── assets/
│       ├── css/styles.css
│       └── js/
│           ├── api.js          # Cliente API centralizado
│           └── layout.js       # Sidebar + topbar compartidos
└── sql/
    ├── schema.sql              # DDL completo + índices + vista
    └── seed.sql                # Datos iniciales (5 MP, procesos, 39 actividades)
```

---

## 🚀 DESPLIEGUE PASO A PASO (Gratis)

### PASO 1 — Crear la base de datos en Supabase

1. Ir a **https://supabase.com** → New Project
2. Nombre: `emcali-mop` | Región: `South America (São Paulo)` | Contraseña: (guardar)
3. Esperar que el proyecto se cree (~2 minutos)
4. Ir a **SQL Editor** → New Query
5. Pegar el contenido de `sql/schema.sql` → **RUN**
6. Pegar el contenido de `sql/seed.sql` → **RUN**
7. Ir a **Settings → API**:
   - Copiar **Project URL** → `SUPABASE_URL`
   - Copiar **service_role key** → `SUPABASE_SERVICE_KEY`

### PASO 2 — Desplegar el backend en Render

1. Ir a **https://render.com** → New → Web Service
2. Conectar tu repositorio GitHub con la carpeta `emcali-mop`
3. Configuración:
   ```
   Name:          emcali-mop-api
   Root Directory: backend
   Runtime:        Node
   Build Command:  npm install
   Start Command:  npm start
   Instance Type:  Free
   ```
4. En **Environment Variables** agregar:
   ```
   SUPABASE_URL           = (tu URL de Supabase)
   SUPABASE_SERVICE_KEY   = (tu service_role key)
   JWT_SECRET             = (cadena aleatoria segura, ej: uuid)
   JWT_EXPIRES_IN         = 8h
   NODE_ENV               = production
   FRONTEND_URL           = (URL de tu frontend en Netlify)
   ```
5. Deploy → esperar ~3 minutos
6. **Copiar la URL del servicio** (ej: `https://emcali-mop-api.onrender.com`)

### PASO 3 — Desplegar el frontend en Netlify

1. Ir a **https://netlify.com** → Add new site → Deploy manually
2. Arrastrar la carpeta `frontend/` al área de deploy
   O conectar GitHub y seleccionar la carpeta `frontend/` como publish directory
3. Una vez desplegado, copiar la URL (ej: `https://emcali-mop.netlify.app`)

### PASO 4 — Actualizar la URL de la API en el frontend

En el archivo `frontend/assets/js/api.js`, línea 7:

```javascript
// Cambiar esto para producción:
const API_BASE = 'https://emcali-mop-api.onrender.com/api';
// (En desarrollo, dejar como está: window.location.origin + '/api')
```

### PASO 5 — Crear el administrador inicial

1. Abrir la URL del backend + `/api/auth/init-admin` en el navegador:
   ```
   https://emcali-mop-api.onrender.com/api/auth/init-admin
   ```
   O con curl:
   ```bash
   curl -X POST https://emcali-mop-api.onrender.com/api/auth/init-admin
   ```
2. Esto crea el usuario administrador inicial:
   - **Email:** `admin@emcali.com.co`
   - **Password:** `Admin2025!`

3. ⚠️ **IMPORTANTE:** Cambiar la contraseña inmediatamente en Administrar Usuarios.

---

## 💻 DESARROLLO LOCAL

```bash
# 1. Clonar o descomprimir el proyecto

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 4. Correr la base de datos
# Ejecutar schema.sql y seed.sql en Supabase SQL Editor

# 5. Iniciar el servidor (sirve también el frontend estático)
npm run dev

# 6. Abrir http://localhost:3000
# Primera vez: POST http://localhost:3000/api/auth/init-admin
```

---

## 👥 Roles de Usuario

| Rol | Puede ver | Puede crear/editar | Puede eliminar | Gestión usuarios |
|-----|-----------|-------------------|----------------|-----------------|
| **Administrador** | ✅ Todo | ✅ | ✅ | ✅ |
| **Gestor** | ✅ Todo | ✅ | ❌ | ❌ |
| **Consulta** | ✅ Todo | ❌ | ❌ | ❌ |

---

## 📊 Estructura de Datos MOP

| Nivel | Tabla | Registros |
|-------|-------|-----------|
| Macroprocesos | `macroprocesos` | 5 |
| Procesos | `procesos` | 17 |
| Subprocesos | `subprocesos` | 29 |
| **Actividades** | `actividades` | **39** |
| Áreas Funcionales | `areas_funcionales` | 1 por actividad |
| Funcionarios | `funcionarios_proceso` | 1 por actividad |

### Actividades Críticas ⚡
| Código | Actividad |
|--------|-----------|
| A050102001 | Documentar Conocimiento Tácito de Operadores Senior |
| A050201001 | Gestionar Contabilidad Regulatoria por Negocio |

---

## 🔌 Endpoints API

```
POST   /api/auth/login           Iniciar sesión
GET    /api/auth/me              Perfil del usuario
POST   /api/auth/init-admin      Crear admin inicial (sólo primera vez)

GET    /api/dashboard            Métricas del dashboard

GET    /api/macroprocesos        Listar macroprocesos
GET    /api/macroprocesos/:id/procesos  Procesos de un MP

GET    /api/procesos             Listar procesos
POST   /api/procesos             Crear proceso [gestor+]
PUT    /api/procesos/:id         Actualizar proceso [gestor+]

GET    /api/subprocesos          Listar subprocesos
POST   /api/subprocesos          Crear subproceso [gestor+]

GET    /api/actividades          Listar actividades (con filtros)
GET    /api/actividades/:id      Detalle de actividad
POST   /api/actividades          Crear actividad [gestor+]
PUT    /api/actividades/:id      Actualizar actividad [gestor+]
DELETE /api/actividades/:id      Eliminar actividad [admin]

GET    /api/usuarios             Listar usuarios [admin]
POST   /api/usuarios             Crear usuario [admin]
PUT    /api/usuarios/:id         Actualizar usuario [admin]
DELETE /api/usuarios/:id         Desactivar usuario [admin]
GET    /api/usuarios/roles       Listar roles [admin]

GET    /api/export/csv           Exportar a CSV
GET    /api/export/json          Exportar a JSON
```

### Parámetros de filtro para GET /api/actividades:
```
?macroproceso=MP01     Filtrar por macroproceso
?critica=true          Sólo actividades críticas
?buscar=texto          Búsqueda de texto
?page=1&limit=50       Paginación
```

---

## 🔒 Seguridad

- **JWT tokens** con expiración de 8 horas
- **Bcrypt** para hash de contraseñas (costo 12)
- **Rate limiting**: 200 req/15min general, 10 req/15min para login
- **Helmet.js**: Headers de seguridad HTTP
- **Express Validator**: Validación de inputs
- **Eliminación lógica**: Registros marcados `activo=false`, nunca borrados físicamente
- **Audit log**: Toda operación INSERT/UPDATE/DELETE queda registrada

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, Bootstrap 5, Vanilla JS |
| Backend | Node.js 18+, Express 4 |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT + bcrypt |
| Deploy Frontend | Netlify (gratis) |
| Deploy Backend | Render (gratis) |
| Deploy DB | Supabase (gratis) |
