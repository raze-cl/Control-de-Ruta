# Inventario de Credenciales y Accesos del Proyecto

> [!IMPORTANT]
> Este documento contiene información confidencial de acceso a las plataformas de producción, bases de datos y usuarios del sistema **Control de Ruta (ScanQR)**. Guarde este archivo en un lugar seguro.

---

## 1. Accesos a Plataformas

| Plataforma | URL de Acceso | Descripción |
|---|---|---|
| **WebApp de Producción** | [https://control-de-ruta-six.vercel.app](https://control-de-ruta-six.vercel.app) | Panel Web para Administradores, Supervisores y Clientes. |
| **Repositorio GitHub** | `https://github.com/raze-cl/Control-de-Ruta` | Código fuente sincronizado con auto-despliegue en Vercel. |
| **Consola Supabase** | [https://supabase.com/dashboard/project/wpjzblsqnbfabntwoyke](https://supabase.com/dashboard/project/wpjzblsqnbfabntwoyke) | Base de datos PostgreSQL, almacenamiento de fotos y configuración. |

---

## 2. Usuarios del Sistema (WebApp & APK Móvil)

Todos los usuarios registrados en la base de datos cuentan actualmente con la clave inicial por defecto `1234`:

| Nombre Completo | RUT | Rol / Tipo | Usuario (`username`) | Contraseña | Correo Electrónico | Notificaciones por Email |
|---|---|---|---|---|---|:---:|
| **Andres Alejandro Alquinta Ayala** | `15.691.758-3` | **Administrador General** | `aalquinta` | `1234` | `zerocool2121@gmail.com` | **Activo (Sí)** |
| **Raul Meza** | `11.222.333-4` | **Administrador** | `rmeza` | `1234` | `r.meza@empresa.cl` | Inactivo (No) |
| **Ingerborg Corina Oyanedel Romero** | `13364968-9` | **Administradora** | `Ioyanedel` | `1234` | *(Sin registrar)* | Inactivo (No) |
| **Juan Perez** | `11.111.111.2` | **Operador / Chofer** | `Jperez` | `1234` | `andres.adt@gmail.com` | Inactivo (No) |
| **Juan Lopez** | `22.333.444-5` | **Ayudante de Operación** | `jlopez` | `1234` | *(Sin registrar)* | Inactivo (No) |
| **Luis Campos** | `33.444.555-6` | **Cliente (Admin Contrato)** | `lcampos` | `1234` | *(Sin registrar)* | Inactivo (No) |

> [!TIP]
> Se recomienda a los administradores actualizar sus contraseñas personales ingresando al módulo "Usuarios" o utilizando la función "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión.

---

## 3. Credenciales de Backend y Base de Datos (Supabase)

- **ID del Proyecto:** `wpjzblsqnbfabntwoyke`
- **Región:** `sa-east-1` (São Paulo / Sudamérica)
- **URL Base:** `https://wpjzblsqnbfabntwoyke.supabase.co`
- **Clave Pública Anónima (`anon key`):**
  ```text
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwanpibHNxbmJmYWJudHdveWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MTc0NjYsImV4cCI6MjEwMzE5MzQ2Nn0.aY__UROrkRoI4BxJJctwnZ-lXj3AYge3XMvAS3q67VA
  ```
- **Bucket de Almacenamiento (Storage):**
  - Nombre: `checklist_photos` (Público)
  - Uso: Fotos de inspección de vehículos, fotos de inicio/fin de puntos de control y fotos de evidencia de inconvenientes.

---

## 4. Servicio de Correos Electrónicos (Resend API)

- **Proveedor:** Resend ([https://resend.com](https://resend.com))
- **Variable de Entorno en Vercel:** `RESEND_API_KEY`
- **Remitente Configurado:** `Control de Ruta <onboarding@resend.dev>`
- **Funcionalidad:**
  - Envío automático de credenciales en "¿Olvidaste tu contraseña?".
  - Despacho inmediato de alertas críticas a correos de administradores ante términos anticipados de ruta o problemas en puntos.
