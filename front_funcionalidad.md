# Requerimientos de Frontend - API Wablas FastAPI

## 📋 Descripción General

Este documento describe las funcionalidades que el frontend debe implementar para interactuar con la API de envío masivo de mensajes WhatsApp mediante Wablas.

La API proporciona dos módulos principales:
1. **Gestión de Devices (CRUD completo)**: Administración de dispositivos Wablas
2. **Envío Masivo de Mensajes**: Sistema de balanceo de carga para envío paralelo

---

## 🔗 Base URL

```
http://localhost:8000
```

**Nota:** En producción, reemplazar con la URL del servidor correspondiente.

---

## 📚 Documentación Interactiva

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 🎯 Módulo 1: Gestión de Devices

### 1.1 Listar Devices

**Endpoint:** `GET /devices`

**Descripción:** Obtiene la lista completa de devices registrados en el sistema.

**Request:**
```http
GET /devices
```

**Response (200 OK):**
```json
{
  "total": 2,
  "devices": [
    {
      "id": 1,
      "token": "4mJVebNeuIux8NynWLfi...",
      "secret_masked": "f5gn***",
      "device_name": "Device Principal",
      "status": "active"
    },
    {
      "id": 2,
      "token": "otro_token_aqui...",
      "secret_masked": "abcd***",
      "device_name": "Device Secundario",
      "status": "active"
    }
  ]
}
```

**Funcionalidad Frontend:**
- Mostrar tabla/listado de devices
- Mostrar: ID, nombre, estado, token (parcialmente oculto)
- Botón para ver detalles
- Botón para editar
- Botón para eliminar

---

### 1.2 Obtener Device Específico

**Endpoint:** `GET /devices/{device_id}`

**Descripción:** Obtiene la información detallada de un device específico.

**Request:**
```http
GET /devices/1
```

**Response (200 OK):**
```json
{
  "id": 1,
  "token": "4mJVebNeuIux8NynWLfi...",
  "secret_masked": "f5gn***",
  "device_name": "Device Principal",
  "status": "active"
}
```

**Response (404 Not Found):**
```json
{
  "detail": "Device con ID 1 no encontrado"
}
```

**Funcionalidad Frontend:**
- Modal o página de detalle
- Mostrar información completa del device
- Opción para editar desde aquí

---

### 1.3 Crear Device

**Endpoint:** `POST /devices`

**Descripción:** Registra un nuevo device en el sistema.

**Request:**
```http
POST /devices
Content-Type: application/json
```

**Body:**
```json
{
  "token": "4mJVebNeuIux8NynWLfiWd11rFqNZ14hWQnWUQ85z3wDAvjJMXKvYi9",
  "secret": "f5gnfiQ1",
  "device_name": "Device Principal"
}
```

**Campos:**
- `token` (string, requerido): Token de autenticación de Wablas
- `secret` (string, requerido): Secret/Key de autenticación de Wablas
- `device_name` (string, opcional): Nombre descriptivo del device

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Device creado exitosamente",
  "device": {
    "id": 1,
    "token": "4mJVebNeuIux8NynWLfi...",
    "secret_masked": "f5gn***",
    "device_name": "Device Principal",
    "status": "active"
  }
}
```

**Funcionalidad Frontend:**
- Formulario modal o página dedicada
- Campos:
  - Token (input tipo password o text)
  - Secret (input tipo password)
  - Nombre del device (text)
- Validación:
  - Token y Secret requeridos
  - Validar formato si es necesario
- Botón "Guardar" / "Crear Device"
- Mostrar mensaje de éxito/error
- Actualizar lista después de crear

---

### 1.4 Actualizar Device

**Endpoint:** `PUT /devices/{device_id}`

**Descripción:** Actualiza los datos de un device existente.

**Request:**
```http
PUT /devices/1
Content-Type: application/json
```

**Body (todos los campos son opcionales):**
```json
{
  "token": "nuevo_token_aqui",
  "secret": "nuevo_secret_aqui",
  "device_name": "Nombre Actualizado"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Device actualizado exitosamente",
  "device": {
    "id": 1,
    "token": "nuevo_token_aqui...",
    "secret_masked": "nuev***",
    "device_name": "Nombre Actualizado",
    "status": "active"
  }
}
```

**Response (404 Not Found):**
```json
{
  "detail": "Device con ID 1 no encontrado"
}
```

**Response (400 Bad Request):**
```json
{
  "detail": "Debe proporcionar al menos un campo para actualizar"
}
```

**Funcionalidad Frontend:**
- Formulario pre-llenado con datos actuales
- Campos editables (todos opcionales)
- Validación: al menos un campo debe ser actualizado
- Botón "Guardar Cambios"
- Confirmación antes de guardar (opcional)
- Mostrar mensaje de éxito/error
- Actualizar vista después de actualizar

---

### 1.5 Eliminar Device

**Endpoint:** `DELETE /devices/{device_id}`

**Descripción:** Elimina un device del sistema.

**Request:**
```http
DELETE /devices/1
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Device con ID 1 eliminado exitosamente",
  "device": null
}
```

**Response (404 Not Found):**
```json
{
  "detail": "Device con ID 1 no encontrado"
}
```

**Funcionalidad Frontend:**
- Botón de eliminar en cada fila/item
- Modal de confirmación:
  - "¿Estás seguro de eliminar este device?"
  - "Esta acción no se puede deshacer"
  - Botones: "Cancelar" y "Eliminar"
- Mostrar mensaje de éxito/error
- Actualizar lista después de eliminar
- Remover item de la lista sin recargar (optimización)

---

## 📨 Módulo 2: Envío Masivo de Mensajes

### 2.1 Enviar Mensajes Masivos

**Endpoint:** `POST /messages/send-bulk`

**Descripción:** Envía mensajes de forma masiva usando múltiples devices en paralelo con balanceo de carga.

**Características:**
- ✅ Orden global preservado
- ✅ Envío paralelo por device
- ✅ Envío secuencial dentro de cada device
- ✅ Balanceo automático de carga

**Request:**
```http
POST /messages/send-bulk
Content-Type: application/json
```

**Body:**
```json
{
  "message": "Hola, este es un mensaje de prueba",
  "phones": [
    "6281223641234",
    "6281223645678",
    "6281223649012"
  ],
  "devices_limit": 5
}
```

**Campos:**
- `message` (string, requerido): Mensaje a enviar
- `phones` (array[string], requerido): Lista de números de teléfono
  - Formato: `628122364xxxx` (código de país + número)
  - Mínimo: 1 número
- `devices_limit` (integer, opcional): Límite de devices a usar (default: 5, min: 1, max: 10)

**Response (200 OK):**
```json
{
  "status": "ok",
  "total_numbers": 3,
  "devices_used": 2,
  "parallel_workers": 2
}
```

**Response (400 Bad Request):**
```json
{
  "detail": "No hay devices disponibles"
}
```

**Response (503 Service Unavailable):**
```json
{
  "detail": {
    "error": "No se pudo conectar con el servidor de Wablas",
    "message": "El servidor no está respondiendo. Verifica tu conexión a internet y que el servidor de Wablas esté disponible.",
    "type": "connection_timeout"
  }
}
```

**Funcionalidad Frontend:**

#### Formulario de Envío:
1. **Campo de Mensaje:**
   - Textarea multilínea
   - Contador de caracteres (opcional)
   - Validación: requerido, mínimo X caracteres

2. **Campo de Números:**
   - Opción A: Textarea donde cada línea es un número
   - Opción B: Input con tags/chips para agregar números
   - Validación:
     - Formato de número (628xxxxxxxxx)
     - No duplicados
     - Mínimo 1 número
   - Botón "Agregar número"
   - Lista de números agregados con opción de eliminar

3. **Selector de Devices:**
   - Dropdown o selector múltiple
   - Mostrar devices disponibles
   - Límite configurable (1-10)
   - Default: 5

4. **Botón de Envío:**
   - "Enviar Mensajes" / "Iniciar Envío"
   - Deshabilitar durante el envío
   - Mostrar loading/spinner

#### Durante el Envío:
- Mostrar progreso (opcional si hay webhook)
- Indicador de carga
- Mensaje: "Enviando mensajes..."

#### Después del Envío:
- Mostrar resultado:
  - Total de números procesados
  - Devices utilizados
  - Workers en paralelo
- Mensaje de éxito/error
- Opción para ver detalles/logs (si están disponibles)

#### Manejo de Errores:
- Mostrar mensajes de error claros
- Si es error de conexión, sugerir verificar internet
- Si no hay devices, redirigir a crear device

---

## 🎨 Recomendaciones de UI/UX

### Página Principal / Dashboard

**Secciones sugeridas:**

1. **Resumen/Estadísticas:**
   - Total de devices activos
   - Total de mensajes enviados (si hay tracking)
   - Devices disponibles

2. **Accesos Rápidos:**
   - Botón grande "Enviar Mensajes"
   - Botón "Gestionar Devices"

3. **Lista de Devices:**
   - Vista previa de devices
   - Estado (activo/inactivo)
   - Acciones rápidas

---

### Página de Devices

**Layout sugerido:**

```
┌─────────────────────────────────────┐
│  Devices                    [+ Nuevo]│
├─────────────────────────────────────┤
│  [Tabla de Devices]                 │
│  - ID | Nombre | Estado | Acciones  │
│  - 1  | Device | Active | [Editar]  │
│       |        |        | [Eliminar]│
└─────────────────────────────────────┘
```

**Funcionalidades:**
- Búsqueda/filtro de devices
- Ordenamiento por columnas
- Paginación (si hay muchos devices)
- Vista de tarjetas como alternativa a tabla

---

### Página de Envío de Mensajes

**Layout sugerido:**

```
┌─────────────────────────────────────┐
│  Enviar Mensajes Masivos            │
├─────────────────────────────────────┤
│  Mensaje:                           │
│  [Textarea grande]                  │
│                                     │
│  Números de Teléfono:               │
│  [Input/Tags] [+ Agregar]           │
│  - 6281223641234 [X]                │
│  - 6281223645678 [X]                │
│                                     │
│  Devices a usar: [Dropdown] (5)    │
│                                     │
│  [Botón: Enviar Mensajes]           │
└─────────────────────────────────────┘
```

**Validaciones en Frontend:**
- Mensaje no vacío
- Al menos un número válido
- Formato de números correcto
- Devices disponibles

---

## 🔄 Flujos de Trabajo

### Flujo 1: Configuración Inicial

1. Usuario accede a la aplicación
2. Si no hay devices, mostrar mensaje: "No hay devices configurados"
3. Botón "Agregar Primer Device"
4. Formulario de creación
5. Después de crear, redirigir a lista de devices

### Flujo 2: Envío de Mensajes

1. Usuario va a "Enviar Mensajes"
2. Completa formulario:
   - Escribe mensaje
   - Agrega números
   - Selecciona devices (opcional)
3. Click en "Enviar"
4. Validación en frontend
5. Envío a API
6. Mostrar loading
7. Mostrar resultado
8. Opción para enviar otro lote

### Flujo 3: Gestión de Devices

1. Usuario va a "Devices"
2. Ve lista de devices
3. Puede:
   - Crear nuevo (botón +)
   - Editar (click en editar)
   - Eliminar (click en eliminar → confirmar)
4. Actualizar vista después de cada acción

---

## 📱 Estados y Validaciones

### Estados de Devices

- `active`: Device activo y disponible
- `inactive`: Device inactivo (si se implementa)

### Validaciones Frontend

**Números de Teléfono:**
- Formato: `628xxxxxxxxx` (Indonesia)
- Longitud: 10-15 dígitos después del código de país
- Sin espacios ni caracteres especiales (excepto + al inicio si se permite)

**Mensaje:**
- No vacío
- Longitud máxima recomendada: 4096 caracteres (verificar límite de WhatsApp)

**Devices:**
- Al menos 1 device debe estar disponible
- Límite máximo: 10 devices en paralelo

---

## 🎯 Funcionalidades Prioritarias

### Prioridad Alta (MVP)

1. ✅ Listar devices
2. ✅ Crear device
3. ✅ Enviar mensajes masivos
4. ✅ Ver resultados básicos

### Prioridad Media

1. ⚠️ Editar device
2. ⚠️ Eliminar device
3. ⚠️ Validación de números
4. ⚠️ Manejo de errores mejorado

### Prioridad Baja (Mejoras)

1. 📊 Dashboard con estadísticas
2. 📊 Historial de envíos
3. 📊 Tracking de mensajes
4. 📊 Exportar/Importar números
5. 📊 Plantillas de mensajes

---

## 🛠️ Ejemplos de Código

### JavaScript/TypeScript - Listar Devices

```javascript
async function getDevices() {
  try {
    const response = await fetch('http://localhost:8000/devices');
    const data = await response.json();
    return data.devices;
  } catch (error) {
    console.error('Error al obtener devices:', error);
    throw error;
  }
}
```

### JavaScript/TypeScript - Crear Device

```javascript
async function createDevice(deviceData) {
  try {
    const response = await fetch('http://localhost:8000/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: deviceData.token,
        secret: deviceData.secret,
        device_name: deviceData.device_name
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear device');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al crear device:', error);
    throw error;
  }
}
```

### JavaScript/TypeScript - Enviar Mensajes

```javascript
async function sendBulkMessages(messageData) {
  try {
    const response = await fetch('http://localhost:8000/messages/send-bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: messageData.message,
        phones: messageData.phones,
        devices_limit: messageData.devices_limit || 5
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || error.detail || 'Error al enviar mensajes');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al enviar mensajes:', error);
    throw error;
  }
}
```

---

## 📝 Notas Importantes

1. **Seguridad:**
   - Los tokens y secrets se muestran parcialmente ocultos en las respuestas
   - No almacenar credenciales en localStorage sin encriptar
   - Usar HTTPS en producción

2. **Performance:**
   - El envío masivo puede tardar según la cantidad de números
   - Considerar implementar polling o webhooks para tracking
   - Mostrar progreso si es posible

3. **Errores:**
   - Siempre manejar errores de conexión
   - Mostrar mensajes claros al usuario
   - Validar datos antes de enviar

4. **Testing:**
   - Probar con números de prueba primero
   - Verificar límites de la API de Wablas
   - Probar con diferentes cantidades de números

---

## 📞 Soporte

Para más información sobre los endpoints, consulta la documentación interactiva en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

**Última actualización:** 2025
**Versión API:** 1.0.0
