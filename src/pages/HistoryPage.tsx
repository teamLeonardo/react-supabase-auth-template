import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useHistory } from '../hooks/useHistory';
import { useHistoryStore, type HistoryEntry } from '../stores/history.store';
import HistoryEntryCard from '../components/history/HistoryEntryCard';
import { useUIStore } from '../stores/ui.store';

const HistoryPage = () => {
  const { session } = useSession();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | HistoryEntry['status']>('all');
  const { clearHistory } = useHistoryStore();
  const { showNotification } = useUIStore();

  const { data: entries = [], isLoading } = useHistory(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );

  const handleLoadInForm = () => {
    // Guardar en store temporal para cargar en el formulario
    // Por ahora redirigimos y mostramos un mensaje
    navigate('/send-bulk');
    showNotification('info', 'Carga la entrada en el formulario (funcionalidad en desarrollo)');
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de limpiar todo el historial? Esta acción no se puede deshacer.')) {
      clearHistory();
      showNotification('success', 'Historial limpiado');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-white mb-4">Debes iniciar sesión para ver el historial</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Historial de Envíos</h1>
            <p className="text-gray-400">Revisa y gestiona tus envíos anteriores</p>
          </div>
          {entries.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition text-sm"
            >
              Limpiar Historial
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm text-gray-400">Filtrar por estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-green-500"
          >
            <option value="all">Todos</option>
            <option value="completed">Completados</option>
            <option value="failed">Fallidos</option>
            <option value="processing">En proceso</option>
            <option value="paused">Pausados</option>
            <option value="pending">Pendientes</option>
          </select>
          <span className="text-sm text-gray-400">
            {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
          </span>
        </div>

        {/* History list */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Cargando historial...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400 text-lg mb-2">No hay envíos en el historial</p>
            <p className="text-gray-500 text-sm">Los envíos que realices aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <HistoryEntryCard
                key={entry.id}
                entry={entry}
                onLoadInForm={handleLoadInForm}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
