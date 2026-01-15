import { useState, useEffect } from 'react';
import { createDevice, updateDevice, type Device, type DeviceCreate, type DeviceUpdate } from '../services/deviceService';

interface DeviceModalProps {
  device: Device | null;
  onClose: () => void;
}

const DeviceModal = ({ device, onClose }: DeviceModalProps) => {
  const [formData, setFormData] = useState({
    token: '',
    secret: '',
    device_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device) {
      setFormData({
        token: device.token,
        secret: '', // No mostramos el secret completo por seguridad
        device_name: device.device_name || '',
      });
    }
  }, [device]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.token || (!device && !formData.secret)) {
      setError('Token y Secret son requeridos');
      return;
    }

    try {
      setLoading(true);
      if (device) {
        // Actualizar
        const updateData: DeviceUpdate = {};
        if (formData.token !== device.token) updateData.token = formData.token;
        if (formData.secret) updateData.secret = formData.secret;
        if (formData.device_name !== device.device_name) {
          updateData.device_name = formData.device_name;
        }

        if (Object.keys(updateData).length === 0) {
          setError('Debe proporcionar al menos un campo para actualizar');
          return;
        }

        await updateDevice(device.id, updateData);
      } else {
        // Crear
        const createData: DeviceCreate = {
          token: formData.token,
          secret: formData.secret,
          device_name: formData.device_name || undefined,
        };
        await createDevice(createData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {device ? 'Editar Device' : 'Nuevo Device'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Token *</label>
            <input
              type="text"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Secret {device ? '(dejar vacío para no cambiar)' : '*'}
            </label>
            <input
              type="password"
              value={formData.secret}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
              required={!device}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nombre del Device</label>
            <input
              type="text"
              value={formData.device_name}
              onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
              placeholder="Ej: Device Principal"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : device ? 'Guardar Cambios' : 'Crear Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceModal;
