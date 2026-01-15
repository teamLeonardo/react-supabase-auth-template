import apiClient from './apiClient';
import { type Job } from './messageService';

// Listar todos los jobs
export const getAllJobs = async (limit?: number): Promise<Job[]> => {
  const url = limit ? `/jobs?limit=${limit}` : '/jobs';
  const response = await apiClient.get<Job[]>(url);
  return response.data;
};

// Obtener job específico
export const getJob = async (jobId: string): Promise<Job> => {
  const response = await apiClient.get<Job>(`/jobs/${jobId}`);
  return response.data;
};
