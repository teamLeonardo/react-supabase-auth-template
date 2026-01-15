import axios from 'axios';

// Obtener la URL base de la API
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  
  // Si no hay URL configurada, usar localhost por defecto
  if (!envUrl) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ VITE_API_BASE_URL no está configurada, usando localhost:8000');
    }
    return 'http://localhost:8000';
  }
  
  // Si la URL ya empieza con http:// o https://, usar tal cual
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    // Remover cualquier barra final
    return envUrl.replace(/\/+$/, '');
  }
  
  // Si no empieza con http/https, agregar https:// automáticamente
  console.warn('⚠️ VITE_API_BASE_URL no tiene protocolo. Agregando https:// automáticamente');
  console.warn('Valor original:', envUrl);
  console.warn('Usar en Vercel: https://' + envUrl);
  
  // Agregar https:// por defecto (asumimos HTTPS en producción)
  const urlWithProtocol = `https://${envUrl}`;
  // Remover cualquier barra final
  return urlWithProtocol.replace(/\/+$/, '');
};

const API_BASE_URL = getApiBaseUrl();

// Log para debugging
console.log('🔗 API Base URL configurada:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request para debugging y validación
apiClient.interceptors.request.use(
  (config) => {
    // Asegurar que la URL sea absoluta
    if (config.url) {
      // Si la URL no empieza con http/https, es relativa y se combinará con baseURL
      // Si baseURL no es absoluta, axios puede concatenar mal
      if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
        // URL relativa - se combinará con baseURL
        if (!config.baseURL || (!config.baseURL.startsWith('http://') && !config.baseURL.startsWith('https://'))) {
          console.error('❌ ERROR: baseURL no es absoluta:', config.baseURL);
          console.error('URL completa intentada:', config.url);
          throw new Error('La URL base de la API debe ser absoluta (http:// o https://)');
        }
      }
    }
    
    // Log para debugging
    if (import.meta.env.DEV) {
      console.log('📤 Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: config.baseURL ? `${config.baseURL}${config.url}` : config.url,
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de error
      const message = error.response.data?.detail?.message || 
                     error.response.data?.detail || 
                     error.message || 
                     'Error al procesar la solicitud';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      return Promise.reject(new Error('No se pudo conectar con el servidor. Verifica tu conexión.'));
    } else {
      // Algo más causó el error
      return Promise.reject(error);
    }
  }
);

export default apiClient;
