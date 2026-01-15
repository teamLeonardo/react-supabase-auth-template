import { useUIStore } from "../../stores/ui.store";
import { useJobTracker } from "../../hooks/useJobTracker";

export const ContentSendMessage = () => {
  const { currentJobId, closeJobProgressModal } = useUIStore();
  const { progress, status, logs, isConnected } = useJobTracker(currentJobId);

  // No mostrar si no hay job activo
  if (!currentJobId) {
    return null;
  }

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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-white">Envío en Progreso</h3>
              <div className={`flex items-center gap-2 ${getStatusColor()}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">{isConnected ? 'Conectado' : 'Desconectado'}</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <button
              onClick={closeJobProgressModal}
              className="text-gray-400 hover:text-white transition"
              title="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">Progreso</span>
              <span className="text-xs font-bold">{progress.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-green-600 to-green-400 transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Estadísticas */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Enviados:</span>
              <span className="text-green-400 font-semibold">{progress.sent}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Fallidos:</span>
              <span className="text-red-400 font-semibold">{progress.failed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Total:</span>
              <span className="text-white font-semibold">{progress.total}</span>
            </div>
            {logs.length > 0 && (
              <div className="ml-auto text-xs text-gray-500">
                {logs[logs.length - 1]?.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};