import { useMutation } from '@tanstack/react-query';
import { sendBulkMessages, type SendBulkRequest, type SendBulkResponse } from '../services/messageService';

// Hook para enviar mensajes masivos
export const useSendBulkMessages = () => {
  return useMutation({
    mutationFn: (data: SendBulkRequest): Promise<SendBulkResponse> => sendBulkMessages(data),
  });
};
