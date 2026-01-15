import { type JobProgress } from './messageService';

// Obtener la URL base de la API (misma lógica que apiClient)
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  
  if (!envUrl) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ VITE_API_BASE_URL no está configurada, usando localhost:8000');
    }
    return 'http://localhost:8000';
  }
  
  // Si la URL ya empieza con http:// o https://, usar tal cual
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    return envUrl.replace(/\/+$/, '');
  }
  
  // Si no empieza con http/https, agregar https:// automáticamente
  console.warn('⚠️ VITE_API_BASE_URL no tiene protocolo. Agregando https:// automáticamente');
  const urlWithProtocol = `https://${envUrl}`;
  return urlWithProtocol.replace(/\/+$/, '');
};

const API_BASE_URL = getApiBaseUrl();
const WS_BASE_URL = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

export interface WebSocketEvent {
  type: string;
  job_id?: string;
  phone?: string;
  status?: string;
  error?: string;
  device_id?: number;
  progress?: JobProgress;
  results?: {
    sent: number;
    failed: number;
    total: number;
    devices_used?: number;
    parallel_workers?: number;
  };
  message?: string;
}

export interface JobTrackerCallbacks {
  onProgress?: (data: { phone: string; status: string; progress: JobProgress; deviceId?: number }) => void;
  onError?: (data: { phone?: string; error: string; progress?: JobProgress } | { error: string; message?: string }) => void;
  onComplete?: (results: { sent: number; failed: number; total: number; devices_used?: number; parallel_workers?: number }) => void;
  onStarted?: (jobId: string) => void;
  onConnected?: () => void;
}

export class JobTracker {
  private ws: WebSocket | null = null;
  private jobId: string;
  private callbacks: JobTrackerCallbacks;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isDisconnected = false;

  constructor(jobId: string, callbacks: JobTrackerCallbacks = {}) {
    this.jobId = jobId;
    this.callbacks = callbacks;
  }

  connect(): void {
    // Evitar múltiples conexiones simultáneas
    if (this.isConnecting || this.isDisconnected) {
      return;
    }

    // Si ya hay una conexión abierta, no reconectar
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    // Si ya se alcanzó el máximo de intentos, detener
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      this.isDisconnected = true;
      if (this.callbacks.onError) {
        this.callbacks.onError({ error: 'No se pudo conectar al WebSocket después de múltiples intentos' });
      }
      return;
    }

    try {
      this.isConnecting = true;
      
      // WebSocket específico para el job
      const wsUrl = `${WS_BASE_URL}/ws/job/${this.jobId}`;
      console.log(`🔌 Intentando conectar WebSocket: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado para job:', this.jobId);
        this.isConnecting = false;
        this.reconnectAttempts = 0; // Resetear contador al conectar exitosamente
        if (this.callbacks.onConnected) {
          this.callbacks.onConnected();
        }
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error al parsear mensaje WebSocket:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        this.isConnecting = false;
        // No llamar onError aquí porque onclose también se disparará
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        
        // Limpiar timeout anterior si existe
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        
        // Si fue un cierre intencional (código 1000), no reconectar
        if (event.code === 1000) {
          this.isDisconnected = true;
          return;
        }

        // Si el job ya está completado o fallido, no reconectar
        if (event.code === 1001 || event.code === 1006) {
          // Error 1006 = conexión cerrada anormalmente
          // Intentar reconectar solo si no hemos alcanzado el máximo
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(2000 * this.reconnectAttempts, 10000); // Máximo 10 segundos
            console.log(`Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts}) en ${delay}ms...`);
            
            this.reconnectTimeout = setTimeout(() => {
              if (!this.isDisconnected) {
                this.connect();
              }
            }, delay);
          } else {
            console.error('❌ Máximo de intentos de reconexión alcanzado');
            this.isDisconnected = true;
            if (this.callbacks.onError) {
              this.callbacks.onError({ error: 'No se pudo mantener la conexión WebSocket' });
            }
          }
        }
      };
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      this.isConnecting = false;
      if (this.callbacks.onError) {
        this.callbacks.onError({ error: 'No se pudo conectar al WebSocket' });
      }
    }
  }

  private handleMessage(data: WebSocketEvent): void {
    switch (data.type) {
      case 'connected':
        console.log('Conectado:', data.message);
        break;

      case 'job_started':
        console.log('🚀 Job iniciado:', data.job_id);
        if (data.job_id && this.callbacks.onStarted) {
          this.callbacks.onStarted(data.job_id);
        }
        break;

      case 'progress':
        if (data.phone && data.progress && this.callbacks.onProgress) {
          this.callbacks.onProgress({
            phone: data.phone,
            status: data.status || 'sent',
            progress: data.progress,
            deviceId: data.device_id,
          });
        }
        break;

      case 'error':
        console.error('❌ Error:', data.phone, data.error);
        if (this.callbacks.onError) {
          this.callbacks.onError({
            phone: data.phone,
            error: data.error || 'Error desconocido',
            progress: data.progress,
          });
        }
        break;

      case 'job_completed':
        console.log('✅ Job completado:', data.results);
        if (data.results && this.callbacks.onComplete) {
          this.callbacks.onComplete(data.results);
        }
        this.disconnect();
        break;

      case 'job_failed':
        console.error('❌ Job fallido:', data.error);
        if (this.callbacks.onError) {
          this.callbacks.onError({
            error: data.error || 'Error desconocido',
            message: data.message,
          });
        }
        this.disconnect();
        break;

      case 'pong':
        // Mantener conexión viva
        break;
    }
  }

  disconnect(): void {
    this.isDisconnected = true;
    this.isConnecting = false;
    this.stopHeartbeat();
    
    // Limpiar timeout de reconexión
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      // Solo cerrar si está abierto o conectando
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Desconexión normal');
      }
      this.ws = null;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now(),
        }));
      }
    }, 30000); // Cada 30 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
