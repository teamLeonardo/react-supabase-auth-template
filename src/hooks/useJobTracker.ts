import { useState, useEffect, useRef } from 'react';
import { JobTracker, type JobTrackerCallbacks } from '../services/websocketService';
import { type JobProgress } from '../services/messageService';

export interface JobLog {
  type: 'info' | 'error' | 'success';
  message: string;
  timestamp: Date;
  phone?: string;
}

export interface UseJobTrackerReturn {
  progress: JobProgress;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  logs: JobLog[];
  isConnected: boolean;
}

export function useJobTracker(jobId: string | null): UseJobTrackerReturn {
  const [progress, setProgress] = useState<JobProgress>({
    sent: 0,
    failed: 0,
    total: 0,
    percentage: 0,
  });
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const trackerRef = useRef<JobTracker | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const callbacks: JobTrackerCallbacks = {
      onConnected: () => {
        setIsConnected(true);
        setLogs((prev) => [
          ...prev,
          {
            type: 'info',
            message: 'Conectado al servidor',
            timestamp: new Date(),
          },
        ]);
      },
      onStarted: () => {
        setStatus('processing');
        setLogs((prev) => [
          ...prev,
          {
            type: 'info',
            message: 'Iniciando envío masivo...',
            timestamp: new Date(),
          },
        ]);
      },
      onProgress: (data) => {
        setProgress(data.progress);
        setLogs((prev) => [
          ...prev,
          {
            type: 'success',
            message: `Enviado a ${data.phone} (${data.progress.sent}/${data.progress.total})`,
            timestamp: new Date(),
            phone: data.phone,
          },
        ]);
      },
      onError: (error) => {
        if ('phone' in error && error.phone) {
          setProgress((prev) => error.progress || prev);
          setLogs((prev) => [
            ...prev,
            {
              type: 'error',
              message: `Error en ${error.phone}: ${error.error}`,
              timestamp: new Date(),
              phone: error.phone,
            },
          ]);
        } else {
          setStatus('failed');
          setLogs((prev) => [
            ...prev,
            {
              type: 'error',
              message: error.error || 'Error desconocido',
              timestamp: new Date(),
            },
          ]);
        }
      },
      onComplete: (results) => {
        setStatus('completed');
        setProgress({
          sent: results.sent,
          failed: results.failed,
          total: results.total,
          percentage: 100,
        });
        setLogs((prev) => [
          ...prev,
          {
            type: 'success',
            message: `✅ Envío completado! Enviados: ${results.sent}, Fallidos: ${results.failed}`,
            timestamp: new Date(),
          },
        ]);
      },
    };

    const tracker = new JobTracker(jobId, callbacks);
    trackerRef.current = tracker;
    tracker.connect();

    return () => {
      tracker.disconnect();
      trackerRef.current = null;
    };
  }, [jobId]);

  return { progress, status, logs, isConnected };
}
