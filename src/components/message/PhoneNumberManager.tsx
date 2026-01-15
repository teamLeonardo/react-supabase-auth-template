import React, { useState } from 'react';

export interface PhoneNumber {
  phone: string;
  name?: string;
}

interface PhoneNumberManagerProps {
  phones: PhoneNumber[];
  onAdd: (phone: PhoneNumber) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, phone: PhoneNumber) => void;
  onLoadExcel: (file: File) => void;
  onDownloadTemplate: () => void;
  onClear: () => void;
}

const PhoneNumberManager = ({
  phones,
  onAdd,
  onRemove,
  onUpdate,
  onLoadExcel,
  onDownloadTemplate,
  onClear,
}: PhoneNumberManagerProps) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea un archivo Excel
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        alert('Por favor, selecciona un archivo Excel (.xlsx o .xls)');
        return;
      }
      
      onLoadExcel(file);
      
      // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
      e.target.value = '';
    }
  };

  const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/\s+/g, '');
    // Si empieza con 51 sin +, agregar el +
    if (cleaned.startsWith('51') && !cleaned.startsWith('+51')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = normalizePhone(phone);
    const phoneRegex = /^\+51\d{9}$/;
    return phoneRegex.test(cleaned);
  };

  const handleAddPhone = () => {
    let cleanedPhone = phoneInput.trim().replace(/\s+/g, '');
    if (!cleanedPhone) return;

    // Normalizar el teléfono (agregar + si falta)
    cleanedPhone = normalizePhone(cleanedPhone);

    if (!validatePhone(cleanedPhone)) {
      alert('Formato de número inválido. Debe ser: +51xxxxxxxx o 51xxxxxxxx (9 dígitos después del código de país)');
      return;
    }

    // Verificar si ya existe
    if (phones.some(p => p.phone === cleanedPhone)) {
      alert('Este número ya está en la lista');
      return;
    }

    onAdd({
      phone: cleanedPhone,
      name: nameInput.trim() || undefined,
    });

    setPhoneInput('');
    setNameInput('');
  };

  const handleAddFromText = () => {
    const lines = phoneInput.split('\n').map(line => line.trim()).filter(line => line);
    const validPhones: PhoneNumber[] = [];
    const invalidPhones: string[] = [];

    lines.forEach(line => {
      const parts = line.split(/\s+/);
      let phone = parts[0].replace(/\s+/g, '');
      const name = parts.slice(1).join(' ');

      // Normalizar el teléfono (agregar + si falta)
      phone = normalizePhone(phone);

      if (validatePhone(phone)) {
        if (!phones.some(p => p.phone === phone)) {
          validPhones.push({
            phone,
            name: name || undefined,
          });
        }
      } else if (phone) {
        invalidPhones.push(parts[0]); // Mostrar el número original sin normalizar
      }
    });

    if (invalidPhones.length > 0) {
      alert(`Algunos números tienen formato inválido: ${invalidPhones.join(', ')}`);
    }

    validPhones.forEach(phone => onAdd(phone));
    setPhoneInput('');
    setNameInput('');
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 px-4 py-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span className="text-white font-semibold">Números de Teléfono</span>
      </div>

      {/* Actions bar */}
      <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-700 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-2 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar Template
        </button>
        <label className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-2 transition cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Cargar Excel
        </label>
      </div>

      {/* Input area */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (phoneInput.includes('\n')) {
                  handleAddFromText();
                } else {
                  handleAddPhone();
                }
              }
            }}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            placeholder="+51987654321"
          />
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            placeholder="Nombre (opcional)"
          />
          <button
            type="button"
            onClick={phoneInput.includes('\n') ? handleAddFromText : handleAddPhone}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <textarea
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none"
          placeholder="O pega múltiples números, uno por línea (formato: +51987654321 Nombre)"
        />

        <p className="text-xs text-gray-400">
          Formato: +51xxxxxxxx (Perú: +51 + 9 dígitos)
        </p>
      </div>

      {/* Phone list */}
      {phones.length > 0 && (
        <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
          {phones.map((phoneData, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-gray-700 rounded"
            >
              <span className="text-sm text-gray-400 w-8">{index + 1}.</span>
              <input
                type="text"
                value={phoneData.phone}
                onChange={(e) => onUpdate(index, { ...phoneData, phone: e.target.value })}
                className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
              />
              <input
                type="text"
                value={phoneData.name || ''}
                onChange={(e) => onUpdate(index, { ...phoneData, name: e.target.value })}
                placeholder="Nombre"
                className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => onAdd({ ...phoneData })}
                className="p-1.5 text-green-400 hover:bg-green-600/20 rounded transition"
                title="Duplicar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1.5 text-red-400 hover:bg-red-600/20 rounded transition"
                title="Eliminar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="px-4 py-3 bg-gray-700/50 border-t border-gray-700 flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded flex items-center gap-2 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpiar
        </button>
        <div className="ml-auto text-sm text-gray-400">
          {phones.length} {phones.length === 1 ? 'número' : 'números'} agregado{phones.length === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberManager;
