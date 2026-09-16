# CRM Avícola "QUÉ POLLO" 🍗

> Sistema de Gestión Comercial, Trazabilidad de Ventas y Administración de Catálogo para **Avícola QUÉ POLLO**.  
> Desarrollado de acuerdo con las especificaciones de la actividad académica **ACT - BD CRM**.

---

## 🎓 Información Académica

- **Institución:** Universidad Técnica de Ambato (UTA)
- **Facultad:** Facultad de Ciencias Administrativas
- **Carrera:** Mercadotecnia
- **Curso:** 7mo Semestre "B"
- **Módulo:** Sistemas de Información
- **Grupo:** GRUPO 4
- **Integrantes:**
  - Flores Salomé
  - Solis Fabian
  - Quinapanta Rebeca
  - Naranjo Domenica
  - Pico Daniela

---

## 🗄️ Estructura de la Base de Datos

El sistema implementa fielmente las entidades y campos requeridos, incorporando la administración dinámica de categorías vinculada a productos:

### 1. Tabla: `CATEGORIAS` (Administración Dinámica)
| Campo | Tipo de Dato | Ejemplo / Valores |
| :--- | :--- | :--- |
| `ID_Categoria` | Número / ID (Clave primaria) | `CAT001` |
| `Nombre_Categoria` | Texto (Único) | `Pollo`, `Cerdo`, `Res`, `Embutidos`, `Menudencias`, `Otros` |
| `Fecha_Creacion` | Fecha | `2026-09-09` |
| `Estado` | Texto | `Activo` |

### 2. Tabla: `CLIENTES`
| Campo | Tipo de Dato | Ejemplo / Valores |
| :--- | :--- | :--- |
| `ID_Cliente` | Número / ID (Clave primaria) | `C001` |
| `Nombre` | Texto | `Carlos` |
| `Apellido` | Texto | `Solis` |
| `Teléfono` | Texto | `0984149863` (con acceso directo a WhatsApp) |
| `Correo` | Texto | `carlosol@gmail.com` |
| `Red_Social` | Texto / Selección | `Facebook`, `Instagram`, `WhatsApp`, `TikTok` |
| `Fecha_Registro`| Fecha | `09/09/2026` |
| `Tipo_Cliente` | Selección | `Frecuente`, `Mayorista`, `Ocasional`, `Nuevo` |

### 3. Tabla: `PRODUCTOS`
| Campo | Tipo de Dato | Ejemplo / Valores |
| :--- | :--- | :--- |
| `ID_Producto` | Número / ID (Clave primaria) | `P001` |
| `Nombre` | Texto | `Pollo entero` |
| `ID_Categoria` | Relación con Categorías | `CAT001` |
| `Categoría` | Selección dinámica | `Pollo` |
| `Precio_V` | Decimal (2) - Precio de Venta | `8.50` |
| `Precio_C` | Decimal (2) - Precio de Costo | `16.50` |

### 4. Tabla: `SEGUIMIENTO / VENTAS`
| Campo | Tipo de Dato | Ejemplo / Valores |
| :--- | :--- | :--- |
| `ID_Seguimiento`| Número / ID (Clave primaria) | `S001` |
| `ID_Cliente` | Relación (Foránea) | `C001` (Carlos Solis) |
| `ID_Producto` | Relación (Foránea) | `P001` (Pollo entero) |
| `Fecha_Compra` | Fecha | `09/09/2026` |
| `Cantidad` | Número entero | `2` |
| `Total` | Decimal | `$7.00` / `$17.00` (Calculado o con descuento) |
| `Canal` | Selección | `Instagram`, `Facebook`, `WhatsApp`, `Local` |
| `Método_Pago` | Selección | `Efectivo`, `Transferencia`, `Deuna`, `Tarjeta` |
| `Estado` | Selección | `Completado`, `Pendiente`, `Cancelado` |
| `Observación` | Texto | `Entregado a conformidad` |

---

## 🍗 Módulo de Categorías Dinámicas

- **Gestión completa:** Creación, edición del nombre y eliminación de categorías desde una interfaz limpia e intuitiva.
- **Protección referencial:** Si una categoría está asociada a uno o más productos, el sistema bloquea su eliminación y avisa: *"No se puede eliminar esta categoría porque existen productos asociados. Cambia primero la categoría de esos productos."*
- **Confirmación segura:** Las categorías sin productos se eliminan tras confirmar en la ventana emergente con botones **Cancelar** y **Eliminar**.
- **Sincronización en tiempo real:** Toda nueva categoría o cambio de nombre se actualiza de inmediato en el formulario de creación/edición de productos y en los filtros del catálogo.
- **Persistencia garantizada:** Los cambios en las categorías se guardan de forma permanente.

---

## 🚀 Uso y Despliegue

### Uso Local Inmediato
1. Abre el archivo **`index.html`** en cualquier navegador web moderno (Edge, Chrome, Brave, Firefox).
2. Todo funciona localmente de inmediato con datos precargados.

### Base de Datos Supabase (PostgreSQL)
El archivo **`schema.sql`** contiene la definición de todas las tablas con sus relaciones foráneas y políticas RLS para ejecutar en el SQL Editor de Supabase.

### Despliegue en Vercel
El archivo **`vercel.json`** permite desplegar el proyecto directamente en la plataforma Vercel para acceso en línea.
