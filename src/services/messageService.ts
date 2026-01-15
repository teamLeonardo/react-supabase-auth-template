import apiClient from './apiClient';

export interface SendBulkFileRequest {
  file: File;
  message: string;
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

// Enviar mensajes masivos desde archivo CSV (retorna job)
export const sendBulkMessages = async (data: SendBulkFileRequest): Promise<SendBulkResponse> => {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('message', data.message);
  if (data.devices_limit !== undefined) {
    formData.append('devices_limit', data.devices_limit.toString());
  }
  
  const response = await apiClient.post<SendBulkResponse>('/messages/send-bulk-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
