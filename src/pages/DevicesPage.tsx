import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { 
  getDevices, 
  deleteDevice, 
  type Device 
} from '../services/deviceService';
import DeviceModal from '../components/DeviceModal';

const DevicesPage = () => {
  const { session } = useSession();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<number | null>(null);

  useEffect(() => {
    if (session) {
      loadDevices();
    }
  }, [session]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDevices();
      setDevices(response.devices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar devices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDevice(null);
    setIsModalOpen(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setIsModalOpen(true);
  };

  const handleDelete = async (deviceId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este device? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeletingDeviceId(deviceId);
      await deleteDevice(deviceId);
      await loadDevices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar device');
    } finally {
      setDeletingDeviceId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
    loadDevices();
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-white mb-4">Debes iniciar sesión para ver los devices</p>
          <Link to="/auth/sign-in" className="text-green-400 hover:underline">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Gestión de Devices</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition font-semibold"
          >
            + Nuevo Device
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Cargando devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <p className="text-gray-400 mb-4">No hay devices configurados</p>
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded transition"
            >
              Agregar Primer Device
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      Token
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Secret
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {devices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-700/50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">{device.id}</td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {device.device_name || 'Sin nombre'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono hidden md:table-cell">
                        {device.token.substring(0, 20)}...
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                        {device.secret_masked}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            device.status === 'active'
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {device.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleEdit(device)}
                            className="text-blue-400 hover:text-blue-300 transition text-left sm:text-center"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(device.id)}
                            disabled={deletingDeviceId === device.id}
                            className="text-red-400 hover:text-red-300 transition disabled:opacity-50 text-left sm:text-center"
                          >
                            {deletingDeviceId === device.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isModalOpen && (
          <DeviceModal
            device={editingDevice}
            onClose={handleModalClose}
          />
        )}
      </div>
    </div>
  );
};

export default DevicesPage;
