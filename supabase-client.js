/**
 * CRM Avícola "QUÉ POLLO" - Capa de Datos y Conectividad Supabase
 * Soporta modo dual: Supabase en la nube (PostgreSQL) y LocalStorage offline/demo.
 */

// Datos semilla iniciales (Acorde a guía académica de la UTA y requerimientos de categorías dinámicas)
const INITIAL_SEED = {
  categorias: [
    { id_categoria: 'CAT001', nombre_categoria: 'Pollo', fecha_creacion: '2026-09-09', estado: 'Activo' },
    { id_categoria: 'CAT002', nombre_categoria: 'Cerdo', fecha_creacion: '2026-09-09', estado: 'Activo' },
    { id_categoria: 'CAT003', nombre_categoria: 'Res', fecha_creacion: '2026-09-09', estado: 'Activo' },
    { id_categoria: 'CAT004', nombre_categoria: 'Embutidos', fecha_creacion: '2026-09-09', estado: 'Activo' },
    { id_categoria: 'CAT005', nombre_categoria: 'Menudencias', fecha_creacion: '2026-09-09', estado: 'Activo' },
    { id_categoria: 'CAT006', nombre_categoria: 'Otros', fecha_creacion: '2026-09-09', estado: 'Activo' },
    { id_categoria: 'CAT007', nombre_categoria: 'Despresado', fecha_creacion: '2026-09-09', estado: 'Activo' },
    { id_categoria: 'CAT008', nombre_categoria: 'Huevos', fecha_creacion: '2026-09-09', estado: 'Activo' }
  ],
  clientes: [
    {
      id_cliente: 'C001',
      nombre: 'Carlos',
      apellido: 'Solis',
      telefono: '0984149863',
      correo: 'carlosol@gmail.com',
      red_social: 'Facebook',
      fecha_registro: '2026-09-09',
      tipo_cliente: 'Frecuente'
    },
    {
      id_cliente: 'C002',
      nombre: 'Salomé',
      apellido: 'Flores',
      telefono: '0991234567',
      correo: 'salome.flores@gmail.com',
      red_social: 'Instagram',
      fecha_registro: '2026-09-10',
      tipo_cliente: 'Mayorista'
    },
    {
      id_cliente: 'C003',
      nombre: 'Rebeca',
      apellido: 'Quinapanta',
      telefono: '0987654321',
      correo: 'rebe.quina@hotmail.com',
      red_social: 'WhatsApp',
      fecha_registro: '2026-09-10',
      tipo_cliente: 'Frecuente'
    },
    {
      id_cliente: 'C004',
      nombre: 'Domenica',
      apellido: 'Naranjo',
      telefono: '0979876543',
      correo: 'dome.naranjo@yahoo.com',
      red_social: 'Facebook',
      fecha_registro: '2026-09-11',
      tipo_cliente: 'Ocasional'
    },
    {
      id_cliente: 'C005',
      nombre: 'Daniela',
      apellido: 'Pico',
      telefono: '0965432109',
      correo: 'dani.pico@gmail.com',
      red_social: 'TikTok',
      fecha_registro: '2026-09-11',
      tipo_cliente: 'Nuevo'
    }
  ],
  productos: [
    {
      id_producto: 'P001',
      nombre: 'Pollo entero',
      id_categoria: 'CAT001',
      categoria: 'Pollo',
      precio_v: 8.50,
      precio_c: 16.50
    },
    {
      id_producto: 'P002',
      nombre: 'Pechuga especial x kg',
      id_categoria: 'CAT007',
      categoria: 'Despresado',
      precio_v: 4.75,
      precio_c: 3.20
    },
    {
      id_producto: 'P003',
      nombre: 'Alitas marinadas BBQ (12 u)',
      id_categoria: 'CAT001',
      categoria: 'Pollo',
      precio_v: 7.00,
      precio_c: 4.50
    },
    {
      id_producto: 'P004',
      nombre: 'Menudencias seleccionadas',
      id_categoria: 'CAT005',
      categoria: 'Menudencias',
      precio_v: 2.50,
      precio_c: 1.20
    },
    {
      id_producto: 'P005',
      nombre: 'Cubeta de Huevos AA (30 u)',
      id_categoria: 'CAT008',
      categoria: 'Huevos',
      precio_v: 4.20,
      precio_c: 3.10
    },
    {
      id_producto: 'P006',
      nombre: 'Salchicha de Pollo artesanal',
      id_categoria: 'CAT004',
      categoria: 'Embutidos',
      precio_v: 3.80,
      precio_c: 2.40
    }
  ],
  ventas: [
    {
      id_seguimiento: 'S001',
      id_cliente: 'C001',
      id_producto: 'P001',
      fecha_compra: '2026-09-09',
      cantidad: 2,
      total: 7.00,
      canal: 'Instagram',
      metodo_pago: 'Efectivo',
      estado: 'Completado',
      observacion: 'Entregado a conformidad'
    },
    {
      id_seguimiento: 'S002',
      id_cliente: 'C002',
      id_producto: 'P002',
      fecha_compra: '2026-09-10',
      cantidad: 5,
      total: 23.75,
      canal: 'WhatsApp',
      metodo_pago: 'Transferencia',
      estado: 'Completado',
      observacion: 'Pedido para asadero semanal'
    },
    {
      id_seguimiento: 'S003',
      id_cliente: 'C003',
      id_producto: 'P003',
      fecha_compra: '2026-09-10',
      cantidad: 1,
      total: 7.00,
      canal: 'Facebook',
      metodo_pago: 'Deuna',
      estado: 'Completado',
      observacion: 'Cliente satisfecho con entrega puntual'
    },
    {
      id_seguimiento: 'S004',
      id_cliente: 'C004',
      id_producto: 'P005',
      fecha_compra: '2026-09-11',
      cantidad: 3,
      total: 12.60,
      canal: 'Local',
      metodo_pago: 'Efectivo',
      estado: 'Completado',
      observacion: 'Compra directa en sucursal central'
    },
    {
      id_seguimiento: 'S005',
      id_cliente: 'C005',
      id_producto: 'P001',
      fecha_compra: '2026-09-11',
      cantidad: 1,
      total: 8.50,
      canal: 'Instagram',
      metodo_pago: 'Transferencia',
      estado: 'Pendiente',
      observacion: 'Coordinando entrega para la tarde'
    }
  ]
};

class DataService {
  constructor() {
    this.supabase = null;
    this.isCloudActive = false;
    this.initLocalStorage();
    this.initSupabase();
  }

  // Inicializar almacenamiento local si no existe
  initLocalStorage() {
    if (!localStorage.getItem('qp_categorias')) {
      localStorage.setItem('qp_categorias', JSON.stringify(INITIAL_SEED.categorias));
    }
    if (!localStorage.getItem('qp_clientes')) {
      localStorage.setItem('qp_clientes', JSON.stringify(INITIAL_SEED.clientes));
    }
    if (!localStorage.getItem('qp_productos')) {
      localStorage.setItem('qp_productos', JSON.stringify(INITIAL_SEED.productos));
    }
    if (!localStorage.getItem('qp_ventas')) {
      localStorage.setItem('qp_ventas', JSON.stringify(INITIAL_SEED.ventas));
    }
    const defaultUrl = 'https://qgkaqlyfbjjbkqjernjs.supabase.co';
    const defaultKey = 'sb_publishable_-aJAjB_cVDr-nj2AmCdj-w_GAuJ4Cwb';
    if (!localStorage.getItem('qp_sb_url')) {
      localStorage.setItem('qp_sb_url', defaultUrl);
    }
    if (!localStorage.getItem('qp_sb_key') || localStorage.getItem('qp_sb_key') === '') {
      localStorage.setItem('qp_sb_key', defaultKey);
    }
  }

  // Resetear a datos iniciales
  resetToInitialSeed() {
    localStorage.setItem('qp_categorias', JSON.stringify(INITIAL_SEED.categorias));
    localStorage.setItem('qp_clientes', JSON.stringify(INITIAL_SEED.clientes));
    localStorage.setItem('qp_productos', JSON.stringify(INITIAL_SEED.productos));
    localStorage.setItem('qp_ventas', JSON.stringify(INITIAL_SEED.ventas));
  }

  // Inicializar cliente de Supabase
  initSupabase() {
    const defaultUrl = 'https://qgkaqlyfbjjbkqjernjs.supabase.co';
    const defaultKey = 'sb_publishable_-aJAjB_cVDr-nj2AmCdj-w_GAuJ4Cwb';
    const url = localStorage.getItem('qp_sb_url') || defaultUrl;
    const key = localStorage.getItem('qp_sb_key') || defaultKey;

    if (url && key && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(url, key);
        this.isCloudActive = true;
      } catch (e) {
        console.warn('Error al inicializar Supabase:', e);
        this.supabase = null;
        this.isCloudActive = false;
      }
    } else {
      this.supabase = null;
      this.isCloudActive = false;
    }
  }

  // Configurar credenciales de Supabase
  async setSupabaseCredentials(url, key) {
    localStorage.setItem('qp_sb_url', url.trim());
    localStorage.setItem('qp_sb_key', key.trim());
    this.initSupabase();
    return await this.testConnection();
  }

  // Desconectar Supabase
  disconnectSupabase() {
    localStorage.removeItem('qp_sb_url');
    localStorage.removeItem('qp_sb_key');
    this.supabase = null;
    this.isCloudActive = false;
  }

  // Probar conexión con Supabase
  async testConnection() {
    if (!this.supabase) {
      return { success: false, message: 'No hay credenciales de Supabase configuradas.' };
    }
    try {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('id_cliente')
        .limit(1);

      if (error) {
        console.error('Error probando Supabase:', error);
        return {
          success: false,
          message: error.message || 'No se pudo consultar la tabla clientes. ¿Ya ejecutaste el script schema.sql en Supabase?'
        };
      }
      this.isCloudActive = true;
      return { success: true, message: 'Conexión exitosa con Supabase PostgreSQL.' };
    } catch (err) {
      return { success: false, message: err.message || 'Error de red al conectar con Supabase.' };
    }
  }

  // Sincronizar todos los datos locales hacia Supabase
  async syncLocalToCloud() {
    if (!this.supabase) {
      throw new Error('Supabase no está configurado.');
    }

    const localCats = this.getLocal('qp_categorias');
    const localClients = this.getLocal('qp_clientes');
    const localProducts = this.getLocal('qp_productos');
    const localSales = this.getLocal('qp_ventas');

    // 0. Categorías
    if (localCats.length > 0) {
      const { error: errCat } = await this.supabase
        .from('categorias')
        .upsert(localCats, { onConflict: 'id_categoria' });
      if (errCat) console.warn(`Aviso sincronizando categorias: ${errCat.message}`);
    }

    // 1. Clientes
    if (localClients.length > 0) {
      const { error: errC } = await this.supabase
        .from('clientes')
        .upsert(localClients, { onConflict: 'id_cliente' });
      if (errC) throw new Error(`Error sincronizando clientes: ${errC.message}`);
    }

    // 2. Productos
    if (localProducts.length > 0) {
      const { error: errP } = await this.supabase
        .from('productos')
        .upsert(localProducts, { onConflict: 'id_producto' });
      if (errP) throw new Error(`Error sincronizando productos: ${errP.message}`);
    }

    // 3. Ventas
    if (localSales.length > 0) {
      const { error: errV } = await this.supabase
        .from('seguimiento_ventas')
        .upsert(localSales, { onConflict: 'id_seguimiento' });
      if (errV) throw new Error(`Error sincronizando ventas: ${errV.message}`);
    }

    return { success: true, count: { categories: localCats.length, clients: localClients.length, products: localProducts.length, sales: localSales.length } };
  }

  // Helpers LocalStorage
  getLocal(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  setLocal(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ==========================================
  // MÉTODOS CRUD: CATEGORÍAS (DINÁMICAS)
  // ==========================================
  async getCategories() {
    if (this.isCloudActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('categorias')
          .select('*')
          .order('id_categoria', { ascending: true });
        if (!error && data && data.length > 0) {
          this.setLocal('qp_categorias', data);
          return data;
        }
      } catch (e) {
        console.warn('Fallback a local para getCategories:', e);
      }
    }
    const localCats = this.getLocal('qp_categorias');
    if (!localCats || localCats.length === 0) {
      this.setLocal('qp_categorias', INITIAL_SEED.categorias);
      return INITIAL_SEED.categorias;
    }
    return localCats;
  }

  async saveCategory(categoryData) {
    const cats = this.getLocal('qp_categorias');
    const index = cats.findIndex(c => c.id_categoria === categoryData.id_categoria);

    if (index >= 0) {
      cats[index] = { ...cats[index], ...categoryData };
    } else {
      cats.push(categoryData);
    }
    this.setLocal('qp_categorias', cats);

    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('categorias').upsert(categoryData, { onConflict: 'id_categoria' });
      } catch (err) {
        console.error('Error guardando categoría en Supabase:', err);
      }
    }
    return categoryData;
  }

  async deleteCategory(id_categoria) {
    let cats = this.getLocal('qp_categorias');
    cats = cats.filter(c => c.id_categoria !== id_categoria);
    this.setLocal('qp_categorias', cats);

    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('categorias').delete().eq('id_categoria', id_categoria);
      } catch (err) {
        console.error('Error eliminando categoría en Supabase:', err);
      }
    }
    return true;
  }

  // ==========================================
  // MÉTODOS CRUD: CLIENTES
  // ==========================================
  async getClients() {
    if (this.isCloudActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('clientes')
          .select('*')
          .order('id_cliente', { ascending: true });
        if (!error && data) {
          this.setLocal('qp_clientes', data); // Mantener espejo en local
          return data;
        }
      } catch (e) {
        console.warn('Fallback a local para getClients:', e);
      }
    }
    return this.getLocal('qp_clientes');
  }

  async saveClient(clientData) {
    const clients = this.getLocal('qp_clientes');
    const index = clients.findIndex(c => c.id_cliente === clientData.id_cliente);
    
    if (index >= 0) {
      clients[index] = { ...clients[index], ...clientData };
    } else {
      clients.push(clientData);
    }
    this.setLocal('qp_clientes', clients);

    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('clientes').upsert(clientData, { onConflict: 'id_cliente' });
      } catch (err) {
        console.error('Error guardando cliente en Supabase:', err);
      }
    }
    return clientData;
  }

  async deleteClient(id_cliente) {
    let clients = this.getLocal('qp_clientes');
    clients = clients.filter(c => c.id_cliente !== id_cliente);
    this.setLocal('qp_clientes', clients);

    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('clientes').delete().eq('id_cliente', id_cliente);
      } catch (err) {
        console.error('Error eliminando cliente en Supabase:', err);
      }
    }
    return true;
  }

  // ==========================================
  // MÉTODOS CRUD: PRODUCTOS
  // ==========================================
  async getProducts() {
    if (this.isCloudActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('productos')
          .select('*')
          .order('id_producto', { ascending: true });
        if (!error && data) {
          this.setLocal('qp_productos', data);
          return data;
        }
      } catch (e) {
        console.warn('Fallback a local para getProducts:', e);
      }
    }
    return this.getLocal('qp_productos');
  }

  async saveProduct(productData) {
    productData.precio_v = parseFloat(productData.precio_v) || 0;
    productData.precio_c = parseFloat(productData.precio_c) || 0;

    const products = this.getLocal('qp_productos');
    const index = products.findIndex(p => p.id_producto === productData.id_producto);

    if (index >= 0) {
      products[index] = { ...products[index], ...productData };
    } else {
      products.push(productData);
    }
    this.setLocal('qp_productos', products);

    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('productos').upsert(productData, { onConflict: 'id_producto' });
      } catch (err) {
        console.error('Error guardando producto en Supabase:', err);
      }
    }
    return productData;
  }

  async deleteProduct(id_producto) {
    let products = this.getLocal('qp_productos');
    products = products.filter(p => p.id_producto !== id_producto);
    this.setLocal('qp_productos', products);

    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('productos').delete().eq('id_producto', id_producto);
      } catch (err) {
        console.error('Error eliminando producto en Supabase:', err);
      }
    }
    return true;
  }

  // ==========================================
  // MÉTODOS CRUD: VENTAS / SEGUIMIENTO
  // ==========================================
  async getSales() {
    if (this.isCloudActive && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('seguimiento_ventas')
          .select('*')
          .order('fecha_compra', { ascending: false });
        if (!error && data) {
          this.setLocal('qp_ventas', data);
          return data;
        }
      } catch (e) {
        console.warn('Fallback a local para getSales:', e);
      }
    }
    return this.getLocal('qp_ventas');
  }

  async saveSale(saleData) {
    saleData.cantidad = parseInt(saleData.cantidad, 10) || 1;
    saleData.total = parseFloat(saleData.total) || 0;

    const sales = this.getLocal('qp_ventas');
    const index = sales.findIndex(s => s.id_seguimiento === saleData.id_seguimiento);

    if (index >= 0) {
      sales[index] = { ...sales[index], ...saleData };
    } else {
      sales.push(saleData);
    }
    this.setLocal('qp_ventas', sales);

    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('seguimiento_ventas').upsert(saleData, { onConflict: 'id_seguimiento' });
      } catch (err) {
        console.error('Error guardando venta en Supabase:', err);
      }
    }
    return saleData;
  }

  async deleteSale(id_seguimiento) {
    let sales = this.getLocal('qp_ventas');
    sales = sales.filter(s => s.id_seguimiento !== id_seguimiento);
    this.setLocal('qp_ventas', sales);

    if (this.isCloudActive && this.supabase) {
      try {
        await this.supabase.from('seguimiento_ventas').delete().eq('id_seguimiento', id_seguimiento);
      } catch (err) {
        console.error('Error eliminando venta en Supabase:', err);
      }
    }
    return true;
  }

  // Exportar backup completo a JSON
  exportBackupJSON() {
    const backup = {
      empresa: 'Avícola QUÉ POLLO',
      universidad: 'Universidad Técnica de Ambato',
      grupo: 'Grupo 4 - Sistemas de Información',
      fecha_exportacion: new Date().toISOString(),
      categorias: this.getLocal('qp_categorias'),
      clientes: this.getLocal('qp_clientes'),
      productos: this.getLocal('qp_productos'),
      seguimiento_ventas: this.getLocal('qp_ventas')
    };
    return JSON.stringify(backup, null, 2);
  }

  // Importar backup desde JSON
  importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.categorias)) this.setLocal('qp_categorias', data.categorias);
      if (Array.isArray(data.clientes)) this.setLocal('qp_clientes', data.clientes);
      if (Array.isArray(data.productos)) this.setLocal('qp_productos', data.productos);
      if (Array.isArray(data.seguimiento_ventas)) this.setLocal('qp_ventas', data.seguimiento_ventas);
      return true;
    } catch (e) {
      console.error('Error importando JSON:', e);
      return false;
    }
  }
}

// Instancia global del servicio
window.dataService = new DataService();
