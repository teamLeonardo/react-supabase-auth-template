import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface FiltersState {
  // Filtros de devices
  deviceSearch: string;
  deviceStatusFilter: 'all' | 'active' | 'inactive';

  // Filtros de envío
  devicesLimit: number;
  
  // Acciones
  setDeviceSearch: (search: string) => void;
  setDeviceStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;
  setDevicesLimit: (limit: number) => void;
  resetFilters: () => void;
}

const initialState = {
  deviceSearch: '',
  deviceStatusFilter: 'all' as const,
  devicesLimit: 5,
};

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setDeviceSearch: (search) => set({ deviceSearch: search }),
      setDeviceStatusFilter: (filter) => set({ deviceStatusFilter: filter }),
      setDevicesLimit: (limit) => set({ devicesLimit: limit }),
      resetFilters: () => set(initialState),
    }),
    {
      name: 'filters-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        devicesLimit: state.devicesLimit,
      }),
    }
  )
);
