/**
 * ==========================================================
 * CRM AVÍCOLA "QUÉ POLLO" - SISTEMA INTEGRAL COMERCIAL
 * Identidad Corporativa:
 * Rojo #E30613 | Verde #00A651 | Amarillo #FFD200 | Dorado #806B20 | Gris #333333
 * Ambato - Tungurahua - Ecuador
 * ==========================================================
 */

// Estado Global de la Aplicación
let state = {
  currentView: 'dashboard',
  currentUser: null,
  dashboardPeriod: 'hoy',
  productViewMode: 'cards',
  ordersFilter: 'TODOS',
  currentProfileFilter: 'TODOS',
  marketingTab: 'promos',
  orderItems: [], // Carrito para modal de pedidos
  
  // Datos del Negocio
  categories: [],
  clients: [],
  products: [],
  orders: [],
  invoices: [],
  crmInteractions: [],
  promotions: [],
  campaigns: [],
  loyaltyRewards: [],
  loyaltyLedger: [],
  userProfiles: [],
  auditLogs: [],
  
  // Instancias de Gráficos Chart.js
  charts: {
    salesTimeline: null,
    topProducts: null
  },
  
  // Elementos en Edición
  editingClientId: null,
  editingProductId: null,
  editingOrderId: null,
  editingUserId: null
};

// Notificaciones Toast con diseño corporativo
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  initDateBanner();
  await loadAllData();
  setupEventListeners();
  checkAuthSession();
  initCanvasDesigner();
});

// Inicializar fecha actual en el banner
function initDateBanner() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todayStr = new Date().toLocaleDateString('es-EC', options);
  const el = document.getElementById('dashboard-date-str');
  if (el) {
    el.textContent = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);
  }
}

// Cargar todos los módulos desde DataService (Supabase + LocalStorage)
async function loadAllData() {
  try {
    const ds = window.dataService;
    if (!ds) {
      console.warn('DataService no inicializado aún.');
      return;
    }

    const [
      cats, clis, prods, ords, invs, crm, promos, camps, rews, ledger, profs, logs
    ] = await Promise.all([
      ds.getCategories(),
      ds.getClients(),
      ds.getProducts(),
      ds.getOrders(),
      ds.getInvoices(),
      ds.getCRMInteractions(),
      ds.getPromotions(),
      ds.getCampaigns(),
      ds.getLoyaltyRewards(),
      ds.getLoyaltyLedger(),
      ds.getUserProfiles(),
      ds.getAuditLogs()
    ]);

    state.categories = cats || [];
    state.clients = clis || [];
    state.products = prods || [];
    state.orders = ords || [];
    state.invoices = invs || [];
    state.crmInteractions = crm || [];
    state.promotions = promos || [];
    state.campaigns = camps || [];
    state.loyaltyRewards = rews || [];
    state.loyaltyLedger = ledger || [];
    state.userProfiles = profs || [];
    state.auditLogs = logs || [];

    populateCategoryDropdowns();
    updateNavigationBadges();
  } catch (err) {
    console.error('Error cargando datos del sistema:', err);
  }
}

// Actualizar contadores numéricos en la barra lateral y pestañas
function updateNavigationBadges() {
  const bClients = document.getElementById('badge-count-clientes');
  const bProducts = document.getElementById('badge-count-productos');
  const bOrders = document.getElementById('badge-count-pedidos');
  const bInvoices = document.getElementById('badge-count-facturas');
  const bUsers = document.getElementById('badge-count-usuarios');
  const bUsersPending = document.getElementById('badge-users-pending');

  if (bClients) bClients.textContent = state.clients.length;
  if (bProducts) bProducts.textContent = state.products.length;
  if (bOrders) bOrders.textContent = state.orders.length;
  if (bInvoices) bInvoices.textContent = state.invoices.length;
  if (bUsers) bUsers.textContent = state.userProfiles.length;

  const pendingCount = (state.userProfiles || []).filter(u => u.estado === 'PENDIENTE').length;
  if (bUsersPending) {
    bUsersPending.textContent = pendingCount;
    if (pendingCount > 0) {
      bUsersPending.classList.remove('hidden');
    } else {
      bUsersPending.classList.add('hidden');
    }
  }

  // Badges en las pestañas del módulo Usuarios
  const bTabTodos = document.getElementById('badge-tab-todos');
  const bTabPendiente = document.getElementById('badge-tab-pendiente');
  const bTabAprobado = document.getElementById('badge-tab-aprobado');
  const bTabRechazado = document.getElementById('badge-tab-rechazado');
  const bTabDesactivado = document.getElementById('badge-tab-desactivado');

  if (bTabTodos) bTabTodos.textContent = state.userProfiles.length;
  if (bTabPendiente) bTabPendiente.textContent = state.userProfiles.filter(u => u.estado === 'PENDIENTE').length;
  if (bTabAprobado) bTabAprobado.textContent = state.userProfiles.filter(u => u.estado === 'APROBADO').length;
  if (bTabRechazado) bTabRechazado.textContent = state.userProfiles.filter(u => u.estado === 'RECHAZADO').length;
  if (bTabDesactivado) bTabDesactivado.textContent = state.userProfiles.filter(u => u.estado === 'DESACTIVADO').length;
}

// Configurar event listeners para filtros dinámicos
function setupEventListeners() {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const closeMobileBtn = document.getElementById('close-mobile-menu');
  if (mobileBtn) mobileBtn.addEventListener('click', openMobileMenu);
  if (closeMobileBtn) closeMobileBtn.addEventListener('click', closeMobileMenu);

  // Filtros Clientes
  const clientSearch = document.getElementById('filter-client-search');
  const clientType = document.getElementById('filter-client-type');
  const clientStatus = document.getElementById('filter-client-status');
  if (clientSearch) clientSearch.addEventListener('input', renderClientsTable);
  if (clientType) clientType.addEventListener('change', renderClientsTable);
  if (clientStatus) clientStatus.addEventListener('change', renderClientsTable);

  // Filtros Productos
  const prodSearch = document.getElementById('filter-product-search');
  const prodCat = document.getElementById('filter-product-category');
  if (prodSearch) prodSearch.addEventListener('input', renderProducts);
  if (prodCat) prodCat.addEventListener('change', renderProducts);

  // Filtros Pedidos
  const orderSearch = document.getElementById('filter-orders-search');
  if (orderSearch) orderSearch.addEventListener('input', renderOrdersTable);

  // Filtros Facturas
  const invoiceSearch = document.getElementById('filter-invoices-search');
  if (invoiceSearch) invoiceSearch.addEventListener('input', renderInvoicesTable);

  // WhatsApp Editor live preview
  const waMsgText = document.getElementById('wa-message-text');
  if (waMsgText) {
    waMsgText.addEventListener('input', () => {
      const p = document.getElementById('wa-preview-text');
      if (p) p.textContent = waMsgText.value || 'Vista previa del mensaje...';
    });
  }
}

function openMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.remove('hidden');
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.add('hidden');
}

// ==========================================
// NAVEGACIÓN Y ENRUTAMIENTO SPA (11 VISTAS)
// ==========================================
function switchView(viewName) {
  closeMobileMenu();

  // Protección de Rol para Usuarios y Facturación Crítica
  if (viewName === 'usuarios' && state.currentUser && state.currentUser.rol !== 'ADMINISTRADOR') {
    Toast.fire({ icon: 'warning', title: 'Módulo reservado para Administradoras' });
    viewName = 'dashboard';
  }

  state.currentView = viewName;

  const views = [
    'dashboard', 'clientes', 'productos', 'pedidos', 'facturas',
    'seguimiento', 'marketing', 'whatsapp', 'fidelizacion', 'reportes', 'usuarios'
  ];

  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.add('hidden');

    const navBtn = document.getElementById(`nav-btn-${v}`);
    if (navBtn) {
      navBtn.classList.remove('nav-link-active');
      navBtn.classList.add('nav-link-inactive');
    }
  });

  const activeView = document.getElementById(`view-${viewName}`);
  if (activeView) activeView.classList.remove('hidden');

  const activeNav = document.getElementById(`nav-btn-${viewName}`);
  if (activeNav) {
    activeNav.classList.add('nav-link-active');
    activeNav.classList.remove('nav-link-inactive');
  }

  // Renderizar la vista correspondiente
  switch (viewName) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'clientes':
      renderClientsTable();
      break;
    case 'productos':
      renderProducts();
      break;
    case 'pedidos':
      renderOrdersTable();
      break;
    case 'facturas':
      renderInvoicesTable();
      break;
    case 'seguimiento':
      renderCRMView();
      break;
    case 'marketing':
      renderMarketingView();
      break;
    case 'whatsapp':
      renderWhatsAppView();
      break;
    case 'fidelizacion':
      renderLoyaltyView();
      break;
    case 'reportes':
      // Estático con opciones de descarga
      break;
    case 'usuarios':
      renderUsuariosTable();
      break;
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ==========================================
// VALIDACIÓN MATEMÁTICA LEGAL ECUADOR (CÉDULA Y RUC)
// ==========================================

/**
 * Valida Cédula de Identidad Ecuatoriana (10 dígitos)
 * Algoritmo Módulo 10 según Registro Civil y SRI
 */
function validateCedulaEcuador(cedula) {
  if (!cedula || typeof cedula !== 'string') return { valid: false, msg: 'Cédula requerida' };
  cedula = cedula.trim();
  if (cedula.length !== 10) return { valid: false, msg: 'Debe tener exactamente 10 dígitos' };
  if (!/^\d{10}$/.test(cedula)) return { valid: false, msg: 'Solo debe contener números' };

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { valid: false, msg: 'Código de provincia inválido (01-24)' };
  }

  const tercerDigito = parseInt(cedula.charAt(2), 10);
  if (tercerDigito >= 6) {
    return { valid: false, msg: 'Tercer dígito debe ser menor a 6 para cédula' };
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const digitoVerificadorCalculado = (10 - (suma % 10)) % 10;
  const digitoVerificadorReal = parseInt(cedula.charAt(9), 10);

  if (digitoVerificadorCalculado !== digitoVerificadorReal) {
    return { valid: false, msg: 'Dígito verificador inválido' };
  }

  return { valid: true, msg: 'Cédula válida SRI' };
}

/**
 * Valida RUC Ecuatoriano (13 dígitos)
 * Cubre: Persona Natural, Sociedades Privadas / Extranjeras, Instituciones Públicas
 */
function validateRucEcuador(ruc) {
  if (!ruc || typeof ruc !== 'string') return { valid: false, msg: 'RUC requerido' };
  ruc = ruc.trim();
  if (ruc.length !== 13) return { valid: false, msg: 'El RUC debe tener 13 dígitos' };
  if (!/^\d{13}$/.test(ruc)) return { valid: false, msg: 'Solo debe contener dígitos' };

  const provincia = parseInt(ruc.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return { valid: false, msg: 'Código de provincia inválido' };
  }

  const tercerDigito = parseInt(ruc.charAt(2), 10);

  // 1. RUC Persona Natural (Tercer dígito < 6) -> Primeros 10 cédula + 001
  if (tercerDigito < 6) {
    const cedulaPart = ruc.substring(0, 10);
    const estPart = ruc.substring(10, 13);
    const valCed = validateCedulaEcuador(cedulaPart);
    if (!valCed.valid) return { valid: false, msg: `Cédula base de RUC inválida: ${valCed.msg}` };
    if (estPart === '000') return { valid: false, msg: 'Código de establecimiento no puede ser 000' };
    return { valid: true, msg: 'RUC Persona Natural válido' };
  }

  // 2. RUC Sociedades Privadas y Extranjeras (Tercer dígito = 9)
  if (tercerDigito === 9) {
    if (ruc.substring(10, 13) === '000') return { valid: false, msg: 'Establecimiento no puede ser 000' };
    const coef = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      suma += parseInt(ruc.charAt(i), 10) * coef[i];
    }
    const residuo = suma % 11;
    const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;
    if (digitoVerificador !== parseInt(ruc.charAt(9), 10)) {
      return { valid: false, msg: 'RUC Jurídico: Dígito verificador inválido' };
    }
    return { valid: true, msg: 'RUC Sociedad Privada válido' };
  }

  // 3. RUC Instituciones Públicas (Tercer dígito = 6)
  if (tercerDigito === 6) {
    if (ruc.substring(9, 13) === '0000') return { valid: false, msg: 'Establecimiento público no puede ser 0000' };
    const coef = [3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 8; i++) {
      suma += parseInt(ruc.charAt(i), 10) * coef[i];
    }
    const residuo = suma % 11;
    const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;
    if (digitoVerificador !== parseInt(ruc.charAt(8), 10)) {
      return { valid: false, msg: 'RUC Público: Dígito verificador inválido' };
    }
    return { valid: true, msg: 'RUC Institución Pública válido' };
  }

  return { valid: false, msg: 'Tercer dígito de RUC inválido' };
}

// Validación en vivo en el formulario de Cliente
function validateDocumentInput() {
  const typeSelect = document.getElementById('client-id-type');
  const docInput = document.getElementById('client-doc-number');
  const feedback = document.getElementById('client-doc-feedback');
  const saveBtn = document.getElementById('btn-save-client');

  if (!typeSelect || !docInput || !feedback) return;

  const type = typeSelect.value;
  const value = docInput.value.trim();

  if (!value) {
    feedback.textContent = 'Ingresa una identificación válida';
    feedback.className = 'text-[10px] mt-1 text-gray-400';
    if (saveBtn) saveBtn.disabled = false;
    return;
  }

  let result = { valid: true, msg: 'Identificación válida' };

  if (type === 'Cédula') {
    result = validateCedulaEcuador(value);
  } else if (type === 'RUC Natural' || type === 'RUC Jurídico') {
    result = validateRucEcuador(value);
  } else if (type === 'Pasaporte') {
    result = { valid: value.length >= 6, msg: value.length >= 6 ? 'Pasaporte válido' : 'Mínimo 6 caracteres' };
  }

  if (result.valid) {
    feedback.textContent = `✓ ${result.msg}`;
    feedback.className = 'text-[10px] mt-1 text-[#00A651] font-bold';
    if (saveBtn) saveBtn.disabled = false;
  } else {
    feedback.textContent = `✗ ${result.msg}`;
    feedback.className = 'text-[10px] mt-1 text-[#E30613] font-bold';
    // No bloqueamos completamente para permitir guardar clientes de prueba si es necesario, pero advertimos
  }
}

// ==========================================
// 1. DASHBOARD & GRÁFICOS (CHART.JS)
// ==========================================
function setDashboardPeriod(period) {
  state.dashboardPeriod = period;

  ['hoy', 'semana', 'mes', 'anio'].forEach(p => {
    const btn = document.getElementById(`btn-period-${p}`);
    if (btn) {
      if (p === period) {
        btn.className = 'px-3 py-1.5 rounded-xl font-bold bg-white text-[#E30613] shadow-xs';
      } else {
        btn.className = 'px-3 py-1.5 rounded-xl font-semibold hover:bg-white/20 text-white';
      }
    }
  });

  renderDashboard();
}

function renderDashboard() {
  const period = state.dashboardPeriod;
  const today = new Date().toISOString().split('T')[0];

  // Filtrar facturas según el periodo
  const validInvoices = state.invoices.filter(inv => inv.estado !== 'ANULADA');

  const filteredInvoices = validInvoices.filter(inv => {
    if (period === 'hoy') return inv.fecha === today;
    if (period === 'semana') {
      const invDate = new Date(inv.fecha);
      const diffTime = Math.abs(new Date() - invDate);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
    }
    if (period === 'mes') {
      return inv.fecha && inv.fecha.substring(0, 7) === today.substring(0, 7);
    }
    return true; // anio o todos
  });

  const totalRevenue = filteredInvoices.reduce((acc, inv) => acc + (parseFloat(inv.total) || 0), 0);
  const totalInvoicesCount = filteredInvoices.length;

  // KPIs Clientes
  const totalClients = state.clients.length;
  const newClients = state.clients.filter(c => c.tipo_cliente === 'Nuevo').length;
  const freqClients = state.clients.filter(c => c.tipo_cliente === 'Frecuente' || c.tipo_cliente === 'Mayorista').length;

  // KPIs Inventario
  const totalProducts = state.products.length;
  const availProducts = state.products.filter(p => (parseFloat(p.stock) || 0) > 0).length;
  const lowStockProducts = state.products.filter(p => (parseFloat(p.stock) || 0) <= (parseFloat(p.stock_minimo) || 10)).length;

  // KPIs Pedidos
  const totalOrders = state.orders.length;
  const pendingOrders = state.orders.filter(o => o.estado === 'Pendiente' || o.estado === 'En preparación').length;
  const completedOrders = state.orders.filter(o => o.estado === 'Entregado' || o.estado === 'Facturado').length;

  // Actualizar elementos DOM
  const elRev = document.getElementById('kpi-total-revenue');
  const elMonthRev = document.getElementById('kpi-month-revenue');
  const elInvCount = document.getElementById('kpi-invoices-count');
  if (elRev) elRev.textContent = `$${totalRevenue.toFixed(2)}`;
  if (elMonthRev) elMonthRev.textContent = `$${totalRevenue.toFixed(2)}`;
  if (elInvCount) elInvCount.textContent = totalInvoicesCount;

  const elTotCli = document.getElementById('kpi-total-clients');
  const elNewCli = document.getElementById('kpi-new-clients');
  const elFreqCli = document.getElementById('kpi-freq-clients');
  if (elTotCli) elTotCli.textContent = totalClients;
  if (elNewCli) elNewCli.textContent = newClients;
  if (elFreqCli) elFreqCli.textContent = freqClients;

  const elTotProd = document.getElementById('kpi-total-products');
  const elAvailProd = document.getElementById('kpi-avail-products');
  const elLowProd = document.getElementById('kpi-low-stock-products');
  if (elTotProd) elTotProd.textContent = totalProducts;
  if (elAvailProd) elAvailProd.textContent = availProducts;
  if (elLowProd) elLowProd.textContent = lowStockProducts;

  const elTotOrd = document.getElementById('kpi-total-orders');
  const elPendOrd = document.getElementById('kpi-pending-orders');
  const elCompOrd = document.getElementById('kpi-completed-orders');
  if (elTotOrd) elTotOrd.textContent = totalOrders;
  if (elPendOrd) elPendOrd.textContent = pendingOrders;
  if (elCompOrd) elCompOrd.textContent = completedOrders;

  renderDashboardRecentOrders();
  renderDashboardCharts();
}

function renderDashboardRecentOrders() {
  const tbody = document.getElementById('dashboard-recent-orders-body');
  if (!tbody) return;

  const recent = [...state.orders].reverse().slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-gray-400">No hay pedidos registrados aún.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(ord => {
    const client = state.clients.find(c => c.id_cliente === ord.id_cliente);
    const clientName = client ? `${client.nombre} ${client.apellido}` : ord.id_cliente;

    const statusBadge = getOrderStatusBadge(ord.estado);

    return `
      <tr class="hover:bg-gray-50/80 transition-colors">
        <td class="px-4 py-3 font-mono font-bold text-gray-800">${ord.numero_pedido || ord.id_pedido}</td>
        <td class="px-4 py-3 font-semibold">${clientName}</td>
        <td class="px-4 py-3 text-gray-500">${ord.fecha_pedido || ''}</td>
        <td class="px-4 py-3 font-black text-[#E30613]">$${parseFloat(ord.total || 0).toFixed(2)}</td>
        <td class="px-4 py-3">${statusBadge}</td>
        <td class="px-4 py-3 text-right">
          <button onclick="switchView('pedidos')" class="px-2.5 py-1 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">
            Detalle
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderDashboardCharts() {
  if (typeof Chart === 'undefined') return;

  // 1. Gráfico Timeline de Ventas
  const canvasTimeline = document.getElementById('chart-sales-timeline');
  if (canvasTimeline) {
    if (state.charts.salesTimeline) {
      state.charts.salesTimeline.destroy();
    }

    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dataValues = [145.50, 210.00, 180.25, 340.00, 520.80, 890.00, 640.50];

    state.charts.salesTimeline = new Chart(canvasTimeline, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ventas Diarias ($)',
          data: dataValues,
          borderColor: '#E30613',
          backgroundColor: 'rgba(227, 6, 19, 0.08)',
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#E30613',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => `$${v}` }
          }
        }
      }
    });
  }

  // 2. Gráfico Top Productos Vendidos
  const canvasTop = document.getElementById('chart-top-products');
  if (canvasTop) {
    if (state.charts.topProducts) {
      state.charts.topProducts.destroy();
    }

    const prodNames = state.products.slice(0, 5).map(p => p.nombre_producto);
    const prodCounts = [140, 95, 80, 60, 45].slice(0, prodNames.length);

    state.charts.topProducts = new Chart(canvasTop, {
      type: 'doughnut',
      data: {
        labels: prodNames.length > 0 ? prodNames : ['Pollo Entero', 'Pechuga Especial', 'Muslos', 'Alitas'],
        datasets: [{
          data: prodNames.length > 0 ? prodCounts : [40, 25, 20, 15],
          backgroundColor: ['#E30613', '#00A651', '#FFD200', '#806B20', '#333333']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
        }
      }
    });
  }
}

// ==========================================
// 2. GESTIÓN DE CLIENTES & VALIDACIÓN SRI
// ==========================================
function renderClientsTable() {
  const tbody = document.getElementById('table-clientes-body');
  if (!tbody) return;

  const search = (document.getElementById('filter-client-search')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('filter-client-type')?.value || '';
  const statusFilter = document.getElementById('filter-client-status')?.value || '';

  const filtered = state.clients.filter(cli => {
    const fullName = `${cli.nombre || ''} ${cli.apellido || ''}`.toLowerCase();
    const doc = (cli.cedula_ruc || '').toLowerCase();
    const phone = (cli.telefono || '').toLowerCase();

    const matchSearch = fullName.includes(search) || doc.includes(search) || phone.includes(search);
    const matchType = !typeFilter || cli.tipo_cliente === typeFilter;
    const matchStatus = !statusFilter || (cli.estado || 'Activo') === statusFilter;

    return matchSearch && matchType && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">No se encontraron clientes con los filtros aplicados.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(cli => {
    const isBlocked = cli.estado === 'Bloqueado';
    const statusBadge = isBlocked
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">🔴 Bloqueado</span>`
      : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">🟢 Activo</span>`;

    const typeBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-gray-100 text-gray-700">${cli.tipo_cliente || 'Normal'}</span>`;

    const cleanPhone = (cli.telefono || '').replace(/\D/g, '');
    const waLink = cleanPhone ? `https://wa.me/593${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}` : '#';

    return `
      <tr class="hover:bg-gray-50/80 transition-colors ${isBlocked ? 'bg-red-50/30' : ''}">
        <td class="px-4 py-3 font-mono font-bold text-gray-700">${cli.id_cliente}</td>
        <td class="px-4 py-3">
          <p class="font-bold text-gray-900">${cli.nombre} ${cli.apellido}</p>
          <span class="text-[11px] text-gray-500">${cli.correo || 'Sin correo'}</span>
        </td>
        <td class="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
          <span class="text-[10px] block text-gray-400 uppercase font-sans">${cli.tipo_identificacion || 'Cédula'}</span>
          ${cli.cedula_ruc}
        </td>
        <td class="px-4 py-3">
          ${cleanPhone ? `
            <a href="${waLink}" target="_blank" class="inline-flex items-center space-x-1 text-[#00A651] font-bold hover:underline">
              <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
              <span>${cli.telefono}</span>
            </a>
          ` : '<span class="text-gray-400">Sin teléfono</span>'}
          <span class="block text-[11px] text-gray-500">${cli.ciudad || 'Ambato'}, ${cli.provincia || 'Tungurahua'}</span>
        </td>
        <td class="px-4 py-3">
          ${typeBadge}
          <span class="block text-[11px] font-bold text-[#E30613] mt-0.5">🌟 ${cli.puntos_fidelidad || 0} pts</span>
        </td>
        <td class="px-4 py-3">${statusBadge}</td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center justify-end space-x-1.5">
            <button onclick="editClient('${cli.id_cliente}')" title="Editar Cliente" class="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="toggleClientBlock('${cli.id_cliente}')" title="${isBlocked ? 'Desbloquear Cliente' : 'Bloquear Cliente'}" class="p-1.5 rounded-lg ${isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}">
              <i data-lucide="${isBlocked ? 'check-circle' : 'slash'}" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteClientPrompt('${cli.id_cliente}')" title="Eliminar Cliente" class="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openClientModal(clientId = null) {
  state.editingClientId = clientId;
  const form = document.getElementById('form-client');
  if (form) form.reset();

  const title = document.getElementById('modal-client-title');
  const idInput = document.getElementById('client-id');
  const feedback = document.getElementById('client-doc-feedback');

  if (feedback) {
    feedback.textContent = 'Ingresa una identificación válida';
    feedback.className = 'text-[10px] mt-1 text-gray-400';
  }

  if (clientId) {
    const cli = state.clients.find(c => c.id_cliente === clientId);
    if (!cli) return;

    if (title) title.textContent = 'Editar Cliente Registrado';
    if (idInput) idInput.value = cli.id_cliente;

    document.getElementById('client-id-type').value = cli.tipo_identificacion || 'Cédula';
    document.getElementById('client-doc-number').value = cli.cedula_ruc || '';
    document.getElementById('client-name').value = cli.nombre || '';
    document.getElementById('client-lastname').value = cli.apellido || '';
    document.getElementById('client-phone').value = cli.telefono || '';
    document.getElementById('client-email').value = cli.correo || '';
    document.getElementById('client-province').value = cli.provincia || 'Tungurahua';
    document.getElementById('client-city').value = cli.ciudad || 'Ambato';
    document.getElementById('client-sector').value = cli.sector || '';
    document.getElementById('client-address').value = cli.direccion || '';
    document.getElementById('client-type-select').value = cli.tipo_cliente || 'Nuevo';
    document.getElementById('client-status-select').value = cli.estado || 'Activo';

    validateDocumentInput();
  } else {
    if (title) title.textContent = 'Registrar Nuevo Cliente';
    if (idInput) idInput.value = `CLI-${Date.now().toString().slice(-6)}`;
    document.getElementById('client-province').value = 'Tungurahua';
    document.getElementById('client-city').value = 'Ambato';
    document.getElementById('client-type-select').value = 'Nuevo';
    document.getElementById('client-status-select').value = 'Activo';
  }

  openModal('modal-client');
}

function editClient(id) {
  openClientModal(id);
}

async function handleSaveClient(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('client-id')?.value;
  const tipoIdentificacion = document.getElementById('client-id-type')?.value;
  const cedulaRuc = document.getElementById('client-doc-number')?.value.trim();
  const nombre = document.getElementById('client-name')?.value.trim();
  const apellido = document.getElementById('client-lastname')?.value.trim();
  const telefono = document.getElementById('client-phone')?.value.trim();
  const correo = document.getElementById('client-email')?.value.trim();
  const provincia = document.getElementById('client-province')?.value.trim();
  const ciudad = document.getElementById('client-city')?.value.trim();
  const sector = document.getElementById('client-sector')?.value.trim();
  const direccion = document.getElementById('client-address')?.value.trim();
  const tipoCliente = document.getElementById('client-type-select')?.value;
  const estado = document.getElementById('client-status-select')?.value;

  if (!cedulaRuc || !nombre || !apellido || !telefono) {
    Toast.fire({ icon: 'warning', title: 'Completa los campos obligatorios (*)' });
    return;
  }

  // Validación SRI obligatoria antes de guardar
  let valCheck = { valid: true };
  if (tipoIdentificacion === 'Cédula') valCheck = validateCedulaEcuador(cedulaRuc);
  else if (tipoIdentificacion.startsWith('RUC')) valCheck = validateRucEcuador(cedulaRuc);

  if (!valCheck.valid) {
    const confirmSave = await Swal.fire({
      title: 'Identificación Inválida',
      text: `El número ingresado no cumple con el algoritmo oficial del SRI: "${valCheck.msg}". ¿Deseas guardarlo de todas formas?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E30613',
      confirmButtonText: 'Sí, guardar de todos modos',
      cancelButtonText: 'Corregir'
    });
    if (!confirmSave.isConfirmed) return;
  }

  const existingClient = state.clients.find(c => c.id_cliente === id);
  const clientData = {
    id_cliente: id,
    tipo_identificacion: tipoIdentificacion,
    cedula_ruc: cedulaRuc,
    nombre,
    apellido,
    telefono,
    correo,
    provincia,
    ciudad,
    sector,
    direccion,
    tipo_cliente: tipoCliente,
    estado,
    puntos_fidelidad: existingClient ? existingClient.puntos_fidelidad : 0
  };

  try {
    await window.dataService.saveClient(clientData);
    state.clients = await window.dataService.getClients();
    updateNavigationBadges();
    renderClientsTable();
    closeModal('modal-client');
    Toast.fire({ icon: 'success', title: 'Cliente guardado correctamente' });
  } catch (err) {
    console.error('Error guardando cliente:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

async function toggleClientBlock(clientId) {
  const cli = state.clients.find(c => c.id_cliente === clientId);
  if (!cli) return;

  const willBlock = cli.estado !== 'Bloqueado';
  const actionText = willBlock ? 'Bloquear' : 'Desbloquear';

  const res = await Swal.fire({
    title: `¿${actionText} Cliente?`,
    text: `El cliente ${cli.nombre} ${cli.apellido} ${willBlock ? 'no podrá registrar nuevos pedidos en el sistema' : 'volverá a estar habilitado para compras'}.`,
    icon: willBlock ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonColor: willBlock ? '#E30613' : '#00A651',
    confirmButtonText: `Sí, ${actionText.toLowerCase()}`,
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      await window.dataService.toggleClientBlock(clientId, willBlock);
      state.clients = await window.dataService.getClients();
      renderClientsTable();
      Toast.fire({ icon: 'success', title: `Cliente ${willBlock ? 'bloqueado' : 'desbloqueado'} con éxito` });
    } catch (err) {
      console.error('Error cambiando estado de cliente:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

async function deleteClientPrompt(clientId) {
  const cli = state.clients.find(c => c.id_cliente === clientId);
  if (!cli) return;

  const res = await Swal.fire({
    title: '¿Eliminar Cliente?',
    text: `Se eliminará el cliente ${cli.nombre} ${cli.apellido}. Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      await window.dataService.deleteClient(clientId);
      state.clients = await window.dataService.getClients();
      updateNavigationBadges();
      renderClientsTable();
      Toast.fire({ icon: 'success', title: 'Cliente eliminado' });
    } catch (err) {
      console.error('Error eliminando cliente:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

// ==========================================
// 3. PRODUCTOS & INVENTARIO (KARDEX)
// ==========================================
function setProductViewMode(mode) {
  state.productViewMode = mode;
  const cardsContainer = document.getElementById('products-cards-container');
  const tableContainer = document.getElementById('products-table-container');
  const btnCards = document.getElementById('btn-prod-view-cards');
  const btnTable = document.getElementById('btn-prod-view-table');

  if (mode === 'cards') {
    if (cardsContainer) cardsContainer.classList.remove('hidden');
    if (tableContainer) tableContainer.classList.add('hidden');
    if (btnCards) {
      btnCards.className = 'p-1.5 rounded-lg text-xs font-bold bg-white text-[#333333] shadow-xs';
    }
    if (btnTable) {
      btnTable.className = 'p-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800';
    }
  } else {
    if (cardsContainer) cardsContainer.classList.add('hidden');
    if (tableContainer) tableContainer.classList.remove('hidden');
    if (btnCards) {
      btnCards.className = 'p-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-800';
    }
    if (btnTable) {
      btnTable.className = 'p-1.5 rounded-lg text-xs font-bold bg-white text-[#333333] shadow-xs';
    }
  }

  renderProducts();
}

function renderProducts() {
  const search = (document.getElementById('filter-product-search')?.value || '').toLowerCase();
  const catFilter = document.getElementById('filter-product-category')?.value || '';

  const filtered = state.products.filter(p => {
    const matchName = (p.nombre_producto || '').toLowerCase().includes(search) || (p.id_producto || '').toLowerCase().includes(search);
    const matchCat = !catFilter || p.categoria === catFilter;
    return matchName && matchCat;
  });

  const cardsContainer = document.getElementById('products-cards-container');
  const tableBody = document.getElementById('table-productos-body');

  // Render Modo Cards
  if (cardsContainer) {
    if (filtered.length === 0) {
      cardsContainer.innerHTML = `<div class="col-span-full py-8 text-center text-gray-400">No hay productos que coincidan.</div>`;
    } else {
      cardsContainer.innerHTML = filtered.map(p => {
        const stock = parseFloat(p.stock) || 0;
        const minStock = parseFloat(p.stock_minimo) || 10;
        const isLow = stock <= minStock;

        return `
          <div class="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">${p.categoria}</span>
                <span class="font-mono text-[10px] font-bold text-gray-400">${p.id_producto}</span>
              </div>
              <h4 class="font-bold text-gray-800 text-sm mt-2">${p.nombre_producto}</h4>
              <p class="text-xs text-gray-500 mt-0.5">${p.descripcion || 'Producto Avícola Fresco'}</p>
            </div>

            <div class="mt-4 pt-3 border-t border-gray-100 flex items-end justify-between">
              <div>
                <span class="text-[10px] text-gray-400 block">Precio Venta</span>
                <span class="text-lg font-black text-[#E30613]">$${parseFloat(p.precio_venta || 0).toFixed(2)}</span>
                <span class="text-[10px] text-gray-500 font-medium block">x ${p.unidad_medida || 'Unidad'}</span>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-gray-400 block">Stock Disponible</span>
                <span class="text-sm font-bold ${isLow ? 'text-red-600' : 'text-[#00A651]'}">${stock} ${p.unidad_medida || 'u'}</span>
                ${isLow ? '<span class="block text-[9px] font-bold text-red-500">¡Bajo Stock!</span>' : ''}
              </div>
            </div>

            <div class="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end space-x-1">
              <button onclick="openStockAdjustmentModal('${p.id_producto}')" title="Ajuste Kardex" class="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-bold flex items-center space-x-1">
                <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                <span>Kardex</span>
              </button>
              <button onclick="editProduct('${p.id_producto}')" title="Editar" class="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteProductPrompt('${p.id_producto}')" title="Eliminar" class="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render Modo Tabla
  if (tableBody) {
    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">No hay productos registrados.</td></tr>`;
    } else {
      tableBody.innerHTML = filtered.map(p => {
        const stock = parseFloat(p.stock) || 0;
        const minStock = parseFloat(p.stock_minimo) || 10;
        const isLow = stock <= minStock;

        return `
          <tr class="hover:bg-gray-50/80 transition-colors">
            <td class="px-4 py-3 font-mono font-bold text-gray-700">${p.id_producto}</td>
            <td class="px-4 py-3 font-bold text-gray-800">${p.nombre_producto}</td>
            <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100">${p.categoria}</span></td>
            <td class="px-4 py-3 font-mono text-gray-500">$${parseFloat(p.precio_costo || 0).toFixed(2)}</td>
            <td class="px-4 py-3 font-mono font-bold text-[#E30613]">$${parseFloat(p.precio_venta || 0).toFixed(2)}</td>
            <td class="px-4 py-3">
              <span class="font-bold ${isLow ? 'text-red-600' : 'text-[#00A651]'}">${stock} ${p.unidad_medida || 'Unidad'}</span>
              ${isLow ? '<span class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-700">BAJO</span>' : ''}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end space-x-1">
                <button onclick="openStockAdjustmentModal('${p.id_producto}')" title="Ajuste Kardex" class="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50">
                  <i data-lucide="sliders" class="w-4 h-4"></i>
                </button>
                <button onclick="editProduct('${p.id_producto}')" title="Editar" class="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteProductPrompt('${p.id_producto}')" title="Eliminar" class="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

function openProductModal(prodId = null) {
  state.editingProductId = prodId;
  const form = document.getElementById('form-product');
  if (form) form.reset();

  populateCategoryDropdowns();

  const title = document.getElementById('modal-product-title');
  const idInput = document.getElementById('product-id');

  if (prodId) {
    const prod = state.products.find(p => p.id_producto === prodId);
    if (!prod) return;

    if (title) title.textContent = 'Editar Producto';
    if (idInput) idInput.value = prod.id_producto;

    document.getElementById('product-category').value = prod.categoria || '';
    document.getElementById('product-name').value = prod.nombre_producto || '';
    document.getElementById('product-desc').value = prod.descripcion || '';
    document.getElementById('product-price-v').value = prod.precio_venta || '';
    document.getElementById('product-price-c').value = prod.precio_costo || '';
    document.getElementById('product-unit').value = prod.unidad_medida || 'Unidad';
    document.getElementById('product-stock').value = prod.stock || 0;
    document.getElementById('product-stock-min').value = prod.stock_minimo || 10;
  } else {
    if (title) title.textContent = 'Registrar Nuevo Producto';
    if (idInput) idInput.value = `PROD-${Date.now().toString().slice(-5)}`;
    document.getElementById('product-unit').value = 'Unidad';
    document.getElementById('product-stock').value = 50;
    document.getElementById('product-stock-min').value = 15;
  }

  openModal('modal-product');
}

function editProduct(id) {
  openProductModal(id);
}

async function handleSaveProduct(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('product-id')?.value;
  const categoria = document.getElementById('product-category')?.value;
  const nombre = document.getElementById('product-name')?.value.trim();
  const descripcion = document.getElementById('product-desc')?.value.trim();
  const precioVenta = parseFloat(document.getElementById('product-price-v')?.value) || 0;
  const precioCosto = parseFloat(document.getElementById('product-price-c')?.value) || 0;
  const unidadMedida = document.getElementById('product-unit')?.value || 'Unidad';
  const stock = parseFloat(document.getElementById('product-stock')?.value) || 0;
  const stockMinimo = parseFloat(document.getElementById('product-stock-min')?.value) || 10;

  if (!nombre || precioVenta <= 0) {
    Toast.fire({ icon: 'warning', title: 'Ingresa un nombre y precio de venta válido' });
    return;
  }

  const prodData = {
    id_producto: id,
    categoria,
    nombre_producto: nombre,
    descripcion,
    precio_venta: precioVenta,
    precio_costo: precioCosto,
    unidad_medida: unidadMedida,
    stock,
    stock_minimo: stockMinimo,
    activo: true
  };

  try {
    await window.dataService.saveProduct(prodData);
    state.products = await window.dataService.getProducts();
    updateNavigationBadges();
    renderProducts();
    closeModal('modal-product');
    Toast.fire({ icon: 'success', title: 'Producto guardado con éxito' });
  } catch (err) {
    console.error('Error guardando producto:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

async function deleteProductPrompt(prodId) {
  const prod = state.products.find(p => p.id_producto === prodId);
  if (!prod) return;

  const res = await Swal.fire({
    title: '¿Eliminar Producto?',
    text: `Se eliminará ${prod.nombre_producto}. Esta acción no se puede revertir.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      await window.dataService.deleteProduct(prodId);
      state.products = await window.dataService.getProducts();
      updateNavigationBadges();
      renderProducts();
      Toast.fire({ icon: 'success', title: 'Producto eliminado' });
    } catch (err) {
      console.error('Error eliminando producto:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

// Modal Kardex Ajuste de Inventario
function openStockAdjustmentModal(prodId = null) {
  const sel = document.getElementById('adj-product-select');
  if (sel) {
    sel.innerHTML = state.products.map(p => `
      <option value="${p.id_producto}" ${p.id_producto === prodId ? 'selected' : ''}>
        ${p.nombre_producto} (Stock actual: ${p.stock} ${p.unidad_medida || 'u'})
      </option>
    `).join('');
  }
  document.getElementById('adj-qty-input').value = '';
  document.getElementById('adj-reason-input').value = '';
  openModal('modal-stock-adjustment');
}

async function handleStockAdjustmentSubmit(e) {
  if (e) e.preventDefault();

  const prodId = document.getElementById('adj-product-select')?.value;
  const tipo = document.getElementById('adj-type-select')?.value; // Entrada / Salida
  const cantidad = parseFloat(document.getElementById('adj-qty-input')?.value) || 0;
  const motivo = document.getElementById('adj-reason-input')?.value.trim();

  if (!prodId || cantidad <= 0 || !motivo) {
    Toast.fire({ icon: 'warning', title: 'Completa todos los campos requeridos' });
    return;
  }

  const prod = state.products.find(p => p.id_producto === prodId);
  if (!prod) return;

  if (tipo === 'Salida' && (parseFloat(prod.stock) || 0) < cantidad) {
    Swal.fire({
      icon: 'error',
      title: 'Inventario Insuficiente',
      text: `No puedes dar salida a ${cantidad} unidades porque solo hay ${prod.stock} disponibles en stock.`,
      confirmButtonColor: '#E30613'
    });
    return;
  }

  try {
    await window.dataService.adjustProductStock(prodId, tipo, cantidad, motivo);
    state.products = await window.dataService.getProducts();
    renderProducts();
    closeModal('modal-stock-adjustment');
    Toast.fire({ icon: 'success', title: `Kardex actualizado: ${tipo} de ${cantidad} ${prod.unidad_medida || 'u'}` });
  } catch (err) {
    console.error('Error aplicando ajuste Kardex:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

// ==========================================
// 4. GESTIÓN DE PEDIDOS COMERCIALES
// ==========================================
function setOrdersFilter(status) {
  state.ordersFilter = status;

  ['todos', 'pendiente', 'confirmado', 'entregado'].forEach(s => {
    const btn = document.getElementById(`tab-orders-${s}`);
    if (btn) {
      if (s.toLowerCase() === status.toLowerCase() || (s === 'todos' && status === 'TODOS')) {
        btn.className = 'tab-order-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-[#333333] text-white';
      } else {
        btn.className = 'tab-order-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200';
      }
    }
  });

  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById('table-pedidos-body');
  if (!tbody) return;

  const search = (document.getElementById('filter-orders-search')?.value || '').toLowerCase();
  const statusFilter = state.ordersFilter;

  const filtered = state.orders.filter(ord => {
    const client = state.clients.find(c => c.id_cliente === ord.id_cliente);
    const clientName = client ? `${client.nombre} ${client.apellido}`.toLowerCase() : '';
    const num = (ord.numero_pedido || ord.id_pedido || '').toLowerCase();

    const matchSearch = num.includes(search) || clientName.includes(search);
    const matchStatus = statusFilter === 'TODOS' || ord.estado === statusFilter;

    return matchSearch && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">No hay pedidos para mostrar.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(ord => {
    const client = state.clients.find(c => c.id_cliente === ord.id_cliente);
    const clientName = client ? `${client.nombre} ${client.apellido}` : ord.id_cliente;
    const clientPhone = client ? client.telefono : '';

    const statusBadge = getOrderStatusBadge(ord.estado);
    const canInvoice = ord.estado !== 'Facturado' && ord.estado !== 'Cancelado';

    return `
      <tr class="hover:bg-gray-50/80 transition-colors">
        <td class="px-4 py-3 font-mono font-bold text-gray-800">${ord.numero_pedido || ord.id_pedido}</td>
        <td class="px-4 py-3">
          <p class="font-bold text-gray-900">${clientName}</p>
          <span class="text-[11px] text-gray-500">${clientPhone || 'Sin teléfono'}</span>
        </td>
        <td class="px-4 py-3 text-gray-500">${ord.fecha_pedido || ''}</td>
        <td class="px-4 py-3 font-medium text-gray-700">${ord.metodo_pago || 'Efectivo'}</td>
        <td class="px-4 py-3 font-black text-[#E30613]">$${parseFloat(ord.total || 0).toFixed(2)}</td>
        <td class="px-4 py-3">
          <select onchange="changeOrderStatus('${ord.id_pedido}', this.value)" class="text-xs font-bold rounded-lg border border-gray-200 py-1 px-2">
            <option value="Pendiente" ${ord.estado === 'Pendiente' ? 'selected' : ''}>🟡 Pendiente</option>
            <option value="Confirmado" ${ord.estado === 'Confirmado' ? 'selected' : ''}>🔵 Confirmado</option>
            <option value="En preparación" ${ord.estado === 'En preparación' ? 'selected' : ''}>🟣 En preparación</option>
            <option value="Entregado" ${ord.estado === 'Entregado' ? 'selected' : ''}>🟢 Entregado</option>
            <option value="Facturado" ${ord.estado === 'Facturado' ? 'selected' : ''}>📑 Facturado</option>
            <option value="Cancelado" ${ord.estado === 'Cancelado' ? 'selected' : ''}>🔴 Cancelado</option>
          </select>
        </td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center justify-end space-x-1">
            ${canInvoice ? `
              <button onclick="openInvoiceFromOrder('${ord.id_pedido}')" title="Emitir Factura SRI" class="px-2 py-1 rounded-lg bg-[#E30613] hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-1 shadow-xs">
                <i data-lucide="receipt" class="w-3.5 h-3.5"></i>
                <span>Facturar</span>
              </button>
            ` : ''}
            <button onclick="deleteOrderPrompt('${ord.id_pedido}')" title="Eliminar Pedido" class="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function getOrderStatusBadge(estado) {
  switch (estado) {
    case 'Confirmado':
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">🔵 Confirmado</span>`;
    case 'En preparación':
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">🟣 En preparación</span>`;
    case 'Entregado':
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">🟢 Entregado</span>`;
    case 'Facturado':
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">📑 Facturado</span>`;
    case 'Cancelado':
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">🔴 Cancelado</span>`;
    default:
      return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">🟡 Pendiente</span>`;
  }
}

// Modal Crear Pedido Multi-Producto
function openOrderModal(orderId = null) {
  state.editingOrderId = orderId;
  state.orderItems = [];

  const form = document.getElementById('form-order');
  if (form) form.reset();

  const idInput = document.getElementById('order-id');
  const dateInput = document.getElementById('order-date');
  const clientSel = document.getElementById('order-client-select');

  if (idInput) idInput.value = `PED-${Date.now().toString().slice(-6)}`;
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  if (clientSel) {
    clientSel.innerHTML = `
      <option value="">-- Seleccionar Cliente --</option>
      ${state.clients.map(c => `
        <option value="${c.id_cliente}">${c.nombre} ${c.apellido} (${c.cedula_ruc})</option>
      `).join('')}
    `;
  }

  // Agregar la primera fila de producto por defecto
  addOrderItemRow();
  calculateOrderTotals();
  openModal('modal-order');
}

function onOrderClientSelect() {
  const cliId = document.getElementById('order-client-select')?.value;
  const cli = state.clients.find(c => c.id_cliente === cliId);
  const addrInput = document.getElementById('order-delivery-address');
  if (cli && addrInput) {
    addrInput.value = `${cli.direccion || ''} (${cli.sector || cli.ciudad || 'Ambato'})`.trim();
  }
}

function addOrderItemRow() {
  const index = state.orderItems.length;
  const defaultProd = state.products[0];

  state.orderItems.push({
    id_producto: defaultProd ? defaultProd.id_producto : '',
    nombre_producto: defaultProd ? defaultProd.nombre_producto : '',
    cantidad: 1,
    precio_unitario: defaultProd ? parseFloat(defaultProd.precio_venta || 0) : 0,
    subtotal: defaultProd ? parseFloat(defaultProd.precio_venta || 0) : 0
  });

  renderOrderItems();
  calculateOrderTotals();
}

function removeOrderItemRow(index) {
  if (state.orderItems.length <= 1) {
    Toast.fire({ icon: 'info', title: 'El pedido debe contener al menos 1 producto' });
    return;
  }
  state.orderItems.splice(index, 1);
  renderOrderItems();
  calculateOrderTotals();
}

function onOrderItemChange(index, field, value) {
  const item = state.orderItems[index];
  if (!item) return;

  if (field === 'id_producto') {
    const prod = state.products.find(p => p.id_producto === value);
    if (prod) {
      item.id_producto = prod.id_producto;
      item.nombre_producto = prod.nombre_producto;
      item.precio_unitario = parseFloat(prod.precio_venta) || 0;
    }
  } else if (field === 'cantidad') {
    item.cantidad = Math.max(0.1, parseFloat(value) || 1);
  } else if (field === 'precio_unitario') {
    item.precio_unitario = Math.max(0, parseFloat(value) || 0);
  }

  item.subtotal = item.cantidad * item.precio_unitario;
  renderOrderItems();
  calculateOrderTotals();
}

function renderOrderItems() {
  const container = document.getElementById('order-items-container');
  if (!container) return;

  container.innerHTML = state.orderItems.map((item, idx) => `
    <div class="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-gray-200">
      <div class="col-span-5 sm:col-span-6">
        <select onchange="onOrderItemChange(${idx}, 'id_producto', this.value)" class="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold">
          ${state.products.map(p => `
            <option value="${p.id_producto}" ${p.id_producto === item.id_producto ? 'selected' : ''}>
              ${p.nombre_producto} ($${parseFloat(p.precio_venta).toFixed(2)})
            </option>
          `).join('')}
        </select>
      </div>

      <div class="col-span-3 sm:col-span-2">
        <input type="number" step="0.1" min="0.1" value="${item.cantidad}" oninput="onOrderItemChange(${idx}, 'cantidad', this.value)" class="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-center">
      </div>

      <div class="col-span-3 sm:col-span-3 text-right">
        <span class="font-mono font-black text-[#E30613] text-xs">$${item.subtotal.toFixed(2)}</span>
      </div>

      <div class="col-span-1 text-center">
        <button type="button" onclick="removeOrderItemRow(${idx})" class="text-gray-400 hover:text-red-600 p-1">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function calculateOrderTotals() {
  const subtotal = state.orderItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const total = subtotal;

  const subDisp = document.getElementById('order-subtotal-disp');
  const totDisp = document.getElementById('order-total-disp');
  if (subDisp) subDisp.textContent = `$${subtotal.toFixed(2)}`;
  if (totDisp) totDisp.textContent = `$${total.toFixed(2)}`;
}

async function handleSaveOrderSubmit(e) {
  if (e) e.preventDefault();

  const idPedido = document.getElementById('order-id')?.value;
  const fecha = document.getElementById('order-date')?.value;
  const idCliente = document.getElementById('order-client-select')?.value;
  const metodoPago = document.getElementById('order-payment-method')?.value;
  const estado = document.getElementById('order-status-select')?.value;
  const direccion = document.getElementById('order-delivery-address')?.value;
  const notas = document.getElementById('order-notes')?.value;

  if (!idCliente) {
    Toast.fire({ icon: 'warning', title: 'Selecciona el cliente solicitante' });
    return;
  }

  if (state.orderItems.length === 0) {
    Toast.fire({ icon: 'warning', title: 'Agrega al menos un producto al pedido' });
    return;
  }

  const subtotal = state.orderItems.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const total = subtotal;

  const orderData = {
    id_pedido: idPedido,
    numero_pedido: idPedido,
    id_cliente: idCliente,
    fecha_pedido: fecha,
    metodo_pago: metodoPago,
    estado: estado,
    direccion_entrega: direccion,
    observaciones: notas,
    subtotal: subtotal,
    descuento: 0,
    total: total,
    detalles: state.orderItems
  };

  try {
    await window.dataService.saveOrder(orderData);
    state.orders = await window.dataService.getOrders();
    state.products = await window.dataService.getProducts(); // Actualizar posibles stocks
    updateNavigationBadges();
    renderOrdersTable();
    closeModal('modal-order');
    Toast.fire({ icon: 'success', title: 'Pedido registrado con éxito' });
  } catch (err) {
    console.error('Error guardando pedido:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

async function changeOrderStatus(orderId, newStatus) {
  try {
    await window.dataService.updateOrderStatus(orderId, newStatus);
    state.orders = await window.dataService.getOrders();
    state.products = await window.dataService.getProducts();
    updateNavigationBadges();
    renderOrdersTable();
    Toast.fire({ icon: 'success', title: `Estado actualizado a ${newStatus}` });
  } catch (err) {
    console.error('Error actualizando estado del pedido:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

async function deleteOrderPrompt(orderId) {
  const ord = state.orders.find(o => o.id_pedido === orderId);
  if (!ord) return;

  const res = await Swal.fire({
    title: '¿Eliminar Pedido?',
    text: `Se eliminará el pedido ${ord.numero_pedido || ord.id_pedido}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      await window.dataService.deleteOrder(orderId);
      state.orders = await window.dataService.getOrders();
      updateNavigationBadges();
      renderOrdersTable();
      Toast.fire({ icon: 'success', title: 'Pedido eliminado' });
    } catch (err) {
      console.error('Error eliminando pedido:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

// ==========================================
// 5. FACTURACIÓN Y EMISIÓN SRI
// ==========================================
function renderInvoicesTable() {
  const tbody = document.getElementById('table-facturas-body');
  if (!tbody) return;

  const search = (document.getElementById('filter-invoices-search')?.value || '').toLowerCase();

  const filtered = state.invoices.filter(inv => {
    const num = (inv.numero_factura || inv.id_factura || '').toLowerCase();
    const cli = (inv.cliente_nombre || inv.id_cliente || '').toLowerCase();
    return num.includes(search) || cli.includes(search);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">No hay facturas registradas.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(inv => {
    const isAnulada = inv.estado === 'ANULADA';
    const statusBadge = isAnulada
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">🔴 ANULADA</span>`
      : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">🟢 EMITIDA</span>`;

    return `
      <tr class="hover:bg-gray-50/80 transition-colors ${isAnulada ? 'bg-red-50/20 opacity-75' : ''}">
        <td class="px-4 py-3 font-mono font-bold text-gray-800">${inv.numero_factura}</td>
        <td class="px-4 py-3 font-semibold text-gray-900">${inv.cliente_nombre || inv.id_cliente}</td>
        <td class="px-4 py-3 text-gray-500">${inv.fecha || ''}</td>
        <td class="px-4 py-3 font-mono text-gray-600">$${parseFloat(inv.subtotal || 0).toFixed(2)}</td>
        <td class="px-4 py-3 font-mono font-black text-[#E30613]">$${parseFloat(inv.total || 0).toFixed(2)}</td>
        <td class="px-4 py-3">${statusBadge}</td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center justify-end space-x-1.5">
            <button onclick="openReceiptModal('${inv.id_factura}')" title="Ver / Imprimir Comprobante" class="p-1.5 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
            ${!isAnulada ? `
              <button onclick="openCancelInvoiceModal('${inv.id_factura}')" title="Anular Factura SRI" class="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                <i data-lucide="x-circle" class="w-4 h-4"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Convertir un pedido en Factura SRI
async function openInvoiceFromOrder(orderId) {
  const ord = state.orders.find(o => o.id_pedido === orderId);
  if (!ord) return;

  const client = state.clients.find(c => c.id_cliente === ord.id_cliente);
  const clientName = client ? `${client.nombre} ${client.apellido}` : 'Consumidor Final';
  const clientDoc = client ? client.cedula_ruc : '9999999999999';

  const res = await Swal.fire({
    title: '¿Emitir Factura Comercial SRI?',
    html: `Se generará la factura oficial para el pedido <strong>${ord.numero_pedido || ord.id_pedido}</strong> a nombre de <strong>${clientName}</strong> por un total de <span class="font-bold text-[#E30613]">$${parseFloat(ord.total).toFixed(2)}</span>.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    confirmButtonText: 'Sí, emitir factura',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      const nextSeq = state.invoices.length + 1;
      const numFactura = `001-001-${nextSeq.toString().padStart(9, '0')}`;

      const invoiceData = {
        id_factura: `FAC-${Date.now().toString().slice(-6)}`,
        numero_factura: numFactura,
        id_pedido: ord.id_pedido,
        id_cliente: ord.id_cliente,
        cliente_nombre: clientName,
        cliente_doc: clientDoc,
        fecha: new Date().toISOString().split('T')[0],
        metodo_pago: ord.metodo_pago || 'Efectivo',
        subtotal: ord.subtotal || ord.total,
        iva: 0.00,
        total: ord.total,
        estado: 'EMITIDA',
        detalles: ord.detalles || []
      };

      await window.dataService.saveInvoice(invoiceData);
      await window.dataService.updateOrderStatus(ord.id_pedido, 'Facturado');

      state.invoices = await window.dataService.getInvoices();
      state.orders = await window.dataService.getOrders();
      updateNavigationBadges();
      renderOrdersTable();

      // Abrir recibo imprimible de inmediato
      openReceiptModal(invoiceData.id_factura);
      Toast.fire({ icon: 'success', title: `Factura ${numFactura} emitida` });
    } catch (err) {
      console.error('Error generando factura:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

// Modal Comprobante Imprimible
function openReceiptModal(invoiceId) {
  const inv = state.invoices.find(i => i.id_factura === invoiceId);
  if (!inv) return;

  document.getElementById('rcpt-num').textContent = inv.numero_factura || '001-001-000000001';
  document.getElementById('rcpt-date').textContent = inv.fecha || new Date().toISOString().split('T')[0];
  document.getElementById('rcpt-client').textContent = inv.cliente_nombre || 'Consumidor Final';
  document.getElementById('rcpt-doc').textContent = inv.cliente_doc || '9999999999';
  document.getElementById('rcpt-payment').textContent = inv.metodo_pago || 'Efectivo';

  const tbody = document.getElementById('rcpt-items-body');
  const items = inv.detalles && inv.detalles.length > 0 ? inv.detalles : [
    { cantidad: 1, nombre_producto: 'Consumo de Productos Avícolas', precio_unitario: inv.total, subtotal: inv.total }
  ];

  if (tbody) {
    tbody.innerHTML = items.map(it => `
      <tr>
        <td class="py-1">${it.cantidad}</td>
        <td class="py-1">${it.nombre_producto}</td>
        <td class="py-1 text-right font-mono">$${parseFloat(it.precio_unitario || 0).toFixed(2)}</td>
        <td class="py-1 text-right font-mono font-bold">$${parseFloat(it.subtotal || 0).toFixed(2)}</td>
      </tr>
    `).join('');
  }

  document.getElementById('rcpt-subtotal').textContent = `$${parseFloat(inv.subtotal || inv.total).toFixed(2)}`;
  document.getElementById('rcpt-iva').textContent = `$${parseFloat(inv.iva || 0).toFixed(2)}`;
  document.getElementById('rcpt-total').textContent = `$${parseFloat(inv.total).toFixed(2)}`;

  openModal('modal-receipt');
}

// Modal Anular Factura
function openCancelInvoiceModal(invoiceId) {
  const inv = state.invoices.find(i => i.id_factura === invoiceId);
  if (!inv) return;

  document.getElementById('cancel-invoice-id').value = inv.id_factura;
  document.getElementById('cancel-invoice-num').value = inv.numero_factura;
  document.getElementById('cancel-invoice-reason').value = '';

  openModal('modal-cancel-invoice');
}

async function handleCancelInvoiceSubmit(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('cancel-invoice-id')?.value;
  const motivo = document.getElementById('cancel-invoice-reason')?.value.trim();

  if (!motivo) {
    Toast.fire({ icon: 'warning', title: 'Debes ingresar el motivo de anulación' });
    return;
  }

  try {
    await window.dataService.cancelInvoice(id, motivo);
    state.invoices = await window.dataService.getInvoices();
    renderInvoicesTable();
    closeModal('modal-cancel-invoice');
    Toast.fire({ icon: 'success', title: 'Factura anulada formalmente' });
  } catch (err) {
    console.error('Error anulando factura:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

// ==========================================
// 6. SEGUIMIENTO COMERCIAL CRM
// ==========================================
function renderCRMView() {
  const container = document.getElementById('crm-timeline-container');
  if (!container) return;

  if (state.crmInteractions.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 py-4 text-center">No hay contactos registrados aún.</p>`;
    return;
  }

  container.innerHTML = state.crmInteractions.map(it => {
    const cli = state.clients.find(c => c.id_cliente === it.id_cliente);
    const cliName = cli ? `${cli.nombre} ${cli.apellido}` : it.id_cliente;

    return `
      <div class="flex items-start space-x-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60">
        <div class="w-8 h-8 rounded-full bg-red-100 text-[#E30613] flex items-center justify-center font-bold text-xs shrink-0">
          <i data-lucide="message-square" class="w-4 h-4"></i>
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-xs text-gray-800">${cliName}</h4>
            <span class="text-[10px] text-gray-400">${it.fecha || ''}</span>
          </div>
          <p class="text-xs text-gray-600 mt-1">${it.resumen_acuerdos || it.notas || ''}</p>
          <div class="mt-2 flex items-center space-x-2">
            <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-200 text-gray-700">${it.canal || 'WhatsApp'}</span>
            <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">${it.etapa_pipeline || 'Contactado'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openCRMInteractionModal() {
  const sel = document.getElementById('crm-client-select');
  if (sel) {
    sel.innerHTML = state.clients.map(c => `
      <option value="${c.id_cliente}">${c.nombre} ${c.apellido} (${c.telefono})</option>
    `).join('');
  }
  document.getElementById('crm-notes-input').value = '';
  openModal('modal-crm-interaction');
}

async function handleSaveCRMInteraction(e) {
  if (e) e.preventDefault();

  const idCli = document.getElementById('crm-client-select')?.value;
  const canal = document.getElementById('crm-channel-select')?.value;
  const etapa = document.getElementById('crm-stage-select')?.value;
  const notas = document.getElementById('crm-notes-input')?.value.trim();

  if (!notas) {
    Toast.fire({ icon: 'warning', title: 'Ingresa los acuerdos o notas del contacto' });
    return;
  }

  const interactionData = {
    id_interaccion: `INT-${Date.now().toString().slice(-6)}`,
    id_cliente: idCli,
    canal,
    etapa_pipeline: etapa,
    resumen_acuerdos: notas,
    fecha: new Date().toISOString().split('T')[0]
  };

  try {
    await window.dataService.saveCRMInteraction(interactionData);
    state.crmInteractions = await window.dataService.getCRMInteractions();
    renderCRMView();
    closeModal('modal-crm-interaction');
    Toast.fire({ icon: 'success', title: 'Contacto comercial registrado' });
  } catch (err) {
    console.error('Error registrando interacción CRM:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

// ==========================================
// 7. MARKETING, CALENDARIO & DISEÑADOR CANVAS
// ==========================================
function setMarketingTab(tab) {
  state.marketingTab = tab;

  ['promos', 'calendar', 'designer', 'campaigns'].forEach(t => {
    const btn = document.getElementById(`tab-mkt-${t}`);
    const content = document.getElementById(`mkt-content-${t}`);

    if (t === tab) {
      if (btn) btn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#333333] text-white shadow-xs';
      if (content) content.classList.remove('hidden');
    } else {
      if (btn) btn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200';
      if (content) content.classList.add('hidden');
    }
  });

  if (tab === 'designer') {
    updateAdCanvas();
  }
}

function renderMarketingView() {
  renderPromotions();
  renderCommercialCalendar();
  renderCampaigns();
}

function renderPromotions() {
  const container = document.getElementById('mkt-content-promos');
  if (!container) return;

  if (state.promotions.length === 0) {
    container.innerHTML = `<p class="col-span-full py-8 text-center text-gray-400 text-xs">No hay promociones activas registradas.</p>`;
    return;
  }

  container.innerHTML = state.promotions.map(promo => `
    <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-[#E30613]">OFERTA COMERCIAL</span>
          <span class="text-[11px] text-gray-400">${promo.fecha_inicio} al ${promo.fecha_fin}</span>
        </div>
        <h3 class="text-base font-bold text-gray-900 mt-2">${promo.titulo}</h3>
        <p class="text-xs text-gray-600 mt-1">${promo.descripcion || 'Aprovecha nuestras ofertas especiales en Ambato.'}</p>
      </div>

      <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span class="text-[10px] text-gray-400 block">Beneficio</span>
          <span class="text-base font-black text-[#00A651]">
            ${promo.tipo_descuento === 'Porcentaje' ? `${promo.valor_descuento}% OFF` : `$${promo.valor_descuento} Descuento`}
          </span>
        </div>
        <button onclick="sharePromoViaWhatsApp('${promo.titulo}', '${promo.valor_descuento}')" class="px-3 py-1.5 rounded-xl bg-[#00A651] hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1">
          <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
          <span>Compartir</span>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function renderCommercialCalendar() {
  const grid = document.getElementById('commercial-calendar-grid');
  if (!grid) return;

  const holidays = [
    { fecha: 'Febrero 2026', nombre: 'Fiesta de la Fruta y de las Flores (Ambato)', campana: 'Combo FFF Familiar' },
    { fecha: 'Febrero 2026', nombre: 'Carnaval en Tungurahua', campana: 'Parrillada Carnavalera' },
    { fecha: 'Abril 2026', nombre: 'Semana Santa', campana: 'Pescado y Alternativas Avícolas' },
    { fecha: 'Mayo 2026', nombre: 'Día de la Madre', campana: 'Almuerzo Especial para Mamá' },
    { fecha: 'Junio 2026', nombre: 'Día del Padre', campana: 'Combo Asado Papá' },
    { fecha: 'Noviembre 2026', nombre: 'Sol de Noviembre (Independencia Ambato)', campana: 'Festival del Pollo Ambateño' },
    { fecha: 'Diciembre 2026', nombre: 'Navidad & Cenas de Fin de Año', campana: 'Pollo Relleno Navideño' }
  ];

  grid.innerHTML = holidays.map(h => `
    <div class="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1">
      <span class="text-[10px] font-bold text-[#E30613] uppercase tracking-wider block">${h.fecha}</span>
      <h4 class="font-bold text-gray-800">${h.nombre}</h4>
      <p class="text-[11px] text-gray-500">Campaña Sugerida: <strong class="text-[#00A651]">${h.campana}</strong></p>
    </div>
  `).join('');
}

function renderCampaigns() {
  const container = document.getElementById('campaigns-list-container');
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">Activa</span>
        <span class="text-[11px] text-gray-400">Canal: WhatsApp + Redes</span>
      </div>
      <h3 class="text-sm font-bold text-gray-900">Campaña Permanente: Clientes Mayoristas de Tungurahua</h3>
      <p class="text-xs text-gray-500">Descuento de $0.10 por kilo a asaderos y restaurantes con compras semanales.</p>
    </div>

    <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">Activa</span>
        <span class="text-[11px] text-gray-400">Canal: Local Físico</span>
      </div>
      <h3 class="text-sm font-bold text-gray-900">PolloPuntos de Fidelidad</h3>
      <p class="text-xs text-gray-500">Acumula 1 punto por cada $10 de compra en mostrador.</p>
    </div>
  `;
}

function openPromotionModal() {
  openModal('modal-promotion');
}

async function handleSavePromotion(e) {
  if (e) e.preventDefault();

  const titulo = document.getElementById('promo-title-input')?.value.trim();
  const tipo = document.getElementById('promo-type-select')?.value;
  const valor = parseFloat(document.getElementById('promo-value-input')?.value) || 0;
  const ini = document.getElementById('promo-start-date')?.value;
  const fin = document.getElementById('promo-end-date')?.value;
  const desc = document.getElementById('promo-desc-input')?.value.trim();

  if (!titulo || valor <= 0 || !ini || !fin) {
    Toast.fire({ icon: 'warning', title: 'Completa los campos obligatorios' });
    return;
  }

  const promoData = {
    id_promocion: `PRM-${Date.now().toString().slice(-6)}`,
    titulo,
    tipo_descuento: tipo,
    valor_descuento: valor,
    fecha_inicio: ini,
    fecha_fin: fin,
    descripcion: desc
  };

  try {
    await window.dataService.savePromotion(promoData);
    state.promotions = await window.dataService.getPromotions();
    renderPromotions();
    closeModal('modal-promotion');
    Toast.fire({ icon: 'success', title: 'Promoción creada' });
  } catch (err) {
    console.error('Error guardando promoción:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

// ==========================================
// DISEÑADOR GRÁFICO HTML5 CANVAS
// ==========================================
let canvasLogoImage = null;

function initCanvasDesigner() {
  const prodSelect = document.getElementById('ad-product-select');
  if (prodSelect) {
    prodSelect.innerHTML = state.products.map(p => `
      <option value="${p.id_producto}">${p.nombre_producto} (Normal: $${parseFloat(p.precio_venta).toFixed(2)})</option>
    `).join('');
  }

  // Cargar logotipo oficial
  canvasLogoImage = new Image();
  canvasLogoImage.src = 'logo.png';
  canvasLogoImage.onload = () => {
    updateAdCanvas();
  };
}

function onAdProductChange() {
  const prodId = document.getElementById('ad-product-select')?.value;
  const prod = state.products.find(p => p.id_producto === prodId);
  if (prod) {
    const normalPrice = parseFloat(prod.precio_venta) || 0;
    const promoPrice = (normalPrice * 0.85).toFixed(2); // 15% sugerido

    document.getElementById('ad-price-normal').value = normalPrice.toFixed(2);
    document.getElementById('ad-price-promo').value = promoPrice;
    document.getElementById('ad-subtitle-input').value = `Pollo fresco seleccionado • ${prod.nombre_producto}`;
    updateAdCanvas();
  }
}

function updateAdCanvas() {
  const canvas = document.getElementById('ad-preview-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const format = document.getElementById('ad-format-select')?.value || 'square';

  // Dimensiones según formato
  let width = 1080;
  let height = 1080;

  if (format === 'story') {
    width = 1080;
    height = 1920;
  } else if (format === 'banner') {
    width = 1200;
    height = 630;
  }

  canvas.width = width;
  canvas.height = height;

  // 1. Fondo Corporativo Degradado
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#E30613');
  gradient.addColorStop(0.5, '#B7050F');
  gradient.addColorStop(1, '#1A1A1A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Elementos Decorativos de Fondo (Círculos dorados sutiles)
  ctx.fillStyle = 'rgba(255, 210, 0, 0.08)';
  ctx.beginPath();
  ctx.arc(width * 0.85, height * 0.2, width * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(width * 0.1, height * 0.8, width * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // 3. Logo Oficial
  if (canvasLogoImage && canvasLogoImage.complete && canvasLogoImage.naturalWidth > 0) {
    const logoW = width * 0.28;
    const logoH = (canvasLogoImage.height / canvasLogoImage.width) * logoW;
    ctx.drawImage(canvasLogoImage, (width - logoW) / 2, height * 0.08, logoW, logoH);
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AVÍCOLA QUÉ POLLO', width / 2, height * 0.14);
  }

  // 4. Título Principal
  const title = document.getElementById('ad-title-input')?.value || '¡GRAN OFERTA DEL DÍA!';
  ctx.fillStyle = '#FFD200';
  ctx.font = '900 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;
  ctx.fillText(title.toUpperCase(), width / 2, height * 0.38);
  ctx.shadowBlur = 0; // reset

  // 5. Mensaje Secundario / Producto
  const subtitle = document.getElementById('ad-subtitle-input')?.value || 'Frescura y el Mejor Sabor a tu Mesa';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(subtitle, width / 2, height * 0.44);

  // 6. Tarjeta Central Blanca de Precios
  const cardW = width * 0.72;
  const cardH = height * 0.28;
  const cardX = (width - cardW) / 2;
  const cardY = height * 0.50;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 32);
  ctx.fill();

  // Sello / Badge de Descuento
  const badgeText = document.getElementById('ad-badge-text')?.value || 'AHORRA 18%';
  ctx.fillStyle = '#00A651';
  ctx.beginPath();
  ctx.roundRect(cardX + cardW - 220, cardY - 24, 200, 52, 26);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, cardX + cardW - 120, cardY + 10);

  // Precios
  const normalPrice = document.getElementById('ad-price-normal')?.value || '8.50';
  const promoPrice = document.getElementById('ad-price-promo')?.value || '6.99';

  // Precio Normal Tachado
  ctx.fillStyle = '#777777';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  const normalText = `Antes: $${normalPrice}`;
  ctx.fillText(normalText, width / 2, cardY + 80);

  // Línea de tachado
  const normWidth = ctx.measureText(normalText).width;
  ctx.strokeStyle = '#E30613';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo((width - normWidth) / 2 - 10, cardY + 70);
  ctx.lineTo((width + normWidth) / 2 + 10, cardY + 70);
  ctx.stroke();

  // Precio Promoción Gigante
  ctx.fillStyle = '#E30613';
  ctx.font = '900 96px sans-serif';
  ctx.fillText(`$${promoPrice}`, width / 2, cardY + 185);

  // 7. Pie de Banner: Información de Contacto y Pedidos
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📞 Haz tu pedido al: 0984149863 • Ambato, Ecuador', width / 2, height * 0.88);

  ctx.fillStyle = '#FFD200';
  ctx.font = '600 22px sans-serif';
  ctx.fillText('Calidad, Frescura y el Mejor Sabor • Avícola QUÉ POLLO', width / 2, height * 0.92);
}

function downloadCanvasAd() {
  const canvas = document.getElementById('ad-preview-canvas');
  if (!canvas) return;

  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `que-pollo-publicidad-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  Toast.fire({ icon: 'success', title: 'Banner publicitario descargado' });
}

// ==========================================
// 8. WHATSAPP COMERCIAL CENTER
// ==========================================
function renderWhatsAppView() {
  const sel = document.getElementById('wa-client-select');
  if (sel) {
    sel.innerHTML = state.clients.map(c => `
      <option value="${c.id_cliente}" data-phone="${c.telefono}" data-name="${c.nombre} ${c.apellido}">
        ${c.nombre} ${c.apellido} (${c.telefono || 'Sin teléfono'})
      </option>
    `).join('');
  }

  applyWhatsAppTemplate();
}

function onWhatsAppClientChange() {
  applyWhatsAppTemplate();
}

function applyWhatsAppTemplate() {
  const tplSelect = document.getElementById('wa-template-select');
  const cliSelect = document.getElementById('wa-client-select');
  const msgInput = document.getElementById('wa-message-text');

  if (!tplSelect || !cliSelect || !msgInput) return;

  const tpl = tplSelect.value;
  const selectedOpt = cliSelect.selectedOptions[0];
  const clientName = selectedOpt ? selectedOpt.getAttribute('data-name') : 'Estimado cliente';

  let text = '';
  switch (tpl) {
    case 'promo':
      text = `¡Hola ${clientName}! 🍗 En Avícola QUÉ POLLO tenemos hoy una súper oferta especial para ti: Pollo entero fresco faenado del día a un precio insuperable. ¿Te gustaría apartar tu pedido para entrega en Ambato?`;
      break;
    case 'order':
      text = `¡Hola ${clientName}! 📦 Confirmamos la recepción de tu pedido en Avícola QUÉ POLLO. Ya está siendo preparado con la máxima frescura e higiene. En breve saldrá hacia tu dirección. ¡Muchas gracias por tu preferencia!`;
      break;
    case 'pending_pay':
      text = `Estimado(a) ${clientName}, esperamos te encuentres muy bien. Te escribimos cordialmente de Avícola QUÉ POLLO para recordarte el saldo pendiente de tu última factura comercial. Quedamos a tu disposición para enviarte los datos de transferencia.`;
      break;
    case 'bday':
      text = `¡Feliz Cumpleaños ${clientName}! 🎂🎉 Desde Avícola QUÉ POLLO te deseamos el mejor de los días. Para celebrarlo, tienes un 15% de descuento directo en tu próximo pedido. ¡Un abrazo!`;
      break;
    case 'recovery':
      text = `¡Hola ${clientName}! 👋 Hace días no sabemos de ti en Avícola QUÉ POLLO y te extrañamos. Queremos consentirte con una cubeta de huevos a precio de distribuidor en tu próxima compra de pollo. ¿Te llevamos hoy tu pedido?`;
      break;
  }

  msgInput.value = text;
  const p = document.getElementById('wa-preview-text');
  if (p) p.textContent = text;
}

function sendWhatsAppMessage() {
  const cliSelect = document.getElementById('wa-client-select');
  const msgInput = document.getElementById('wa-message-text');

  if (!cliSelect || !msgInput) return;

  const selectedOpt = cliSelect.selectedOptions[0];
  const phone = selectedOpt ? selectedOpt.getAttribute('data-phone') : '';
  const message = msgInput.value.trim();

  if (!phone) {
    Toast.fire({ icon: 'warning', title: 'El cliente seleccionado no tiene número de teléfono registrado' });
    return;
  }

  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = clean.substring(1);
  const fullPhone = `593${clean}`;

  const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function sharePromoViaWhatsApp(titulo, descuento) {
  const text = `¡Mira esta gran promoción de Avícola QUÉ POLLO! 🍗 ${titulo} con ${descuento} de descuento. Pide directo al 0984149863 en Ambato.`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// ==========================================
// 9. PROGRAMA DE FIDELIZACIÓN (POLLOPUNTOS)
// ==========================================
function renderLoyaltyView() {
  const catContainer = document.getElementById('rewards-catalog-container');
  const tbody = document.getElementById('table-fidelizacion-body');

  if (catContainer) {
    catContainer.innerHTML = state.loyaltyRewards.map(rew => `
      <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Recompensa</span>
            <span class="text-sm font-black text-[#E30613]">${rew.puntos_requeridos} Pts</span>
          </div>
          <h4 class="font-bold text-gray-800 text-sm mt-2">${rew.titulo}</h4>
          <p class="text-xs text-gray-500 mt-1">${rew.descripcion}</p>
        </div>
        <button onclick="openRedeemPointsModal('${rew.id}')" class="mt-4 w-full py-2 rounded-xl bg-red-50 text-[#E30613] hover:bg-red-100 text-xs font-bold transition-colors">
          Canjear para un Cliente
        </button>
      </div>
    `).join('');
  }

  if (tbody) {
    if (state.loyaltyLedger.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">No hay movimientos de puntos registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.loyaltyLedger.map(l => {
      const cli = state.clients.find(c => c.id_cliente === l.id_cliente);
      const cliName = cli ? `${cli.nombre} ${cli.apellido}` : l.id_cliente;
      const isPositive = (l.puntos || 0) > 0;

      return `
        <tr class="hover:bg-gray-50/80 transition-colors">
          <td class="px-4 py-3 font-mono text-gray-600">${l.id}</td>
          <td class="px-4 py-3 font-bold text-gray-800">${cliName}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
              ${l.tipo_operacion || (isPositive ? 'Acumulación' : 'Canje')}
            </span>
          </td>
          <td class="px-4 py-3 font-mono font-black ${isPositive ? 'text-[#00A651]' : 'text-[#E30613]'}">
            ${isPositive ? `+${l.puntos}` : l.puntos} pts
          </td>
          <td class="px-4 py-3 text-gray-600">${l.referencia || 'Compra comercial'}</td>
          <td class="px-4 py-3 text-gray-400">${l.fecha || ''}</td>
        </tr>
      `;
    }).join('');
  }
}

function openRedeemPointsModal(rewardId = null) {
  const cliSel = document.getElementById('redeem-client-select');
  const rewSel = document.getElementById('redeem-reward-select');

  if (cliSel) {
    cliSel.innerHTML = state.clients.map(c => `
      <option value="${c.id_cliente}">${c.nombre} ${c.apellido} (Saldo: ${c.puntos_fidelidad || 0} pts)</option>
    `).join('');
  }

  if (rewSel) {
    rewSel.innerHTML = state.loyaltyRewards.map(r => `
      <option value="${r.id}" data-cost="${r.puntos_requeridos}" ${r.id === rewardId ? 'selected' : ''}>
        ${r.titulo} (${r.puntos_requeridos} pts)
      </option>
    `).join('');
  }

  onRedeemRewardChange();
  onRedeemClientChange();
  openModal('modal-redeem-points');
}

function onRedeemRewardChange() {
  const rewSel = document.getElementById('redeem-reward-select');
  const costInput = document.getElementById('redeem-cost-input');
  if (rewSel && costInput) {
    const cost = rewSel.selectedOptions[0]?.getAttribute('data-cost') || 0;
    costInput.value = cost;
  }
}

function onRedeemClientChange() {
  const cliId = document.getElementById('redeem-client-select')?.value;
  const cli = state.clients.find(c => c.id_cliente === cliId);
  const balDisp = document.getElementById('redeem-client-balance');
  if (cli && balDisp) {
    balDisp.textContent = `Saldo disponible: ${cli.puntos_fidelidad || 0} PolloPuntos`;
  }
}

async function handleRedeemPointsSubmit(e) {
  if (e) e.preventDefault();

  const idCli = document.getElementById('redeem-client-select')?.value;
  const idRew = document.getElementById('redeem-reward-select')?.value;
  const cost = parseInt(document.getElementById('redeem-cost-input')?.value, 10) || 0;

  const cli = state.clients.find(c => c.id_cliente === idCli);
  const rew = state.loyaltyRewards.find(r => r.id === idRew);

  if (!cli || !rew) return;

  if ((cli.puntos_fidelidad || 0) < cost) {
    Swal.fire({
      icon: 'error',
      title: 'Puntos Insuficientes',
      text: `El cliente ${cli.nombre} ${cli.apellido} tiene ${cli.puntos_fidelidad || 0} pts, pero se requieren ${cost} pts para canjear "${rew.titulo}".`,
      confirmButtonColor: '#E30613'
    });
    return;
  }

  try {
    await window.dataService.redeemLoyaltyReward(idCli, idRew);
    state.clients = await window.dataService.getClients();
    state.loyaltyLedger = await window.dataService.getLoyaltyLedger();
    renderLoyaltyView();
    closeModal('modal-redeem-points');
    Toast.fire({ icon: 'success', title: `Canje exitoso: ${rew.titulo}` });
  } catch (err) {
    console.error('Error canjeando recompensa:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

// ==========================================
// 10. CENTRO DE REPORTES (EXPORTACIÓN CSV)
// ==========================================
function exportClientsCSV() {
  if (window.dataService) window.dataService.exportCSV('clientes');
  Toast.fire({ icon: 'success', title: 'Descargando reporte de clientes en Excel (CSV)' });
}

function exportInventoryCSV() {
  if (window.dataService) window.dataService.exportCSV('inventario');
  Toast.fire({ icon: 'success', title: 'Descargando reporte de inventario en Excel (CSV)' });
}

function exportOrdersCSV() {
  if (window.dataService) window.dataService.exportCSV('pedidos');
  Toast.fire({ icon: 'success', title: 'Descargando reporte de pedidos en Excel (CSV)' });
}

function exportInvoicesCSV() {
  if (window.dataService) window.dataService.exportCSV('facturas');
  Toast.fire({ icon: 'success', title: 'Descargando libro de facturación en Excel (CSV)' });
}

// ==========================================
// 11. GESTIÓN DE CATEGORÍAS MODAL
// ==========================================
function populateCategoryDropdowns() {
  const prodSelect = document.getElementById('product-category');
  const filterSelect = document.getElementById('filter-product-category');

  if (prodSelect) {
    prodSelect.innerHTML = state.categories.map(c => `
      <option value="${c.nombre_categoria}">${c.nombre_categoria}</option>
    `).join('');
  }

  if (filterSelect) {
    const current = filterSelect.value;
    filterSelect.innerHTML = `
      <option value="">Todas las Categorías</option>
      ${state.categories.map(c => `<option value="${c.nombre_categoria}">${c.nombre_categoria}</option>`).join('')}
    `;
    if (current) filterSelect.value = current;
  }
}

function openCategoriesModal() {
  renderCategoriesModalList();
  openModal('modal-categories');
}

function renderCategoriesModalList() {
  const list = document.getElementById('categories-modal-list');
  if (!list) return;

  list.innerHTML = state.categories.map(c => `
    <div class="flex items-center justify-between p-2.5 hover:bg-gray-50">
      <span class="font-bold text-gray-800">${c.nombre_categoria}</span>
      <button onclick="deleteCategoryPrompt('${c.id_categoria}')" class="text-red-500 hover:text-red-700 p-1">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

async function handleQuickAddCategory(e) {
  if (e) e.preventDefault();

  const nameInput = document.getElementById('quick-cat-name');
  const name = nameInput ? nameInput.value.trim() : '';

  if (!name) return;

  try {
    await window.dataService.saveCategory({
      id_categoria: `CAT-${Date.now().toString().slice(-4)}`,
      nombre_categoria: name
    });
    state.categories = await window.dataService.getCategories();
    populateCategoryDropdowns();
    renderCategoriesModalList();
    if (nameInput) nameInput.value = '';
    Toast.fire({ icon: 'success', title: `Categoría "${name}" agregada` });
  } catch (err) {
    console.error('Error agregando categoría:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

async function deleteCategoryPrompt(catId) {
  const cat = state.categories.find(c => c.id_categoria === catId);
  if (!cat) return;

  const res = await Swal.fire({
    title: '¿Eliminar Categoría?',
    text: `Se eliminará la categoría "${cat.nombre_categoria}".`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      await window.dataService.deleteCategory(catId);
      state.categories = await window.dataService.getCategories();
      populateCategoryDropdowns();
      renderCategoriesModalList();
      Toast.fire({ icon: 'success', title: 'Categoría eliminada' });
    } catch (err) {
      console.error('Error eliminando categoría:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

// ==========================================
// 12. CONTROL DE ACCESOS, USUARIOS & RBAC
// ==========================================
function setProfilesFilter(status) {
  state.currentProfileFilter = status;

  ['todos', 'pendiente', 'aprobado', 'rechazado', 'desactivado'].forEach(s => {
    const btn = document.getElementById(`tab-filter-${s}`);
    if (btn) {
      if (s.toUpperCase() === status.toUpperCase()) {
        btn.className = 'tab-profile-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-[#333333] text-white';
      } else {
        btn.className = 'tab-profile-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200';
      }
    }
  });

  renderUsuariosTable();
}

function renderUsuariosTable() {
  const tbody = document.getElementById('table-usuarios-body');
  if (!tbody) return;

  const statusFilter = state.currentProfileFilter;

  const filtered = state.userProfiles.filter(u => {
    if (statusFilter === 'TODOS') return true;
    return (u.estado || 'APROBADO').toUpperCase() === statusFilter.toUpperCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">No hay perfiles con el estado seleccionado.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const isMasterAdmin = u.correo === 'veronica@quepollo.com' || u.correo === 'salome@quepollo.com';

    let statusBadge = '';
    switch (u.estado) {
      case 'PENDIENTE':
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">🟡 PENDIENTE</span>`;
        break;
      case 'RECHAZADO':
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">🔴 RECHAZADO</span>`;
        break;
      case 'DESACTIVADO':
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">⚪ DESACTIVADO</span>`;
        break;
      default:
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">🟢 APROBADO</span>`;
    }

    const roleBadge = u.rol === 'ADMINISTRADOR'
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-red-50 text-[#E30613] border border-red-200">👑 ADMIN</span>`
      : `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">${u.rol || 'VENDEDOR'}</span>`;

    return `
      <tr class="hover:bg-gray-50/80 transition-colors">
        <td class="px-4 py-3">
          <p class="font-bold text-gray-900">${u.nombre} ${u.apellido || ''}</p>
          ${isMasterAdmin ? '<span class="text-[9px] font-bold text-[#E30613]">★ Administradora Titular</span>' : ''}
        </td>
        <td class="px-4 py-3">
          <p class="font-mono text-gray-700">${u.correo}</p>
          <span class="text-[11px] text-gray-500">${u.telefono || 'Sin teléfono'}</span>
        </td>
        <td class="px-4 py-3">${roleBadge}</td>
        <td class="px-4 py-3">${statusBadge}</td>
        <td class="px-4 py-3 text-gray-500">${u.fecha_registro || ''}</td>
        <td class="px-4 py-3 text-xs text-gray-600">${u.aprobado_por || 'Sistema'}</td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center justify-end space-x-1.5">
            ${u.estado === 'PENDIENTE' ? `
              <button onclick="approveUserPrompt('${u.id || u.user_id}')" title="Aprobar Acceso" class="px-2 py-1 rounded-lg bg-[#00A651] hover:bg-emerald-700 text-white font-bold text-xs shadow-xs">
                Aprobar
              </button>
              <button onclick="rejectUserPrompt('${u.id || u.user_id}')" title="Rechazar" class="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs">
                Rechazar
              </button>
            ` : `
              ${!isMasterAdmin ? `
                <button onclick="toggleUserRolePrompt('${u.id || u.user_id}')" title="Cambiar Rol" class="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100">
                  <i data-lucide="shield" class="w-4 h-4"></i>
                </button>
                <button onclick="toggleUserStatusPrompt('${u.id || u.user_id}')" title="Cambiar Estado" class="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50">
                  <i data-lucide="power" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteUserPrompt('${u.id || u.user_id}')" title="Eliminar" class="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              ` : '<span class="text-[10px] text-gray-400 font-bold">Protegido</span>'}
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderAuditLogs();
  if (window.lucide) window.lucide.createIcons();
}

function renderAuditLogs() {
  const container = document.getElementById('audit-log-container');
  if (!container) return;

  if (state.auditLogs.length === 0) {
    container.innerHTML = `<p class="text-gray-400 py-2">No hay registros de auditoría recientes.</p>`;
    return;
  }

  container.innerHTML = state.auditLogs.slice(0, 15).map(l => `
    <div class="py-1 border-b border-gray-100 flex items-center justify-between">
      <div>
        <span class="font-bold text-[#E30613]">[${l.accion}]</span>
        <span class="text-gray-700 ml-1">${l.detalles || ''}</span>
      </div>
      <span class="text-[10px] text-gray-400 font-mono">${l.fecha || ''}</span>
    </div>
  `).join('');
}

async function approveUserPrompt(userId) {
  const prof = state.userProfiles.find(u => (u.id === userId || u.user_id === userId));
  if (!prof) return;

  const res = await Swal.fire({
    title: '¿Aprobar Cuenta de Usuario?',
    html: `Autorizar el acceso de <strong>${prof.nombre} ${prof.apellido || ''}</strong> (${prof.correo}) al CRM de Avícola QUÉ POLLO.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#00A651',
    confirmButtonText: 'Sí, aprobar acceso',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      const adminName = state.currentUser ? `${state.currentUser.nombre || 'Administradora'}` : 'Veronica Toaza';
      await window.dataService.approveUserProfile(userId, adminName);
      state.userProfiles = await window.dataService.getUserProfiles();
      state.auditLogs = await window.dataService.getAuditLogs();
      updateNavigationBadges();
      renderUsuariosTable();
      Toast.fire({ icon: 'success', title: 'Usuario aprobado con éxito' });
    } catch (err) {
      console.error('Error aprobando usuario:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

async function rejectUserPrompt(userId) {
  const prof = state.userProfiles.find(u => (u.id === userId || u.user_id === userId));
  if (!prof) return;

  const res = await Swal.fire({
    title: '¿Rechazar Solicitud?',
    html: `Rechazar el acceso para <strong>${prof.nombre}</strong> (${prof.correo}).`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    confirmButtonText: 'Sí, rechazar',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      await window.dataService.rejectUserProfile(userId);
      state.userProfiles = await window.dataService.getUserProfiles();
      state.auditLogs = await window.dataService.getAuditLogs();
      updateNavigationBadges();
      renderUsuariosTable();
      Toast.fire({ icon: 'info', title: 'Solicitud rechazada' });
    } catch (err) {
      console.error('Error rechazando usuario:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

async function toggleUserRolePrompt(userId) {
  const prof = state.userProfiles.find(u => (u.id === userId || u.user_id === userId));
  if (!prof) return;

  const nextRole = prof.rol === 'ADMINISTRADOR' ? 'VENDEDOR' : 'ADMINISTRADOR';

  const res = await Swal.fire({
    title: '¿Cambiar Rol de Acceso?',
    html: `Cambiar el rol de <strong>${prof.nombre}</strong> a <span class="font-bold text-[#E30613]">${nextRole}</span>.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    confirmButtonText: `Sí, cambiar a ${nextRole}`,
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      await window.dataService.changeUserRole(userId, nextRole);
      state.userProfiles = await window.dataService.getUserProfiles();
      renderUsuariosTable();
      Toast.fire({ icon: 'success', title: `Rol cambiado a ${nextRole}` });
    } catch (err) {
      console.error('Error cambiando rol:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

async function toggleUserStatusPrompt(userId) {
  const prof = state.userProfiles.find(u => (u.id === userId || u.user_id === userId));
  if (!prof) return;

  const newStatus = prof.estado === 'DESACTIVADO' ? 'APROBADO' : 'DESACTIVADO';

  const res = await Swal.fire({
    title: `¿${newStatus === 'DESACTIVADO' ? 'Desactivar' : 'Reactivar'} Usuario?`,
    text: `El usuario ${prof.nombre} ${newStatus === 'DESACTIVADO' ? 'no podrá iniciar sesión en el CRM' : 'volverá a tener acceso'}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      prof.estado = newStatus;
      await window.dataService.saveUserProfile(prof);
      state.userProfiles = await window.dataService.getUserProfiles();
      updateNavigationBadges();
      renderUsuariosTable();
      Toast.fire({ icon: 'success', title: `Usuario ${newStatus.toLowerCase()}` });
    } catch (err) {
      console.error('Error modificando estado:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

async function deleteUserPrompt(userId) {
  const prof = state.userProfiles.find(u => (u.id === userId || u.user_id === userId));
  if (!prof) return;

  if (state.currentUser && (state.currentUser.correo === prof.correo || state.currentUser.id === userId)) {
    Swal.fire({ icon: 'error', title: 'Acción no permitida', text: 'No puedes eliminar tu propia sesión activa.', confirmButtonColor: '#E30613' });
    return;
  }

  const res = await Swal.fire({
    title: '¿Eliminar Usuario Permanentemente?',
    text: `Se borrará la cuenta de ${prof.nombre} (${prof.correo}).`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) {
    try {
      await window.dataService.deleteUserProfile(userId);
      state.userProfiles = await window.dataService.getUserProfiles();
      updateNavigationBadges();
      renderUsuariosTable();
      Toast.fire({ icon: 'success', title: 'Usuario eliminado' });
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

function openUserModal(userId = null) {
  state.editingUserId = userId;
  const form = document.getElementById('form-user');
  if (form) form.reset();

  const title = document.getElementById('modal-user-title');
  const idInput = document.getElementById('user-profile-id');
  const emailInput = document.getElementById('user-email');

  if (userId) {
    const prof = state.userProfiles.find(u => (u.id === userId || u.user_id === userId));
    if (!prof) return;

    if (title) title.textContent = 'Editar Perfil de Usuario';
    if (idInput) idInput.value = prof.id || prof.user_id;
    if (emailInput) {
      emailInput.value = prof.correo;
      emailInput.readOnly = true;
    }
    document.getElementById('user-name').value = prof.nombre || '';
    document.getElementById('user-lastname').value = prof.apellido || '';
    document.getElementById('user-phone').value = prof.telefono || '';
    document.getElementById('user-role').value = prof.rol || 'VENDEDOR';
    document.getElementById('user-status').value = prof.estado || 'APROBADO';
  } else {
    if (title) title.textContent = 'Crear Nuevo Perfil de Usuario';
    if (idInput) idInput.value = `usr-${Date.now()}`;
    if (emailInput) {
      emailInput.value = '';
      emailInput.readOnly = false;
    }
    document.getElementById('user-role').value = 'VENDEDOR';
    document.getElementById('user-status').value = 'APROBADO';
  }

  openModal('modal-user');
}

async function handleSaveUser(e) {
  if (e) e.preventDefault();

  const id = document.getElementById('user-profile-id')?.value;
  const nombre = document.getElementById('user-name')?.value.trim();
  const apellido = document.getElementById('user-lastname')?.value.trim();
  const correo = document.getElementById('user-email')?.value.trim().toLowerCase();
  const telefono = document.getElementById('user-phone')?.value.trim();
  const rol = document.getElementById('user-role')?.value;
  const estado = document.getElementById('user-status')?.value;

  if (!nombre || !correo) {
    Toast.fire({ icon: 'warning', title: 'Completa los campos obligatorios' });
    return;
  }

  const profileData = {
    id: id || `usr-${Date.now()}`,
    user_id: id || `usr-${Date.now()}`,
    nombre,
    apellido,
    correo,
    telefono,
    rol,
    estado,
    fecha_registro: new Date().toISOString().split('T')[0],
    fecha_aprobacion: estado === 'APROBADO' ? new Date().toISOString().split('T')[0] : null,
    aprobado_por: estado === 'APROBADO' ? (state.currentUser?.nombre || 'Administradora') : null
  };

  try {
    await window.dataService.saveUserProfile(profileData);
    state.userProfiles = await window.dataService.getUserProfiles();
    updateNavigationBadges();
    renderUsuariosTable();
    closeModal('modal-user');
    Toast.fire({ icon: 'success', title: 'Perfil guardado con éxito' });
  } catch (err) {
    console.error('Error guardando usuario:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

// ==========================================
// 13. AUTENTICACIÓN, SESIONES & GATEKEEPER
// ==========================================
async function checkAuthSession() {
  const profileJson = localStorage.getItem('qp_current_profile') || sessionStorage.getItem('qp_current_profile');
  if (profileJson) {
    try {
      const user = JSON.parse(profileJson);
      state.currentUser = user;
      evaluateUserAccess(user);
      return;
    } catch (e) {
      console.warn('Error parseando sesión guardada');
    }
  }

  // Si no hay sesión guardada, mostrar pantalla de login
  showGatekeeperScreen('gatekeeper-auth');
}

function evaluateUserAccess(user) {
  if (!user) {
    showGatekeeperScreen('gatekeeper-auth');
    return;
  }

  // Maestras Titulares tienen acceso garantizado
  const isMasterAdmin = user.correo === 'veronica@quepollo.com' || user.correo === 'salome@quepollo.com';

  if (!isMasterAdmin) {
    if (user.estado === 'PENDIENTE') {
      showGatekeeperScreen('gatekeeper-pending');
      const pEmail = document.getElementById('pending-user-email');
      if (pEmail) pEmail.textContent = user.correo;
      return;
    }
    if (user.estado === 'RECHAZADO') {
      showGatekeeperScreen('gatekeeper-rejected');
      return;
    }
    if (user.estado === 'DESACTIVADO') {
      showGatekeeperScreen('gatekeeper-deactivated');
      return;
    }
  }

  // Usuario Aprobado -> Mostrar la Aplicación Principal
  showGatekeeperScreen('main-app-container');

  // Actualizar datos del usuario en la interfaz
  const topName = document.getElementById('topbar-user-name');
  const topRole = document.getElementById('topbar-user-role');
  const topInit = document.getElementById('topbar-user-initials');

  const nameStr = `${user.nombre || 'Usuario'} ${user.apellido || ''}`.trim();
  if (topName) topName.textContent = nameStr;
  if (topRole) topRole.textContent = user.rol || 'VENDEDOR';
  if (topInit) topInit.textContent = (user.nombre ? user.nombre.charAt(0) : 'U').toUpperCase();

  // Control de visibilidad del botón Usuarios según Rol
  const navUsers = document.getElementById('nav-item-usuarios');
  if (navUsers) {
    if (user.rol === 'ADMINISTRADOR' || isMasterAdmin) {
      navUsers.classList.remove('hidden');
    } else {
      navUsers.classList.add('hidden');
    }
  }

  switchView('dashboard');
}

function showGatekeeperScreen(screenId) {
  const screens = [
    'gatekeeper-auth',
    'gatekeeper-pending',
    'gatekeeper-rejected',
    'gatekeeper-deactivated',
    'main-app-container'
  ];

  screens.forEach(s => {
    const el = document.getElementById(s);
    if (el) {
      if (s === screenId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

async function handleLoginSubmit(e) {
  if (e) e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const remember = document.getElementById('remember-me')?.checked;

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passInput ? passInput.value.trim() : '';

  if (!email || !password) {
    Toast.fire({ icon: 'warning', title: 'Ingresa correo y contraseña' });
    return;
  }

  try {
    const res = await window.dataService.loginWithCredentials(email, password);
    state.currentUser = res.profile;

    if (remember) {
      localStorage.setItem('qp_current_profile', JSON.stringify(res.profile));
    } else {
      sessionStorage.setItem('qp_current_profile', JSON.stringify(res.profile));
    }

    evaluateUserAccess(res.profile);
    Toast.fire({ icon: 'success', title: `Bienvenida, ${res.profile.nombre}` });
  } catch (err) {
    console.error('Error de login:', err);
    Swal.fire({
      icon: 'error',
      title: 'Acceso Denegado',
      text: err.message || 'Credenciales incorrectas.',
      confirmButtonColor: '#E30613'
    });
  }
}

async function handleRegisterSubmit(e) {
  if (e) e.preventDefault();

  const nombre = document.getElementById('reg-name')?.value.trim();
  const apellido = document.getElementById('reg-lastname')?.value.trim();
  const correo = document.getElementById('reg-email')?.value.trim().toLowerCase();
  const telefono = document.getElementById('reg-phone')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const passConfirm = document.getElementById('reg-confirm-password')?.value;

  if (!nombre || !apellido || !correo || !telefono || !password) {
    Toast.fire({ icon: 'warning', title: 'Completa todos los campos obligatorios' });
    return;
  }

  if (password !== passConfirm) {
    Swal.fire({ icon: 'error', title: 'Contraseñas no coinciden', text: 'Verifica la confirmación de tu contraseña.', confirmButtonColor: '#E30613' });
    return;
  }

  try {
    const regResult = await window.dataService.registerNewUser({
      nombre,
      apellido,
      correo,
      telefono,
      password
    });

    closeModal('modal-register');
    state.currentUser = regResult;

    Swal.fire({
      icon: 'info',
      title: '¡Cuenta Registrada!',
      html: `Hola <strong>${nombre}</strong>, tu cuenta ha sido creada exitosamente.<br><br>Por políticas de seguridad, ha quedado en estado <span class="font-bold text-amber-600">PENDIENTE DE APROBACIÓN</span> hasta que una administradora (Veronica Toaza o Salomé Flores) autorice tu ingreso.`,
      confirmButtonColor: '#E30613',
      confirmButtonText: 'Entendido'
    }).then(() => {
      evaluateUserAccess(regResult);
    });
  } catch (err) {
    console.error('Error registrando usuario:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

async function handleForgotPasswordSubmit(e) {
  if (e) e.preventDefault();

  const email = document.getElementById('forgot-email')?.value.trim().toLowerCase();
  if (!email) return;

  try {
    await window.dataService.requestPasswordReset(email);
    closeModal('modal-forgot-password');
    Swal.fire({
      icon: 'success',
      title: 'Correo Enviado',
      text: `Se han enviado las instrucciones de recuperación a ${email}.`,
      confirmButtonColor: '#E30613'
    });
  } catch (err) {
    console.error('Error solicitando recuperación:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

function handleLogout() {
  localStorage.removeItem('qp_current_profile');
  sessionStorage.removeItem('qp_current_profile');
  state.currentUser = null;

  if (window.dataService) {
    window.dataService.logout();
  }

  showGatekeeperScreen('gatekeeper-auth');
  Toast.fire({ icon: 'info', title: 'Sesión finalizada' });
}

function togglePasswordVisibility(inputId, eyeIconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(eyeIconId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }

  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// UTILIDADES DE MODALES GENÉRICOS
// ==========================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
  }
}
