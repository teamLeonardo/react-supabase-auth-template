import apiClient from './apiClient';

export interface Device {
  id: number;
  token: string;
  secret_masked: string;
  device_name: string;
  status: 'active' | 'inactive';
  is_receiver?: boolean;
  phone?: string;
}

export interface DeviceCreate {
  token: string;
  secret: string;
  device_name?: string;
  is_receiver?: boolean;
  phone?: string;
}

export interface DeviceUpdate {
  token?: string;
  secret?: string;
  device_name?: string;
  is_receiver?: boolean;
  phone?: string;
}

export interface DevicesResponse {
  total: number;
  devices: Device[];
}

export interface DeviceResponse {
  status: string;
  message: string;
  device: Device;
}

// Listar todos los devices
export const getDevices = async (): Promise<DevicesResponse> => {
  const response = await apiClient.get<DevicesResponse>('/devices');
  return response.data;
};

// Obtener un device específico
export const getDevice = async (deviceId: number): Promise<Device> => {
  const response = await apiClient.get<Device>(`/devices/${deviceId}`);
  return response.data;
};

// Crear un nuevo device
export const createDevice = async (deviceData: DeviceCreate): Promise<DeviceResponse> => {
  const response = await apiClient.post<DeviceResponse>('/devices', deviceData);
  return response.data;
};

// Actualizar un device
export const updateDevice = async (
  deviceId: number,
  deviceData: DeviceUpdate
): Promise<DeviceResponse> => {
  const response = await apiClient.put<DeviceResponse>(`/devices/${deviceId}`, deviceData);
  return response.data;
};

// Eliminar un device
export const deleteDevice = async (deviceId: number): Promise<{ status: string; message: string; device: null }> => {
  const response = await apiClient.delete<{ status: string; message: string; device: null }>(`/devices/${deviceId}`);
  return response.data;
};
