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
    state.users = await window.dataService.getUsers();
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
  if (uBadge) uBadge.textContent = state.users.length;
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
// CONTROLADOR DE AUTENTICACIÓN (LOGIN & SESIÓN)
// ==========================================
function checkAuthSession() {
  const saved = localStorage.getItem('qp_current_user') || sessionStorage.getItem('qp_current_user');
  if (saved) {
    try {
      state.currentUser = JSON.parse(saved);
      updateAuthUI(true);
      switchView('dashboard');
    } catch {
      updateAuthUI(false);
    }
  } else {
    updateAuthUI(false);
  }
}

function updateAuthUI(isAuthenticated) {
  const loginEl = document.getElementById('login-screen');
  const appEl = document.getElementById('app-container');

  if (isAuthenticated && state.currentUser) {
    if (loginEl) loginEl.classList.add('hidden');
    if (appEl) appEl.classList.remove('hidden');

    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    if (nameEl) nameEl.textContent = state.currentUser.nombre || state.currentUser.usuario;
    if (roleEl) {
      roleEl.textContent = state.currentUser.rol || 'Usuario';
      roleEl.className = state.currentUser.rol === 'Administrador'
        ? 'text-[10px] font-bold text-[#E30613]'
        : 'text-[10px] font-semibold text-[#00A651]';
    }

    // Restricciones según Rol
    const navUserBtn = document.getElementById('nav-btn-usuarios');
    if (navUserBtn) {
      if (state.currentUser.rol === 'Vendedor') {
        navUserBtn.classList.add('hidden');
      } else {
        navUserBtn.classList.remove('hidden');
      }
    }
  } else {
    if (loginEl) loginEl.classList.remove('hidden');
    if (appEl) appEl.classList.add('hidden');
  }

  if (window.lucide) window.lucide.createIcons();
}

function handleLoginSubmit(e) {
  if (e) e.preventDefault();

  const userInput = document.getElementById('login-username').value.trim();
  const passInput = document.getElementById('login-password').value.trim();
  const remember = document.getElementById('login-remember')?.checked;

  if (!userInput || !passInput) {
    Toast.fire({ icon: 'warning', title: 'Por favor complete todos los campos' });
    return;
  }

  const found = state.users.find(u =>
    u.usuario.toLowerCase() === userInput.toLowerCase() ||
    (u.correo && u.correo.toLowerCase() === userInput.toLowerCase())
  );

  if (!found || found.password !== passInput) {
    Swal.fire({
      icon: 'error',
      title: 'Acceso Denegado',
      text: 'Usuario o contraseña incorrectos. Por favor verifique sus datos.',
      confirmButtonColor: '#E30613'
    });
    return;
  }

  if (found.estado && found.estado === 'Inactivo') {
    Swal.fire({
      icon: 'warning',
      title: 'Cuenta Inactiva',
      text: 'Esta cuenta se encuentra temporalmente desactivada. Contacte al administrador.',
      confirmButtonColor: '#E30613'
    });
    return;
  }

  state.currentUser = found;
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('qp_current_user', JSON.stringify(found));

  Toast.fire({
    icon: 'success',
    title: `¡Bienvenido(a), ${found.nombre}!`
  });

  updateAuthUI(true);
  switchView('dashboard');
}

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
  }).then((res) => {
    if (res.isConfirmed) {
      localStorage.removeItem('qp_current_user');
      sessionStorage.removeItem('qp_current_user');
      state.currentUser = null;
      const form = document.getElementById('form-login');
      if (form) form.reset();
      updateAuthUI(false);
      Toast.fire({ icon: 'info', title: 'Sesión finalizada correctamente' });
    }
  });
}

function fillQuickLogin(user, pass) {
  const userInput = document.getElementById('login-username');
  const passInput = document.getElementById('login-password');
  if (userInput) userInput.value = user;
  if (passInput) passInput.value = pass;
  handleLoginSubmit(null);
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
// MÓDULO 4: GESTIÓN DE USUARIOS Y CREDENCIALES
// ==========================================
function renderUsuariosTable() {
  const tbody = document.getElementById('table-usuarios-body');
  if (!tbody) return;

  const search = (document.getElementById('filter-user-search')?.value || '').toLowerCase();
  const roleFilter = document.getElementById('filter-user-role')?.value || '';

  const filtered = state.users.filter(u => {
    const matchSearch = (u.nombre || '').toLowerCase().includes(search) ||
                        (u.usuario || '').toLowerCase().includes(search) ||
                        (u.id_usuario || '').toLowerCase().includes(search);
    const matchRole = !roleFilter || u.rol === roleFilter;
    return matchSearch && matchRole;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-400">
          <i data-lucide="shield-alert" class="w-8 h-8 mx-auto mb-2 text-gray-300"></i>
          No se encontraron usuarios que coincidan con la búsqueda.
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const isCurrentUser = state.currentUser && state.currentUser.id_usuario === u.id_usuario;
    const roleBadge = u.rol === 'Administrador'
      ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[#E30613] border border-red-200">👑 ${u.rol}</span>`
      : (u.rol === 'Supervisor'
        ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-[#806B20] border border-yellow-200">🔍 ${u.rol}</span>`
        : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#00A651] border border-emerald-200">💼 ${u.rol}</span>`);

    const statusBadge = u.estado === 'Activo'
      ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#00A651]">🟢 Activo</span>`
      : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#E30613]">🔴 Inactivo</span>`;

    return `
      <tr class="hover:bg-gray-50/80 transition-colors">
        <td class="px-4 py-3 font-mono font-bold text-xs text-gray-700">
          <span class="bg-gray-100 px-2 py-0.5 rounded-md">${u.id_usuario}</span>
        </td>
        <td class="px-4 py-3">
          <div class="font-bold text-[#333333] flex items-center space-x-1.5">
            <span>${u.nombre}</span>
            ${isCurrentUser ? '<span class="text-[10px] bg-red-100 text-[#E30613] px-1.5 py-0.2 rounded font-bold">Tú</span>' : ''}
          </div>
        </td>
        <td class="px-4 py-3 text-gray-600 font-medium">
          <span class="font-mono text-xs">@${u.usuario}</span>
        </td>
        <td class="px-4 py-3">${roleBadge}</td>
        <td class="px-4 py-3">
          <div class="flex items-center space-x-2">
            <span class="font-mono text-xs text-gray-500 tracking-widest">••••••••</span>
            <button onclick="showPasswordAlert('${u.usuario}', '${u.password}')" title="Ver contraseña" class="p-1 rounded-lg text-gray-400 hover:text-[#E30613] hover:bg-red-50 transition-colors">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
        <td class="px-4 py-3">${statusBadge}</td>
        <td class="px-4 py-3 text-right">
          <div class="inline-flex items-center space-x-1">
            <button onclick="editUser('${u.id_usuario}')" title="Editar y cambiar contraseña" class="p-1.5 rounded-lg text-gray-500 hover:text-[#00A651] hover:bg-emerald-50 transition-colors">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            ${!isCurrentUser ? `
              <button onclick="deleteUser('${u.id_usuario}')" title="Eliminar usuario" class="p-1.5 rounded-lg text-gray-500 hover:text-[#E30613] hover:bg-red-50 transition-colors">
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

function showPasswordAlert(usuario, password) {
  Swal.fire({
    title: `Credencial de Acceso`,
    html: `
      <div class="space-y-3 text-left">
        <p class="text-xs text-gray-500">Usuario: <strong class="text-gray-800">@${usuario}</strong></p>
        <div>
          <label class="text-[11px] font-bold text-gray-400 uppercase">Contraseña actual:</label>
          <div class="mt-1 p-3 bg-red-50 border border-red-100 rounded-xl text-center font-mono font-bold text-xl text-[#E30613] tracking-widest">
            ${password}
          </div>
        </div>
      </div>
    `,
    confirmButtonColor: '#E30613',
    confirmButtonText: 'Aceptar'
  });
}

function openUserModal(userId = null) {
  state.editingUserId = userId;
  const title = document.getElementById('modal-user-title');
  const form = document.getElementById('form-user');
  form.reset();

  if (userId) {
    const u = state.users.find(x => x.id_usuario === userId);
    if (!u) return;

    if (title) title.textContent = 'Editar Usuario y Contraseña';
    document.getElementById('user-id').value = u.id_usuario;
    document.getElementById('user-id').readOnly = true;
    document.getElementById('user-name').value = u.nombre;
    document.getElementById('user-username').value = u.usuario;
    document.getElementById('user-password').value = u.password;
    document.getElementById('user-role').value = u.rol || 'Vendedor';
    document.getElementById('user-status').value = u.estado || 'Activo';
  } else {
    if (title) title.textContent = 'Registrar Nuevo Usuario';
    document.getElementById('user-id').readOnly = false;
    
    // Auto-generar ID siguiente
    const nextNum = state.users.length + 1;
    document.getElementById('user-id').value = `U00${nextNum}`;
    document.getElementById('user-role').value = 'Vendedor';
    document.getElementById('user-status').value = 'Activo';
  }

  openModal('modal-user');
}

async function handleSaveUser(e) {
  e.preventDefault();

  const id = document.getElementById('user-id').value.trim().toUpperCase();
  const nombre = document.getElementById('user-name').value.trim();
  const usuario = document.getElementById('user-username').value.trim().toLowerCase();
  const password = document.getElementById('user-password').value.trim();
  const rol = document.getElementById('user-role').value;
  const estado = document.getElementById('user-status').value;

  if (!id || !nombre || !usuario || !password) {
    Toast.fire({ icon: 'warning', title: 'Complete todos los campos obligatorios' });
    return;
  }

  // Validar unicidad de nombre de usuario
  const duplicate = state.users.find(u => u.usuario.toLowerCase() === usuario && u.id_usuario !== id);
  if (duplicate) {
    Swal.fire({
      icon: 'error',
      title: 'Usuario ya existente',
      text: `El nombre de usuario "@${usuario}" ya está en uso por otro miembro del equipo.`,
      confirmButtonColor: '#E30613'
    });
    return;
  }

  const userData = {
    id_usuario: id,
    nombre,
    usuario,
    password,
    rol,
    estado
  };

  try {
    await window.dataService.saveUser(userData);
    await loadAllData();
    renderUsuariosTable();
    closeModal('modal-user');

    // Si el usuario editado es el mismo con sesión activa, actualizar la sesión
    if (state.currentUser && state.currentUser.id_usuario === id) {
      state.currentUser = userData;
      if (localStorage.getItem('qp_current_user')) {
        localStorage.setItem('qp_current_user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('qp_current_user', JSON.stringify(userData));
      }
      updateAuthUI(true);
    }

    Toast.fire({
      icon: 'success',
      title: state.editingUserId ? 'Usuario actualizado con éxito' : 'Nuevo usuario registrado con éxito'
    });
  } catch (err) {
    console.error('Error guardando usuario:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo guardar el usuario', confirmButtonColor: '#E30613' });
  }
}

function editUser(id) {
  openUserModal(id);
}

async function deleteUser(id) {
  if (state.currentUser && state.currentUser.id_usuario === id) {
    Swal.fire({
      icon: 'error',
      title: 'Acción no permitida',
      text: 'No puedes eliminar la cuenta con la que tienes la sesión iniciada en este momento.',
      confirmButtonColor: '#E30613'
    });
    return;
  }

  const u = state.users.find(x => x.id_usuario === id);
  const result = await Swal.fire({
    title: '¿Eliminar cuenta de usuario?',
    html: `Se eliminará el acceso de <strong>${u ? u.nombre : id}</strong> (@${u ? u.usuario : ''}).`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#E30613',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await window.dataService.deleteUser(id);
      await loadAllData();
      renderUsuariosTable();
      Toast.fire({ icon: 'success', title: 'Usuario eliminado del sistema' });
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#E30613' });
    }
  }
}

