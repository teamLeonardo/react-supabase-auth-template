import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useSendBulkMessages } from '../hooks/useMessages';
import { useDevices } from '../hooks/useDevices';
import { useUIStore } from '../stores/ui.store';
import { useFiltersStore } from '../stores/filters.store';
import { useHistoryStore } from '../stores/history.store';
import MessageEditor from '../components/message/MessageEditor';
import PhoneNumberManager, { type PhoneNumber } from '../components/message/PhoneNumberManager';
import SendActions from '../components/message/SendActions';

const SendBulkPage = () => {
  const { session } = useSession();
  const [message, setMessage] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Stores
  const { 
    currentJobId, 
    openJobProgressModal, 
    showNotification 
  } = useUIStore();
  const { devicesLimit, setDevicesLimit } = useFiltersStore();
  const { addEntry } = useHistoryStore();

  // TanStack Query hooks
  const { data: availableDevices = [], isLoading: loadingDevices } = useDevices({ status: 'active' });
  const sendBulkMutation = useSendBulkMessages();

  const handleAddPhone = (phone: PhoneNumber) => {
    setPhoneNumbers([...phoneNumbers, phone]);
  };

  const handleRemovePhone = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const handleUpdatePhone = (index: number, phone: PhoneNumber) => {
    const updated = [...phoneNumbers];
    updated[index] = phone;
    setPhoneNumbers(updated);
  };

  const handleLoadCSV = () => {
    // Mock: Simular carga de CSV
    alert('Funcionalidad de carga CSV próximamente disponible');
  };

  const handleClearPhones = () => {
    if (phoneNumbers.length > 0 && window.confirm('¿Estás seguro de limpiar todos los números?')) {
      setPhoneNumbers([]);
    }
  };

  const handleSaveLater = () => {
    // Mock: Guardar para enviar después
    if (message.trim() && phoneNumbers.length > 0) {
      alert('Mensaje guardado para enviar después (funcionalidad mock)');
    } else {
      setError('Debe completar el mensaje y agregar al menos un número');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError('El mensaje es requerido');
      return;
    }

    if (phoneNumbers.length === 0) {
      setError('Debe agregar al menos un número de teléfono');
      return;
    }

    if (availableDevices.length === 0) {
      setError('No hay devices disponibles. Por favor, crea al menos un device primero.');
      return;
    }

    try {
      const phones = phoneNumbers.map(p => p.phone);
      const phoneNamesMap: { [key: string]: string } = {};
      phoneNumbers.forEach(p => {
        if (p.name) {
          phoneNamesMap[p.phone] = p.name;
        }
      });

      const response = await sendBulkMutation.mutateAsync({
        message: message.trim(),
        phones,
        devices_limit: Math.min(devicesLimit, availableDevices.length),
      });

      // Obtener el job_id de la respuesta
      const jobId = response.job.id;
      
      // Guardar en historial
      addEntry({
        jobId,
        message: message.trim(),
        phones,
        phoneNames: phoneNamesMap,
        devicesLimit: Math.min(devicesLimit, availableDevices.length),
        status: 'processing',
      });

      openJobProgressModal(jobId);
      showNotification('success', 'Envío creado exitosamente');

      // Limpiar formulario
      setMessage('');
      setPhoneNumbers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el envío');
      showNotification('error', err instanceof Error ? err.message : 'Error al crear el envío');
    }
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
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Enviar Mensajes Masivos</h1>
            <p className="text-gray-400">Compose y envía mensajes personalizados a múltiples destinatarios</p>
          </div>

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
              {/* Message Editor */}
              <MessageEditor
                value={message}
                onChange={setMessage}
                variables={['@value1']}
              />

              {/* Phone Number Manager */}
              <PhoneNumberManager
                phones={phoneNumbers}
                onAdd={handleAddPhone}
                onRemove={handleRemovePhone}
                onUpdate={handleUpdatePhone}
                onLoadCSV={handleLoadCSV}
                onClear={handleClearPhones}
              />

              {/* Devices Configuration */}
              <div className="bg-gray-800 rounded-lg p-6">
                <label className="block text-sm font-medium mb-2 text-white">
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

              {/* Error message */}
              {error && (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
                  {error}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end">
                <SendActions
                  onSaveLater={handleSaveLater}
                  isSending={sendBulkMutation.isPending}
                  canSend={phoneNumbers.length > 0 && message.trim().length > 0 && !currentJobId}
                  phoneCount={phoneNumbers.length}
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendBulkPage;
