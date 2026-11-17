-- ==========================================================
-- SCRIPT DE BASE DE DATOS SUPABASE (POSTGRESQL) COMPLETO
-- PROYECTO: CRM INTEGRAL AVÍCOLA "QUÉ POLLO"
-- UNIVERSIDAD TÉCNICA DE AMBATO - FACULTAD DE CIENCIAS ADMINISTRATIVAS
-- MERCADOTECNIA 7mo B - SISTEMAS DE INFORMACIÓN
-- ==========================================================

-- EXTENSIÓN PARA UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categorias (
    id_categoria VARCHAR(20) PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(50) DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: CLIENTES (CON VALIDACIÓN SRI, DIRECCIÓN DETALLADA Y FIDELIDAD)
CREATE TABLE IF NOT EXISTS public.clientes (
    id_cliente VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    tipo_identificacion VARCHAR(30) DEFAULT 'Cédula', -- Cédula, RUC Natural, RUC Jurídico, Pasaporte
    cedula_ruc VARCHAR(20),
    telefono VARCHAR(20),
    correo VARCHAR(150),
    provincia VARCHAR(80) DEFAULT 'Tungurahua',
    ciudad VARCHAR(80) DEFAULT 'Ambato',
    sector VARCHAR(100),
    direccion TEXT,
    red_social VARCHAR(50) DEFAULT 'WhatsApp',
    fecha_registro DATE DEFAULT CURRENT_DATE,
    tipo_cliente VARCHAR(50) DEFAULT 'Frecuente', -- Nuevo, Frecuente, Potencial, Mayorista, Inactivo
    estado_cliente VARCHAR(30) DEFAULT 'Activo',  -- Activo, Bloqueado
    puntos_fidelidad INTEGER DEFAULT 0,
    consentimiento_comunicacion BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: PRODUCTOS E INVENTARIO
CREATE TABLE IF NOT EXISTS public.productos (
    id_producto VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    id_categoria VARCHAR(20) REFERENCES public.categorias(id_categoria) ON DELETE RESTRICT ON UPDATE CASCADE,
    categoria VARCHAR(100) NOT NULL DEFAULT 'Pollo',
    imagen_url TEXT,
    precio_v NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    precio_c NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stock_disponible NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    stock_minimo NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
    unidad_medida VARCHAR(30) DEFAULT 'kg', -- kg, Unidad, Cubeta, Libra, Paquete
    estado VARCHAR(30) DEFAULT 'Activo', -- Activo, Inactivo
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: KARDEX / MOVIMIENTOS DE INVENTARIO
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
    id_movimiento VARCHAR(30) PRIMARY KEY,
    id_producto VARCHAR(20) REFERENCES public.productos(id_producto) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(30) NOT NULL, -- Entrada, Salida, Ajuste
    cantidad NUMERIC(10, 2) NOT NULL,
    stock_anterior NUMERIC(10, 2) NOT NULL,
    stock_nuevo NUMERIC(10, 2) NOT NULL,
    motivo VARCHAR(200) NOT NULL,
    usuario_responsable VARCHAR(150) DEFAULT 'Sistema',
    fecha_movimiento TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: PEDIDOS COMERCIALES
CREATE TABLE IF NOT EXISTS public.pedidos (
    id_pedido VARCHAR(30) PRIMARY KEY,
    id_cliente VARCHAR(20) REFERENCES public.clientes(id_cliente) ON DELETE SET NULL,
    fecha_pedido DATE DEFAULT CURRENT_DATE,
    estado_pedido VARCHAR(50) DEFAULT 'Pendiente', -- Pendiente, Confirmado, En preparación, Listo para entregar, Entregado, Cancelado, Facturado
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    iva NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    forma_pago VARCHAR(50) DEFAULT 'Efectivo',
    direccion_entrega TEXT,
    observaciones TEXT,
    usuario_creador VARCHAR(150),
    stock_descontado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: DETALLE DE PEDIDOS
CREATE TABLE IF NOT EXISTS public.detalle_pedidos (
    id_detalle VARCHAR(40) PRIMARY KEY,
    id_pedido VARCHAR(30) REFERENCES public.pedidos(id_pedido) ON DELETE CASCADE,
    id_producto VARCHAR(20) REFERENCES public.productos(id_producto),
    nombre_producto VARCHAR(150),
    cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- 7. TABLA: FACTURAS (NORMATIVA SRI / INMUTABILIDAD)
CREATE TABLE IF NOT EXISTS public.facturas (
    id_factura VARCHAR(30) PRIMARY KEY,
    numero_factura VARCHAR(50) NOT NULL UNIQUE, -- Formato SRI: 001-001-000000001
    id_pedido VARCHAR(30) REFERENCES public.pedidos(id_pedido) ON DELETE SET NULL,
    id_cliente VARCHAR(20) REFERENCES public.clientes(id_cliente),
    fecha_emision TIMESTAMPTZ DEFAULT NOW(),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    iva NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    forma_pago VARCHAR(50) DEFAULT 'Efectivo',
    estado_pago VARCHAR(50) DEFAULT 'Emitida', -- Borrador, Emitida, Pendiente de pago, Pagada, Anulada
    es_inmutable BOOLEAN DEFAULT true,
    motivo_anulacion TEXT,
    fecha_anulacion TIMESTAMPTZ,
    usuario_anulacion VARCHAR(150),
    clave_acceso_sri VARCHAR(60),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: DETALLE DE FACTURAS
CREATE TABLE IF NOT EXISTS public.detalle_facturas (
    id_detalle_factura VARCHAR(40) PRIMARY KEY,
    id_factura VARCHAR(30) REFERENCES public.facturas(id_factura) ON DELETE CASCADE,
    id_producto VARCHAR(20) REFERENCES public.productos(id_producto),
    nombre_producto VARCHAR(150),
    cantidad NUMERIC(10, 2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- 9. TABLA: SEGUIMIENTO COMERCIAL CRM (HISTORIAL DE CONTACTOS Y PIPELINE)
CREATE TABLE IF NOT EXISTS public.seguimiento_crm (
    id_contacto VARCHAR(30) PRIMARY KEY,
    id_cliente VARCHAR(20) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
    tipo_contacto VARCHAR(50) NOT NULL, -- Llamada, WhatsApp, Correo, Reunión, Visita
    fecha_contacto TIMESTAMPTZ DEFAULT NOW(),
    observacion TEXT NOT NULL,
    proxima_fecha_seguimiento DATE,
    etapa_oportunidad VARCHAR(50) DEFAULT 'Contacto Inicial', -- Contacto Inicial, Cotización, Negociación, Cerrada Ganada, Cerrada Perdida
    motivo_perdida VARCHAR(150),
    usuario_responsable VARCHAR(150) DEFAULT 'Administrador'
);

-- 10. TABLA: PROMOCIONES Y DESCUENTOS
CREATE TABLE IF NOT EXISTS public.promociones (
    id_promocion VARCHAR(30) PRIMARY KEY,
    nombre_promocion VARCHAR(150) NOT NULL,
    descripcion TEXT,
    id_producto VARCHAR(20) REFERENCES public.productos(id_producto) ON DELETE SET NULL,
    codigo_promocional VARCHAR(50) UNIQUE,
    descuento_porcentaje NUMERIC(5, 2) DEFAULT 0.00,
    precio_promocional NUMERIC(10, 2),
    precio_normal NUMERIC(10, 2),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    usos_maximos INTEGER DEFAULT 100,
    usos_actuales INTEGER DEFAULT 0,
    estado VARCHAR(30) DEFAULT 'Activa', -- Borrador, Programada, Activa, Finalizada, Cancelada
    imagen_banner TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABLA: CAMPAÑAS PUBLICITARIAS
CREATE TABLE IF NOT EXISTS public.campanas_marketing (
    id_campana VARCHAR(30) PRIMARY KEY,
    nombre_campana VARCHAR(150) NOT NULL,
    canal VARCHAR(50) NOT NULL, -- Instagram, Facebook, WhatsApp, Local
    publico_objetivo VARCHAR(150),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    presupuesto NUMERIC(10, 2) DEFAULT 0.00,
    ventas_atribuidas NUMERIC(10, 2) DEFAULT 0.00,
    enlace_publicacion TEXT,
    estado VARCHAR(30) DEFAULT 'Activa', -- Diseñada, Programada, Publicada, Finalizada
    resultado TEXT
);

-- 12. TABLA: PROGRAMA DE FIDELIZACIÓN (POLLOPUNTOS)
CREATE TABLE IF NOT EXISTS public.fidelizacion_puntos (
    id_transaccion VARCHAR(40) PRIMARY KEY,
    id_cliente VARCHAR(20) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
    tipo_operacion VARCHAR(30) NOT NULL, -- Ganado, Canjeado, Ajuste
    puntos INTEGER NOT NULL,
    referencia_origen VARCHAR(100), -- ID Factura / Recompensa
    fecha TIMESTAMPTZ DEFAULT NOW(),
    observacion TEXT
);

-- 13. TABLA: CATÁLOGO DE RECOMPENSAS
CREATE TABLE IF NOT EXISTS public.recompensas (
    id_recompensa VARCHAR(30) PRIMARY KEY,
    nombre_recompensa VARCHAR(150) NOT NULL,
    puntos_requeridos INTEGER NOT NULL,
    descripcion TEXT,
    stock_recompensa INTEGER DEFAULT 50,
    estado VARCHAR(30) DEFAULT 'Activo'
);

-- 14. TABLA: BITÁCORA DE AUDITORÍA Y SEGURIDAD
CREATE TABLE IF NOT EXISTS public.bitacora_auditoria (
    id_evento VARCHAR(40) PRIMARY KEY,
    usuario VARCHAR(150) NOT NULL,
    accion VARCHAR(100) NOT NULL,
    modulo VARCHAR(80) NOT NULL,
    detalles TEXT,
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TABLA: PERFILES DE USUARIOS (AUTENTICACIÓN Y ROLES RBAC)
-- NOTA IMPORTANTE: id y user_id en TEXT para garantizar máxima compatibilidad con Supabase Auth y modo local
DROP TABLE IF EXISTS public.perfiles_usuarios CASCADE;
CREATE TABLE public.perfiles_usuarios (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    rol VARCHAR(50) NOT NULL DEFAULT 'USUARIO' CHECK (rol IN ('ADMINISTRADOR', 'VENDEDOR', 'EMPLEADO', 'USUARIO')),
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'DESACTIVADO')),
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_aprobacion TIMESTAMPTZ,
    aprobado_por VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA LEGACY DE COMPATIBILIDAD (SEGUIMIENTO_VENTAS)
CREATE TABLE IF NOT EXISTS public.seguimiento_ventas (
    id_seguimiento VARCHAR(20) PRIMARY KEY,
    id_cliente VARCHAR(20) REFERENCES public.clientes(id_cliente) ON DELETE SET NULL,
    id_producto VARCHAR(20) REFERENCES public.productos(id_producto) ON DELETE SET NULL,
    fecha_compra DATE DEFAULT CURRENT_DATE,
    cantidad INTEGER NOT NULL DEFAULT 1,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    canal VARCHAR(50) DEFAULT 'Instagram',
    metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
    estado VARCHAR(50) DEFAULT 'Completado',
    observacion TEXT DEFAULT 'Entregado a conformidad',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS) GLOBALES Y SEGURAS
-- ==========================================================
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimiento_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanas_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelizacion_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recompensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimiento_ventas ENABLE ROW LEVEL SECURITY;

-- CREAR POLÍTICAS PERMISIVAS PARA ACCESO ANÓNIMO / AUTENTICADO
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
            'categorias', 'clientes', 'productos', 'movimientos_inventario',
            'pedidos', 'detalle_pedidos', 'facturas', 'detalle_facturas',
            'seguimiento_crm', 'promociones', 'campanas_marketing',
            'fidelizacion_puntos', 'recompensas', 'bitacora_auditoria',
            'perfiles_usuarios', 'seguimiento_ventas'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Acceso_Permisivo_%I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Acceso_Permisivo_%I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END $$;

-- TRIGGER AUTOMÁTICO EN auth.users -> perfiles_usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles_usuarios (
        id,
        user_id,
        nombre,
        apellido,
        correo,
        telefono,
        rol,
        estado,
        fecha_registro
    )
    VALUES (
        NEW.id::text,
        NEW.id::text,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
        'USUARIO',
        'PENDIENTE',
        NOW()
    )
    ON CONFLICT (correo) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        nombre = EXCLUDED.nombre,
        apellido = EXCLUDED.apellido;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- DATOS SEMILLA INICIALES (ADMINISTRADORAS Y OPERACIÓN)
-- ==========================================================
INSERT INTO public.perfiles_usuarios (id, user_id, nombre, apellido, correo, telefono, rol, estado, fecha_registro, fecha_aprobacion, aprobado_por)
VALUES 
    ('usr-admin-veronica', 'usr-admin-veronica', 'Veronica', 'Toaza', 'veronica@quepollo.com', '0984149863', 'ADMINISTRADOR', 'APROBADO', NOW(), NOW(), 'Sistema Maestro'),
    ('usr-admin-salome', 'usr-admin-salome', 'Salomé', 'Flores', 'salome@quepollo.com', '0991234567', 'ADMINISTRADOR', 'APROBADO', NOW(), NOW(), 'Sistema Maestro'),
    ('usr-user-rebeca', 'usr-user-rebeca', 'Rebeca', 'Quinapanta', 'rebeca@quepollo.com', '0987654321', 'VENDEDOR', 'APROBADO', NOW(), NOW(), 'Veronica Toaza'),
    ('usr-user-carlos', 'usr-user-carlos', 'Carlos', 'Mendoza', 'carlos.mendoza@gmail.com', '0979876543', 'USUARIO', 'PENDIENTE', NOW(), NULL, NULL)
ON CONFLICT (correo) DO UPDATE SET
    rol = EXCLUDED.rol,
    estado = EXCLUDED.estado,
    nombre = EXCLUDED.nombre,
    apellido = EXCLUDED.apellido;
