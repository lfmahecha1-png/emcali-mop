/**
 * EMCALI MOP — API Client
 * Centraliza todas las llamadas al backend
 */

const API_BASE = window.location.origin + 'https://emcali-mop-production.up.railway.app/api';

const Api = {
  // ── AUTH ─────────────────────────────────────────────────
  getToken: () => localStorage.getItem('mop_token'),
  getUser:  () => JSON.parse(localStorage.getItem('mop_user') || 'null'),
  isLoggedIn: () => !!Api.getToken(),

  saveSession(token, user) {
    localStorage.setItem('mop_token', token);
    localStorage.setItem('mop_user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('mop_token');
    localStorage.removeItem('mop_user');
  },

  requireAuth() {
    if (!Api.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },

  requireRole(...roles) {
    const user = Api.getUser();
    if (!user || !roles.includes(user.rol)) {
      toast('No tiene permisos para esta acción.', 'error');
      return false;
    }
    return true;
  },

  // ── HTTP ─────────────────────────────────────────────────
  async request(method, endpoint, body = null) {
    const token = Api.getToken();
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(API_BASE + endpoint, opts);
      if (res.status === 401) {
        Api.clearSession();
        window.location.href = '/login.html';
        return null;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
      return data;
    } catch (err) {
      throw err;
    }
  },

  get:    (ep)        => Api.request('GET', ep),
  post:   (ep, body)  => Api.request('POST', ep, body),
  put:    (ep, body)  => Api.request('PUT', ep, body),
  patch:  (ep, body)  => Api.request('PATCH', ep, body),
  delete: (ep)        => Api.request('DELETE', ep),

  // ── AUTH ENDPOINTS ────────────────────────────────────────
  login: (email, password) => Api.post('/auth/login', { email, password }),
  me: () => Api.get('/auth/me'),

  // ── DASHBOARD ────────────────────────────────────────────
  dashboard: () => Api.get('/dashboard'),

  // ── MACROPROCESOS ─────────────────────────────────────────
  macroprocesos: () => Api.get('/macroprocesos'),
  procesosPorMP: (id) => Api.get(`/macroprocesos/${id}/procesos`),

  // ── PROCESOS ─────────────────────────────────────────────
  procesos: (mpId) => Api.get('/procesos' + (mpId ? `?macroproceso_id=${mpId}` : '')),

  // ── SUBPROCESOS ───────────────────────────────────────────
  subprocesos: (procId) => Api.get('/subprocesos' + (procId ? `?proceso_id=${procId}` : '')),

  // ── ACTIVIDADES ───────────────────────────────────────────
  actividades: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return Api.get('/actividades' + (qs ? '?' + qs : ''));
  },
  actividad: (id) => Api.get(`/actividades/${id}`),
  crearActividad: (data) => Api.post('/actividades', data),
  actualizarActividad: (id, data) => Api.put(`/actividades/${id}`, data),
  eliminarActividad: (id) => Api.delete(`/actividades/${id}`),

  // ── USUARIOS ──────────────────────────────────────────────
  usuarios: () => Api.get('/usuarios'),
  roles:    () => Api.get('/usuarios/roles'),
  crearUsuario: (data) => Api.post('/usuarios', data),
  actualizarUsuario: (id, data) => Api.put(`/usuarios/${id}`, data),
  desactivarUsuario: (id) => Api.delete(`/usuarios/${id}`),

  // ── EXPORT ───────────────────────────────────────────────
  exportCSV(macroproceso = '') {
    const token = Api.getToken();
    const mp = macroproceso ? `?macroproceso=${macroproceso}` : '';
    const url = `${API_BASE}/export/csv${mp}`;
    // Usar fetch con token para descargar
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'EMCALI_MOP_Export.csv';
        a.click();
      });
  },
  exportJSON(macroproceso = '') {
    const token = Api.getToken();
    const mp = macroproceso ? `?macroproceso=${macroproceso}` : '';
    fetch(`${API_BASE}/export/json${mp}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'EMCALI_MOP_Export.json';
        a.click();
      });
  }
};

// ── TOAST UTILITY ────────────────────────────────────────────
function toast(msg, type = 'info', duration = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast-msg ${type}`;
  el.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ── LOADING ───────────────────────────────────────────────────
function showLoading() {
  let el = document.getElementById('loadingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingOverlay';
    el.className = 'loading-overlay';
    el.innerHTML = '<div class="spinner-ring"></div>';
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
}

function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}
