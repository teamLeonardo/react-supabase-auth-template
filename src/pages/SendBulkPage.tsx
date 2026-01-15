import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { sendBulkMessages } from '../services/messageService';
import { getDevices, type Device } from '../services/deviceService';
import { useJobTracker } from '../hooks/useJobTracker';
import JobProgressModal from '../components/JobProgressModal';

const SendBulkPage = () => {
  const { session } = useSession();
  const [message, setMessage] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [phones, setPhones] = useState<string[]>([]);
  const [devicesLimit, setDevicesLimit] = useState(5);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Hook para tracking del job actual
  const { progress, status, logs, isConnected } = useJobTracker(currentJobId);

  useEffect(() => {
    if (session) {
      loadDevices();
    }
  }, [session]);

  const loadDevices = async () => {
    try {
      setLoadingDevices(true);
      const response = await getDevices();
      setAvailableDevices(response.devices.filter(d => d.status === 'active'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar devices');
    } finally {
      setLoadingDevices(false);
    }
  };

  const validatePhone = (phone: string): boolean => {
    // Formato: +51xxxxxxxx (Perú: +51 + 9 dígitos)
    const cleaned = phone.replace(/\s+/g, '');
    const phoneRegex = /^\+51\d{9}$/;
    return phoneRegex.test(cleaned);
  };

  const handleAddPhone = () => {
    const cleanedPhone = phoneInput.trim().replace(/\s+/g, '');
    if (!cleanedPhone) return;

    if (!validatePhone(cleanedPhone)) {
      setError('Formato de número inválido. Debe ser: +51xxxxxxxx (9 dígitos después del código de país)');
      return;
    }

    if (phones.includes(cleanedPhone)) {
      setError('Este número ya está en la lista');
      return;
    }

    setPhones([...phones, cleanedPhone]);
    setPhoneInput('');
    setError(null);
  };

  const handleRemovePhone = (phone: string) => {
    setPhones(phones.filter(p => p !== phone));
  };

  const handleAddPhonesFromText = () => {
    const lines = phoneInput.split('\n').map(line => line.trim()).filter(line => line);
    const validPhones: string[] = [];
    const invalidPhones: string[] = [];

    lines.forEach(phone => {
      const cleaned = phone.replace(/\s+/g, '');
      if (validatePhone(cleaned) && !phones.includes(cleaned) && !validPhones.includes(cleaned)) {
        validPhones.push(cleaned);
      } else if (cleaned) {
        invalidPhones.push(cleaned);
      }
    });

    if (invalidPhones.length > 0) {
      setError(`Algunos números tienen formato inválido: ${invalidPhones.join(', ')}`);
    }

    if (validPhones.length > 0) {
      setPhones([...phones, ...validPhones]);
      setPhoneInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError('El mensaje es requerido');
      return;
    }

    if (phones.length === 0) {
      setError('Debe agregar al menos un número de teléfono');
      return;
    }

    if (availableDevices.length === 0) {
      setError('No hay devices disponibles. Por favor, crea al menos un device primero.');
      return;
    }

    try {
      setLoading(true);
      const response = await sendBulkMessages({
        message: message.trim(),
        phones,
        devices_limit: Math.min(devicesLimit, availableDevices.length),
      });

      // Obtener el job_id de la respuesta
      const jobId = response.job.id;
      setCurrentJobId(jobId);
      setShowProgressModal(true);

      // Limpiar formulario
      setMessage('');
      setPhones([]);
      setPhoneInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el envío');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
    setCurrentJobId(null);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-white mb-4">Debes iniciar sesión para enviar mensajes</p>
          <Link to="/auth/sign-in" className="text-green-400 hover:underline">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Enviar Mensajes Masivos</h1>

        {loadingDevices ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Cargando devices...</p>
          </div>
        ) : availableDevices.length === 0 ? (
          <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-500 rounded">
            <p className="text-yellow-200 mb-2">
              No hay devices disponibles. Por favor, crea al menos un device primero.
            </p>
            <Link
              to="/devices"
              className="text-yellow-300 hover:underline"
            >
              Ir a Gestión de Devices →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <label className="block text-sm font-medium mb-2">
                Mensaje *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-green-500 resize-none"
                placeholder="Escribe el mensaje que deseas enviar..."
                required
              />
              <p className="mt-2 text-xs text-gray-400">
                {message.length} caracteres
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <label className="block text-sm font-medium mb-2">
                Números de Teléfono *
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPhone();
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
                    placeholder="+51987654321 (uno por uno o múltiples separados por líneas)"
                  />
                  <button
                    type="button"
                    onClick={phoneInput.includes('\n') ? handleAddPhonesFromText : handleAddPhone}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                  >
                    Agregar
                  </button>
                </div>
                <textarea
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-green-500 resize-none"
                  placeholder="O pega múltiples números, uno por línea..."
                />
                <p className="text-xs text-gray-400">
                  Formato: +51xxxxxxxx (Perú: +51 + 9 dígitos)
                </p>
              </div>

              {phones.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Números agregados ({phones.length}):
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {phones.map((phone) => (
                      <span
                        key={phone}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-gray-700 rounded text-sm"
                      >
                        {phone}
                        <button
                          type="button"
                          onClick={() => handleRemovePhone(phone)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <label className="block text-sm font-medium mb-2">
                Devices a usar (máximo: {availableDevices.length})
              </label>
              <input
                type="number"
                min={1}
                max={Math.min(10, availableDevices.length)}
                value={devicesLimit}
                onChange={(e) => setDevicesLimit(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition"
              />
              <p className="mt-2 text-xs text-gray-400">
                Se usarán hasta {Math.min(devicesLimit, availableDevices.length)} devices en paralelo
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phones.length === 0 || !message.trim() || showProgressModal}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando envío...' : 'Enviar Mensajes'}
            </button>
          </form>
        )}

        {/* Modal de progreso */}
        <JobProgressModal
          isOpen={showProgressModal}
          progress={progress}
          status={status}
          logs={logs}
          isConnected={isConnected}
          onClose={handleCloseProgressModal}
        />
      </div>
    </div>
  );
};

export default SendBulkPage;
