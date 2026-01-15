# Guía de Implementación: Jobs en Segundo Plano con WebSockets

## 📋 Descripción General

Este documento explica cómo implementar la funcionalidad de **envío masivo de mensajes en segundo plano** con **notificaciones en tiempo real** mediante WebSockets.

### Características Principales

- ✅ **Registro inmediato**: Los envíos se registran instantáneamente en JSON
- ✅ **Procesamiento asíncrono**: El envío se ejecuta en segundo plano
- ✅ **Notificaciones en tiempo real**: Progreso vía WebSocket
- ✅ **Persistencia**: Todos los jobs se guardan en `data/jobs.json`
- ✅ **Tracking completo**: Estado, progreso y resultados de cada job

---

## 🔄 Flujo de Trabajo

```
1. Usuario crea envío
   ↓
2. POST /messages/send-bulk
   ↓
3. Se crea job en JSON (status: pending)
   ↓
4. Retorna job_id inmediatamente
   ↓
5. Frontend conecta WebSocket
   ↓
6. Proceso en background inicia
   ↓
7. WebSocket emite progreso en tiempo real
   ↓
8. Job se actualiza en JSON
   ↓
9. Job completa (status: completed/failed)
```

---

## 🚀 Implementación Paso a Paso

### Paso 1: Crear el Envío (POST Request)

Cuando el usuario completa el formulario y hace clic en "Enviar", realiza una petición POST:

```javascript
async function createBulkSend(messageData) {
  try {
    const response = await fetch('http://localhost:8000/messages/send-bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: messageData.message,
        phones: messageData.phones,  // Array de números
        devices_limit: messageData.devices_limit || 5
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear el envío');
    }

    const result = await response.json();
    return result.job;  // Retorna el job con su ID
  } catch (error) {
    console.error('Error al crear envío:', error);
    throw error;
  }
}
```

**Respuesta esperada:**
```json
{
  "status": "success",
  "message": "Job creado y en proceso. Usa WebSocket para seguir el progreso.",
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00",
    "total_numbers": 100,
    "progress": {
      "sent": 0,
      "failed": 0,
      "total": 100,
      "percentage": 0.0
    }
  }
}
```

---

### Paso 2: Conectar WebSocket para Seguimiento

Inmediatamente después de crear el job, conecta el WebSocket para recibir actualizaciones:

```javascript
class JobTracker {
  constructor(jobId) {
    this.jobId = jobId;
    this.ws = null;
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  connect() {
    // Opción 1: WebSocket específico para el job
    this.ws = new WebSocket(`ws://localhost:8000/ws/job/${this.jobId}`);
    
    // Opción 2: WebSocket general (necesitas suscribirte)
    // this.ws = new WebSocket('ws://localhost:8000/ws');

    this.ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      
      // Si usas WebSocket general, suscríbete al job
      if (this.ws.url.includes('/ws')) {
        this.ws.send(JSON.stringify({
          type: 'subscribe_job',
          job_id: this.jobId
        }));
      }
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('❌ Error en WebSocket:', error);
      if (this.onError) this.onError(error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket desconectado');
    };
  }

  handleMessage(data) {
    switch(data.type) {
      case 'connected':
        console.log('Conectado:', data.message);
        break;

      case 'job_started':
        console.log('🚀 Job iniciado:', data.job_id);
        this.updateUI('Iniciando envío...');
        break;

      case 'progress':
        // Actualización de progreso
        if (this.onProgress) {
          this.onProgress({
            phone: data.phone,
            status: data.status,
            progress: data.progress,
            deviceId: data.device_id
          });
        }
        break;

      case 'error':
        // Error en un mensaje específico
        console.error('❌ Error:', data.phone, data.error);
        if (this.onError) {
          this.onError({
            phone: data.phone,
            error: data.error,
            progress: data.progress
          });
        }
        break;

      case 'job_completed':
        console.log('✅ Job completado:', data.results);
        if (this.onComplete) {
          this.onComplete(data.results);
        }
        this.disconnect();
        break;

      case 'job_failed':
        console.error('❌ Job fallido:', data.error);
        if (this.onError) {
          this.onError({ error: data.error, message: data.message });
        }
        this.disconnect();
        break;

      case 'pong':
        // Mantener conexión viva
        break;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Mantener conexión viva
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // Cada 30 segundos
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}
```

---

### Paso 3: Integración Completa en el Componente

Ejemplo completo de implementación en React/Vue/vanilla JS:

```javascript
class BulkSendManager {
  constructor() {
    this.currentTracker = null;
  }

  async sendBulkMessages(messageData) {
    try {
      // 1. Crear el job
      const job = await createBulkSend(messageData);
      const jobId = job.id;

      // 2. Mostrar UI de progreso
      this.showProgressUI(job);

      // 3. Conectar WebSocket
      const tracker = new JobTracker(jobId);
      
      tracker.onProgress = (data) => {
        this.updateProgressBar(data.progress.percentage);
        this.addLogEntry(`✅ Enviado a ${data.phone} (${data.progress.sent}/${data.progress.total})`);
      };

      tracker.onComplete = (results) => {
        this.showSuccessMessage(results);
        this.hideProgressUI();
      };

      tracker.onError = (error) => {
        if (error.phone) {
          this.addLogEntry(`❌ Error en ${error.phone}: ${error.error}`, 'error');
        } else {
          this.showErrorMessage(error.error || error.message);
        }
      };

      tracker.connect();
      tracker.startHeartbeat();
      
      this.currentTracker = tracker;

      return jobId;
    } catch (error) {
      console.error('Error:', error);
      this.showErrorMessage(error.message);
      throw error;
    }
  }

  showProgressUI(job) {
    // Mostrar modal o sección de progreso
    // Inicializar barra de progreso en 0%
    // Mostrar lista de logs
  }

  updateProgressBar(percentage) {
    // Actualizar barra de progreso
    document.getElementById('progress-bar').style.width = `${percentage}%`;
    document.getElementById('progress-text').textContent = `${percentage.toFixed(1)}%`;
  }

  addLogEntry(message, type = 'info') {
    // Agregar entrada al log
    const logContainer = document.getElementById('log-container');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  showSuccessMessage(results) {
    alert(`✅ Envío completado!\nEnviados: ${results.sent}\nFallidos: ${results.failed}`);
  }

  showErrorMessage(message) {
    alert(`❌ Error: ${message}`);
  }

  hideProgressUI() {
    // Ocultar modal o sección de progreso
  }

  cancel() {
    if (this.currentTracker) {
      this.currentTracker.disconnect();
      this.currentTracker.stopHeartbeat();
    }
  }
}
```

---

## 📡 Eventos WebSocket

### Tipos de Eventos

#### 1. `job_created`
Emitido cuando se crea un nuevo job.

```json
{
  "type": "job_created",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Nuevo job creado: 550e8400..."
}
```

#### 2. `job_started`
Emitido cuando el procesamiento inicia.

```json
{
  "type": "job_started",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Iniciando envío masivo"
}
```

#### 3. `progress`
Emitido cada vez que se envía un mensaje exitosamente.

```json
{
  "type": "progress",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_id": 1,
  "phone": "6281223641234",
  "status": "sent",
  "progress": {
    "sent": 25,
    "failed": 0,
    "total": 100,
    "percentage": 25.0
  }
}
```

#### 4. `error`
Emitido cuando falla el envío de un mensaje específico.

```json
{
  "type": "error",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_id": 1,
  "phone": "6281223645678",
  "error": "Connection timeout",
  "progress": {
    "sent": 25,
    "failed": 1,
    "total": 100,
    "percentage": 26.0
  }
}
```

#### 5. `job_completed`
Emitido cuando el job se completa exitosamente.

```json
{
  "type": "job_completed",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "results": {
    "sent": 98,
    "failed": 2,
    "total": 100,
    "devices_used": 5,
    "parallel_workers": 5
  }
}
```

#### 6. `job_failed`
Emitido cuando el job falla completamente.

```json
{
  "type": "job_failed",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "error": "No se pudo conectar con el servidor de Wablas",
  "message": "Connection timeout"
}
```

---

## 🎨 Ejemplo de UI/UX

### Componente de Progreso

```html
<!-- Modal o sección de progreso -->
<div id="progress-modal" class="modal">
  <div class="modal-content">
    <h2>Enviando Mensajes</h2>
    
    <!-- Barra de progreso -->
    <div class="progress-container">
      <div class="progress-bar">
        <div id="progress-bar-fill" class="progress-fill" style="width: 0%"></div>
      </div>
      <div id="progress-text" class="progress-text">0%</div>
    </div>

    <!-- Estadísticas -->
    <div class="stats">
      <div class="stat">
        <span class="stat-label">Enviados:</span>
        <span id="stat-sent" class="stat-value">0</span>
      </div>
      <div class="stat">
        <span class="stat-label">Fallidos:</span>
        <span id="stat-failed" class="stat-value">0</span>
      </div>
      <div class="stat">
        <span class="stat-label">Total:</span>
        <span id="stat-total" class="stat-value">0</span>
      </div>
    </div>

    <!-- Log de eventos -->
    <div id="log-container" class="log-container">
      <!-- Los logs se agregan aquí dinámicamente -->
    </div>

    <!-- Botón cancelar (opcional) -->
    <button id="cancel-btn" class="btn-cancel">Cancelar</button>
  </div>
</div>
```

### Estilos CSS (Ejemplo)

```css
.progress-container {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 30px;
  background-color: #e0e0e0;
  border-radius: 15px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
  color: #333;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  background-color: #f9f9f9;
}

.log-entry {
  padding: 5px;
  margin: 2px 0;
  font-size: 12px;
  font-family: monospace;
}

.log-info {
  color: #333;
}

.log-error {
  color: #d32f2f;
  background-color: #ffebee;
}
```

---

## 🔍 Consultar Estado de Jobs

### Listar Todos los Jobs

```javascript
async function getAllJobs(limit = null) {
  try {
    const url = limit 
      ? `http://localhost:8000/jobs?limit=${limit}`
      : 'http://localhost:8000/jobs';
    
    const response = await fetch(url);
    const jobs = await response.json();
    return jobs;
  } catch (error) {
    console.error('Error al obtener jobs:', error);
    throw error;
  }
}
```

### Obtener Job Específico

```javascript
async function getJob(jobId) {
  try {
    const response = await fetch(`http://localhost:8000/jobs/${jobId}`);
    
    if (!response.ok) {
      throw new Error('Job no encontrado');
    }
    
    const job = await response.json();
    return job;
  } catch (error) {
    console.error('Error al obtener job:', error);
    throw error;
  }
}
```

---

## 📊 Ejemplo Completo: React Hook

```javascript
import { useState, useEffect, useRef } from 'react';

function useJobTracker(jobId) {
  const [progress, setProgress] = useState({
    sent: 0,
    failed: 0,
    total: 0,
    percentage: 0
  });
  const [status, setStatus] = useState('pending');
  const [logs, setLogs] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    // Conectar WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/job/${jobId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket conectado');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch(data.type) {
        case 'progress':
          setProgress(data.progress);
          setLogs(prev => [...prev, {
            type: 'info',
            message: `Enviado a ${data.phone}`,
            timestamp: new Date()
          }]);
          break;

        case 'error':
          setProgress(data.progress);
          setLogs(prev => [...prev, {
            type: 'error',
            message: `Error en ${data.phone}: ${data.error}`,
            timestamp: new Date()
          }]);
          break;

        case 'job_started':
          setStatus('processing');
          break;

        case 'job_completed':
          setStatus('completed');
          setProgress(data.results);
          break;

        case 'job_failed':
          setStatus('failed');
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket desconectado');
    };

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [jobId]);

  return { progress, status, logs };
}

// Uso del hook
function BulkSendComponent() {
  const [jobId, setJobId] = useState(null);
  const { progress, status, logs } = useJobTracker(jobId);

  const handleSend = async () => {
    const job = await createBulkSend({
      message: "Hola!",
      phones: ["6281223641234", "6281223645678"],
      devices_limit: 5
    });
    
    setJobId(job.id);
  };

  return (
    <div>
      <button onClick={handleSend}>Enviar</button>
      
      {jobId && (
        <div>
          <h3>Progreso: {progress.percentage}%</h3>
          <div>
            Enviados: {progress.sent} | 
            Fallidos: {progress.failed} | 
            Total: {progress.total}
          </div>
          <div>
            {logs.map((log, i) => (
              <div key={i} className={log.type}>
                {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Mejores Prácticas

### 1. Manejo de Reconexión

```javascript
class RobustJobTracker extends JobTracker {
  constructor(jobId) {
    super(jobId);
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    super.connect();
    
    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
      } else {
        console.error('No se pudo reconectar después de múltiples intentos');
      }
    };
  }
}
```

### 2. Polling como Fallback

Si WebSocket falla, puedes usar polling para obtener el estado:

```javascript
async function pollJobStatus(jobId, onUpdate, interval = 2000) {
  const pollInterval = setInterval(async () => {
    try {
      const job = await getJob(jobId);
      onUpdate(job);
      
      // Detener polling si el job está completo
      if (job.status === 'completed' || job.status === 'failed') {
        clearInterval(pollInterval);
      }
    } catch (error) {
      console.error('Error en polling:', error);
    }
  }, interval);

  return pollInterval;
}
```

### 3. Limpieza de Recursos

```javascript
// Siempre desconectar y limpiar cuando el componente se desmonte
useEffect(() => {
  return () => {
    if (tracker) {
      tracker.disconnect();
      tracker.stopHeartbeat();
    }
  };
}, []);
```

---

## 🐛 Manejo de Errores

### Errores Comunes

1. **WebSocket no se conecta**
   - Verificar que el servidor esté corriendo
   - Verificar CORS configurado
   - Verificar URL correcta

2. **No se reciben eventos**
   - Verificar que el job_id sea correcto
   - Verificar que el job esté en estado `processing`
   - Verificar logs del servidor

3. **Conexión se cierra inesperadamente**
   - Implementar reconexión automática
   - Usar heartbeat para mantener conexión viva

### Debugging

```javascript
// Habilitar logs detallados
const DEBUG = true;

if (DEBUG) {
  ws.onopen = () => console.log('[WS] Conectado');
  ws.onmessage = (event) => {
    console.log('[WS] Mensaje recibido:', JSON.parse(event.data));
  };
  ws.onerror = (error) => console.error('[WS] Error:', error);
  ws.onclose = (event) => console.log('[WS] Desconectado:', event.code, event.reason);
}
```

---

## 📝 Resumen de Endpoints

### REST API

- `POST /messages/send-bulk` - Crear job de envío
- `GET /jobs` - Listar todos los jobs
- `GET /jobs/{job_id}` - Obtener job específico

### WebSocket

- `ws://localhost:8000/ws` - WebSocket general
- `ws://localhost:8000/ws/job/{job_id}` - WebSocket específico para job

---

## ✅ Checklist de Implementación

- [ ] Crear función para enviar request POST
- [ ] Manejar respuesta y extraer job_id
- [ ] Implementar conexión WebSocket
- [ ] Manejar eventos de progreso
- [ ] Actualizar UI con progreso en tiempo real
- [ ] Mostrar logs de eventos
- [ ] Manejar errores y reconexión
- [ ] Limpiar recursos al desmontar
- [ ] Implementar polling como fallback (opcional)
- [ ] Agregar indicadores visuales (loading, success, error)

---

**Última actualización:** 2024
**Versión:** 1.0.0
