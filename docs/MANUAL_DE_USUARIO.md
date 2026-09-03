# Manual Oficial de Usuario: Control de Ruta (ScanQR)

Este manual proporciona las instrucciones paso a paso para el uso correcto de la aplicación móvil (para choferes y operadores en terreno) y la plataforma web de administración (para supervisores y clientes).

---

## PARTE 1: Manual del Conductor / Operador en Terreno (APK Móvil)

### 1. Instalación y Primer Ingreso
1. Descargue e instale el archivo **`ControlDeRuta-release.apk`** en su dispositivo Android.
2. Al abrir la aplicación, otorgue todos los permisos solicitados:
   - **Cámara:** Necesaria para escanear códigos QR y capturar fotos de evidencia.
   - **Ubicación (GPS):** Necesaria para validar la presencia física en los puntos de control.
3. Ingrese su **Nombre de Usuario** y **Contraseña** asignados por su supervisor.

### 2. Validación Documental (Semáforo de Seguridad)
- Al iniciar sesión, la aplicación revisa automáticamente la vigencia de sus licencias, exámenes ocupacionales y pases de faena.
- **Si sus documentos están al día (Verde):** Podrá continuar normalmente.
- **Si algún documento obligatorio está vencido (Rojo):** La aplicación le impedirá iniciar ruta por razones de seguridad laboral y cumplimiento legal. Debe contactar a su supervisor.

### 3. Selección de Vehículo y Checklist Pre-Operacional 360°
1. Seleccione el vehículo que conducirá en la jornada (ej. `V-101`).
2. Si el vehículo no tiene su checklist diario completado hoy:
   - Presione **"Realizar Checklist Vehicular"**.
   - Responda cada una de las preguntas de inspección visual y mecánica (Luces, Neumáticos, Frenos, Niveles de fluidos, etc.).
   - Tome las fotografías obligatorias del estado del vehículo (Frontal, Lateral, Posterior, Tacómetro/Kilometraje).
   - Presione **"Finalizar y Guardar Checklist"**.
3. Seleccione a su **Ayudante u Operador acompañante** (o marque "Sin Ayudante").

### 4. Inicio de Ruta y Escaneo de Entrada a Faena
1. Seleccione la Faena a la que se dirige (ej. `Minera Centinela`).
2. Al llegar al punto de inicio (Garita de Entrada), presione **"Escanear QR de Inicio"**.
3. La aplicación registrará la hora exacta y las coordenadas satelitales GPS de partida.

### 5. Ejecución de Puntos de Control en Terreno
Durante el recorrido por la faena, verá la lista de puntos asignados para la ruta:
1. Al llegar a un punto, presione el botón de la cámara para **Escanear el Código QR del Punto**.
2. **Control de Distancia (GPS):**
   - Si está dentro de los 200 metros, la aplicación abrirá de inmediato la pantalla de registro.
   - Si no hay señal GPS (túnel o socavón subterráneo), la aplicación le consultará si desea registrar el punto marcando *"Inconsistencia por falta de GPS"*. Presione **"Continuar con Inconsistencia"**.
3. **Registro del Punto:**
   - Capture la **Foto de Llegada / Inicio de Punto**.
   - Responda las preguntas de control específicas del punto.
   - Agregue observaciones si corresponde.
   - Capture la **Foto de Salida / Término de Punto**.
   - Presione **"Completar y Guardar Punto"**.
   - El punto cambiará a color **Verde con ticket (✓)** indicando la hora en que se ejecutó.

### 6. ¿Qué hacer si un Punto está Bloqueado o Inaccesible?
Si una ruta tiene un derrumbe, obras en camino o el acceso está cerrado:
1. No intente forzar el paso. En la lista de puntos, presione el botón **"Reportar Inconveniente"** (icono de advertencia naranja).
2. Seleccione el motivo correspondiente (ej. *Acceso bloqueado / Obras en camino*, *Área restringida*, etc.).
3. Ingrese una breve observación descriptiva.
4. Tome una **Foto de Evidencia** del camino bloqueado o del letrero de cierre.
5. Presione **"Guardar Novedad"**. El punto quedará registrado con distintivo ámbar para justificar su no ejecución ante el cliente.

### 7. Finalización de Jornada o Término Anticipado
- **Si completó todos los puntos:** Presione **"Finalizar Jornada de Ruta"**. Escanee el QR de salida si la faena lo requiere. La ruta quedará cerrada exitosamente.
- **Si debe terminar antes por emergencia o fin de turno:** Presione **"Terminar Ruta Anticipadamente"**. Seleccione el motivo y confirme. Se enviará una alerta automática a los supervisores.

### 8. Operación en Zonas Fuera de Cobertura (Modo Offline)
- La aplicación **funciona 100% sin señal de internet**.
- Toda foto, check-in o reporte queda guardado en la memoria segura del teléfono.
- En la parte superior verá un aviso: `📡 X registros pendientes de sincronizar`.
- En cuanto su teléfono vuelva a tener señal 4G o Wi-Fi, la información y las fotografías se sincronizarán solas con la plataforma central.

---

## PARTE 2: Manual del Administrador / Supervisor (WebApp)

**URL de Acceso:** [https://control-de-ruta-six.vercel.app](https://control-de-ruta-six.vercel.app)

### 1. Monitoreo en Tiempo Real (Dashboard de Control)
- **KPIs Superiores:** Visualice en tiempo real los vehículos activos, rutas en proceso hoy, choferes habilitados y el índice de cumplimiento general.
- **Cálculo para Estado de Pago:**
  - El cumplimiento se evalúa contra la **periodicidad estipulada** de cada punto (diaria, semanal o días específicos).
  - Los puntos reportados con problema justificado aparecen con etiqueta ámbar y no penalizan arbitrariamente la gestión operativa.

### 2. Auditoría de Rutas y Descarga de Evidencias
1. Ingrese a la sección **"Registros de Rutas"**.
2. Filtre por fecha, faena o chofer.
3. Presione el botón **"Ver Detalle"** en cualquier ruta:
   - Revise el mapa interactivo con la geolocalización de inicio y término.
   - Consulte la tabla **"Detalle de Puntos de Control"**:
     - Al hacer clic en cualquier punto, se desplegará el visor de evidencias con las fotos en alta resolución de llegada, salida o novedad, hora exacta y geoposición GPS.

### 3. Gestión de Vehículos y Choferes
- **Semáforo Documental:** Verifique qué conductores o camiones tienen revisiones técnicas, licencias o seguros por vencer en los próximos 30 días.
- **Habilitación:** Puede activar o deshabilitar un vehículo o chofer con un solo interruptor.

### 4. Gestión de Faenas, Periodicidad y Códigos QR
1. Ingrese al módulo **"Faenas"**.
2. Al crear o editar puntos de control:
   - Asigne el nombre, código y coordenadas en el mapa.
   - Configure la **Periodicidad**: Diario, Semanal o días de la semana (ej. Martes, Jueves, Sábado).
3. Presione **"Imprimir QR"** para generar la plantilla con el código QR vectorizado de alta resolución, listo para imprimir y colocar en el poste, garita o caseta en terreno.

### 5. Centro de Alertas y Notificaciones por Correo
- En la campana superior de notificaciones se reciben alertas inmediatas cuando un conductor reporta un problema en un punto o realiza un término anticipado.
- Si desea recibir estas alertas en su correo personal, active la casilla `Recibe Notificaciones = Sí` en su perfil de usuario en el módulo "Usuarios".
