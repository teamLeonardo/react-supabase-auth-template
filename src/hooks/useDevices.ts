import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  type DeviceCreate,
  type DeviceUpdate,
} from '../services/deviceService';

// Query keys
export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (filters?: { status?: string }) => [...deviceKeys.lists(), filters] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: number) => [...deviceKeys.details(), id] as const,
};

// Hook para listar devices
export const useDevices = (filters?: { status?: 'all' | 'active' | 'inactive' }) => {
  return useQuery({
    queryKey: deviceKeys.list(filters?.status ? { status: filters.status } : undefined),
    queryFn: async () => {
      const response = await getDevices();
      let devices = response.devices;
      
      // Aplicar filtro de estado si es necesario
      if (filters?.status && filters.status !== 'all') {
        devices = devices.filter(d => d.status === filters.status);
      }
      
      return devices;
    },
    staleTime: 30000, // 30 segundos
  });
};

// Hook para obtener un device específico
export const useDevice = (deviceId: number | null) => {
  return useQuery({
    queryKey: deviceKeys.detail(deviceId!),
    queryFn: () => getDevice(deviceId!),
    enabled: !!deviceId,
  });
};

// Hook para crear device
export const useCreateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeviceCreate) => createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
};

// Hook para actualizar device
export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DeviceUpdate }) =>
      updateDevice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(variables.id) });
    },
  });
};

// Hook para eliminar device
export const useDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: number) => deleteDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
};
