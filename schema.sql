-- ==========================================================
-- SCRIPT DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- PROYECTO: CRM AVICOLA "QUÉ POLLO"
-- UNIVERSIDAD TÉCNICA DE AMBATO - FACULTAD DE CIENCIAS ADMINISTRATIVAS
-- GRUPO 4 - SISTEMAS DE INFORMACIÓN (7mo "B" MERCADOTECNIA)
-- ==========================================================

-- 1. CREACIÓN DE TABLA: CATEGORIAS (ADMINISTRACIÓN DINÁMICA)
CREATE TABLE IF NOT EXISTS public.categorias (
    id_categoria VARCHAR(20) PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(50) DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREACIÓN DE TABLA: CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id_cliente VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(150),
    red_social VARCHAR(50) DEFAULT 'Facebook',
    fecha_registro DATE DEFAULT CURRENT_DATE,
    tipo_cliente VARCHAR(50) DEFAULT 'Frecuente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREACIÓN DE TABLA: PRODUCTOS (CON RELACIÓN A CATEGORIAS)
CREATE TABLE IF NOT EXISTS public.productos (
    id_producto VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    id_categoria VARCHAR(20) REFERENCES public.categorias(id_categoria) ON DELETE RESTRICT ON UPDATE CASCADE,
    categoria VARCHAR(100) NOT NULL DEFAULT 'Pollo',
    precio_v NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    precio_c NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREACIÓN DE TABLA: SEGUIMIENTO / VENTAS
CREATE TABLE IF NOT EXISTS public.seguimiento_ventas (
    id_seguimiento VARCHAR(20) PRIMARY KEY,
    id_cliente VARCHAR(20) REFERENCES public.clientes(id_cliente) ON DELETE SET NULL ON UPDATE CASCADE,
    id_producto VARCHAR(20) REFERENCES public.productos(id_producto) ON DELETE SET NULL ON UPDATE CASCADE,
    fecha_compra DATE DEFAULT CURRENT_DATE,
    cantidad INTEGER NOT NULL DEFAULT 1,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    canal VARCHAR(50) DEFAULT 'Instagram',
    metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
    estado VARCHAR(50) DEFAULT 'Completado',
    observacion TEXT DEFAULT 'Entregado a conformidad',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimiento_ventas ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PERMISIVAS PARA ACCESO PÚBLICO / ANON
DROP POLICY IF EXISTS "Permitir todo en categorias" ON public.categorias;
CREATE POLICY "Permitir todo en categorias" ON public.categorias FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en clientes" ON public.clientes;
CREATE POLICY "Permitir todo en clientes" ON public.clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en productos" ON public.productos;
CREATE POLICY "Permitir todo en productos" ON public.productos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en seguimiento_ventas" ON public.seguimiento_ventas;
CREATE POLICY "Permitir todo en seguimiento_ventas" ON public.seguimiento_ventas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================================
-- REGISTROS INICIALES DE PRUEBA
-- ==========================================================

-- Categorías iniciales
INSERT INTO public.categorias (id_categoria, nombre_categoria, fecha_creacion, estado)
VALUES 
    ('CAT001', 'Pollo', '2026-09-09', 'Activo'),
    ('CAT002', 'Cerdo', '2026-09-09', 'Activo'),
    ('CAT003', 'Res', '2026-09-09', 'Activo'),
    ('CAT004', 'Embutidos', '2026-09-09', 'Activo'),
    ('CAT005', 'Menudencias', '2026-09-09', 'Activo'),
    ('CAT006', 'Otros', '2026-09-09', 'Activo'),
    ('CAT007', 'Despresado', '2026-09-09', 'Activo'),
    ('CAT008', 'Huevos', '2026-09-09', 'Activo')
ON CONFLICT (id_categoria) DO NOTHING;

-- Clientes iniciales
INSERT INTO public.clientes (id_cliente, nombre, apellido, telefono, correo, red_social, fecha_registro, tipo_cliente)
VALUES 
    ('C001', 'Carlos', 'Solis', '0984149863', 'carlosol@gmail.com', 'Facebook', '2026-09-09', 'Frecuente'),
    ('C002', 'Salomé', 'Flores', '0991234567', 'salome.flores@gmail.com', 'Instagram', '2026-09-10', 'Mayorista'),
    ('C003', 'Rebeca', 'Quinapanta', '0987654321', 'rebe.quina@hotmail.com', 'WhatsApp', '2026-09-10', 'Frecuente'),
    ('C004', 'Domenica', 'Naranjo', '0979876543', 'dome.naranjo@yahoo.com', 'Facebook', '2026-09-11', 'Ocasional'),
    ('C005', 'Daniela', 'Pico', '0965432109', 'dani.pico@gmail.com', 'TikTok', '2026-09-11', 'Nuevo')
ON CONFLICT (id_cliente) DO NOTHING;

-- Productos iniciales (con relación de categoría)
INSERT INTO public.productos (id_producto, nombre, id_categoria, categoria, precio_v, precio_c)
VALUES 
    ('P001', 'Pollo entero', 'CAT001', 'Pollo', 8.50, 16.50),
    ('P002', 'Pechuga especial x kg', 'CAT007', 'Despresado', 4.75, 3.20),
    ('P003', 'Alitas marinadas BBQ (12 u)', 'CAT001', 'Pollo', 7.00, 4.50),
    ('P004', 'Menudencias seleccionadas', 'CAT005', 'Menudencias', 2.50, 1.20),
    ('P005', 'Cubeta de Huevos AA (30 u)', 'CAT008', 'Huevos', 4.20, 3.10),
    ('P006', 'Salchicha de Pollo artesanal', 'CAT004', 'Embutidos', 3.80, 2.40)
ON CONFLICT (id_producto) DO NOTHING;

-- Ventas / Seguimiento iniciales
INSERT INTO public.seguimiento_ventas (id_seguimiento, id_cliente, id_producto, fecha_compra, cantidad, total, canal, metodo_pago, estado, observacion)
VALUES 
    ('S001', 'C001', 'P001', '2026-09-09', 2, 7.00, 'Instagram', 'Efectivo', 'Completado', 'Entregado a conformidad'),
    ('S002', 'C002', 'P002', '2026-09-10', 5, 23.75, 'WhatsApp', 'Transferencia', 'Completado', 'Pedido para asadero semanal'),
    ('S003', 'C003', 'P003', '2026-09-10', 1, 7.00, 'Facebook', 'Deuna', 'Completado', 'Cliente satisfecho con entrega puntual'),
    ('S004', 'C004', 'P005', '2026-09-11', 3, 12.60, 'Local', 'Efectivo', 'Completado', 'Compra directa en sucursal central'),
    ('S005', 'C005', 'P001', '2026-09-11', 1, 8.50, 'Instagram', 'Transferencia', 'Pendiente', 'Coordinando entrega para la tarde')
ON CONFLICT (id_seguimiento) DO NOTHING;
