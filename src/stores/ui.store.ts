import { create } from 'zustand';

interface UIState {
  // Modales
  isDeviceModalOpen: boolean;
  isJobProgressModalOpen: boolean;
  currentJobId: string | null;

  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;

  // Notificaciones
  notification: {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null;

  // Acciones
  openDeviceModal: () => void;
  closeDeviceModal: () => void;
  openJobProgressModal: (jobId: string) => void;
  closeJobProgressModal: () => void;
  setLoading: (loading: boolean, message?: string) => void;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Estado inicial
  isDeviceModalOpen: false,
  isJobProgressModalOpen: false,
  currentJobId: null,
  isLoading: false,
  loadingMessage: null,
  notification: null,

  // Acciones
  openDeviceModal: () => set({ isDeviceModalOpen: true }),
  closeDeviceModal: () => set({ isDeviceModalOpen: false }),
  
  openJobProgressModal: (jobId: string) => 
    set({ isJobProgressModalOpen: true, currentJobId: jobId }),
  
  closeJobProgressModal: () => 
    set({ isJobProgressModalOpen: false, currentJobId: null }),
  
  setLoading: (loading: boolean, message?: string) =>
    set({ isLoading: loading, loadingMessage: message || null }),
  
  showNotification: (type, message) =>
    set({ notification: { type, message } }),
  
  clearNotification: () => set({ notification: null }),
}));
