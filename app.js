/**
 * ==========================================================
 * CRM AVÍCOLA "QUÉ POLLO" - LÓGICA DE APLICACIÓN
 * Identidad Corporativa:
 * Rojo #E30613 | Verde #00A651 | Amarillo #FFD200 | Dorado #806B20 | Gris #333333
 * Universidad Técnica de Ambato - Sistemas de Información
 * ==========================================================
 */

let state = {
  currentView: 'dashboard',
  currentUser: null,
  userProfiles: [],
  currentProfileFilter: 'TODOS',
  users: [],
  categories: [],
  clients: [],
  products: [],
  sales: [],
  charts: {
    channels: null,
    status: null,
    products: null
  },
  editingCategoryId: null,
  editingClientId: null,
  editingProductId: null,
  editingSaleId: null,
  editingUserId: null
};

// Notificaciones Toast con estilo corporativo
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

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
  initDateBanner();
  await loadAllData();
  setupEventListeners();
  checkAuthSession();
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

// Cargar todos los datos desde el servicio
async function loadAllData() {
  try {
    state.categories = await window.dataService.getCategories();
    state.clients = await window.dataService.getClients();
    state.products = await window.dataService.getProducts();
    state.sales = await window.dataService.getSales();
    state.userProfiles = await window.dataService.getUserProfiles();
    state.users = state.userProfiles; // Compatibilidad interna
    populateCategoryDropdowns();
    updateNavigationBadges();
  } catch (err) {
    console.error('Error cargando datos:', err);
  }
}

// Actualizar contadores numéricos en la barra lateral
function updateNavigationBadges() {
  const cBadge = document.getElementById('badge-count-clientes');
  const pBadge = document.getElementById('badge-count-productos');
  const sBadge = document.getElementById('badge-count-ventas');
  const uBadge = document.getElementById('badge-count-usuarios');

  if (cBadge) cBadge.textContent = state.clients.length;
  if (pBadge) pBadge.textContent = state.products.length;
  if (sBadge) sBadge.textContent = state.sales.length;
  if (uBadge) uBadge.textContent = state.userProfiles.length;
}

// Poblar los selectores desplegables de categorías dinámicamente
function populateCategoryDropdowns(selectedCategory = null) {
  const productCatSelect = document.getElementById('product-category');
  const filterCatSelect = document.getElementById('filter-product-category');

  if (productCatSelect) {
    const currentVal = selectedCategory || productCatSelect.value;
    productCatSelect.innerHTML = state.categories.map(cat => `
      <option value="${cat.nombre_categoria}">${cat.nombre_categoria}</option>
    `).join('');

    if (currentVal && state.categories.some(c => c.nombre_categoria === currentVal)) {
      productCatSelect.value = currentVal;
    } else if (state.categories.length > 0) {
      productCatSelect.value = state.categories[0].nombre_categoria;
    }
  }

  if (filterCatSelect) {
    const currentFilterVal = filterCatSelect.value;
    filterCatSelect.innerHTML = `
      <option value="">Todas las Categorías</option>
      ${state.categories.map(cat => `<option value="${cat.nombre_categoria}">${cat.nombre_categoria}</option>`).join('')}
    `;
    if (currentFilterVal) {
      filterCatSelect.value = currentFilterVal;
    }
  }
}

// Configurar event listeners para filtros y búsquedas
function setupEventListeners() {
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const closeMobileBtn = document.getElementById('close-mobile-menu');
  if (mobileBtn) mobileBtn.addEventListener('click', openMobileMenu);
  if (closeMobileBtn) closeMobileBtn.addEventListener('click', closeMobileMenu);

  // Filtros Clientes
  const clientSearch = document.getElementById('filter-client-search');
  const clientType = document.getElementById('filter-client-type');
  const clientSocial = document.getElementById('filter-client-social');
  if (clientSearch) clientSearch.addEventListener('input', renderClientsTable);
  if (clientType) clientType.addEventListener('change', renderClientsTable);
  if (clientSocial) clientSocial.addEventListener('change', renderClientsTable);

  // Filtros Productos
  const prodSearch = document.getElementById('filter-product-search');
  const prodCat = document.getElementById('filter-product-category');
  if (prodSearch) prodSearch.addEventListener('input', renderProducts);
  if (prodCat) prodCat.addEventListener('change', renderProducts);

  // Filtros Ventas
  const saleSearch = document.getElementById('filter-sales-search');
  const saleStatus = document.getElementById('filter-sales-status');
  const saleChannel = document.getElementById('filter-sales-channel');
  if (saleSearch) saleSearch.addEventListener('input', renderSalesTable);
  if (saleStatus) saleStatus.addEventListener('change', renderSalesTable);
  if (saleChannel) saleChannel.addEventListener('change', renderSalesTable);

  // Filtros Usuarios
  const userSearch = document.getElementById('filter-user-search');
  const userRole = document.getElementById('filter-user-role');
  if (userSearch) userSearch.addEventListener('input', renderUsuariosTable);
  if (userRole) userRole.addEventListener('change', renderUsuariosTable);
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
// CAMBIO DE VISTAS (SPA ROUTING)
// ==========================================
function switchView(viewName) {
  // Protección de Rol para Usuarios
  if (viewName === 'usuarios' && state.currentUser && state.currentUser.rol !== 'ADMINISTRADOR') {
    Toast.fire({ icon: 'warning', title: 'Módulo reservado para Administradores' });
    viewName = 'dashboard';
  }

  state.currentView = viewName;

  const views = ['dashboard', 'clientes', 'productos', 'ventas', 'usuarios'];
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

  if (viewName === 'dashboard') {
    renderDashboard();
  } else if (viewName === 'clientes') {
    renderClientsTable();
  } else if (viewName === 'productos') {
    renderProducts();
  } else if (viewName === 'ventas') {
    renderSalesTable();
  } else if (viewName === 'usuarios') {
    renderUsuariosTable();
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ==========================================
// 1. DASHBOARD & GRÁFICOS CORPORATIVOS
// ==========================================
function renderDashboard() {
  const totalRevenue = state.sales.reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0);
  const totalSales = state.sales.length;
  const totalClients = state.clients.length;
  const totalProducts = state.products.length;

  document.getElementById('kpi-total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
  document.getElementById('kpi-total-sales').textContent = totalSales;
  document.getElementById('kpi-total-clients').textContent = totalClients;
  document.getElementById('kpi-total-products').textContent = totalProducts;

  renderDashboardRecentSales();
  renderCharts();
}

function renderDashboardRecentSales() {
  const tbody = document.getElementById('dashboard-recent-sales-body');
  if (!tbody) return;

  const recent = [...state.sales].reverse().slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-gray-400">No hay ventas registradas aún.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(sale => {
    const client = state.clients.find(c => c.id_cliente === sale.id_cliente);
    const product = state.products.find(p => p.id_producto === sale.id_producto);
    const clientName = client ? `${client.nombre} ${client.apellido}` : sale.id_cliente;
    const prodName = product ? product.nombre : sale.id_producto;

    const statusBadgeClass = {
      'Completado': 'badge-completado',
      'Pendiente': 'badge-pendiente',
      'Cancelado': 'badge-cancelado'
    }[sale.estado] || 'badge-completado';

    const channelBadgeClass = {
      'Instagram': 'badge-instagram',
      'Facebook': 'badge-facebook',
      'WhatsApp': 'badge-whatsapp',
      'Local': 'badge-local'
    }[sale.canal] || 'badge-local';

    return `
      <tr class="hover:bg-gray-50/80 transition-colors">
        <td class="px-6 py-3 font-mono font-bold text-[#E30613]">${sale.id_seguimiento}</td>
        <td class="px-6 py-3 font-medium text-[#333333]">${clientName}</td>
        <td class="px-6 py-3">${prodName} <span class="text-xs text-gray-400">(${sale.cantidad} u)</span></td>
        <td class="px-6 py-3 text-xs text-gray-500">${sale.fecha_compra}</td>
        <td class="px-6 py-3">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${channelBadgeClass}">${sale.canal}</span>
        </td>
        <td class="px-6 py-3 font-extrabold text-[#333333] font-mono">$${(parseFloat(sale.total) || 0).toFixed(2)}</td>
        <td class="px-6 py-3">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass}">${sale.estado}</span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderCharts() {
  if (!window.Chart) return;

  // 1. Gráfico Canales (Doughnut) con paleta corporativa: Rojo, Verde, Amarillo, Dorado, Gris
  const channelCounts = {};
  state.sales.forEach(s => {
    channelCounts[s.canal] = (channelCounts[s.canal] || 0) + 1;
  });

  const channelLabels = Object.keys(channelCounts);
  const channelData = Object.values(channelCounts);

  const ctxChannels = document.getElementById('chart-channels')?.getContext('2d');
  if (ctxChannels) {
    if (state.charts.channels) state.charts.channels.destroy();
    state.charts.channels = new Chart(ctxChannels, {
      type: 'doughnut',
      data: {
        labels: channelLabels.length > 0 ? channelLabels : ['Sin datos'],
        datasets: [{
          data: channelData.length > 0 ? channelData : [1],
          backgroundColor: ['#E30613', '#00A651', '#FFD200', '#806B20', '#333333'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, family: 'Plus Jakarta Sans' } } }
        },
        cutout: '68%'
      }
    });
  }

  // 2. Gráfico Estados (Pie): Verde (Completado), Amarillo (Pendiente), Rojo (Cancelado)
  const statusCounts = { 'Completado': 0, 'Pendiente': 0, 'Cancelado': 0 };
  state.sales.forEach(s => {
    if (statusCounts[s.estado] !== undefined) statusCounts[s.estado]++;
    else statusCounts[s.estado] = 1;
  });

  const ctxStatus = document.getElementById('chart-status')?.getContext('2d');
  if (ctxStatus) {
    if (state.charts.status) state.charts.status.destroy();
    state.charts.status = new Chart(ctxStatus, {
      type: 'pie',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ['#00A651', '#FFD200', '#E30613'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, family: 'Plus Jakarta Sans' } } }
        }
      }
    });
  }

  // 3. Gráfico Top Productos (Bar) en Rojo Institucional
  const productQuantities = {};
  state.sales.forEach(s => {
    const prod = state.products.find(p => p.id_producto === s.id_producto);
    const label = prod ? prod.nombre : s.id_producto;
    productQuantities[label] = (productQuantities[label] || 0) + (parseInt(s.cantidad, 10) || 0);
  });

  const ctxProducts = document.getElementById('chart-products')?.getContext('2d');
  if (ctxProducts) {
    if (state.charts.products) state.charts.products.destroy();
    state.charts.products = new Chart(ctxProducts, {
      type: 'bar',
      data: {
        labels: Object.keys(productQuantities),
        datasets: [{
          label: 'Unidades Vendidas',
          data: Object.values(productQuantities),
          backgroundColor: '#E30613',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { ticks: { font: { size: 10, family: 'Plus Jakarta Sans' } } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

// ==========================================
// 2. MÓDULO CLIENTES (CRUD)
// ==========================================
function renderClientsTable() {
  const tbody = document.getElementById('table-clientes-body');
  if (!tbody) return;

  const search = (document.getElementById('filter-client-search')?.value || '').toLowerCase().trim();
  const typeFilter = document.getElementById('filter-client-type')?.value || '';
  const socialFilter = document.getElementById('filter-client-social')?.value || '';

  const filtered = state.clients.filter(c => {
    const matchSearch = !search || 
      c.id_cliente.toLowerCase().includes(search) ||
      c.nombre.toLowerCase().includes(search) ||
      c.apellido.toLowerCase().includes(search) ||
      (c.telefono && c.telefono.includes(search)) ||
      (c.correo && c.correo.toLowerCase().includes(search));

    const matchType = !typeFilter || c.tipo_cliente === typeFilter;
    const matchSocial = !socialFilter || c.red_social === socialFilter;

    return matchSearch && matchType && matchSocial;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-6 text-center text-gray-400">No se encontraron clientes que coincidan con los filtros.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const rawPhone = (c.telefono || '').replace(/\D/g, '');
    const waUrl = rawPhone.length >= 9 ? `https://wa.me/593${rawPhone.startsWith('0') ? rawPhone.substring(1) : rawPhone}` : '#';

    const typeBadgeColors = {
      'Frecuente': 'bg-red-50 text-[#E30613] border-red-200',
      'Mayorista': 'bg-emerald-50 text-[#00A651] border-emerald-200',
      'Ocasional': 'bg-yellow-50 text-[#806B20] border-yellow-200',
      'Nuevo': 'bg-gray-100 text-[#333333] border-gray-200'
    }[c.tipo_cliente] || 'bg-gray-100 text-gray-700 border-gray-200';

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-5 py-3 font-mono font-bold text-[#E30613]">${c.id_cliente}</td>
        <td class="px-5 py-3">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full bg-red-50 text-[#E30613] border border-red-100 flex items-center justify-center font-bold text-xs">
              ${c.nombre.charAt(0)}${c.apellido.charAt(0)}
            </div>
            <div>
              <div class="font-semibold text-[#333333]">${c.nombre} ${c.apellido}</div>
            </div>
          </div>
        </td>
        <td class="px-5 py-3">
          <div class="flex items-center space-x-1.5">
            <span class="text-[#333333] font-mono text-xs">${c.telefono || 'S/N'}</span>
            ${rawPhone ? `
              <a href="${waUrl}" target="_blank" class="p-1 rounded text-[#00A651] hover:bg-emerald-50" title="Contactar por WhatsApp">
                <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
              </a>
            ` : ''}
          </div>
        </td>
        <td class="px-5 py-3">
          ${c.correo ? `
            <a href="mailto:${c.correo}" class="text-xs text-[#333333] hover:text-[#E30613] hover:underline flex items-center space-x-1">
              <span>${c.correo}</span>
            </a>
          ` : '<span class="text-gray-400 text-xs">Sin correo</span>'}
        </td>
        <td class="px-5 py-3">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            ${c.red_social || 'Facebook'}
          </span>
        </td>
        <td class="px-5 py-3 text-xs text-gray-500">${c.fecha_registro || '-'}</td>
        <td class="px-5 py-3">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeBadgeColors}">
            ${c.tipo_cliente}
          </span>
        </td>
        <td class="px-5 py-3 text-right">
          <div class="flex items-center justify-end space-x-1">
            <button onclick="viewClientHistory('${c.id_cliente}')" class="p-1.5 text-gray-500 hover:text-[#00A651] hover:bg-emerald-50 rounded-lg transition-colors" title="Ver Historial de Compras">
              <i data-lucide="history" class="w-4 h-4"></i>
            </button>
            <button onclick="editClient('${c.id_cliente}')" class="p-1.5 text-gray-500 hover:text-[#E30613] hover:bg-red-50 rounded-lg transition-colors" title="Editar Cliente">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteClientPrompt('${c.id_cliente}')" class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar Cliente">
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
  const modalTitle = document.getElementById('modal-client-title');
  const idInput = document.getElementById('client-id');
  const nameInput = document.getElementById('client-name');
  const lastnameInput = document.getElementById('client-lastname');
  const phoneInput = document.getElementById('client-phone');
  const emailInput = document.getElementById('client-email');
  const socialInput = document.getElementById('client-social');
  const dateInput = document.getElementById('client-date');
  const typeInput = document.getElementById('client-type');

  if (clientId) {
    modalTitle.textContent = 'Editar Cliente';
    const client = state.clients.find(c => c.id_cliente === clientId);
    if (client) {
      idInput.value = client.id_cliente;
      idInput.readOnly = true;
      nameInput.value = client.nombre;
      lastnameInput.value = client.apellido;
      phoneInput.value = client.telefono || '';
      emailInput.value = client.correo || '';
      socialInput.value = client.red_social || 'Facebook';
      dateInput.value = client.fecha_registro || new Date().toISOString().split('T')[0];
      typeInput.value = client.tipo_cliente || 'Frecuente';
    }
  } else {
    modalTitle.textContent = 'Registrar Nuevo Cliente';
    idInput.readOnly = false;
    const nextNum = state.clients.length + 1;
    idInput.value = `C${String(nextNum).padStart(3, '0')}`;
    nameInput.value = '';
    lastnameInput.value = '';
    phoneInput.value = '09';
    emailInput.value = '';
    socialInput.value = 'Facebook';
    dateInput.value = new Date().toISOString().split('T')[0];
    typeInput.value = 'Frecuente';
  }

  openModal('modal-client');
}

function editClient(id) {
  openClientModal(id);
}

async function handleSaveClient(event) {
  event.preventDefault();
  const id = document.getElementById('client-id').value.trim();
  const nombre = document.getElementById('client-name').value.trim();
  const apellido = document.getElementById('client-lastname').value.trim();
  const telefono = document.getElementById('client-phone').value.trim();
  const correo = document.getElementById('client-email').value.trim();
  const red_social = document.getElementById('client-social').value;
  const fecha_registro = document.getElementById('client-date').value;
  const tipo_cliente = document.getElementById('client-type').value;

  if (!id || !nombre || !apellido) {
    Toast.fire({ icon: 'warning', title: 'Completa los campos obligatorios' });
    return;
  }

  const clientData = {
    id_cliente: id,
    nombre,
    apellido,
    telefono,
    correo,
    red_social,
    fecha_registro,
    tipo_cliente
  };

  await window.dataService.saveClient(clientData);
  await loadAllData();
  closeModal('modal-client');
  renderClientsTable();
  Toast.fire({ icon: 'success', title: 'Cliente guardado con éxito' });
}

async function deleteClientPrompt(id) {
  const result = await Swal.fire({
    title: '¿Eliminar cliente?',
    text: `Se eliminará el cliente ${id}. Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    await window.dataService.deleteClient(id);
    await loadAllData();
    renderClientsTable();
    Toast.fire({ icon: 'success', title: 'Cliente eliminado' });
  }
}

function viewClientHistory(clientId) {
  const client = state.clients.find(c => c.id_cliente === clientId);
  if (!client) return;

  document.getElementById('history-client-name').textContent = `${client.nombre} ${client.apellido}`;
  document.getElementById('history-client-details').textContent = `${client.id_cliente} • ${client.tipo_cliente} • ${client.correo || client.telefono || 'Sin datos de contacto'}`;

  const clientSales = state.sales.filter(s => s.id_cliente === clientId);
  const tbody = document.getElementById('history-table-body');
  let totalSpent = 0;

  if (clientSales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-3 py-4 text-center text-gray-400">Este cliente aún no tiene ventas registradas.</td></tr>`;
  } else {
    tbody.innerHTML = clientSales.map(s => {
      totalSpent += parseFloat(s.total) || 0;
      const product = state.products.find(p => p.id_producto === s.id_producto);
      const prodName = product ? product.nombre : s.id_producto;
      return `
        <tr class="hover:bg-gray-50">
          <td class="px-3 py-2 font-mono font-bold text-[#E30613]">${s.id_seguimiento}</td>
          <td class="px-3 py-2 font-medium text-[#333333]">${prodName} (${s.cantidad} u)</td>
          <td class="px-3 py-2 text-gray-500">${s.fecha_compra}</td>
          <td class="px-3 py-2 font-bold text-[#333333] font-mono">$${(parseFloat(s.total) || 0).toFixed(2)}</td>
          <td class="px-3 py-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.estado === 'Completado' ? 'badge-completado' : 'badge-pendiente'}">${s.estado}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  document.getElementById('history-total-spent').textContent = `$${totalSpent.toFixed(2)}`;
  openModal('modal-client-history');
}

// ==========================================
// 3. MÓDULO PRODUCTOS (CRUD & CATEGORÍAS)
// ==========================================
function renderProducts() {
  const container = document.getElementById('products-cards-container');
  const tbody = document.getElementById('table-productos-body');
  if (!container || !tbody) return;

  const search = (document.getElementById('filter-product-search')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('filter-product-category')?.value || '';

  const filtered = state.products.filter(p => {
    const matchSearch = !search ||
      p.id_producto.toLowerCase().includes(search) ||
      p.nombre.toLowerCase().includes(search);
    const matchCat = !catFilter || p.categoria === catFilter;
    return matchSearch && matchCat;
  });

  // 1. Grid de Tarjetas Visuales con Branding QUÉ POLLO
  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-gray-400">No hay productos que coincidan con la búsqueda.</div>`;
  } else {
    container.innerHTML = filtered.map(p => {
      const pv = parseFloat(p.precio_v) || 0;
      const pc = parseFloat(p.precio_c) || 0;
      const margin = pv - pc;
      const isPositive = margin >= 0;

      const categoryIcons = {
        'Pollo': '🍗',
        'Cerdo': '🥩',
        'Res': '🍖',
        'Despresado': '🥩',
        'Huevos': '🥚',
        'Embutidos': '🌭',
        'Menudencias': '🍲',
        'Otros': '🏷️'
      }[p.categoria] || '🏷️';

      return `
        <div class="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs card-hover-effect flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[#E30613] border border-red-100 flex items-center space-x-1">
                <span>${categoryIcons}</span>
                <span>${p.categoria}</span>
              </span>
              <span class="font-mono text-xs font-bold text-gray-400">${p.id_producto}</span>
            </div>

            <h3 class="font-extrabold text-[#333333] text-lg mt-3 leading-snug">${p.nombre}</h3>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-100 space-y-3">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-[#F5F5F5] p-2.5 rounded-xl border border-gray-100">
                <span class="text-gray-400 block text-[11px]">Precio_V (Venta)</span>
                <span class="text-base font-extrabold text-[#E30613] font-mono">$${pv.toFixed(2)}</span>
              </div>
              <div class="bg-[#F5F5F5] p-2.5 rounded-xl border border-gray-100">
                <span class="text-gray-400 block text-[11px]">Precio_C (Costo)</span>
                <span class="text-base font-medium text-gray-700 font-mono">$${pc.toFixed(2)}</span>
              </div>
            </div>

            <div class="flex items-center justify-between text-xs px-1">
              <span class="text-gray-500">Margen Unitario:</span>
              <span class="font-bold font-mono ${isPositive ? 'text-[#00A651]' : 'text-[#E30613]'}">
                $${margin.toFixed(2)}
              </span>
            </div>

            <div class="flex items-center justify-end space-x-1 pt-1">
              <button onclick="editProduct('${p.id_producto}')" class="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-700 hover:bg-gray-100 flex items-center space-x-1">
                <i data-lucide="edit-3" class="w-3.5 h-3.5 text-[#333333]"></i>
                <span>Editar</span>
              </button>
              <button onclick="deleteProductPrompt('${p.id_producto}')" class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Tabla Detallada
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-gray-400">Sin productos registrados.</td></tr>`;
  } else {
    tbody.innerHTML = filtered.map(p => {
      const pv = parseFloat(p.precio_v) || 0;
      const pc = parseFloat(p.precio_c) || 0;
      const margin = pv - pc;
      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-5 py-3 font-mono font-bold text-[#E30613]">${p.id_producto}</td>
          <td class="px-5 py-3 font-semibold text-[#333333]">${p.nombre}</td>
          <td class="px-5 py-3">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">${p.categoria}</span>
          </td>
          <td class="px-5 py-3 font-bold text-[#E30613] font-mono">$${pv.toFixed(2)}</td>
          <td class="px-5 py-3 font-medium text-gray-600 font-mono">$${pc.toFixed(2)}</td>
          <td class="px-5 py-3 font-bold font-mono ${margin >= 0 ? 'text-[#00A651]' : 'text-[#E30613]'}">$${margin.toFixed(2)}</td>
          <td class="px-5 py-3 text-right">
            <div class="flex items-center justify-end space-x-1">
              <button onclick="editProduct('${p.id_producto}')" class="p-1.5 text-gray-500 hover:text-[#E30613] hover:bg-red-50 rounded-lg">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteProductPrompt('${p.id_producto}')" class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (window.lucide) window.lucide.createIcons();
}

function openProductModal(prodId = null) {
  state.editingProductId = prodId;
  const modalTitle = document.getElementById('modal-product-title');
  const idInput = document.getElementById('product-id');
  const nameInput = document.getElementById('product-name');
  const priceVInput = document.getElementById('product-price-v');
  const priceCInput = document.getElementById('product-price-c');

  populateCategoryDropdowns();

  if (prodId) {
    modalTitle.textContent = 'Editar Producto';
    const prod = state.products.find(p => p.id_producto === prodId);
    if (prod) {
      idInput.value = prod.id_producto;
      idInput.readOnly = true;
      nameInput.value = prod.nombre;
      populateCategoryDropdowns(prod.categoria);
      priceVInput.value = prod.precio_v;
      priceCInput.value = prod.precio_c;
    }
  } else {
    modalTitle.textContent = 'Registrar Nuevo Producto';
    idInput.readOnly = false;
    const nextNum = state.products.length + 1;
    idInput.value = `P${String(nextNum).padStart(3, '0')}`;
    nameInput.value = '';
    priceVInput.value = '8.50';
    priceCInput.value = '16.50';
  }

  openModal('modal-product');
}

function editProduct(id) {
  openProductModal(id);
}

async function handleSaveProduct(event) {
  event.preventDefault();
  const id = document.getElementById('product-id').value.trim();
  const nombre = document.getElementById('product-name').value.trim();
  const categoria = document.getElementById('product-category').value;
  const precio_v = parseFloat(document.getElementById('product-price-v').value) || 0;
  const precio_c = parseFloat(document.getElementById('product-price-c').value) || 0;

  if (!id || !nombre) {
    Toast.fire({ icon: 'warning', title: 'Completa los campos obligatorios' });
    return;
  }

  const matchingCat = state.categories.find(c => c.nombre_categoria === categoria);
  const id_categoria = matchingCat ? matchingCat.id_categoria : '';

  const productData = {
    id_producto: id,
    nombre,
    id_categoria,
    categoria,
    precio_v,
    precio_c
  };

  await window.dataService.saveProduct(productData);
  await loadAllData();
  closeModal('modal-product');
  renderProducts();
  Toast.fire({ icon: 'success', title: 'Producto guardado con éxito' });
}

async function deleteProductPrompt(id) {
  const result = await Swal.fire({
    title: '¿Eliminar producto?',
    text: `Se eliminará el producto ${id} del catálogo.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    await window.dataService.deleteProduct(id);
    await loadAllData();
    renderProducts();
    Toast.fire({ icon: 'success', title: 'Producto eliminado' });
  }
}

// ==========================================
// ADMINISTRACIÓN DINÁMICA DE CATEGORÍAS
// ==========================================
function openCategoriesModal() {
  const tbody = document.getElementById('table-categories-body');
  if (!tbody) return;

  if (state.categories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-4 py-4 text-center text-gray-400">No hay categorías registradas.</td></tr>`;
  } else {
    tbody.innerHTML = state.categories.map(cat => {
      const associatedProducts = state.products.filter(p => 
        p.categoria === cat.nombre_categoria || p.id_categoria === cat.id_categoria
      );
      const count = associatedProducts.length;

      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-4 py-3 font-mono font-bold text-[#E30613]">${cat.id_categoria}</td>
          <td class="px-4 py-3 font-semibold text-[#333333]">${cat.nombre_categoria}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${count > 0 ? 'bg-red-50 text-[#E30613] border border-red-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}">
              ${count} ${count === 1 ? 'producto' : 'productos'}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <div class="flex items-center justify-end space-x-1">
              <button onclick="openAddCategoryModal('${cat.id_categoria}')" class="p-1.5 text-gray-500 hover:text-[#00A651] hover:bg-emerald-50 rounded-lg transition-colors" title="Editar Categoría">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="deleteCategoryPrompt('${cat.id_categoria}')" class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar Categoría">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  openModal('modal-categories');
  if (window.lucide) window.lucide.createIcons();
}

function openAddCategoryModal(catId = null) {
  state.editingCategoryId = catId;
  const titleEl = document.getElementById('category-form-title');
  const idInput = document.getElementById('category-form-id');
  const nameInput = document.getElementById('category-form-name');

  if (catId) {
    const cat = state.categories.find(c => c.id_categoria === catId);
    if (cat) {
      titleEl.textContent = 'Editar categoría';
      idInput.value = cat.id_categoria;
      nameInput.value = cat.nombre_categoria;
    }
  } else {
    titleEl.textContent = 'Agregar categoría';
    idInput.value = '';
    nameInput.value = '';
  }

  openModal('modal-category-form');
  setTimeout(() => nameInput.focus(), 100);
}

async function handleSaveCategory(event) {
  event.preventDefault();
  const rawName = document.getElementById('category-form-name').value;
  const cleanName = rawName.trim();

  if (!cleanName) {
    Swal.fire({
      icon: 'warning',
      title: 'Nombre requerido',
      text: 'El nombre de la categoría no puede estar vacío.',
      confirmButtonColor: '#E30613'
    });
    return;
  }

  const isDuplicate = state.categories.some(c => 
    c.nombre_categoria.toLowerCase() === cleanName.toLowerCase() &&
    c.id_categoria !== state.editingCategoryId
  );

  if (isDuplicate) {
    Swal.fire({
      icon: 'warning',
      title: 'Categoría duplicada',
      text: 'Ya existe una categoría con este nombre.',
      confirmButtonColor: '#E30613'
    });
    return;
  }

  if (state.editingCategoryId) {
    const cat = state.categories.find(c => c.id_categoria === state.editingCategoryId);
    if (cat) {
      const oldName = cat.nombre_categoria;
      cat.nombre_categoria = cleanName;
      await window.dataService.saveCategory(cat);

      if (oldName !== cleanName) {
        for (const prod of state.products) {
          if (prod.categoria === oldName || prod.id_categoria === cat.id_categoria) {
            prod.categoria = cleanName;
            prod.id_categoria = cat.id_categoria;
            await window.dataService.saveProduct(prod);
          }
        }
      }

      Toast.fire({ icon: 'success', title: 'Categoría actualizada correctamente.' });
    }
  } else {
    const nextNum = state.categories.length + 1;
    const newId = `CAT${String(nextNum).padStart(3, '0')}`;
    const newCat = {
      id_categoria: newId,
      nombre_categoria: cleanName,
      fecha_creacion: new Date().toISOString().split('T')[0],
      estado: 'Activo'
    };

    await window.dataService.saveCategory(newCat);
    Toast.fire({ icon: 'success', title: 'Categoría creada correctamente.' });
  }

  await loadAllData();
  closeModal('modal-category-form');

  const modalCat = document.getElementById('modal-categories');
  if (modalCat && !modalCat.classList.contains('hidden')) {
    openCategoriesModal();
  }

  if (state.currentView === 'productos') {
    renderProducts();
  }
}

async function deleteCategoryPrompt(catId) {
  const cat = state.categories.find(c => c.id_categoria === catId);
  if (!cat) return;

  const associatedProducts = state.products.filter(p => 
    p.categoria === cat.nombre_categoria || p.id_categoria === cat.id_categoria
  );

  if (associatedProducts.length > 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No se puede eliminar',
      text: 'No se puede eliminar esta categoría porque existen productos asociados. Cambia primero la categoría de esos productos.',
      confirmButtonColor: '#E30613'
    });
    return;
  }

  const result = await Swal.fire({
    title: '¿Estás seguro de que deseas eliminar esta categoría?',
    text: `Se eliminará la categoría "${cat.nombre_categoria}".`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    await window.dataService.deleteCategory(catId);
    await loadAllData();
    openCategoriesModal();
    renderProducts();
    Toast.fire({ icon: 'success', title: 'Categoría eliminada.' });
  }
}

// ==========================================
// 4. MÓDULO SEGUIMIENTO / VENTAS (CRUD)
// ==========================================
function renderSalesTable() {
  const tbody = document.getElementById('table-ventas-body');
  if (!tbody) return;

  const search = (document.getElementById('filter-sales-search')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('filter-sales-status')?.value || '';
  const channelFilter = document.getElementById('filter-sales-channel')?.value || '';

  const filtered = state.sales.filter(s => {
    const client = state.clients.find(c => c.id_cliente === s.id_cliente);
    const prod = state.products.find(p => p.id_producto === s.id_producto);
    const clientName = client ? `${client.nombre} ${client.apellido}`.toLowerCase() : '';
    const prodName = prod ? prod.nombre.toLowerCase() : '';
    const obs = (s.observacion || '').toLowerCase();

    const matchSearch = !search ||
      s.id_seguimiento.toLowerCase().includes(search) ||
      s.id_cliente.toLowerCase().includes(search) ||
      clientName.includes(search) ||
      prodName.includes(search) ||
      obs.includes(search);

    const matchStatus = !statusFilter || s.estado === statusFilter;
    const matchChannel = !channelFilter || s.canal === channelFilter;

    return matchSearch && matchStatus && matchChannel;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="px-6 py-6 text-center text-gray-400">No se encontraron ventas registradas.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const client = state.clients.find(c => c.id_cliente === s.id_cliente);
    const prod = state.products.find(p => p.id_producto === s.id_producto);

    const clientDisplay = client ? `${client.nombre} ${client.apellido}` : s.id_cliente;
    const prodDisplay = prod ? prod.nombre : s.id_producto;

    const statusBadgeClass = {
      'Completado': 'badge-completado',
      'Pendiente': 'badge-pendiente',
      'Cancelado': 'badge-cancelado'
    }[s.estado] || 'badge-completado';

    const channelBadgeClass = {
      'Instagram': 'badge-instagram',
      'Facebook': 'badge-facebook',
      'WhatsApp': 'badge-whatsapp',
      'Local': 'badge-local'
    }[s.canal] || 'badge-local';

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3 font-mono font-bold text-[#E30613]">${s.id_seguimiento}</td>
        <td class="px-4 py-3">
          <div class="font-semibold text-[#333333]">${clientDisplay}</div>
          <span class="text-[11px] font-mono text-gray-400">${s.id_cliente}</span>
        </td>
        <td class="px-4 py-3">
          <div class="font-medium text-[#333333]">${prodDisplay}</div>
          <span class="text-[11px] text-gray-400">${prod ? prod.categoria : ''}</span>
        </td>
        <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">${s.fecha_compra}</td>
        <td class="px-4 py-3 font-bold text-center">${s.cantidad}</td>
        <td class="px-4 py-3 font-extrabold text-[#333333] font-mono">$${(parseFloat(s.total) || 0).toFixed(2)}</td>
        <td class="px-4 py-3">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${channelBadgeClass}">
            ${s.canal}
          </span>
        </td>
        <td class="px-4 py-3 text-xs font-medium text-gray-600">${s.metodo_pago}</td>
        <td class="px-4 py-3">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass}">
            ${s.estado}
          </span>
        </td>
        <td class="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title="${s.observacion || ''}">
          ${s.observacion || '-'}
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <div class="flex items-center justify-end space-x-1">
            <button onclick="printSaleReceipt('${s.id_seguimiento}')" class="p-1.5 text-gray-500 hover:text-[#00A651] hover:bg-emerald-50 rounded-lg" title="Ver / Imprimir Recibo">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
            <button onclick="editSale('${s.id_seguimiento}')" class="p-1.5 text-gray-500 hover:text-[#E30613] hover:bg-red-50 rounded-lg" title="Editar Venta">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteSalePrompt('${s.id_seguimiento}')" class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar Venta">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openSaleModal(saleId = null) {
  state.editingSaleId = saleId;
  const modalTitle = document.getElementById('modal-sale-title');
  const idInput = document.getElementById('sale-id');
  const dateInput = document.getElementById('sale-date');
  const clientSelect = document.getElementById('sale-client-id');
  const productSelect = document.getElementById('sale-product-id');
  const qtyInput = document.getElementById('sale-qty');
  const totalInput = document.getElementById('sale-total');
  const channelSelect = document.getElementById('sale-channel');
  const paymentSelect = document.getElementById('sale-payment');
  const statusSelect = document.getElementById('sale-status');
  const obsInput = document.getElementById('sale-notes');

  clientSelect.innerHTML = state.clients.map(c => `
    <option value="${c.id_cliente}">${c.id_cliente} - ${c.nombre} ${c.apellido} (${c.tipo_cliente})</option>
  `).join('');

  productSelect.innerHTML = state.products.map(p => `
    <option value="${p.id_producto}" data-price="${p.precio_v}">${p.id_producto} - ${p.nombre} ($${p.precio_v})</option>
  `).join('');

  if (saleId) {
    modalTitle.textContent = 'Editar Venta / Seguimiento';
    const sale = state.sales.find(s => s.id_seguimiento === saleId);
    if (sale) {
      idInput.value = sale.id_seguimiento;
      idInput.readOnly = true;
      dateInput.value = sale.fecha_compra || new Date().toISOString().split('T')[0];
      clientSelect.value = sale.id_cliente;
      productSelect.value = sale.id_producto;
      qtyInput.value = sale.cantidad;
      totalInput.value = sale.total;
      channelSelect.value = sale.canal || 'Instagram';
      paymentSelect.value = sale.metodo_pago || 'Efectivo';
      statusSelect.value = sale.estado || 'Completado';
      obsInput.value = sale.observacion || 'Entregado a conformidad';
    }
  } else {
    modalTitle.textContent = 'Registrar Venta / Seguimiento';
    idInput.readOnly = false;
    const nextNum = state.sales.length + 1;
    idInput.value = `S${String(nextNum).padStart(3, '0')}`;
    dateInput.value = new Date().toISOString().split('T')[0];
    qtyInput.value = 1;
    channelSelect.value = 'Instagram';
    paymentSelect.value = 'Efectivo';
    statusSelect.value = 'Completado';
    obsInput.value = 'Entregado a conformidad';
    calculateSaleTotal();
  }

  openModal('modal-sale');
}

function calculateSaleTotal() {
  const productSelect = document.getElementById('sale-product-id');
  const qtyInput = document.getElementById('sale-qty');
  const totalInput = document.getElementById('sale-total');

  if (!productSelect || !qtyInput || !totalInput) return;

  const selectedOption = productSelect.options[productSelect.selectedIndex];
  if (!selectedOption) return;

  const unitPrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
  const qty = parseInt(qtyInput.value, 10) || 1;
  const calculated = unitPrice * qty;

  totalInput.value = calculated.toFixed(2);
}

function editSale(id) {
  openSaleModal(id);
}

async function handleSaveSale(event) {
  event.preventDefault();
  const id = document.getElementById('sale-id').value.trim();
  const id_cliente = document.getElementById('sale-client-id').value;
  const id_producto = document.getElementById('sale-product-id').value;
  const fecha_compra = document.getElementById('sale-date').value;
  const cantidad = parseInt(document.getElementById('sale-qty').value, 10) || 1;
  const total = parseFloat(document.getElementById('sale-total').value) || 0;
  const canal = document.getElementById('sale-channel').value;
  const metodo_pago = document.getElementById('sale-payment').value;
  const estado = document.getElementById('sale-status').value;
  const observacion = document.getElementById('sale-notes').value.trim();

  if (!id || !id_cliente || !id_producto) {
    Toast.fire({ icon: 'warning', title: 'Selecciona cliente y producto' });
    return;
  }

  const saleData = {
    id_seguimiento: id,
    id_cliente,
    id_producto,
    fecha_compra,
    cantidad,
    total,
    canal,
    metodo_pago,
    estado,
    observacion
  };

  await window.dataService.saveSale(saleData);
  await loadAllData();
  closeModal('modal-sale');
  renderSalesTable();
  if (state.currentView === 'dashboard') renderDashboard();
  Toast.fire({ icon: 'success', title: 'Venta registrada con éxito' });
}

async function deleteSalePrompt(id) {
  const result = await Swal.fire({
    title: '¿Eliminar registro de venta?',
    text: `Se eliminará el seguimiento ${id}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    await window.dataService.deleteSale(id);
    await loadAllData();
    renderSalesTable();
    if (state.currentView === 'dashboard') renderDashboard();
    Toast.fire({ icon: 'success', title: 'Registro eliminado' });
  }
}

// ==========================================
// COMPROBANTE DE VENTA IMPRIMIBLE
// ==========================================
function printSaleReceipt(saleId) {
  const sale = state.sales.find(s => s.id_seguimiento === saleId);
  if (!sale) return;

  const client = state.clients.find(c => c.id_cliente === sale.id_cliente) || {
    nombre: sale.id_cliente,
    apellido: '',
    telefono: 'S/N',
    correo: 'S/N'
  };

  const product = state.products.find(p => p.id_producto === sale.id_producto) || {
    nombre: sale.id_producto
  };

  document.getElementById('rcpt-id').textContent = sale.id_seguimiento;
  document.getElementById('rcpt-date').textContent = sale.fecha_compra;
  document.getElementById('rcpt-channel').textContent = sale.canal;
  document.getElementById('rcpt-payment').textContent = sale.metodo_pago;
  document.getElementById('rcpt-status').textContent = sale.estado;

  document.getElementById('rcpt-client-name').textContent = `${client.nombre} ${client.apellido}`;
  document.getElementById('rcpt-client-phone').textContent = client.telefono || 'Sin registrar';
  document.getElementById('rcpt-client-email').textContent = client.correo || 'Sin registrar';

  document.getElementById('rcpt-product-name').textContent = product.nombre;
  document.getElementById('rcpt-product-qty').textContent = sale.cantidad;
  document.getElementById('rcpt-total').textContent = `$${(parseFloat(sale.total) || 0).toFixed(2)}`;

  document.getElementById('rcpt-obs').textContent = sale.observacion || 'Entregado a conformidad';

  openModal('modal-receipt');
}

// ==========================================
// HELPERS DE MODALES
// ==========================================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('hidden');
  }
  if (window.lucide) window.lucide.createIcons();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// ==========================================
// CONTROLADOR DE AUTENTICACIÓN (SUPABASE AUTH & GATEKEEPER)
// ==========================================

// Alternar entre las pantallas de la aplicación (Gatekeeper)
function showGatekeeperScreen(screenName) {
  const loginEl = document.getElementById('login-screen');
  const pendingEl = document.getElementById('pending-screen');
  const rejectedEl = document.getElementById('rejected-screen');
  const disabledEl = document.getElementById('disabled-screen');
  const appEl = document.getElementById('app-container');

  if (loginEl) loginEl.classList.add('hidden');
  if (pendingEl) pendingEl.classList.add('hidden');
  if (rejectedEl) rejectedEl.classList.add('hidden');
  if (disabledEl) disabledEl.classList.add('hidden');
  if (appEl) appEl.classList.add('hidden');

  if (screenName === 'login' && loginEl) loginEl.classList.remove('hidden');
  if (screenName === 'pending' && pendingEl) pendingEl.classList.remove('hidden');
  if (screenName === 'rejected' && rejectedEl) rejectedEl.classList.remove('hidden');
  if (screenName === 'disabled' && disabledEl) disabledEl.classList.remove('hidden');
  if (screenName === 'app' && appEl) appEl.classList.remove('hidden');

  if (window.lucide) window.lucide.createIcons();
}

// Verificar sesión activa al inicio
async function checkAuthSession() {
  const saved = localStorage.getItem('qp_current_profile') || 
                sessionStorage.getItem('qp_current_profile') ||
                localStorage.getItem('qp_current_user') || 
                sessionStorage.getItem('qp_current_user');

  if (saved) {
    try {
      const user = JSON.parse(saved);
      // Intentar refrescar el perfil con los datos más recientes
      const freshProfile = await window.dataService.getUserProfileByEmail(user.correo);
      state.currentUser = freshProfile || user;
      evaluateUserAccess(state.currentUser);
    } catch (e) {
      console.warn('Error verificando sesión guardada:', e);
      showGatekeeperScreen('login');
    }
  } else {
    showGatekeeperScreen('login');
  }
}

// Evaluar permisos y enrutar según el estado de aprobación
function evaluateUserAccess(user) {
  if (!user) {
    showGatekeeperScreen('login');
    return;
  }

  const estado = (user.estado || 'PENDIENTE').toUpperCase();

  if (estado === 'PENDIENTE') {
    const nameEl = document.getElementById('pending-user-name');
    const emailEl = document.getElementById('pending-user-email');
    if (nameEl) nameEl.textContent = `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.correo;
    if (emailEl) emailEl.textContent = user.correo || '-';
    showGatekeeperScreen('pending');
    return;
  }

  if (estado === 'RECHAZADO') {
    showGatekeeperScreen('rejected');
    return;
  }

  if (estado === 'DESACTIVADO') {
    showGatekeeperScreen('disabled');
    return;
  }

  if (estado === 'APROBADO') {
    showGatekeeperScreen('app');

    // Actualizar nombre y rol en la cabecera
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const fullName = `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.correo;
    if (nameEl) nameEl.textContent = fullName;
    if (roleEl) {
      roleEl.textContent = user.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Usuario Operativo';
      roleEl.className = user.rol === 'ADMINISTRADOR'
        ? 'text-[10px] font-bold text-[#E30613]'
        : 'text-[10px] font-semibold text-[#00A651]';
    }

    // Control de Acceso Basado en Roles (RBAC) para el módulo de usuarios
    const navUserBtn = document.getElementById('nav-btn-usuarios');
    const mobileNavUserBtn = document.getElementById('mobile-nav-btn-usuarios');

    if (user.rol !== 'ADMINISTRADOR') {
      if (navUserBtn) navUserBtn.classList.add('hidden');
      if (mobileNavUserBtn) mobileNavUserBtn.classList.add('hidden');
      if (state.currentView === 'usuarios') {
        state.currentView = 'dashboard';
      }
    } else {
      if (navUserBtn) navUserBtn.classList.remove('hidden');
      if (mobileNavUserBtn) mobileNavUserBtn.classList.remove('hidden');
    }

    switchView(state.currentView || 'dashboard');
  }
}

// Iniciar sesión
async function handleLoginSubmit(e) {
  if (e) e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const remember = document.getElementById('login-remember')?.checked;

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value.trim() : '';

  if (!email || !password) {
    Toast.fire({ icon: 'warning', title: 'Por favor ingresa tu correo y contraseña' });
    return;
  }

  const btnSubmit = document.getElementById('btn-login-submit');
  const originalBtnText = btnSubmit ? btnSubmit.innerHTML : '';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline-block mr-2"></i> Verificando...`;
  }

  try {
    const result = await window.dataService.signInUser({ email, password });
    
    state.currentUser = result.profile;
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('qp_current_profile', JSON.stringify(result.profile));
    storage.setItem('qp_current_user', JSON.stringify(result.profile));

    evaluateUserAccess(result.profile);

    if (result.profile.estado === 'APROBADO') {
      Toast.fire({
        icon: 'success',
        title: `¡Bienvenido(a), ${result.profile.nombre || result.profile.correo}!`
      });
    }
  } catch (err) {
    console.error('Error de autenticación:', err);
    Swal.fire({
      icon: 'error',
      title: 'Acceso Denegado',
      text: err.message || 'Credenciales inválidas. Por favor verifica tu correo y contraseña.',
      confirmButtonColor: '#E30613'
    });
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalBtnText;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

// Registro de cuenta nueva (Público)
async function handleRegisterSubmit(e) {
  if (e) e.preventDefault();

  const nombre = document.getElementById('reg-name')?.value.trim();
  const apellido = document.getElementById('reg-lastname')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim().toLowerCase();
  const telefono = document.getElementById('reg-phone')?.value.trim();
  const password = document.getElementById('reg-password')?.value.trim();
  const confirmPass = document.getElementById('reg-confirm-password')?.value.trim();

  if (!nombre || !apellido || !email || !telefono || !password) {
    Toast.fire({ icon: 'warning', title: 'Por favor completa todos los campos requeridos' });
    return;
  }

  if (password !== confirmPass) {
    Swal.fire({
      icon: 'error',
      title: 'Las contraseñas no coinciden',
      text: 'Por favor asegúrate de escribir la misma contraseña en ambos campos.',
      confirmButtonColor: '#E30613'
    });
    return;
  }

  if (password.length < 6) {
    Swal.fire({
      icon: 'warning',
      title: 'Contraseña muy corta',
      text: 'La contraseña debe tener al menos 6 caracteres por seguridad.',
      confirmButtonColor: '#E30613'
    });
    return;
  }

  const btnSubmit = document.getElementById('btn-register-submit');
  const originalText = btnSubmit ? btnSubmit.innerHTML : '';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin mr-1 inline-block"></i> Registrando...`;
  }

  try {
    const result = await window.dataService.signUpUser({
      email,
      password,
      nombre,
      apellido,
      telefono
    });

    closeModal('modal-register');
    const regForm = document.getElementById('form-register');
    if (regForm) regForm.reset();

    // Actualizar perfiles locales
    state.userProfiles = await window.dataService.getUserProfiles();
    state.users = state.userProfiles;
    updateNavigationBadges();

    // Mostrar modal informativo
    await Swal.fire({
      icon: 'info',
      title: '¡Solicitud Registrada con Éxito!',
      html: `
        <div class="space-y-3 text-left text-xs text-gray-600">
          <p>Tu cuenta ha sido creada para: <strong class="text-gray-900">${nombre} ${apellido}</strong> (${email}).</p>
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
            <strong>Estado actual: PENDIENTE DE APROBACIÓN</strong>
            <p class="mt-1">Un administrador revisará y habilitará tu acceso al CRM de Avícola QUÉ POLLO.</p>
          </div>
        </div>
      `,
      confirmButtonColor: '#E30613',
      confirmButtonText: 'Entendido'
    });

    // Colocar al usuario en la pantalla de pendiente
    state.currentUser = result.profile;
    sessionStorage.setItem('qp_current_profile', JSON.stringify(result.profile));
    sessionStorage.setItem('qp_current_user', JSON.stringify(result.profile));
    evaluateUserAccess(result.profile);

  } catch (err) {
    console.error('Error al registrar usuario:', err);
    Swal.fire({
      icon: 'error',
      title: 'Error de Registro',
      text: err.message || 'No se pudo completar el registro. Intenta nuevamente.',
      confirmButtonColor: '#E30613'
    });
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }
  }
}

// Recuperar contraseña
async function handleForgotPasswordSubmit(e) {
  if (e) e.preventDefault();

  const email = document.getElementById('forgot-email')?.value.trim();
  if (!email) {
    Toast.fire({ icon: 'warning', title: 'Ingresa tu correo electrónico' });
    return;
  }

  try {
    const res = await window.dataService.resetPassword(email);
    closeModal('modal-forgot-password');
    const form = document.getElementById('form-forgot-password');
    if (form) form.reset();

    Swal.fire({
      icon: 'success',
      title: 'Solicitud Enviada',
      text: res.message || 'Revisa tu bandeja de entrada para restablecer tu contraseña con Supabase Auth.',
      confirmButtonColor: '#E30613'
    });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message || 'No se pudo procesar la solicitud de recuperación.',
      confirmButtonColor: '#E30613'
    });
  }
}

// Cerrar sesión
function handleLogout() {
  Swal.fire({
    title: '¿Cerrar Sesión?',
    text: 'Volverás a la pantalla principal de acceso comercial.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar'
  }).then(async (res) => {
    if (res.isConfirmed) {
      await window.dataService.signOutUser();
      localStorage.removeItem('qp_current_profile');
      sessionStorage.removeItem('qp_current_profile');
      localStorage.removeItem('qp_current_user');
      sessionStorage.removeItem('qp_current_user');
      state.currentUser = null;

      const form = document.getElementById('form-login');
      if (form) form.reset();

      showGatekeeperScreen('login');
      Toast.fire({ icon: 'info', title: 'Sesión finalizada correctamente' });
    }
  });
}

// Alternar visibilidad de contraseña
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
// MÓDULO 4: GESTIÓN DE PERFILES Y APROBACIONES
// ==========================================

// Cambiar filtro de pestaña de estados (TODOS, PENDIENTE, APROBADO, RECHAZADO, DESACTIVADO)
function setProfilesFilter(status) {
  state.currentProfileFilter = status;

  const tabs = ['todos', 'pendiente', 'aprobado', 'rechazado', 'desactivado'];
  tabs.forEach(t => {
    const tabBtn = document.getElementById(`tab-filter-${t}`);
    if (tabBtn) {
      if (t === status.toLowerCase()) {
        tabBtn.className = 'tab-profile-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#333333] text-white shadow-xs';
      } else {
        tabBtn.className = 'tab-profile-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200';
      }
    }
  });

  renderUsuariosTable();
}

// Renderizar tabla de usuarios y perfiles
function renderUsuariosTable() {
  const tbody = document.getElementById('table-usuarios-body');
  if (!tbody) return;

  // Actualizar contadores de las pestañas
  const allProfiles = state.userProfiles || [];
  const countTodos = allProfiles.length;
  const countPendiente = allProfiles.filter(p => p.estado === 'PENDIENTE').length;
  const countAprobado = allProfiles.filter(p => p.estado === 'APROBADO').length;
  const countRechazado = allProfiles.filter(p => p.estado === 'RECHAZADO').length;
  const countDesactivado = allProfiles.filter(p => p.estado === 'DESACTIVADO').length;

  const bTodos = document.getElementById('badge-tab-todos');
  const bPendiente = document.getElementById('badge-tab-pendiente');
  const bAprobado = document.getElementById('badge-tab-aprobado');
  const bRechazado = document.getElementById('badge-tab-rechazado');
  const bDesactivado = document.getElementById('badge-tab-desactivado');

  if (bTodos) bTodos.textContent = countTodos;
  if (bPendiente) bPendiente.textContent = countPendiente;
  if (bAprobado) bAprobado.textContent = countAprobado;
  if (bRechazado) bRechazado.textContent = countRechazado;
  if (bDesactivado) bDesactivado.textContent = countDesactivado;

  // Filtros aplicados
  const search = (document.getElementById('filter-user-search')?.value || '').toLowerCase();
  const roleFilter = document.getElementById('filter-user-role')?.value || '';
  const statusFilter = state.currentProfileFilter || 'TODOS';

  const filtered = allProfiles.filter(p => {
    const fullName = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
    const email = (p.correo || '').toLowerCase();
    const phone = (p.telefono || '').toLowerCase();
    const matchSearch = !search || fullName.includes(search) || email.includes(search) || phone.includes(search);
    const matchRole = !roleFilter || (p.rol || '').toUpperCase() === roleFilter.toUpperCase();
    const matchStatus = statusFilter === 'TODOS' || (p.estado || '').toUpperCase() === statusFilter.toUpperCase();
    return matchSearch && matchRole && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-10 text-center text-gray-400">
          <i data-lucide="shield-alert" class="w-9 h-9 mx-auto mb-2 text-gray-300"></i>
          <p class="font-semibold text-gray-500">No se encontraron solicitudes o usuarios</p>
          <p class="text-xs text-gray-400 mt-1">Intenta ajustando el filtro de búsqueda o el estado seleccionado.</p>
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const isCurrentUser = state.currentUser && (state.currentUser.correo === p.correo || state.currentUser.id === p.id);
    const profileId = p.id || p.user_id || p.correo;
    const fullName = `${p.nombre || ''} ${p.apellido || ''}`.trim() || 'Sin Nombre';

    // Badge de Rol
    const roleBadge = p.rol === 'ADMINISTRADOR'
      ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[#E30613] border border-red-200">👑 ADMINISTRADOR</span>`
      : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#00A651] border border-emerald-200">💼 USUARIO</span>`;

    // Badge de Estado
    let statusBadge = '';
    if (p.estado === 'PENDIENTE') {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">🟡 PENDIENTE</span>`;
    } else if (p.estado === 'APROBADO') {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#00A651] border border-emerald-200">🟢 APROBADO</span>`;
    } else if (p.estado === 'RECHAZADO') {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[#E30613] border border-red-200">🔴 RECHAZADO</span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">⚪ DESACTIVADO</span>`;
    }

    // Botones de Acción según estado
    let stateActionButtons = '';
    if (p.estado === 'PENDIENTE') {
      stateActionButtons = `
        <button onclick="handleApproveUser('${profileId}')" title="Aprobar Solicitud" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#00A651] hover:bg-emerald-700 text-white flex items-center space-x-1 shadow-xs transition-colors">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          <span>Aprobar</span>
        </button>
        <button onclick="handleRejectUser('${profileId}')" title="Rechazar Solicitud" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-[#E30613] border border-red-200 flex items-center space-x-1 transition-colors">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
          <span>Rechazar</span>
        </button>
      `;
    } else if (p.estado === 'APROBADO') {
      stateActionButtons = `
        ${!isCurrentUser ? `
          <button onclick="handleDeactivateUser('${profileId}')" title="Desactivar Cuenta" class="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors">
            <i data-lucide="power-off" class="w-4 h-4"></i>
          </button>
        ` : ''}
        <button onclick="handleChangeRolePrompt('${profileId}')" title="Cambiar Rol (Administrador / Usuario)" class="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
          <i data-lucide="shield" class="w-4 h-4"></i>
        </button>
      `;
    } else if (p.estado === 'RECHAZADO') {
      stateActionButtons = `
        <button onclick="handleApproveUser('${profileId}')" title="Aprobar y Conceder Acceso" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#00A651] hover:bg-emerald-700 text-white flex items-center space-x-1 shadow-xs transition-colors">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
          <span>Aprobar</span>
        </button>
      `;
    } else if (p.estado === 'DESACTIVADO') {
      stateActionButtons = `
        <button onclick="handleReactivateUser('${profileId}')" title="Reactivar Cuenta" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#00A651] hover:bg-emerald-700 text-white flex items-center space-x-1 shadow-xs transition-colors">
          <i data-lucide="power" class="w-3.5 h-3.5"></i>
          <span>Reactivar</span>
        </button>
      `;
    }

    // Teléfono WhatsApp
    const phoneClean = (p.telefono || '').replace(/\D/g, '');
    const waLink = phoneClean ? `https://wa.me/593${phoneClean.startsWith('0') ? phoneClean.slice(1) : phoneClean}` : null;

    return `
      <tr class="hover:bg-gray-50/80 transition-colors ${p.estado === 'PENDIENTE' ? 'bg-amber-50/30' : ''}">
        <td class="px-4 py-3">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-full bg-red-50 text-[#E30613] font-bold text-xs flex items-center justify-center border border-red-100 shrink-0">
              ${fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="font-bold text-[#333333] flex items-center space-x-1.5">
                <span>${fullName}</span>
                ${isCurrentUser ? '<span class="text-[10px] bg-red-100 text-[#E30613] px-1.5 py-0.2 rounded font-bold">Tú</span>' : ''}
              </div>
              <span class="text-[11px] text-gray-400 font-mono">ID: ${(p.user_id || p.id || '').slice(0, 8)}...</span>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="space-y-0.5">
            <div class="text-xs font-medium text-gray-700 flex items-center space-x-1">
              <i data-lucide="mail" class="w-3 h-3 text-gray-400"></i>
              <span class="font-mono">${p.correo}</span>
            </div>
            ${p.telefono ? `
              <div class="text-xs text-gray-500 flex items-center space-x-1">
                <i data-lucide="phone" class="w-3 h-3 text-[#00A651]"></i>
                ${waLink ? `<a href="${waLink}" target="_blank" class="hover:underline text-[#00A651] font-medium">${p.telefono}</a>` : `<span>${p.telefono}</span>`}
              </div>
            ` : ''}
          </div>
        </td>
        <td class="px-4 py-3">${roleBadge}</td>
        <td class="px-4 py-3">${statusBadge}</td>
        <td class="px-4 py-3 text-xs text-gray-500 font-mono">
          ${p.fecha_registro || '-'}
        </td>
        <td class="px-4 py-3 text-xs text-gray-500">
          ${p.aprobado_por ? `
            <div>
              <span class="font-semibold text-gray-700">${p.aprobado_por}</span>
              <p class="text-[10px] text-gray-400 font-mono">${p.fecha_aprobacion || ''}</p>
            </div>
          ` : `<span class="text-gray-400 italic">Pendiente de revisión</span>`}
        </td>
        <td class="px-4 py-3 text-right">
          <div class="inline-flex items-center space-x-1.5">
            ${stateActionButtons}
            <button onclick="openUserModal('${profileId}')" title="Editar Perfil" class="p-1.5 rounded-lg text-gray-500 hover:text-[#00A651] hover:bg-emerald-50 transition-colors">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            ${!isCurrentUser ? `
              <button onclick="handleDeleteUser('${profileId}')" title="Eliminar Perfil" class="p-1.5 rounded-lg text-gray-500 hover:text-[#E30613] hover:bg-red-50 transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            ` : `
              <span class="w-7"></span>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Aprobar Usuario (ADMINISTRADOR)
async function handleApproveUser(profileId) {
  try {
    const adminName = `${state.currentUser?.nombre || 'Administrador'} ${state.currentUser?.apellido || ''}`.trim();
    await window.dataService.approveUser(profileId, adminName);
    state.userProfiles = await window.dataService.getUserProfiles();
    state.users = state.userProfiles;
    updateNavigationBadges();
    renderUsuariosTable();

    Toast.fire({
      icon: 'success',
      title: '¡Usuario Aprobado! Ya tiene acceso al sistema comercial'
    });
  } catch (err) {
    console.error('Error aprobando usuario:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

// Rechazar Usuario (ADMINISTRADOR)
async function handleRejectUser(profileId) {
  const result = await Swal.fire({
    title: '¿Rechazar Solicitud?',
    text: 'El usuario no podrá acceder al CRM de Avícola QUÉ POLLO.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Sí, rechazar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      const adminName = `${state.currentUser?.nombre || 'Administrador'} ${state.currentUser?.apellido || ''}`.trim();
      await window.dataService.rejectUser(profileId, adminName);
      state.userProfiles = await window.dataService.getUserProfiles();
      state.users = state.userProfiles;
      updateNavigationBadges();
      renderUsuariosTable();

      Toast.fire({ icon: 'info', title: 'Solicitud rechazada' });
    } catch (err) {
      console.error('Error rechazando usuario:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

// Desactivar Usuario (ADMINISTRADOR)
async function handleDeactivateUser(profileId) {
  const result = await Swal.fire({
    title: '¿Desactivar Cuenta?',
    text: 'El usuario será suspendido temporalmente y no podrá operar en el sistema.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Sí, desactivar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await window.dataService.deactivateUser(profileId);
      state.userProfiles = await window.dataService.getUserProfiles();
      state.users = state.userProfiles;
      updateNavigationBadges();
      renderUsuariosTable();

      Toast.fire({ icon: 'warning', title: 'Cuenta desactivada temporalmente' });
    } catch (err) {
      console.error('Error desactivando usuario:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

// Reactivar Usuario (ADMINISTRADOR)
async function handleReactivateUser(profileId) {
  try {
    const adminName = `${state.currentUser?.nombre || 'Administrador'} ${state.currentUser?.apellido || ''}`.trim();
    await window.dataService.reactivateUser(profileId, adminName);
    state.userProfiles = await window.dataService.getUserProfiles();
    state.users = state.userProfiles;
    updateNavigationBadges();
    renderUsuariosTable();

    Toast.fire({ icon: 'success', title: 'Cuenta reactivada exitosamente' });
  } catch (err) {
    console.error('Error reactivando usuario:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
  }
}

// Cambiar Rol de Usuario
async function handleChangeRolePrompt(profileId) {
  const p = (state.userProfiles || []).find(x => x.id === profileId || x.user_id === profileId || x.correo === profileId);
  if (!p) return;

  const currentRole = p.rol || 'USUARIO';
  const newRole = currentRole === 'ADMINISTRADOR' ? 'USUARIO' : 'ADMINISTRADOR';

  const result = await Swal.fire({
    title: '¿Cambiar Rol de Acceso?',
    html: `Cambiar el rol de <strong>${p.nombre || p.correo}</strong> de <span class="font-bold">${currentRole}</span> a <span class="font-bold text-[#E30613]">${newRole}</span>.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    cancelButtonColor: '#6B7280',
    confirmButtonText: `Sí, cambiar a ${newRole}`,
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await window.dataService.changeUserRole(profileId, newRole);
      state.userProfiles = await window.dataService.getUserProfiles();
      state.users = state.userProfiles;
      renderUsuariosTable();
      Toast.fire({ icon: 'success', title: `Rol cambiado a ${newRole}` });
    } catch (err) {
      console.error('Error cambiando rol:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

// Eliminar Usuario Permanentemente
async function handleDeleteUser(profileId) {
  const p = (state.userProfiles || []).find(x => x.id === profileId || x.user_id === profileId || x.correo === profileId);
  if (state.currentUser && (state.currentUser.correo === p?.correo || state.currentUser.id === profileId)) {
    Swal.fire({
      icon: 'error',
      title: 'Acción no permitida',
      text: 'No puedes eliminar tu propia cuenta mientras estás conectado.',
      confirmButtonColor: '#E30613'
    });
    return;
  }

  const result = await Swal.fire({
    title: '¿Eliminar Usuario Definitivamente?',
    html: `Se eliminará el perfil y acceso de <strong>${p ? (p.nombre + ' ' + (p.apellido || '')) : profileId}</strong> (${p?.correo || ''}).`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await window.dataService.deleteUserProfile(profileId);
      state.userProfiles = await window.dataService.getUserProfiles();
      state.users = state.userProfiles;
      updateNavigationBadges();
      renderUsuariosTable();
      Toast.fire({ icon: 'success', title: 'Usuario eliminado del sistema' });
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

// Abrir Modal de Creación / Edición de Usuario (Admin)
function openUserModal(profileId = null) {
  state.editingUserId = profileId;
  const title = document.getElementById('modal-user-title');
  const form = document.getElementById('form-user');
  if (form) form.reset();

  const idInput = document.getElementById('user-profile-id');
  const emailInput = document.getElementById('user-email');

  if (profileId) {
    const p = (state.userProfiles || []).find(x => x.id === profileId || x.user_id === profileId || x.correo === profileId);
    if (!p) return;

    if (title) title.textContent = 'Editar Perfil de Usuario';
    if (idInput) idInput.value = p.id || p.user_id || '';
    if (emailInput) {
      emailInput.value = p.correo || '';
      emailInput.readOnly = true;
    }
    document.getElementById('user-name').value = p.nombre || '';
    document.getElementById('user-lastname').value = p.apellido || '';
    document.getElementById('user-phone').value = p.telefono || '';
    document.getElementById('user-role').value = p.rol || 'USUARIO';
    document.getElementById('user-status').value = p.estado || 'APROBADO';
  } else {
    if (title) title.textContent = 'Crear Nuevo Perfil de Usuario';
    if (idInput) idInput.value = '';
    if (emailInput) {
      emailInput.value = '';
      emailInput.readOnly = false;
    }
    document.getElementById('user-role').value = 'USUARIO';
    document.getElementById('user-status').value = 'APROBADO';
  }

  openModal('modal-user');
}

// Guardar Perfil de Usuario desde Modal (Admin)
async function handleSaveUser(e) {
  if (e) e.preventDefault();

  const profileId = document.getElementById('user-profile-id')?.value;
  const nombre = document.getElementById('user-name')?.value.trim();
  const apellido = document.getElementById('user-lastname')?.value.trim();
  const correo = document.getElementById('user-email')?.value.trim().toLowerCase();
  const telefono = document.getElementById('user-phone')?.value.trim();
  const rol = document.getElementById('user-role')?.value;
  const estado = document.getElementById('user-status')?.value;

  if (!nombre || !apellido || !correo) {
    Toast.fire({ icon: 'warning', title: 'Completa todos los campos obligatorios' });
    return;
  }

  const profileData = {
    id: profileId || `usr-${Date.now()}`,
    user_id: profileId || `usr-${Date.now()}`,
    nombre,
    apellido,
    correo,
    telefono,
    rol,
    estado,
    fecha_registro: new Date().toISOString().split('T')[0],
    fecha_aprobacion: estado === 'APROBADO' ? new Date().toISOString().split('T')[0] : null,
    aprobado_por: estado === 'APROBADO' ? (`${state.currentUser?.nombre || 'Administrador'} ${state.currentUser?.apellido || ''}`.trim()) : null
  };

  try {
    await window.dataService.saveUserProfile(profileData);
    state.userProfiles = await window.dataService.getUserProfiles();
    state.users = state.userProfiles;
    updateNavigationBadges();
    renderUsuariosTable();
    closeModal('modal-user');

    // Si el usuario editado es la sesión activa actual, actualizar
    if (state.currentUser && (state.currentUser.correo === correo || state.currentUser.id === profileId)) {
      state.currentUser = { ...state.currentUser, ...profileData };
      if (localStorage.getItem('qp_current_profile')) {
        localStorage.setItem('qp_current_profile', JSON.stringify(state.currentUser));
      } else {
        sessionStorage.setItem('qp_current_profile', JSON.stringify(state.currentUser));
      }
      evaluateUserAccess(state.currentUser);
    }

    Toast.fire({
      icon: 'success',
      title: profileId ? 'Perfil actualizado correctamente' : 'Usuario creado y registrado con éxito'
    });
  } catch (err) {
    console.error('Error guardando perfil:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo guardar el usuario', confirmButtonColor: '#E30613' });
  }
}


