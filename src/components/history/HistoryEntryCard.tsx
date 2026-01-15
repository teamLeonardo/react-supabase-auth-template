import { type HistoryEntry } from '../../stores/history.store';
import { useHistoryStore } from '../../stores/history.store';
import { useUIStore } from '../../stores/ui.store';

interface HistoryEntryCardProps {
  entry: HistoryEntry;
  onLoadInForm: (entry: HistoryEntry) => void;
}

const HistoryEntryCard = ({ entry, onLoadInForm }: HistoryEntryCardProps) => {
  const { deleteEntry, pauseEntry, resumeEntry } = useHistoryStore();
  const { openJobProgressModal } = useUIStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + ' - ' + date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const getStatusColor = () => {
    switch (entry.status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'processing':
        return 'text-blue-400';
      case 'paused':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (entry.status) {
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      case 'processing':
        return 'En proceso';
      case 'paused':
        return 'Pausado';
      default:
        return 'Pendiente';
    }
  };

  const handleDetail = () => {
    // Mock: Mostrar detalles del job si existe
    if (entry.jobId) {
      openJobProgressModal(entry.jobId);
    } else {
      alert(`Detalles del envío:\n\nMensaje: ${entry.message}\nDestinatarios: ${entry.phones.length}\nEstado: ${getStatusText()}`);
    }
  };

  const handlePause = () => {
    pauseEntry(entry.id);
    alert('Envío pausado (funcionalidad mock)');
  };

  const handleResume = () => {
    resumeEntry(entry.id);
    alert('Envío reanudado (funcionalidad mock)');
  };

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de eliminar este envío del historial?')) {
      deleteEntry(entry.id);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">{formatDate(entry.createdAt)}</div>
          <div className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition"
          title="Eliminar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Message */}
      <div className="mb-3">
        <span className="font-semibold text-white">Mensaje - </span>
        <span className="text-gray-300">{truncateMessage(entry.message)}</span>
      </div>

      {/* Recipients */}
      <div className="mb-4">
        <span className="font-semibold text-white">Destinatarios - </span>
        <span className="text-gray-300">
          {entry.phones.length} {entry.phones.length === 1 ? 'número' : 'números'}: {entry.phones.slice(0, 2).join(', ')}
          {entry.phones.length > 2 && `, +${entry.phones.length - 2} más`}
        </span>
      </div>

      {/* Results (if completed) */}
      {entry.status === 'completed' && entry.results && (
        <div className="mb-4 p-3 bg-gray-700/50 rounded text-sm">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-gray-400">Enviados:</span>
              <span className="ml-2 text-green-400 font-semibold">{entry.results.sent}</span>
            </div>
            <div>
              <span className="text-gray-400">Fallidos:</span>
              <span className="ml-2 text-red-400 font-semibold">{entry.results.failed}</span>
            </div>
            <div>
              <span className="text-gray-400">Total:</span>
              <span className="ml-2 text-white font-semibold">{entry.results.total}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleDetail}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded border border-green-600/30 transition"
        >
          Detalle
        </button>
        {entry.status === 'processing' && (
          <button
            onClick={handlePause}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded border border-green-600/30 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
            Pausar
          </button>
        )}
        {entry.status === 'paused' && (
          <button
            onClick={handleResume}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded border border-green-600/30 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Reanudar
          </button>
        )}
        <button
          onClick={() => onLoadInForm(entry)}
          className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-sm rounded border border-green-600 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Cargar en formulario
        </button>
      </div>
    </div>
  );
};

export default HistoryEntryCard;
