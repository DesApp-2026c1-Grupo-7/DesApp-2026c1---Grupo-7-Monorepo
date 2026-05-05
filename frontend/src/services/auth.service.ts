import api from './api';

export interface User {
  _id: string;
  nombre: string;
  email: string;
  role: 'estudiante' | 'admin';
}

interface AuthResponse {
  ok: boolean;
  token: string;
  user: User;
  error?: string;
}

export async function loginService(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function registerService(nombre: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { nombre, email, password });
  return data;
}

export async function getMeService(): Promise<{ ok: boolean; user: User }> {
  const { data } = await api.get('/auth/me');
  return data;
}
