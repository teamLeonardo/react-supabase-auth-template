import { type JobProgress } from './messageService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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

  constructor(jobId: string, callbacks: JobTrackerCallbacks = {}) {
    this.jobId = jobId;
    this.callbacks = callbacks;
  }

  connect(): void {
    try {
      // WebSocket específico para el job
      const wsUrl = `${WS_BASE_URL}/ws/job/${this.jobId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado para job:', this.jobId);
        this.reconnectAttempts = 0;
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
        if (this.callbacks.onError) {
          this.callbacks.onError({ error: 'Error de conexión WebSocket' });
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        this.stopHeartbeat();
        
        // Intentar reconectar si no fue un cierre intencional
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
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
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Desconexión normal');
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
