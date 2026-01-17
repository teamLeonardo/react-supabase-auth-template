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
import { extractVariables, generateExcelTemplate, readExcelToCSV } from '../utils/excelUtils';

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

  const handleDownloadTemplate = () => {
    const variables = extractVariables(message);
    if (variables.length === 0) {
      showNotification('info', 'Agrega variables (@valor1, @valor2, etc.) en el mensaje para generar el template');
      return;
    }
    generateExcelTemplate(variables);
    showNotification('success', 'Template descargado exitosamente');
  };

  const handleLoadExcel = async (file: File) => {
    try {
      const csvContent = await readExcelToCSV(file);
      
      // Parsear el CSV y cargar los contactos
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        setError('El archivo Excel está vacío');
        return;
      }

      const newPhones: PhoneNumber[] = [];
      const errors: string[] = [];

      // Extraer variables del mensaje actual
      const variables = extractVariables(message);

      // Saltar el header si existe
      const startIndex = lines[0].toLowerCase().includes('phone') ? 1 : 0;

      lines.slice(startIndex).forEach((line, index) => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length === 0 || !parts[0]) return;

        const phone = parts[0];
        const name = parts[1] || undefined;

        // Limpiar espacios
        let cleanedPhone = phone.replace(/\s+/g, '');
        
        // Si empieza con 51 sin +, agregar el +
        if (cleanedPhone.startsWith('51') && !cleanedPhone.startsWith('+51')) {
          cleanedPhone = '+' + cleanedPhone;
        }
        
        // Validar teléfono
        const phoneRegex = /^\+51\d{9}$/;
        
        if (!phoneRegex.test(cleanedPhone)) {
          errors.push(`Línea ${startIndex + index + 1}: ${phone} - formato inválido`);
          return;
        }

        // Verificar duplicados
        if (phoneNumbers.some(p => p.phone === cleanedPhone) || newPhones.some(p => p.phone === cleanedPhone)) {
          errors.push(`Línea ${startIndex + index + 1}: ${phone} - duplicado`);
          return;
        }

        // Extraer valores de variables (parts[2], parts[3], etc.)
        const variablesData: { [key: string]: string } = {};
        variables.forEach((variable, varIndex) => {
          const valueIndex = varIndex + 2; // phone está en 0, name en 1, variables empiezan en 2
          if (parts[valueIndex]) {
            variablesData[variable] = parts[valueIndex];
          }
        });

        newPhones.push({
          phone: cleanedPhone,
          name,
          variables: Object.keys(variablesData).length > 0 ? variablesData : undefined,
        });
      });

      if (errors.length > 0) {
        setError(`Algunos números tienen problemas:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...y ${errors.length - 5} más` : ''}`);
      }

      if (newPhones.length > 0) {
        setPhoneNumbers([...phoneNumbers, ...newPhones]);
        showNotification('success', `${newPhones.length} contacto(s) cargado(s) exitosamente`);
      } else if (errors.length > 0) {
        showNotification('error', 'No se pudieron cargar contactos. Revisa el formato del archivo.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el archivo Excel';
      setError(errorMessage);
      showNotification('error', errorMessage);
    }
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
      // Extraer variables del mensaje
      const variables = extractVariables(message.trim());
      
      // Generar archivo CSV desde los datos ingresados
      // Formato: telefono|valor1|valor2|valor3...
      // Primera columna: número de teléfono
      // Siguientes columnas: valores para @valor1, @valor2, etc.
      const csvLines: string[] = [];
      
      // Crear header con phone y las variables detectadas
      const header = ['phone', ...variables].join('|');
      csvLines.push(header);
      
      // Agregar cada contacto
      phoneNumbers.forEach(phoneData => {
        const row: string[] = [phoneData.phone];
        
        // Agregar valores según las variables
        variables.forEach(variable => {
          // Usar el valor de la variable si existe, si no, usar el nombre como fallback para @valor1
          const variableValue = phoneData.variables?.[variable];
          if (variableValue) {
            row.push(variableValue);
          } else if (variable === '@valor1' && phoneData.name) {
            // Mantener compatibilidad: usar nombre para @valor1 si no hay valor específico
            row.push(phoneData.name);
          } else {
            row.push('');
          }
        });
        
        csvLines.push(row.join('|'));
      });
      
      // Crear el contenido CSV
      const csvContent = csvLines.join('\n');
      
      // Crear Blob y File desde el contenido CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const csvFile = new File([blob], `contactos_${Date.now()}.csv`, { type: 'text/csv' });
      
      const phones = phoneNumbers.map(p => p.phone);
      const phoneNamesMap: { [key: string]: string } = {};
      phoneNumbers.forEach(p => {
        if (p.name) {
          phoneNamesMap[p.phone] = p.name;
        }
      });

      const response = await sendBulkMutation.mutateAsync({
        file: csvFile,
        message: message.trim(),
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
                variables={extractVariables(message)}
              />

              {/* Phone Number Manager */}
              <PhoneNumberManager
                variables={extractVariables(message)}
                phones={phoneNumbers}
                onAdd={handleAddPhone}
                onRemove={handleRemovePhone}
                onUpdate={handleUpdatePhone}
                onLoadExcel={handleLoadExcel}
                onDownloadTemplate={handleDownloadTemplate}
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
