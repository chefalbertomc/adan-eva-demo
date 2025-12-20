# ADAN&EVA | CRM & Operations Platform

Proyecto de CRM y Operaciones para administración de restaurantes (Demo: Buffalo Wild Wings).

## 🚀 Estado Actual (Prototipo Local)
Esta aplicación funciona actualmente como un **Prototipo de Alta Fidelidad**.
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla).
- **Datos**: Simulación local usando `localStorage`.

> **⚠️ IMPORTANTE:** En esta versión, los datos **NO se comparten entre dispositivos**. Lo que la Hostess registre en su iPad NO se verá automáticamente en el celular del Gerente, ya que la "base de datos" vive en la memoria del navegador de cada dispositivo.

---

## 🗺️ Roadmap de Implementación (De Local a Producción Real)

Para llevar este proyecto a la vida real y que funcione online, se recomienda seguir estas fases:

### Fase 1: Backend & Base de Datos Real (Siguiente Paso Recomendado)
Reemplazar el archivo `_store.js` por una conexión a una base de datos en la nube.
- **Recomendación:** **Firebase (Google)** o **Supabase**.
- **Por qué:** Permiten tener base de datos en tiempo real sin configurar servidores complejos.
- **Beneficio:** Hostess agrega visita -> Gerente lo ve en tiempo real en su celular.

### Fase 2: Despliegue (Hosting)
Una vez conectada la base de datos, el código (HTML/JS) debe vivir en internet.
- **Servicios:** Vercel, Netlify o GitHub Pages.
- **Costo:** Gratuitos para empezar.

### Fase 3: App Instalable (PWA)
Convertir la web en una aplicación instalable (ícono en el celular).
- Ya tenemos las bases (`meta tags` para iOS/Android).
- Falta configurar el `manifest.json` y el `Service Worker`.
- Esto permite que los meseros/gerentes instalen la app sin pasar por App Store/Play Store.

---

## 🛠️ Roles del Sistema (Demo)
Credenciales para pruebas locales:

| Rol | Usuario | Contraseña | Alcance |
| :--- | :--- | :--- | :--- |
| **Hostess** | `hostess` | `123` | Check-in, Gestión de Mesas (Local) |
| **Mesero** | `mesero` | `123` | Mis Mesas, Tomar Orden (Local) |
| **Gerente** | `gerente` | `123` | Dashboard Sucursal, Alertas, Cumpleaños |
| **Regional** | `regional` | `123` | Dashboard Global, Reportes, Métricas |
| **Super Admin**| `admin` | `123` | Gestión de Usuarios (Crear/Editar) |

## 📁 Estructura del Proyecto
- `index.html`: Punto de entrada (Single Page Application).
- `assets/css`: Estilos (Diseño oscuro, Glassmorphism).
- `assets/js`: Lógica de negocio.
  - `_store.js`: **Simulador de Base de Datos** (Aquí está la lógica que se debe migrar a la nube).
  - `app.js`: Controladores de vista y UI.
