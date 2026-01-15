import { useMutation } from '@tanstack/react-query';
import { sendBulkMessages, type SendBulkFileRequest, type SendBulkResponse } from '../services/messageService';

// Hook para enviar mensajes masivos
export const useSendBulkMessages = () => {
  return useMutation({
    mutationFn: (data: SendBulkFileRequest): Promise<SendBulkResponse> => sendBulkMessages(data),
  });
};
