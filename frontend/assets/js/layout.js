/**
 * EMCALI MOP — Shared Layout JS
 * Renders sidebar + topbar and handles navigation
 */

function renderLayout(activePage, pageTitle) {
  const user = Api.getUser();
  if (!user) { window.location.href = '/login.html'; return; }

  const navItems = [
    { page: 'dashboard',    href: 'dashboard.html',    icon: 'bi-grid-1x2',        label: 'Dashboard' },
    { page: 'mop',          href: 'mop.html',          icon: 'bi-table',            label: 'Tabla MOP' },
  ];
  if (user.rol === 'administrador' || user.rol === 'gestor') {
    navItems.push({ page: 'editar', href: 'editar_actividad.html', icon: 'bi-pencil-square', label: 'Nueva Actividad' });
  }
  if (user.rol === 'administrador') {
    navItems.push({ page: 'usuarios', href: 'administrar_usuarios.html', icon: 'bi-people', label: 'Usuarios' });
  }

  const rolBadge = { administrador: 'danger', gestor: 'warning', consulta: 'info' };
  const rolLabel = { administrador: 'Administrador', gestor: 'Gestor', consulta: 'Consulta' };

  const sidebarHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="d-flex align-items-center gap-2">
          <div class="d-inline-flex align-items-center justify-content-center rounded-2"
               style="width:32px;height:32px;background:rgba(255,255,255,0.15);font-weight:900;font-size:1.1rem;color:white;flex-shrink:0;">E</div>
          <div>
            <h5>EMCALI EICE ESP</h5>
            <small>Sistema de Gestión MOP</small>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">Navegación</div>
        ${navItems.map(item => `
          <a href="${item.href}" class="sidebar-link ${activePage === item.page ? 'active' : ''}">
            <i class="bi ${item.icon}"></i>
            ${item.label}
          </a>
        `).join('')}

        <div class="nav-section-title mt-3">Macroprocesos</div>
        <a href="mop.html?mp=MP01" class="sidebar-link" style="font-size:0.8rem;padding:0.45rem 1.5rem;">
          <span style="width:10px;height:10px;background:var(--mp01);border-radius:50%;display:inline-block;flex-shrink:0;"></span>
          MP01 – Estrategia
        </a>
        <a href="mop.html?mp=MP02" class="sidebar-link" style="font-size:0.8rem;padding:0.45rem 1.5rem;">
          <span style="width:10px;height:10px;background:var(--mp02);border-radius:50%;display:inline-block;flex-shrink:0;"></span>
          MP02 – Acueducto
        </a>
        <a href="mop.html?mp=MP03" class="sidebar-link" style="font-size:0.8rem;padding:0.45rem 1.5rem;">
          <span style="width:10px;height:10px;background:var(--mp03);border-radius:50%;display:inline-block;flex-shrink:0;"></span>
          MP03 – Energía
        </a>
        <a href="mop.html?mp=MP04" class="sidebar-link" style="font-size:0.8rem;padding:0.45rem 1.5rem;">
          <span style="width:10px;height:10px;background:var(--mp04);border-radius:50%;display:inline-block;flex-shrink:0;"></span>
          MP04 – TIC
        </a>
        <a href="mop.html?mp=MP05" class="sidebar-link" style="font-size:0.8rem;padding:0.45rem 1.5rem;">
          <span style="width:10px;height:10px;background:var(--mp05);border-radius:50%;display:inline-block;flex-shrink:0;"></span>
          MP05 – Soporte
        </a>
      </nav>

      <div class="sidebar-user">
        <div class="d-flex align-items-center gap-2">
          <div class="d-inline-flex align-items-center justify-content-center rounded-circle"
               style="width:34px;height:34px;background:rgba(255,255,255,0.15);font-weight:700;color:white;font-size:0.9rem;flex-shrink:0;">
            ${user.nombre.charAt(0).toUpperCase()}
          </div>
          <div class="overflow-hidden">
            <div style="font-size:0.8rem;font-weight:600;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.nombre}</div>
            <small><span class="badge bg-${rolBadge[user.rol] || 'secondary'}">${rolLabel[user.rol] || user.rol}</span></small>
          </div>
        </div>
        <button class="btn btn-sm w-100 mt-2" style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-size:0.75rem;"
                onclick="logout()">
          <i class="bi bi-box-arrow-right me-1"></i>Cerrar sesión
        </button>
      </div>
    </aside>
  `;

  const topbarHTML = `
    <nav class="topbar">
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-sm btn-light d-md-none" onclick="document.getElementById('sidebar').classList.toggle('open')">
          <i class="bi bi-list fs-5"></i>
        </button>
        <span class="topbar-title">${pageTitle}</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span class="text-muted small d-none d-md-inline">
          <i class="bi bi-person-circle me-1"></i>${user.nombre}
        </span>
        <button class="btn btn-sm btn-outline-secondary" onclick="logout()">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </nav>
  `;

  document.getElementById('sidebar-mount').innerHTML = sidebarHTML;
  document.getElementById('topbar-mount').innerHTML = topbarHTML;
}

function logout() {
  Api.clearSession();
  window.location.href = '/login.html';
}
