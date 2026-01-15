import { type JobProgress, type JobLog } from '../hooks/useJobTracker';

interface JobProgressModalProps {
  isOpen: boolean;
  progress: JobProgress;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  logs: JobLog[];
  isConnected: boolean;
  onClose: () => void;
}

const JobProgressModal = ({
  isOpen,
  progress,
  status,
  logs,
  isConnected,
  onClose,
}: JobProgressModalProps) => {
  if (!isOpen) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'processing':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      case 'processing':
        return 'En proceso';
      default:
        return 'Pendiente';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col border-t-4 border-green-500">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Progreso del Envío</h2>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${getStatusColor()}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{isConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {status === 'completed' || status === 'failed' ? (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
              >
                Cerrar
              </button>
            ) : null}
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Barra de progreso */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-400">Progreso</span>
              <span className="text-sm font-bold">{progress.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-8 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${progress.percentage}%` }}
              >
                {progress.percentage > 5 && `${progress.percentage.toFixed(0)}%`}
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{progress.sent}</div>
              <div className="text-xs text-gray-400 mt-1">Enviados</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{progress.failed}</div>
              <div className="text-xs text-gray-400 mt-1">Fallidos</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{progress.total}</div>
              <div className="text-xs text-gray-400 mt-1">Total</div>
            </div>
          </div>

          {/* Log de eventos */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Log de Eventos</h3>
            <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Esperando eventos...</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`text-xs font-mono p-2 rounded ${
                        log.type === 'error'
                          ? 'bg-red-900/30 text-red-300'
                          : log.type === 'success'
                          ? 'bg-green-900/30 text-green-300'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      <span className="text-gray-500">
                        [{log.timestamp.toLocaleTimeString()}]
                      </span>{' '}
                      {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobProgressModal;
