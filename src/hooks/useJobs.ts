import { useQuery } from '@tanstack/react-query';
import { getAllJobs, getJob } from '../services/jobService';
import { type Job } from '../services/messageService';

// Query keys
export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (limit?: number) => [...jobKeys.lists(), limit] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

// Hook para listar todos los jobs
export const useJobs = (limit?: number) => {
  return useQuery({
    queryKey: jobKeys.list(limit),
    queryFn: () => getAllJobs(limit),
    staleTime: 10000, // 10 segundos
  });
};

// Hook para obtener un job específico
export const useJob = (jobId: string | null) => {
  return useQuery({
    queryKey: jobKeys.detail(jobId!),
    queryFn: () => getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Refetch cada 2 segundos si el job está en proceso
      const job = query.state.data as Job | undefined;
      if (job && (job.status === 'pending' || job.status === 'processing')) {
        return 2000;
      }
      return false;
    },
  });
};
