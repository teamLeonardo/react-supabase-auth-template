import { useQuery } from '@tanstack/react-query';
import { useHistoryStore, type HistoryEntry } from '../stores/history.store';

// Query keys
export const historyKeys = {
  all: ['history'] as const,
  lists: () => [...historyKeys.all, 'list'] as const,
  list: (filters?: { status?: string }) => [...historyKeys.lists(), filters] as const,
  details: () => [...historyKeys.all, 'detail'] as const,
  detail: (id: string) => [...historyKeys.details(), id] as const,
};

// Hook para listar historial
export const useHistory = (filters?: { status?: HistoryEntry['status'] }) => {
  const entries = useHistoryStore((state) => state.entries);

  return useQuery({
    queryKey: historyKeys.list(filters?.status ? { status: filters.status } : undefined),
    queryFn: () => {
      let filtered = [...entries];

      if (filters?.status) {
        filtered = filtered.filter((entry) => entry.status === filters.status);
      }

      return filtered.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
    staleTime: 0, // Siempre refetch desde el store
  });
};

// Hook para obtener una entrada específica
export const useHistoryEntry = (id: string | null) => {
  const getEntry = useHistoryStore((state) => state.getEntry);

  return useQuery({
    queryKey: historyKeys.detail(id!),
    queryFn: () => {
      if (!id) return null;
      return getEntry(id) || null;
    },
    enabled: !!id,
    staleTime: 0,
  });
};
