import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
