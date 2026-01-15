import apiClient from './apiClient';

export interface SendBulkRequest {
  message: string;
  phones: string[];
  devices_limit?: number;
}

export interface JobProgress {
  sent: number;
  failed: number;
  total: number;
  percentage: number;
}

export interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  total_numbers: number;
  progress: JobProgress;
}

export interface SendBulkResponse {
  status: string;
  message: string;
  job: Job;
}

// Enviar mensajes masivos (retorna job)
export const sendBulkMessages = async (data: SendBulkRequest): Promise<SendBulkResponse> => {
  const response = await apiClient.post<SendBulkResponse>('/messages/send-bulk', data);
  return response.data;
};
