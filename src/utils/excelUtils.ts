import * as XLSX from 'xlsx';

/**
 * Extrae todas las variables del formato @valor1, @valor2, etc. del mensaje
 */
export const extractVariables = (message: string): string[] => {
  const regex = /@valor\d+/g;
  const matches = message.match(regex);
  if (!matches) return [];
  
  // Ordenar y eliminar duplicados
  const unique = [...new Set(matches)].sort((a, b) => {
    const numA = parseInt(a.replace('@valor', ''));
    const numB = parseInt(b.replace('@valor', ''));
    return numA - numB;
  });
  
  return unique;
};

/**
 * Genera un archivo Excel template con las columnas basadas en las variables del mensaje
 */
export const generateExcelTemplate = (variables: string[]): void => {
  // Crear encabezados: phone siempre es la primera columna, luego las variables
  const headers = ['phone', ...variables];
  
  // Crear un workbook
  const wb = XLSX.utils.book_new();
  
  // Crear una hoja con los headers y una fila de ejemplo
  const wsData = [
    headers,
    ['+51987654321', ...variables.map(() => 'ejemplo')], // Fila de ejemplo
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Ajustar el ancho de las columnas
  const colWidths = headers.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;
  
  // Agregar la hoja al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Contactos');
  
  // Generar el archivo y descargarlo
  const fileName = `template_${variables.length > 0 ? variables.join('_') : 'basico'}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Lee un archivo Excel y lo convierte a formato CSV (separado por |)
 * Retorna el contenido CSV como string
 */
export const readExcelToCSV = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Tomar la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON primero
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        // Convertir a CSV con separador |
        const csvLines: string[] = [];
        
        jsonData.forEach((row: unknown) => {
          if (Array.isArray(row)) {
            // Filtrar filas vacías
            const filteredRow = row.filter(cell => cell !== '');
            if (filteredRow.length > 0) {
              csvLines.push(filteredRow.join('|'));
            }
          }
        });
        
        resolve(csvLines.join('\n'));
      } catch (error) {
        reject(new Error('Error al leer el archivo Excel. Verifica que el formato sea correcto.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};
