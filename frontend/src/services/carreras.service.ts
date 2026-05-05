import api from './api';

export interface Carrera {
  _id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  materias: number;
  estudiantes: number;
}

interface CarrerasResponse {
  ok: boolean;
  data: Carrera[];
}

interface CarreraResponse {
  ok: boolean;
  data: Carrera;
}

export async function getCarreras(): Promise<Carrera[]> {
  const { data } = await api.get<CarrerasResponse>('/carreras');
  return data.data;
}

export async function getCarrera(id: string): Promise<Carrera> {
  const { data } = await api.get<CarreraResponse>(`/carreras/${id}`);
  return data.data;
}

export async function createCarrera(body: { nombre: string; codigo: string; descripcion?: string }): Promise<Carrera> {
  const { data } = await api.post<CarreraResponse>('/carreras', body);
  return data.data;
}

export async function updateCarrera(id: string, body: Partial<Carrera>): Promise<Carrera> {
  const { data } = await api.put<CarreraResponse>(`/carreras/${id}`, body);
  return data.data;
}

export async function deleteCarrera(id: string): Promise<void> {
  await api.delete(`/carreras/${id}`);
}
