# 📱 Guía Técnica para Frontend - API de Envío Masivo

## 🎯 Resumen

Esta API permite enviar mensajes masivos de WhatsApp con personalización dinámica usando variables. El sistema procesa los envíos en segundo plano usando workers paralelos y notifica el progreso en tiempo real vía WebSocket.

---

## 🔌 Endpoints Disponibles

### 1. `POST /messages/send-bulk-file`
**Envío masivo desde archivo CSV**
- ✅ Para envíos masivos (archivos pre-generados o generados desde el frontend)
- ✅ Hasta 1,000,000 recipients
- ✅ Formato: Archivo CSV + mensaje en FormData

### 2. `GET /jobs`
**Listar todos los jobs de envío**

### 3. `GET /jobs/{job_id}`
**Obtener información de un job específico**

### 4. `WebSocket /ws/job/{job_id}`
**Conexión WebSocket para recibir actualizaciones en tiempo real**

---

## 📁 Endpoint: POST /messages/send-bulk-file

### ¿Qué espera el backend?

**Request (FormData/Multipart):**
- `file`: Archivo CSV o TXT (obligatorio)
- `message`: String con el mensaje plantilla (obligatorio)
- `devices_limit`: Number opcional (default: 5)

**Formato del archivo CSV:**
- Separador: `|` (pipe)
- Primera columna: número de teléfono
- Siguientes columnas: valores para `@valor1`, `@valor2`, etc.
- Puede tener header opcional: `phone|@valor1|@valor2` (se ignora automáticamente)
- Encoding: UTF-8

**Ejemplo de contenido CSV:**
```
phone|@valor1|@valor2
+51123123123|leonardo|12345
+51123123124|maria|12346
+51123123125|juan
+51123123126
```

**Límites:**
- Máximo 1,000,000 recipients en el archivo
- Tamaño de archivo recomendado: hasta 100MB
- Formatos soportados: `.csv` o `.txt`

**¿Cuándo usar este endpoint?**
- Usuario sube un archivo CSV pre-generado
- Usuario genera un CSV desde el frontend y lo sube
- Envíos de cualquier tamaño (hasta 1,000,000 recipients)
- Datos exportados desde Excel/Google Sheets
- Archivos generados por sistemas externos

### ¿Qué regresa el backend?

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Job creado y en proceso. Procesando X mensajes desde archivo 'nombre.csv'.",
  "job": {
    "id": "uuid-string",
    "status": "pending",
    "created_at": "2026-01-15T20:00:00Z",
    "updated_at": "2026-01-15T20:00:00Z",
    "message": "tu mensaje plantilla",
    "total_numbers": 1000,
    "devices_limit": 5,
    "progress": {
      "sent": 0,
      "failed": 0,
      "total": 1000,
      "percentage": 0.0
    },
    "results": {}
  }
}
```

**Importante:**
- El endpoint retorna **inmediatamente** con el ID del job
- El procesamiento ocurre en **segundo plano**
- Para seguir el progreso, debes conectarte al **WebSocket** usando el `job.id`

**Errores posibles:**
- `400`: Archivo vacío, formato inválido, o encoding incorrecto
- `413`: Archivo con demasiados recipients
- `400`: No hay devices disponibles

---

## 📊 Endpoint: GET /jobs

### ¿Qué espera el backend?

**Request:**
- Método: GET
- Sin parámetros
- Sin body

### ¿Qué regresa el backend?

**Response (200 OK):**
```json
[
  {
    "id": "uuid-1",
    "status": "completed",
    "created_at": "2026-01-15T20:00:00Z",
    "progress": {
      "sent": 1000,
      "failed": 0,
      "total": 1000,
      "percentage": 100.0
    }
  },
  {
    "id": "uuid-2",
    "status": "processing",
    "created_at": "2026-01-15T20:05:00Z",
    "progress": {
      "sent": 500,
      "failed": 2,
      "total": 1000,
      "percentage": 50.2
    }
  }
]
```

**Estados posibles:**
- `pending`: Job creado, esperando procesamiento
- `processing`: En proceso
- `completed`: Completado exitosamente
- `failed`: Falló
- `cancelled`: Cancelado

---

## 🔍 Endpoint: GET /jobs/{job_id}

### ¿Qué espera el backend?

**Request:**
- Método: GET
- Parámetro de ruta: `job_id` (UUID del job)

### ¿Qué regresa el backend?

**Response (200 OK):**
- Mismo formato que un elemento del array de `/jobs`
- Incluye información completa del job

**Errores:**
- `404`: Job no encontrado

---

## 🔌 WebSocket: /ws/job/{job_id}

### ¿Cómo funciona?

**Conexión:**
1. Conecta al WebSocket usando: `wss://tu-api.com/ws/job/{job_id}`
2. El backend automáticamente te suscribe a las actualizaciones de ese job
3. Mantén la conexión abierta para recibir eventos en tiempo real

**Eventos que recibirás:**

**1. Evento: `subscribed`**
```json
{
  "type": "subscribed",
  "job_id": "uuid",
  "message": "Suscrito a las actualizaciones del job uuid"
}
```

**2. Evento: `job_started`**
```json
{
  "type": "job_started",
  "job_id": "uuid",
  "message": "Iniciando envío masivo de 1000 mensajes"
}
```

**3. Evento: `chunk_processing`**
```json
{
  "type": "chunk_processing",
  "job_id": "uuid",
  "chunk_start": 0,
  "chunk_end": 1000,
  "total": 5000,
  "message": "Procesando chunk 0-1000 de 5000"
}
```

**4. Evento: `progress`**
```json
{
  "type": "progress",
  "job_id": "uuid",
  "device_id": 1,
  "phone": "+51123123123",
  "status": "sent",
  "progress": {
    "sent": 500,
    "failed": 2,
    "total": 1000,
    "percentage": 50.2
  }
}
```

**5. Evento: `error`**
```json
{
  "type": "error",
  "job_id": "uuid",
  "device_id": 1,
  "phone": "+51123123124",
  "error": "ConnectTimeout",
  "progress": {
    "sent": 500,
    "failed": 3,
    "total": 1000,
    "percentage": 50.3
  }
}
```

**6. Evento: `job_completed`**
```json
{
  "type": "job_completed",
  "job_id": "uuid",
  "status": "completed",
  "results": {
    "sent": 998,
    "failed": 2,
    "total": 1000
  }
}
```

**7. Evento: `job_failed`**
```json
{
  "type": "job_failed",
  "job_id": "uuid",
  "error": "No hay devices disponibles",
  "message": "Descripción del error"
}
```

**Mantener conexión viva:**
- Puedes enviar mensajes `ping` periódicamente
- El backend responderá con `pong`
- Formato: `{"type": "ping", "timestamp": "..."}`

---

## 🎨 Cómo Implementar en el Frontend

### 1. Preparar el archivo CSV

**Técnicamente:**
- Toma tu lista de contactos con sus datos
- Genera un archivo CSV con formato: `telefono|valor1|valor2|valor3...`
- Separador: `|` (pipe)
- Primera columna: número de teléfono
- Siguientes columnas: valores para `@valor1`, `@valor2`, etc.
- Encoding: UTF-8

**Ejemplo de transformación:**
```
Contactos:
[
  {phone: "+51123123123", nombre: "leonardo", pedido: "12345"},
  {phone: "+51123123124", nombre: "maria", pedido: "12346"}
]

Generar CSV:
phone|@valor1|@valor2
+51123123123|leonardo|12345
+51123123124|maria|12346
```

**Preparar el mensaje:**
- Mensaje plantilla con variables: `"Hola @valor1, tu pedido @valor2 ha sido procesado"`
- El backend reemplazará automáticamente `@valor1`, `@valor2`, etc. con los valores del CSV
- Si falta un valor, el backend usa `"---"`

### 2. Generar CSV desde JavaScript (si es necesario)

**Técnicamente:**
- Puedes generar el CSV desde JavaScript usando `Blob` y `URL.createObjectURL`
- Formato: Cada línea = `telefono|valor1|valor2|valor3...`
- Puedes incluir header opcional: `phone|@valor1|@valor2` (el backend lo ignora)
- Convierte el Blob a File para enviarlo

### 3. Enviar request a /send-bulk-file

**Técnicamente:**
- Usa `FormData` para crear el request
- Agrega el archivo: `formData.append('file', fileBlob)`
- Agrega el mensaje: `formData.append('message', messageString)`
- Agrega devices_limit: `formData.append('devices_limit', '5')`
- Envía con POST usando `fetch` o `axios`
- **NO incluyas Content-Type header**, el navegador lo hace automáticamente
- Captura el `job.id` de la respuesta

**Manejo de errores:**
- Si recibes 400: Archivo vacío o formato inválido, verifica el CSV
- Si recibes 413: Archivo con demasiados recipients
- Si recibes 400: No hay devices disponibles

### 4. Conectar WebSocket

**Técnicamente:**
- Crea una conexión WebSocket usando el `job.id`
- URL: `wss://tu-api.com/ws/job/{job_id}`
- Escucha eventos `message`
- Parsea el JSON recibido
- Actualiza la UI según el tipo de evento

**Actualización de UI:**
- `progress`: Actualiza contadores (enviados, fallidos, porcentaje)
- `chunk_processing`: Muestra qué chunk se está procesando
- `job_completed`: Muestra resultados finales
- `job_failed`: Muestra error y permite reintentar

---

## 🔄 Flujo Completo de Implementación

### Paso 1: Preparación
1. Usuario ingresa mensaje plantilla con variables (`@valor1`, `@valor2`, etc.)
2. Usuario selecciona/ingresa lista de contactos con sus datos
3. Frontend genera archivo CSV con formato: `telefono|valor1|valor2|valor3...`
   - Opción A: Usuario sube archivo CSV pre-generado
   - Opción B: Frontend genera CSV desde datos ingresados

### Paso 2: Envío
1. Frontend hace POST a `/send-bulk-file` con archivo CSV + mensaje
2. Backend retorna inmediatamente con `job.id`
3. Frontend muestra "Procesando..." y guarda el `job.id`

### Paso 3: Monitoreo
1. Frontend conecta WebSocket a `/ws/job/{job_id}`
2. Recibe eventos de progreso en tiempo real
3. Actualiza UI con:
   - Contador de enviados/fallidos
   - Porcentaje de progreso
   - Estado actual (procesando chunk X de Y)
   - Errores individuales si los hay

### Paso 4: Finalización
1. Recibe evento `job_completed` o `job_failed`
2. Muestra resultados finales
3. Permite ver detalles o reintentar si falló

---

## 📋 Consideraciones Técnicas

### Límites y Optimizaciones

**Para payloads grandes:**
- El endpoint procesa eficientemente cualquier tamaño (hasta 1,000,000 recipients)
- Procesa en chunks de 1,000 con workers paralelos
- El procesamiento es asíncrono, no bloquea
- Optimizado para memoria: lee y procesa el archivo por chunks

**Manejo de memoria:**
- El formato compacto reduce significativamente el tamaño del JSON
- Para 10,000 recipients: ~500KB vs ~2MB con formato objeto
- El backend procesa en chunks para no sobrecargar memoria

**WebSocket:**
- Mantén una conexión por job activo
- Implementa reconexión automática si se cae
- Envía pings periódicos para mantener la conexión viva
- Maneja desconexiones gracefully

### Personalización de Mensajes

**Variables disponibles:**
- `@valor1`, `@valor2`, `@valor3`, etc. (ilimitadas)
- El backend reemplaza automáticamente
- Si falta un valor, usa `"---"`

**Ejemplo de mensaje:**
```
"Hola @valor1, tu pedido @valor2 ha sido procesado. Gracias @valor1!"
```

Con recipient: `"+51123123123|leonardo|12345"`

Resultado: `"Hola leonardo, tu pedido 12345 ha sido procesado. Gracias leonardo!"`

### Estados del Job

**Estados posibles:**
- `pending`: Creado, esperando procesamiento
- `processing`: En proceso (recibiendo actualizaciones)
- `completed`: Completado (todos los mensajes procesados)
- `failed`: Falló (error crítico)
- `cancelled`: Cancelado (no implementado aún)

**Transiciones:**
```
pending → processing → completed
pending → processing → failed
```

---

## 🎯 Resumen para el Frontend

**Lo que necesitas hacer:**

1. **Preparar CSV**: Generar o cargar archivo CSV con formato `telefono|valor1|valor2|valor3...`
2. **Enviar request**: POST a `/send-bulk-file` con archivo CSV + mensaje plantilla
3. **Conectar WebSocket**: Usar el `job.id` para recibir actualizaciones
4. **Actualizar UI**: Mostrar progreso en tiempo real
5. **Manejar finalización**: Mostrar resultados o errores

**Lo que el backend hace:**

1. **Valida** el request
2. **Crea** un job y retorna inmediatamente
3. **Procesa** en segundo plano usando workers paralelos
4. **Divide** en chunks de 1,000 para optimizar memoria
5. **Notifica** progreso vía WebSocket en tiempo real
6. **Actualiza** el estado del job cuando termina

**Ventajas del sistema:**

- ✅ No bloquea: El request retorna inmediatamente
- ✅ Escalable: Procesa miles de mensajes eficientemente
- ✅ Tiempo real: Actualizaciones instantáneas vía WebSocket
- ✅ Personalizado: Cada mensaje puede tener sus propios valores
- ✅ Optimizado: Formato compacto reduce tamaño del payload
- ✅ Robusto: Manejo de errores y reintentos automáticos

---

## 🚀 Ejemplo de Flujo Completo

1. Usuario ingresa: "Hola @valor1, tu pedido @valor2"
2. Usuario tiene 3 contactos con nombre y pedido
3. Frontend genera CSV:
   ```
   phone|@valor1|@valor2
   +51123123123|leonardo|12345
   +51123123124|maria|12346
   +51123123125|juan|12347
   ```
4. Frontend crea FormData y agrega:
   - `file`: Archivo CSV generado
   - `message`: "Hola @valor1, tu pedido @valor2"
   - `devices_limit`: 5
5. Frontend envía POST a `/send-bulk-file`
6. Backend retorna: `{job: {id: "abc-123", status: "pending"}}`
7. Frontend conecta WebSocket a `/ws/job/abc-123`
8. Recibe eventos: `job_started` → `progress` (x3) → `job_completed`
9. Frontend muestra: "3 mensajes enviados exitosamente"

---

## 📝 Notas Finales

### Sobre el Endpoint

**Endpoint único:** `/send-bulk-file`

- ✅ Funciona para cualquier tamaño de envío (hasta 1,000,000 recipients)
- ✅ Usuario puede subir archivo CSV pre-generado
- ✅ Frontend puede generar CSV desde datos ingresados y enviarlo
- ✅ Formato: Archivo CSV + mensaje en FormData
- ✅ Procesa en chunks de 1,000 con workers paralelos
- ✅ Retorna inmediatamente con job.id
- ✅ Usa WebSocket para progreso en tiempo real
- ✅ Personaliza mensajes con variables `@valor1`, `@valor2`, etc.

**Ventajas:**
- Más eficiente en memoria para grandes volúmenes
- Flexible: acepta archivos pre-generados o generados dinámicamente
- Escalable: puede manejar cientos de miles de mensajes

### Otras Consideraciones

- El backend procesa **asíncronamente**, no esperes resultados en el response inicial
- Usa **WebSocket** para seguimiento en tiempo real, no polling
- El formato CSV con separador `|` es **más eficiente** que objetos JSON para grandes volúmenes
- Los mensajes se **personalizan automáticamente** según los valores del CSV
- Si falta un valor en el CSV, se usa `"---"` automáticamente
- El sistema es **escalable** y puede manejar cientos de miles de mensajes
- Puedes generar el CSV desde JavaScript usando `Blob` si el usuario ingresa datos en el frontend